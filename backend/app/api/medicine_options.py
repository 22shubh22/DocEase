from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, MedicineOption, RoleEnum
from app.schemas.schemas import (
    MedicineOptionCreate,
    MedicineOptionUpdate,
    MedicineOptionResponse
)

router = APIRouter(tags=["Medicine Options"])


def require_doctor(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can manage medicine options")
    return current_user


@router.get("/", response_model=List[MedicineOptionResponse])
def get_medicine_options(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(MedicineOption).filter(MedicineOption.clinic_id == current_user.clinic_id)
    if active_only:
        query = query.filter(MedicineOption.is_active == True)
    return query.order_by(MedicineOption.display_order, MedicineOption.name).all()


@router.post("/", response_model=MedicineOptionResponse)
def create_medicine_option(
    data: MedicineOptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    option = MedicineOption(
        name=data.name,
        description=data.description,
        is_active=data.is_active,
        display_order=data.display_order,
        clinic_id=current_user.clinic_id
    )
    db.add(option)
    db.commit()
    db.refresh(option)
    return option


@router.put("/{option_id}", response_model=MedicineOptionResponse)
def update_medicine_option(
    option_id: str,
    data: MedicineOptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    option = db.query(MedicineOption).filter(
        MedicineOption.id == option_id,
        MedicineOption.clinic_id == current_user.clinic_id
    ).first()
    if not option:
        raise HTTPException(status_code=404, detail="Medicine option not found")

    if data.name is not None:
        option.name = data.name
    if data.description is not None:
        option.description = data.description
    if data.is_active is not None:
        option.is_active = data.is_active
    if data.display_order is not None:
        option.display_order = data.display_order

    db.commit()
    db.refresh(option)
    return option


@router.delete("/{option_id}")
def delete_medicine_option(
    option_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    option = db.query(MedicineOption).filter(
        MedicineOption.id == option_id,
        MedicineOption.clinic_id == current_user.clinic_id
    ).first()
    if not option:
        raise HTTPException(status_code=404, detail="Medicine option not found")

    db.delete(option)
    db.commit()
    return {"message": "Medicine option deleted"}
