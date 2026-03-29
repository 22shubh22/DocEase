from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Request, status
from sqlalchemy.orm import Session
from datetime import date, datetime
from app.core.database import get_db
from app.core.deps import get_current_user, require_permission, require_plugin, get_client_ip
from app.models.models import (
    User, Patient, Visit, VaccinationSchedule, VaccinationRecord, AuditActionEnum, generate_uuid,
)
from app.schemas.schemas import (
    VaccinationScheduleEntry, VaccinationScheduleCreate, VaccinationScheduleUpdate,
    VaccinationRecordCreate, VaccinationRecordUpdate, VaccinationRecordResponse,
    VaccinationCardResponse, VaccinationDashboardResponse,
    VaccinationScheduleResponse,
)
from app.services.vaccination_service import (
    seed_vaccination_schedule, reset_vaccination_schedule,
    compute_vaccination_card, compute_due_vaccines, compute_vaccination_dashboard,
    compute_vaccination_schedule_view,
)
from app.services.audit_service import create_audit_log
from typing import List, Optional

router = APIRouter()


# ── Schedule Management ──

@router.get("/schedule", response_model=List[VaccinationScheduleEntry])
async def get_schedule(
    current_user: User = Depends(require_permission("can_view_patients")),
    _plugin: User = Depends(require_plugin("vaccination")),
    db: Session = Depends(get_db),
):
    """Get the clinic's vaccination schedule."""
    entries = db.query(VaccinationSchedule).filter(
        VaccinationSchedule.clinic_id == current_user.clinic_id,
    ).order_by(VaccinationSchedule.display_order).all()

    # Auto-seed if empty (first access for this clinic)
    if not entries:
        seed_vaccination_schedule(db, current_user.clinic_id)
        entries = db.query(VaccinationSchedule).filter(
            VaccinationSchedule.clinic_id == current_user.clinic_id,
        ).order_by(VaccinationSchedule.display_order).all()

    return entries


@router.post("/schedule", response_model=VaccinationScheduleEntry, status_code=201)
async def add_schedule_entry(
    data: VaccinationScheduleCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(require_permission("can_manage_clinic_options")),
    _plugin: User = Depends(require_plugin("vaccination")),
    db: Session = Depends(get_db),
):
    """Add a custom vaccine to the clinic's schedule."""
    existing = db.query(VaccinationSchedule).filter(
        VaccinationSchedule.clinic_id == current_user.clinic_id,
        VaccinationSchedule.vaccine_name == data.vaccine_name,
        VaccinationSchedule.dose_number == data.dose_number,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This vaccine dose already exists in the schedule")

    entry = VaccinationSchedule(
        id=generate_uuid(),
        clinic_id=current_user.clinic_id,
        **data.model_dump(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    background_tasks.add_task(
        create_audit_log, db, current_user.clinic_id, current_user.id,
        current_user.email, AuditActionEnum.CREATE, "vaccination_schedule",
        entry.id, f"Added vaccine {data.vaccine_name} dose {data.dose_number}",
        None, None, get_client_ip(request), None,
    )
    return entry


@router.put("/schedule/{entry_id}", response_model=VaccinationScheduleEntry)
async def update_schedule_entry(
    entry_id: str,
    data: VaccinationScheduleUpdate,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(require_permission("can_manage_clinic_options")),
    _plugin: User = Depends(require_plugin("vaccination")),
    db: Session = Depends(get_db),
):
    """Update a vaccination schedule entry."""
    entry = db.query(VaccinationSchedule).filter(
        VaccinationSchedule.id == entry_id,
        VaccinationSchedule.clinic_id == current_user.clinic_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Schedule entry not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(entry, key, value)
    db.commit()
    db.refresh(entry)

    background_tasks.add_task(
        create_audit_log, db, current_user.clinic_id, current_user.id,
        current_user.email, AuditActionEnum.UPDATE, "vaccination_schedule",
        entry.id, f"Updated schedule entry {entry.dose_label}",
        None, None, get_client_ip(request), None,
    )
    return entry


@router.delete("/schedule/{entry_id}")
async def delete_schedule_entry(
    entry_id: str,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(require_permission("can_manage_clinic_options")),
    _plugin: User = Depends(require_plugin("vaccination")),
    db: Session = Depends(get_db),
):
    """Deactivate a vaccination schedule entry."""
    entry = db.query(VaccinationSchedule).filter(
        VaccinationSchedule.id == entry_id,
        VaccinationSchedule.clinic_id == current_user.clinic_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Schedule entry not found")

    entry.is_active = False
    db.commit()

    background_tasks.add_task(
        create_audit_log, db, current_user.clinic_id, current_user.id,
        current_user.email, AuditActionEnum.DELETE, "vaccination_schedule",
        entry.id, f"Deactivated schedule entry {entry.dose_label}",
        None, None, get_client_ip(request), None,
    )
    return {"message": "Schedule entry deactivated"}


@router.post("/schedule/reset")
async def reset_schedule(
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(require_permission("can_manage_clinic_options")),
    _plugin: User = Depends(require_plugin("vaccination")),
    db: Session = Depends(get_db),
):
    """Reset schedule to default EPI template."""
    count = reset_vaccination_schedule(db, current_user.clinic_id)

    background_tasks.add_task(
        create_audit_log, db, current_user.clinic_id, current_user.id,
        current_user.email, AuditActionEnum.UPDATE, "vaccination_schedule",
        None, f"Reset vaccination schedule to defaults ({count} entries)",
        None, None, get_client_ip(request), None,
    )
    return {"message": f"Schedule reset with {count} entries"}


# ── Patient Vaccination Card ──

@router.get("/patients/{patient_id}/card", response_model=VaccinationCardResponse)
async def get_vaccination_card(
    patient_id: str,
    current_user: User = Depends(require_permission("can_view_patients")),
    _plugin: User = Depends(require_plugin("vaccination")),
    db: Session = Depends(get_db),
):
    """Get full vaccination card for a patient."""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_user.clinic_id,
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Auto-seed schedule if needed
    schedule_count = db.query(VaccinationSchedule).filter(
        VaccinationSchedule.clinic_id == current_user.clinic_id
    ).count()
    if schedule_count == 0:
        seed_vaccination_schedule(db, current_user.clinic_id)

    card = compute_vaccination_card(db, patient_id, current_user.clinic_id)
    if not card:
        raise HTTPException(status_code=404, detail="Patient not found")
    return card


@router.get("/patients/{patient_id}/due")
async def get_due_vaccines(
    patient_id: str,
    current_user: User = Depends(require_permission("can_view_patients")),
    _plugin: User = Depends(require_plugin("vaccination")),
    db: Session = Depends(get_db),
):
    """Get only due/overdue vaccines for a patient."""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_user.clinic_id,
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return compute_due_vaccines(db, patient_id, current_user.clinic_id)


# ── Record Doses ──

@router.post("/patients/{patient_id}/doses", response_model=VaccinationRecordResponse, status_code=201)
async def record_dose(
    patient_id: str,
    data: VaccinationRecordCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(require_permission("can_create_visits")),
    _plugin: User = Depends(require_plugin("vaccination")),
    db: Session = Depends(get_db),
):
    """Record a vaccine dose for a patient."""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_user.clinic_id,
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Check for duplicate
    existing = db.query(VaccinationRecord).filter(
        VaccinationRecord.patient_id == patient_id,
        VaccinationRecord.vaccine_name == data.vaccine_name,
        VaccinationRecord.dose_number == data.dose_number,
        VaccinationRecord.is_voided == False,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This dose has already been recorded")

    # Enforce dose sequence: all earlier doses of the same vaccine must be recorded first
    earlier_scheduled = db.query(VaccinationSchedule).filter(
        VaccinationSchedule.clinic_id == current_user.clinic_id,
        VaccinationSchedule.vaccine_name == data.vaccine_name,
        VaccinationSchedule.dose_number < data.dose_number,
        VaccinationSchedule.is_active == True,
    ).count()
    if earlier_scheduled > 0:
        earlier_recorded = db.query(VaccinationRecord).filter(
            VaccinationRecord.patient_id == patient_id,
            VaccinationRecord.vaccine_name == data.vaccine_name,
            VaccinationRecord.dose_number < data.dose_number,
            VaccinationRecord.is_voided == False,
        ).count()
        if earlier_recorded < earlier_scheduled:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot record dose {data.dose_number} — earlier doses of {data.vaccine_name} have not been recorded yet",
            )

    age_at_dose = None
    if patient.date_of_birth:
        age_at_dose = (data.date_administered - patient.date_of_birth).days

    record = VaccinationRecord(
        id=generate_uuid(),
        patient_id=patient_id,
        clinic_id=current_user.clinic_id,
        schedule_entry_id=data.schedule_entry_id,
        vaccine_name=data.vaccine_name,
        dose_number=data.dose_number,
        dose_label=data.dose_label,
        date_administered=data.date_administered,
        age_at_dose_days=age_at_dose,
        batch_number=data.batch_number,
        administered_by=current_user.id,
        injection_site=data.injection_site,
        route=data.route,
        adverse_reaction=data.adverse_reaction,
        notes=data.notes,
        created_by=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    background_tasks.add_task(
        create_audit_log, db, current_user.clinic_id, current_user.id,
        current_user.email, AuditActionEnum.CREATE, "vaccination_record",
        record.id, f"Recorded {data.vaccine_name} dose {data.dose_number} for patient {patient.full_name}",
        None, None, get_client_ip(request), None,
    )
    return record


@router.post("/visits/{visit_id}/doses", response_model=VaccinationRecordResponse, status_code=201)
async def record_dose_during_visit(
    visit_id: str,
    data: VaccinationRecordCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(require_permission("can_create_visits")),
    _plugin: User = Depends(require_plugin("vaccination")),
    db: Session = Depends(get_db),
):
    """Record a vaccine dose during a visit."""
    visit = db.query(Visit).filter(
        Visit.id == visit_id,
        Visit.clinic_id == current_user.clinic_id,
    ).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    patient = db.query(Patient).filter(Patient.id == visit.patient_id).first()

    existing = db.query(VaccinationRecord).filter(
        VaccinationRecord.patient_id == visit.patient_id,
        VaccinationRecord.vaccine_name == data.vaccine_name,
        VaccinationRecord.dose_number == data.dose_number,
        VaccinationRecord.is_voided == False,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This dose has already been recorded")

    # Enforce dose sequence: all earlier doses of the same vaccine must be recorded first
    earlier_scheduled = db.query(VaccinationSchedule).filter(
        VaccinationSchedule.clinic_id == current_user.clinic_id,
        VaccinationSchedule.vaccine_name == data.vaccine_name,
        VaccinationSchedule.dose_number < data.dose_number,
        VaccinationSchedule.is_active == True,
    ).count()
    if earlier_scheduled > 0:
        earlier_recorded = db.query(VaccinationRecord).filter(
            VaccinationRecord.patient_id == visit.patient_id,
            VaccinationRecord.vaccine_name == data.vaccine_name,
            VaccinationRecord.dose_number < data.dose_number,
            VaccinationRecord.is_voided == False,
        ).count()
        if earlier_recorded < earlier_scheduled:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot record dose {data.dose_number} — earlier doses of {data.vaccine_name} have not been recorded yet",
            )

    age_at_dose = None
    if patient and patient.date_of_birth:
        age_at_dose = (data.date_administered - patient.date_of_birth).days

    record = VaccinationRecord(
        id=generate_uuid(),
        patient_id=visit.patient_id,
        clinic_id=current_user.clinic_id,
        schedule_entry_id=data.schedule_entry_id,
        visit_id=visit_id,
        vaccine_name=data.vaccine_name,
        dose_number=data.dose_number,
        dose_label=data.dose_label,
        date_administered=data.date_administered,
        age_at_dose_days=age_at_dose,
        batch_number=data.batch_number,
        administered_by=current_user.id,
        injection_site=data.injection_site,
        route=data.route,
        adverse_reaction=data.adverse_reaction,
        notes=data.notes,
        created_by=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    background_tasks.add_task(
        create_audit_log, db, current_user.clinic_id, current_user.id,
        current_user.email, AuditActionEnum.CREATE, "vaccination_record",
        record.id, f"Recorded {data.vaccine_name} during visit for patient {patient.full_name if patient else 'unknown'}",
        None, None, get_client_ip(request), None,
    )
    return record


@router.put("/records/{record_id}", response_model=VaccinationRecordResponse)
async def update_record(
    record_id: str,
    data: VaccinationRecordUpdate,
    background_tasks: BackgroundTasks,
    request: Request,
    current_user: User = Depends(require_permission("can_edit_visits")),
    _plugin: User = Depends(require_plugin("vaccination")),
    db: Session = Depends(get_db),
):
    """Update a vaccination record."""
    record = db.query(VaccinationRecord).filter(
        VaccinationRecord.id == record_id,
        VaccinationRecord.clinic_id == current_user.clinic_id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)

    background_tasks.add_task(
        create_audit_log, db, current_user.clinic_id, current_user.id,
        current_user.email, AuditActionEnum.UPDATE, "vaccination_record",
        record.id, f"Updated vaccination record for {record.vaccine_name}",
        None, None, get_client_ip(request), None,
    )
    return record


@router.delete("/records/{record_id}")
async def delete_record(
    record_id: str,
    background_tasks: BackgroundTasks,
    request: Request,
    reason: str = Query(default="Entered in error", description="Reason for voiding this record"),
    current_user: User = Depends(require_permission("can_edit_visits")),
    _plugin: User = Depends(require_plugin("vaccination")),
    db: Session = Depends(get_db),
):
    """Void a vaccination record (soft-delete)."""
    record = db.query(VaccinationRecord).filter(
        VaccinationRecord.id == record_id,
        VaccinationRecord.clinic_id == current_user.clinic_id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if record.is_voided:
        raise HTTPException(status_code=400, detail="Record is already voided")

    record.is_voided = True
    record.void_reason = reason
    record.voided_at = datetime.utcnow()
    record.voided_by = current_user.id
    db.commit()

    background_tasks.add_task(
        create_audit_log, db, current_user.clinic_id, current_user.id,
        current_user.email, AuditActionEnum.DELETE, "vaccination_record",
        record_id, f"Voided vaccination record for {record.vaccine_name}: {reason}",
        None, None, get_client_ip(request), None,
    )
    return {"message": "Record voided"}


# ── Dashboard ──

@router.get("/dashboard/schedule", response_model=VaccinationScheduleResponse)
async def get_dashboard_schedule(
    status: Optional[str] = Query(None, description="Filter by status: due or overdue"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_permission("can_view_patients")),
    _plugin: User = Depends(require_plugin("vaccination")),
    db: Session = Depends(get_db),
):
    """Get vaccination schedule view: flat, date-sorted list of pending vaccinations."""
    # Validate status filter
    if status and status not in ("due", "overdue"):
        raise HTTPException(status_code=400, detail="status must be 'due' or 'overdue'")

    # Auto-seed schedule if needed
    schedule_count = db.query(VaccinationSchedule).filter(
        VaccinationSchedule.clinic_id == current_user.clinic_id
    ).count()
    if schedule_count == 0:
        seed_vaccination_schedule(db, current_user.clinic_id)

    return compute_vaccination_schedule_view(
        db, current_user.clinic_id, status_filter=status, limit=limit, offset=offset
    )


@router.get("/dashboard", response_model=VaccinationDashboardResponse)
async def get_dashboard(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_permission("can_view_patients")),
    _plugin: User = Depends(require_plugin("vaccination")),
    db: Session = Depends(get_db),
):
    """Get vaccination dashboard: due/overdue children."""
    # Auto-seed schedule if needed
    schedule_count = db.query(VaccinationSchedule).filter(
        VaccinationSchedule.clinic_id == current_user.clinic_id
    ).count()
    if schedule_count == 0:
        seed_vaccination_schedule(db, current_user.clinic_id)

    return compute_vaccination_dashboard(db, current_user.clinic_id, limit=limit, offset=offset)
