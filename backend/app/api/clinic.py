from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.deps import get_current_user, get_current_doctor
from app.models.models import User, Clinic, Doctor
from app.schemas.schemas import ClinicUpdate, DoctorUpdate

router = APIRouter()


@router.get("/", response_model=dict)
async def get_clinic_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get clinic information"""
    clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()

    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    return {"clinic": clinic}


@router.put("/", response_model=dict)
async def update_clinic(
    clinic_data: ClinicUpdate,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Update clinic information (doctor only)"""
    clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()

    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    update_data = clinic_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(clinic, field, value)

    db.commit()
    db.refresh(clinic)

    return {"message": "Clinic updated successfully", "clinic": clinic}


@router.get("/doctor-profile", response_model=dict)
async def get_doctor_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get doctor profile"""
    doctor = db.query(Doctor).filter(Doctor.clinic_id == current_user.clinic_id).first()

    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")

    return {"doctor": doctor}


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

    return {"message": "Doctor profile updated successfully", "doctor": doctor}
