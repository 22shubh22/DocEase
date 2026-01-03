from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
from app.db.database import get_db
from app.core.deps import get_current_user, get_current_doctor
from app.models.models import User, Patient, Visit, Prescription
from app.schemas.schemas import PatientCreate, PatientUpdate, PatientResponse

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
        "clinic_id": patient.clinic_id,
        "created_by": patient.created_by,
        "created_at": patient.created_at.isoformat() if patient.created_at else None,
        "updated_at": patient.updated_at.isoformat() if patient.updated_at else None,
    }


@router.get("/", response_model=dict)
async def get_all_patients(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
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


@router.get("/search", response_model=dict)
async def search_patients(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search patients by name, phone, or patient code"""
    patients = db.query(Patient).filter(
        Patient.clinic_id == current_user.clinic_id,
        or_(
            Patient.full_name.ilike(f"%{q}%"),
            Patient.phone.contains(q),
            Patient.patient_code.ilike(f"%{q}%")
        )
    ).limit(20).all()

    return {"patients": [patient_to_dict(p) for p in patients]}


@router.get("/{patient_id}", response_model=dict)
async def get_patient_by_id(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get patient by ID"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_user.clinic_id
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new patient"""
    # Generate patient code by finding the maximum numeric value
    patients = db.query(Patient).filter(
        Patient.clinic_id == current_user.clinic_id
    ).all()
    
    max_num = 0
    for p in patients:
        if p.patient_code and '-' in p.patient_code:
            try:
                num = int(p.patient_code.split('-')[1])
                if num > max_num:
                    max_num = num
            except (ValueError, IndexError):
                continue
    
    patient_code = f"PT-{str(max_num + 1).zfill(4)}"

    patient = Patient(
        **patient_data.model_dump(),
        patient_code=patient_code,
        clinic_id=current_user.clinic_id,
        created_by=current_user.id
    )

    db.add(patient)
    db.commit()
    db.refresh(patient)

    return {"message": "Patient created successfully", "patient": patient_to_dict(patient)}


@router.put("/{patient_id}", response_model=dict)
async def update_patient(
    patient_id: str,
    patient_data: PatientUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update patient information"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_user.clinic_id
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    update_data = patient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    return {"message": "Patient updated successfully", "patient": patient_to_dict(patient)}


@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: str,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Delete a patient (doctor only)"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_user.clinic_id
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db.delete(patient)
    db.commit()

    return {"message": "Patient deleted successfully"}


@router.get("/{patient_id}/visits", response_model=dict)
async def get_patient_visits(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all visits for a patient"""
    visits = db.query(Visit).filter(
        Visit.patient_id == patient_id,
        Visit.clinic_id == current_user.clinic_id
    ).order_by(Visit.visit_date.desc()).all()

    return {"visits": visits}


@router.get("/{patient_id}/prescriptions", response_model=dict)
async def get_patient_prescriptions(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all prescriptions for a patient"""
    prescriptions = db.query(Prescription).filter(
        Prescription.patient_id == patient_id,
        Prescription.clinic_id == current_user.clinic_id
    ).order_by(Prescription.prescription_date.desc()).all()

    return {"prescriptions": prescriptions}
