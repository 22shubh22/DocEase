from fastapi import APIRouter, Depends, HTTPException, Request, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, cast, Integer
from typing import Optional
from app.core.database import get_db
from app.core.deps import get_current_user, require_permission, get_client_ip
from app.models.models import User, Patient, Visit, VisitMedicine, AuditActionEnum
from app.schemas.schemas import PatientCreate, PatientUpdate, PatientResponse
from app.services.audit_service import create_audit_log, get_model_dict, compute_changes

router = APIRouter()


def patient_to_dict(patient):
    """Convert a Patient model to a dictionary"""
    return {
        "id": patient.id,
        "patient_code": patient.patient_code,
        "full_name": patient.full_name,
        "age": patient.age,
        "gender": patient.gender,
        "phone": patient.phone,
        "emergency_contact": patient.emergency_contact,
        "address": patient.address,
        "blood_group": patient.blood_group,
        "allergies": patient.allergies,
        "medical_history": patient.medical_history,
        "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
        "guardian_name": patient.guardian_name,
        "guardian_phone": patient.guardian_phone,
        "guardian_relationship": patient.guardian_relationship,
        "clinic_id": patient.clinic_id,
        "created_by": patient.created_by,
        "created_by_name": patient.creator.full_name if patient.creator else "System",
        "created_at": patient.created_at.isoformat() if patient.created_at else None,
        "updated_at": patient.updated_at.isoformat() if patient.updated_at else None,
    }


@router.get("/", response_model=dict)
async def get_all_patients(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(require_permission("can_view_patients")),
    db: Session = Depends(get_db)
):
    """Get all patients with pagination"""
    skip = (page - 1) * limit

    total = db.query(Patient).filter(Patient.clinic_id == current_user.clinic_id).count()

    patients = db.query(Patient).filter(
        Patient.clinic_id == current_user.clinic_id
    ).order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "patients": [patient_to_dict(p) for p in patients],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    }


@router.get("/stats", response_model=dict)
async def get_patient_stats(
    current_user: User = Depends(require_permission("can_view_patients")),
    db: Session = Depends(get_db)
):
    """Get patient statistics"""
    total_patients = db.query(Patient).filter(
        Patient.clinic_id == current_user.clinic_id
    ).count()

    return {
        "total_patients": total_patients
    }


@router.get("/search", response_model=dict)
async def search_patients(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(require_permission("can_view_patients")),
    db: Session = Depends(get_db)
):
    """Search patients by name, phone, patient code, or address.
    Supports multiple search terms separated by spaces.
    All terms must match (in any field) for a patient to be included.
    """
    # Split query into terms
    terms = q.strip().split()

    # Build conditions: each term must appear in at least one field
    conditions = []
    for term in terms:
        term_condition = or_(
            Patient.full_name.ilike(f"%{term}%"),
            Patient.phone.contains(term),
            Patient.patient_code.ilike(f"%{term}%"),
            Patient.address.ilike(f"%{term}%"),
            Patient.guardian_name.ilike(f"%{term}%")
        )
        conditions.append(term_condition)

    # All term conditions must be satisfied (AND logic)
    patients = db.query(Patient).filter(
        Patient.clinic_id == current_user.clinic_id,
        and_(*conditions)
    ).limit(20).all()

    return {"patients": [patient_to_dict(p) for p in patients]}


@router.get("/{patient_id}", response_model=dict)
async def get_patient_by_id(
    patient_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("can_view_patients")),
    db: Session = Depends(get_db)
):
    """Get patient by ID"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_user.clinic_id
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    background_tasks.add_task(
        create_audit_log,
        action=AuditActionEnum.READ,
        resource_type="patients",
        resource_id=patient.id,
        user_id=current_user.id,
        user_email=current_user.email,
        clinic_id=current_user.clinic_id,
        description=f"Viewed patient {patient.patient_code}",
        ip_address=get_client_ip(request),
    )

    patient_dict = {
        "id": patient.id,
        "patient_code": patient.patient_code,
        "full_name": patient.full_name,
        "age": patient.age,
        "gender": patient.gender,
        "phone": patient.phone,
        "emergency_contact": patient.emergency_contact,
        "address": patient.address,
        "blood_group": patient.blood_group,
        "allergies": patient.allergies,
        "medical_history": patient.medical_history,
        "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
        "guardian_name": patient.guardian_name,
        "guardian_phone": patient.guardian_phone,
        "guardian_relationship": patient.guardian_relationship,
        "clinic_id": patient.clinic_id,
        "created_by": patient.created_by,
        "created_at": patient.created_at,
        "updated_at": patient.updated_at,
        "created_by_name": patient.creator.full_name if patient.creator else "System"
    }

    return {"patient": patient_dict}


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("can_create_patients")),
    db: Session = Depends(get_db)
):
    """Create a new patient"""
    # Generate patient code by finding the global maximum numeric value
    max_num_result = db.query(
        func.max(
            cast(func.split_part(Patient.patient_code, '-', 2), Integer)
        )
    ).filter(
        Patient.patient_code.like('PT-%')
    ).scalar()

    max_num = max_num_result or 0
    patient_code = f"PT-{str(max_num + 1).zfill(4)}"

    patient_dict = patient_data.model_dump()
    patient_since = patient_dict.pop('patient_since', None)
    
    patient = Patient(
        **patient_dict,
        patient_code=patient_code,
        clinic_id=current_user.clinic_id,
        created_by=current_user.id
    )
    
    if patient_since:
        patient.created_at = patient_since

    db.add(patient)
    db.commit()
    db.refresh(patient)

    background_tasks.add_task(
        create_audit_log,
        action=AuditActionEnum.CREATE,
        resource_type="patients",
        resource_id=patient.id,
        user_id=current_user.id,
        user_email=current_user.email,
        clinic_id=current_user.clinic_id,
        description=f"Created patient {patient.patient_code}",
        new_values=get_model_dict(patient, exclude_fields=['clinic', 'creator', 'appointments', 'visits']),
        ip_address=get_client_ip(request),
    )

    return {"message": "Patient created successfully", "patient": patient_to_dict(patient)}


@router.put("/{patient_id}", response_model=dict)
async def update_patient(
    patient_id: str,
    patient_data: PatientUpdate,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("can_edit_patients")),
    db: Session = Depends(get_db)
):
    """Update patient information"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_user.clinic_id
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    old_snapshot = get_model_dict(patient, exclude_fields=['clinic', 'creator', 'appointments', 'visits'])

    update_data = patient_data.model_dump(exclude_unset=True)
    patient_since = update_data.pop('patient_since', None)

    for field, value in update_data.items():
        setattr(patient, field, value)

    if patient_since:
        patient.created_at = patient_since

    db.commit()
    db.refresh(patient)

    new_snapshot = get_model_dict(patient, exclude_fields=['clinic', 'creator', 'appointments', 'visits'])
    old_changes, new_changes = compute_changes(old_snapshot, new_snapshot)

    if old_changes:
        background_tasks.add_task(
            create_audit_log,
            action=AuditActionEnum.UPDATE,
            resource_type="patients",
            resource_id=patient.id,
            user_id=current_user.id,
            user_email=current_user.email,
            clinic_id=current_user.clinic_id,
            description=f"Updated patient {patient.patient_code}",
            old_values=old_changes,
            new_values=new_changes,
            ip_address=get_client_ip(request),
        )

    return {"message": "Patient updated successfully", "patient": patient_to_dict(patient)}


@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("can_delete_patients")),
    db: Session = Depends(get_db)
):
    """Delete a patient (requires can_delete_patients permission)"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_user.clinic_id
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    old_snapshot = get_model_dict(patient, exclude_fields=['clinic', 'creator', 'appointments', 'visits'])
    patient_code = patient.patient_code

    db.delete(patient)
    db.commit()

    background_tasks.add_task(
        create_audit_log,
        action=AuditActionEnum.DELETE,
        resource_type="patients",
        resource_id=patient_id,
        user_id=current_user.id,
        user_email=current_user.email,
        clinic_id=current_user.clinic_id,
        description=f"Deleted patient {patient_code}",
        old_values=old_snapshot,
        ip_address=get_client_ip(request),
    )

    return {"message": "Patient deleted successfully"}


@router.get("/{patient_id}/visits", response_model=dict)
async def get_patient_visits(
    patient_id: str,
    current_user: User = Depends(require_permission("can_view_visits")),
    db: Session = Depends(get_db)
):
    """Get all visits for a patient with medicines"""
    visits = db.query(Visit).filter(
        Visit.patient_id == patient_id,
        Visit.clinic_id == current_user.clinic_id
    ).order_by(Visit.visit_date.desc()).all()

    visit_list = []
    for visit in visits:
        # Get medicines for this visit
        medicines = db.query(VisitMedicine).filter(VisitMedicine.visit_id == visit.id).all()
        medicines_data = [
            {
                "id": m.id,
                "medicine_name": m.medicine_name,
                "dosage": m.dosage,
                "duration": m.duration,
            }
            for m in medicines
        ]

        visit_list.append({
            "id": visit.id,
            "visit_date": visit.visit_date.isoformat() if visit.visit_date else None,
            "visit_number": visit.visit_number,
            "patient_id": visit.patient_id,
            "doctor_id": visit.doctor_id,
            "symptoms": visit.symptoms,
            "diagnosis": visit.diagnosis,
            "observations": visit.observations,
            "recommended_tests": visit.recommended_tests,
            "follow_up_date": visit.follow_up_date.isoformat() if visit.follow_up_date else None,
            "vitals": visit.vitals,
            "prescription_notes": visit.prescription_notes,
            "medicines": medicines_data,
            "created_at": visit.created_at.isoformat() if visit.created_at else None,
        })

    return {"visits": visit_list}


@router.get("/{patient_id}/prescriptions", response_model=dict)
async def get_patient_prescriptions(
    patient_id: str,
    current_user: User = Depends(require_permission("can_view_visits")),
    db: Session = Depends(get_db)
):
    """Get all prescriptions (visits with medicines) for a patient"""
    # Get visits that have medicines
    visits = db.query(Visit).filter(
        Visit.patient_id == patient_id,
        Visit.clinic_id == current_user.clinic_id
    ).order_by(Visit.visit_date.desc()).all()

    prescription_list = []
    for visit in visits:
        # Get medicines for this visit
        medicines = db.query(VisitMedicine).filter(VisitMedicine.visit_id == visit.id).all()

        # Only include visits that have medicines (prescriptions)
        if not medicines:
            continue

        medicines_data = [
            {
                "id": m.id,
                "medicine_name": m.medicine_name,
                "dosage": m.dosage,
                "duration": m.duration,
            }
            for m in medicines
        ]

        prescription_list.append({
            "id": visit.id,  # Using visit_id as prescription_id
            "visit_id": visit.id,
            "patient_id": visit.patient_id,
            "doctor_id": visit.doctor_id,
            "prescription_date": visit.visit_date.isoformat() if visit.visit_date else None,
            "medicines": medicines_data,
            "notes": visit.prescription_notes,
            "visit": {
                "id": visit.id,
                "visit_date": visit.visit_date.isoformat() if visit.visit_date else None,
                "diagnosis": visit.diagnosis,
            },
            "created_at": visit.created_at.isoformat() if visit.created_at else None,
        })

    return {"prescriptions": prescription_list}
