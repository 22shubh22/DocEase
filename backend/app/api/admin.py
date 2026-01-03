from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.deps import get_db, get_current_user
from app.models.models import User, Clinic, Doctor, Patient, ClinicAdmin, RoleEnum
from app.schemas.schemas import (
    ClinicCreate, ClinicResponse, ClinicUpdate, ClinicWithDoctors,
    DoctorAssignment, AdminDashboardStats, UserCreate, UserResponse
)
from app.core.security import get_password_hash

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/stats", response_model=AdminDashboardStats)
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    admin_clinic_ids = [ca.clinic_id for ca in current_user.managed_clinics]
    
    total_clinics = len(admin_clinic_ids)
    total_doctors = db.query(Doctor).filter(Doctor.clinic_id.in_(admin_clinic_ids)).count() if admin_clinic_ids else 0
    total_patients = db.query(Patient).filter(Patient.clinic_id.in_(admin_clinic_ids)).count() if admin_clinic_ids else 0
    
    return AdminDashboardStats(
        total_clinics=total_clinics,
        total_doctors=total_doctors,
        total_patients=total_patients
    )


@router.get("/clinics", response_model=List[ClinicResponse])
async def get_admin_clinics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    admin_clinic_ids = [ca.clinic_id for ca in current_user.managed_clinics]
    clinics = db.query(Clinic).filter(Clinic.id.in_(admin_clinic_ids)).all()
    return clinics


@router.post("/clinics", response_model=ClinicResponse, status_code=status.HTTP_201_CREATED)
async def create_clinic(
    clinic_data: ClinicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    clinic = Clinic(**clinic_data.dict())
    db.add(clinic)
    db.flush()
    
    clinic_admin = ClinicAdmin(admin_id=current_user.id, clinic_id=clinic.id)
    db.add(clinic_admin)
    db.commit()
    db.refresh(clinic)
    
    return clinic


@router.get("/clinics/{clinic_id}", response_model=ClinicWithDoctors)
async def get_clinic_details(
    clinic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    admin_clinic_ids = [ca.clinic_id for ca in current_user.managed_clinics]
    if clinic_id not in admin_clinic_ids:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    return clinic


@router.put("/clinics/{clinic_id}", response_model=ClinicResponse)
async def update_clinic(
    clinic_id: str,
    clinic_data: ClinicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    admin_clinic_ids = [ca.clinic_id for ca in current_user.managed_clinics]
    if clinic_id not in admin_clinic_ids:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    for key, value in clinic_data.dict(exclude_unset=True).items():
        setattr(clinic, key, value)
    
    db.commit()
    db.refresh(clinic)
    return clinic


@router.delete("/clinics/{clinic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_clinic(
    clinic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    admin_clinic_ids = [ca.clinic_id for ca in current_user.managed_clinics]
    if clinic_id not in admin_clinic_ids:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    db.delete(clinic)
    db.commit()


@router.get("/clinics/{clinic_id}/doctors", response_model=List[UserResponse])
async def get_clinic_doctors(
    clinic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    admin_clinic_ids = [ca.clinic_id for ca in current_user.managed_clinics]
    if clinic_id not in admin_clinic_ids:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    doctors = db.query(User).filter(
        User.clinic_id == clinic_id,
        User.role == RoleEnum.DOCTOR
    ).all()
    return doctors


@router.post("/clinics/{clinic_id}/doctors", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def add_doctor_to_clinic(
    clinic_id: str,
    doctor_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    admin_clinic_ids = [ca.clinic_id for ca in current_user.managed_clinics]
    if clinic_id not in admin_clinic_ids:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    existing = db.query(User).filter(User.email == doctor_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=doctor_data.email,
        password_hash=get_password_hash(doctor_data.password),
        role=RoleEnum.DOCTOR,
        full_name=doctor_data.full_name,
        phone=doctor_data.phone,
        clinic_id=clinic_id
    )
    db.add(user)
    db.flush()
    
    doctor = Doctor(user_id=user.id, clinic_id=clinic_id)
    db.add(doctor)
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/clinics/{clinic_id}/doctors/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_doctor_from_clinic(
    clinic_id: str,
    doctor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    admin_clinic_ids = [ca.clinic_id for ca in current_user.managed_clinics]
    if clinic_id not in admin_clinic_ids:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    user = db.query(User).filter(
        User.id == doctor_id,
        User.clinic_id == clinic_id,
        User.role == RoleEnum.DOCTOR
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Doctor not found in this clinic")
    
    db.delete(user)
    db.commit()
