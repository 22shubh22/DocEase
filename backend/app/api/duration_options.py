from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, DurationOption, RoleEnum
from app.schemas.schemas import (
    DurationOptionCreate,
    DurationOptionUpdate,
    DurationOptionResponse
)

router = APIRouter(tags=["Duration Options"])


def require_doctor(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can manage duration options")
    return current_user


@router.get("/", response_model=List[DurationOptionResponse])
def get_duration_options(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DurationOption).filter(DurationOption.clinic_id == current_user.clinic_id)
    if active_only:
        query = query.filter(DurationOption.is_active == True)
    return query.order_by(DurationOption.display_order, DurationOption.name).all()


@router.post("/", response_model=DurationOptionResponse)
def create_duration_option(
    data: DurationOptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    option = DurationOption(
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


@router.put("/{option_id}", response_model=DurationOptionResponse)
def update_duration_option(
    option_id: str,
    data: DurationOptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    option = db.query(DurationOption).filter(
        DurationOption.id == option_id,
        DurationOption.clinic_id == current_user.clinic_id
    ).first()
    if not option:
        raise HTTPException(status_code=404, detail="Duration option not found")

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
def delete_duration_option(
    option_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    option = db.query(DurationOption).filter(
        DurationOption.id == option_id,
        DurationOption.clinic_id == current_user.clinic_id
    ).first()
    if not option:
        raise HTTPException(status_code=404, detail="Duration option not found")

    db.delete(option)
    db.commit()
    return {"message": "Duration option deleted"}
