from fastapi import APIRouter, Depends, HTTPException, Request, status, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import date, datetime
from typing import Optional, Literal
from math import ceil
from app.core.database import get_db
from app.core.deps import get_current_user, require_permission, require_plugin, get_client_ip
from app.models.models import User, Appointment, Patient, AppointmentStatusEnum, Visit, Doctor, AuditActionEnum
from app.schemas.schemas import AppointmentCreate, AppointmentUpdate, AppointmentPositionUpdate
from app.utils.age import format_age_display
from app.services.audit_service import create_audit_log

router = APIRouter()


@router.get("/queue", response_model=dict)
async def get_queue(
    queue_date: Optional[date] = Query(None, description="Date to filter queue (defaults to today)"),
    current_user: User = Depends(require_permission("can_view_opd")),
    _plugin: User = Depends(require_plugin("opd_queue")),
    db: Session = Depends(get_db)
):
    """Get OPD queue for a specific date (defaults to today)"""
    target_date = queue_date or date.today()

    appointments = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.visit).joinedload(Visit.doctor).joinedload(Doctor.user)
    ).filter(
        Appointment.clinic_id == current_user.clinic_id,
        Appointment.appointment_date == target_date
    ).order_by(Appointment.queue_number.asc()).all()

    queue = []
    for apt in appointments:
        # Get doctor info for completed appointments (already eager loaded)
        doctor_info = None
        if apt.status == AppointmentStatusEnum.COMPLETED and apt.visit:
            visit = apt.visit
            if visit.doctor:
                doctor = visit.doctor
                doctor_user = doctor.user
                doctor_info = {
                    "id": doctor.id,
                    "name": doctor_user.full_name if doctor_user else None,
                    "doctor_code": doctor.doctor_code,
                }

        # Include visit info for completed appointments
        visit_info = None
        if apt.status == AppointmentStatusEnum.COMPLETED and apt.visit:
            visit_info = {
                "id": apt.visit.id,
                "amount": float(apt.visit.amount) if apt.visit.amount else None,
                "follow_up_date": apt.visit.follow_up_date.isoformat() if apt.visit.follow_up_date else None,
            }

        queue.append({
            "id": apt.id,
            "patient_id": apt.patient_id,
            "patient_name": apt.patient.full_name if apt.patient else None,
            "patient_code": apt.patient.patient_code if apt.patient else None,
            "patient": {
                "id": apt.patient.id,
                "full_name": apt.patient.full_name,
                "patient_code": apt.patient.patient_code,
                "age": apt.patient.age,
                "age_display": format_age_display(apt.patient.date_of_birth, apt.patient.age),
                "phone": apt.patient.phone,
                "address": apt.patient.address,
            } if apt.patient else None,
            "queue_number": apt.queue_number,
            "chief_complaints": apt.chief_complaints or [],
            "status": apt.status.value,
            "created_at": apt.created_at.isoformat() if apt.created_at else None,
            "doctor": doctor_info,
            "visit": visit_info,
        })

    return {"queue": queue, "date": target_date.isoformat()}


@router.get("/stats", response_model=dict)
async def get_daily_stats(
    stats_date: Optional[date] = Query(None, description="Date to get stats for (defaults to today)"),
    current_user: User = Depends(require_permission("can_view_opd")),
    _plugin: User = Depends(require_plugin("opd_queue")),
    db: Session = Depends(get_db)
):
    """Get daily statistics for a specific date"""
    target_date = stats_date or date.today()

    total = db.query(Appointment).filter(
        Appointment.clinic_id == current_user.clinic_id,
        Appointment.appointment_date == target_date
    ).count()

    waiting = db.query(Appointment).filter(
        Appointment.clinic_id == current_user.clinic_id,
        Appointment.appointment_date == target_date,
        Appointment.status == AppointmentStatusEnum.WAITING
    ).count()

    in_progress = db.query(Appointment).filter(
        Appointment.clinic_id == current_user.clinic_id,
        Appointment.appointment_date == target_date,
        Appointment.status == AppointmentStatusEnum.IN_PROGRESS
    ).count()

    completed = db.query(Appointment).filter(
        Appointment.clinic_id == current_user.clinic_id,
        Appointment.appointment_date == target_date,
        Appointment.status == AppointmentStatusEnum.COMPLETED
    ).count()

    return {
        "stats": {
            "total": total,
            "completed": completed,
            "waiting": waiting,
            "inProgress": in_progress
        },
        "date": target_date.isoformat()
    }


@router.get("/appointments/active", response_model=dict)
async def get_active_appointment(
    patient_id: str = Query(..., description="Patient ID to check"),
    current_user: User = Depends(require_permission("can_view_opd")),
    _plugin: User = Depends(require_plugin("opd_queue")),
    db: Session = Depends(get_db)
):
    """Get active (WAITING/IN_PROGRESS) appointment for a patient today"""
    active = db.query(Appointment).filter(
        Appointment.patient_id == patient_id,
        Appointment.appointment_date == date.today(),
        Appointment.clinic_id == current_user.clinic_id,
        Appointment.status.in_([AppointmentStatusEnum.WAITING, AppointmentStatusEnum.IN_PROGRESS])
    ).order_by(Appointment.queue_number.asc()).first()

    if not active:
        return {"appointment": None}

    return {
        "appointment": {
            "id": active.id,
            "queue_number": active.queue_number,
            "chief_complaints": active.chief_complaints or [],
            "status": active.status.value
        }
    }


@router.post("/appointments/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_to_queue(
    appointment_data: AppointmentCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("can_manage_opd")),
    _plugin: User = Depends(require_plugin("opd_queue")),
    db: Session = Depends(get_db)
):
    """Add patient to OPD queue"""
    today = date.today()

    last_appointment = db.query(Appointment).filter(
        Appointment.clinic_id == current_user.clinic_id,
        Appointment.appointment_date == today
    ).order_by(Appointment.queue_number.desc()).first()

    queue_number = (last_appointment.queue_number + 1) if last_appointment and last_appointment.queue_number else 1

    appointment = Appointment(
        patient_id=appointment_data.patient_id,
        appointment_date=today,
        queue_number=queue_number,
        chief_complaints=appointment_data.chief_complaints or [],
        status=AppointmentStatusEnum.WAITING,
        clinic_id=current_user.clinic_id,
        created_by=current_user.id,
        created_at=datetime.now()
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    background_tasks.add_task(
        create_audit_log,
        action=AuditActionEnum.CREATE,
        resource_type="appointments",
        resource_id=appointment.id,
        user_id=current_user.id,
        user_email=current_user.email,
        clinic_id=current_user.clinic_id,
        description=f"Added patient to OPD queue (#{appointment.queue_number})",
        ip_address=get_client_ip(request),
    )

    return {"message": "Added to queue", "appointment": {"id": appointment.id, "queue_number": appointment.queue_number}}


@router.put("/appointments/{appointment_id}/status", response_model=dict)
async def update_queue_status(
    appointment_id: str,
    status_data: AppointmentUpdate,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("can_manage_opd")),
    _plugin: User = Depends(require_plugin("opd_queue")),
    db: Session = Depends(get_db)
):
    """Update appointment status"""
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.clinic_id == current_user.clinic_id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    old_status = appointment.status.value if appointment.status else None

    if status_data.status:
        appointment.status = status_data.status

    db.commit()
    db.refresh(appointment)

    background_tasks.add_task(
        create_audit_log,
        action=AuditActionEnum.UPDATE,
        resource_type="appointments",
        resource_id=appointment.id,
        user_id=current_user.id,
        user_email=current_user.email,
        clinic_id=current_user.clinic_id,
        description=f"Appointment status: {old_status} → {appointment.status.value}",
        old_values={"status": old_status},
        new_values={"status": appointment.status.value},
        ip_address=get_client_ip(request),
    )

    return {"message": "Status updated", "appointment": {"id": appointment.id, "status": appointment.status.value}}


@router.put("/appointments/{appointment_id}/position", response_model=dict)
async def update_queue_position(
    appointment_id: str,
    position_data: AppointmentPositionUpdate,
    current_user: User = Depends(require_permission("can_manage_opd")),
    _plugin: User = Depends(require_plugin("opd_queue")),
    db: Session = Depends(get_db)
):
    """Update appointment position in queue (reorder)"""
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.clinic_id == current_user.clinic_id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    current_position = appointment.queue_number
    new_position = position_data.new_position
    target_date = appointment.appointment_date

    if current_position == new_position:
        return {"message": "Position unchanged", "appointment": {"id": appointment.id, "queue_number": appointment.queue_number}}

    all_appointments = db.query(Appointment).filter(
        Appointment.clinic_id == current_user.clinic_id,
        Appointment.appointment_date == target_date
    ).order_by(Appointment.queue_number.asc()).all()

    if new_position < 1:
        new_position = 1
    if new_position > len(all_appointments):
        new_position = len(all_appointments)

    if new_position < current_position:
        for apt in all_appointments:
            if apt.queue_number >= new_position and apt.queue_number < current_position:
                apt.queue_number += 1
    else:
        for apt in all_appointments:
            if apt.queue_number > current_position and apt.queue_number <= new_position:
                apt.queue_number -= 1

    appointment.queue_number = new_position
    db.commit()

    return {"message": "Position updated", "appointment": {"id": appointment.id, "queue_number": appointment.queue_number}}


@router.get("/follow-ups", response_model=dict)
async def get_follow_ups(
    status: Optional[Literal["overdue", "today", "upcoming", "all"]] = Query("all"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    patient_search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_permission("can_view_opd")),
    _plugin: User = Depends(require_plugin("opd_queue")),
    db: Session = Depends(get_db)
):
    """Get all follow-ups with filtering, search, and pagination"""
    today = date.today()

    base_filter = [
        Visit.clinic_id == current_user.clinic_id,
        Visit.follow_up_date.isnot(None),
    ]

    # Summary counts (always unfiltered by search/date-range)
    overdue_count = db.query(func.count(Visit.id)).filter(
        *base_filter, Visit.follow_up_date < today
    ).scalar()
    today_count = db.query(func.count(Visit.id)).filter(
        *base_filter, Visit.follow_up_date == today
    ).scalar()
    upcoming_count = db.query(func.count(Visit.id)).filter(
        *base_filter, Visit.follow_up_date > today
    ).scalar()

    # Build query
    query = db.query(Visit).options(
        joinedload(Visit.patient),
        joinedload(Visit.doctor).joinedload(Doctor.user),
    ).filter(*base_filter)

    # Apply status filter
    if start_date or end_date:
        if start_date:
            query = query.filter(Visit.follow_up_date >= start_date)
        if end_date:
            query = query.filter(Visit.follow_up_date <= end_date)
    elif status == "overdue":
        query = query.filter(Visit.follow_up_date < today)
    elif status == "today":
        query = query.filter(Visit.follow_up_date == today)
    elif status == "upcoming":
        query = query.filter(Visit.follow_up_date > today)

    # Patient search
    if patient_search:
        search_term = f"%{patient_search}%"
        query = query.join(Visit.patient).filter(
            (Patient.full_name.ilike(search_term)) |
            (Patient.patient_code.ilike(search_term))
        )

    # Get total count for pagination
    total = query.count()
    total_pages = ceil(total / limit) if total > 0 else 1

    # Order and paginate
    query = query.order_by(Visit.follow_up_date.asc())
    offset = (page - 1) * limit
    visits = query.offset(offset).limit(limit).all()

    return {
        "follow_ups": [
            {
                "visit_id": str(v.id),
                "patient_id": str(v.patient_id),
                "patient_name": v.patient.full_name if v.patient else None,
                "patient_code": v.patient.patient_code if v.patient else None,
                "last_visit_date": v.visit_date.isoformat() if v.visit_date else None,
                "follow_up_date": v.follow_up_date.isoformat() if v.follow_up_date else None,
                "diagnosis": v.diagnosis or [],
                "doctor_name": (
                    v.doctor.user.full_name if v.doctor and v.doctor.user else None
                ),
                "status": (
                    "overdue" if v.follow_up_date < today
                    else "today" if v.follow_up_date == today
                    else "upcoming"
                ),
            }
            for v in visits
        ],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": total_pages,
        },
        "summary": {
            "overdue": overdue_count,
            "today": today_count,
            "upcoming": upcoming_count,
        },
    }


@router.get("/follow-ups-due", response_model=dict)
async def get_follow_ups_due(
    target_date: Optional[date] = Query(None, description="Date to check follow-ups (defaults to today)"),
    current_user: User = Depends(require_permission("can_view_opd")),
    _plugin: User = Depends(require_plugin("opd_queue")),
    db: Session = Depends(get_db)
):
    """Get patients with follow-ups due on a specific date (defaults to today)"""
    check_date = target_date or date.today()

    visits = db.query(Visit).options(
        joinedload(Visit.patient)
    ).filter(
        Visit.clinic_id == current_user.clinic_id,
        Visit.follow_up_date == check_date
    ).all()

    return {
        "follow_ups": [
            {
                "visit_id": str(v.id),
                "patient_id": str(v.patient_id),
                "patient_name": v.patient.full_name if v.patient else None,
                "patient_code": v.patient.patient_code if v.patient else None,
                "last_visit_date": v.visit_date.isoformat() if v.visit_date else None,
                "diagnosis": v.diagnosis or [],
            }
            for v in visits
        ],
        "count": len(visits),
        "date": check_date.isoformat()
    }


@router.get("/appointments/{appointment_id}/visit", response_model=dict)
async def get_visit_by_appointment(
    appointment_id: str,
    current_user: User = Depends(require_permission("can_view_visits")),
    _plugin: User = Depends(require_plugin("opd_queue")),
    db: Session = Depends(get_db)
):
    """Get visit details linked to an appointment (for OPD reopen case)"""
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.clinic_id == current_user.clinic_id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Find visit linked to this appointment with eager loading
    visit = db.query(Visit).options(
        joinedload(Visit.doctor).joinedload(Doctor.user)
    ).filter(Visit.appointment_id == appointment_id).first()

    if not visit:
        return {"visit": None}

    doctor = visit.doctor
    doctor_user = doctor.user if doctor else None

    return {
        "visit": {
            "id": visit.id,
            "symptoms": visit.symptoms,
            "diagnosis": visit.diagnosis,
            "observations": visit.observations,
            "recommended_tests": visit.recommended_tests or [],
            "follow_up_date": visit.follow_up_date.isoformat() if visit.follow_up_date else None,
            "vitals": visit.vitals or {},
            "visit_number": visit.visit_number,
            "visit_date": visit.visit_date.isoformat() if visit.visit_date else None,
            "doctor": {
                "id": doctor.id,
                "name": doctor_user.full_name if doctor_user else None,
                "doctor_code": doctor.doctor_code,
                "specialization": doctor.specialization,
                "registration_number": doctor.registration_number
            } if doctor else None,
        }
    }
