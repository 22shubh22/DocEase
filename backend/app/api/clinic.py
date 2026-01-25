from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_doctor
from app.models.models import User, Clinic, Doctor
from app.schemas.schemas import ClinicUpdate, DoctorUpdate

router = APIRouter()


def clinic_to_dict(clinic):
    """Convert a Clinic model to a dictionary"""
    return {
        "id": clinic.id,
        "name": clinic.name,
        "address": clinic.address,
        "phone": clinic.phone,
        "email": clinic.email,
        "logo_url": clinic.logo_url,
        "owner_doctor_id": clinic.owner_doctor_id,
        "created_at": clinic.created_at.isoformat() if clinic.created_at else None,
        "updated_at": clinic.updated_at.isoformat() if clinic.updated_at else None,
    }


def doctor_to_dict(doctor):
    """Convert a Doctor model to a dictionary"""
    return {
        "id": doctor.id,
        "user_id": doctor.user_id,
        "clinic_id": doctor.clinic_id,
        "specialization": doctor.specialization,
        "qualification": doctor.qualification,
        "registration_number": doctor.registration_number,
        "signature_url": doctor.signature_url,
        "created_at": doctor.created_at.isoformat() if doctor.created_at else None,
        "updated_at": doctor.updated_at.isoformat() if doctor.updated_at else None,
    }


@router.get("/", response_model=dict)
async def get_clinic_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get clinic information"""
    clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()

    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    is_owner = False
    if current_user.role.value == "DOCTOR":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor and clinic.owner_doctor_id == doctor.id:
            is_owner = True

    return {"clinic": clinic_to_dict(clinic), "is_owner": is_owner}


@router.put("/", response_model=dict)
async def update_clinic(
    clinic_data: ClinicUpdate,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Update clinic information (owner doctor only)"""
    clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()

    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor or clinic.owner_doctor_id != doctor.id:
        raise HTTPException(status_code=403, detail="Only the clinic owner can modify settings")

    update_data = clinic_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(clinic, field, value)

    db.commit()
    db.refresh(clinic)

    return {"message": "Clinic updated successfully", "clinic": clinic_to_dict(clinic)}


@router.get("/doctors", response_model=dict)
async def get_clinic_doctors(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all doctors in the clinic"""
    doctors = db.query(Doctor).filter(Doctor.clinic_id == current_user.clinic_id).all()

    doctor_list = []
    for doctor in doctors:
        user = db.query(User).filter(User.id == doctor.user_id).first()
        doctor_list.append({
            "id": doctor.id,
            "name": user.full_name if user else "Unknown",
            "specialization": doctor.specialization,
            "doctor_code": doctor.doctor_code,
        })

    return {"doctors": doctor_list}


@router.get("/doctor-profile", response_model=dict)
async def get_doctor_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get doctor profile"""
    doctor = db.query(Doctor).filter(Doctor.clinic_id == current_user.clinic_id).first()

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    return {"doctor": doctor_to_dict(doctor)}


@router.put("/doctor-profile", response_model=dict)
async def update_doctor_profile(
    doctor_data: DoctorUpdate,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Update doctor profile (doctor only)"""
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    update_data = doctor_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(doctor, field, value)

    db.commit()
    db.refresh(doctor)

    return {"message": "Doctor profile updated successfully", "doctor": doctor_to_dict(doctor)}
