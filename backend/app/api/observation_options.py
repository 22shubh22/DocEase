from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, ObservationOption, RoleEnum
from app.schemas.schemas import (
    ObservationOptionCreate,
    ObservationOptionUpdate,
    ObservationOptionResponse
)

router = APIRouter(tags=["Observation Options"])


def require_doctor(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can manage observation options")
    return current_user


@router.get("/", response_model=List[ObservationOptionResponse])
def get_observation_options(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ObservationOption).filter(ObservationOption.clinic_id == current_user.clinic_id)
    if active_only:
        query = query.filter(ObservationOption.is_active == True)
    return query.order_by(ObservationOption.display_order, ObservationOption.name).all()


@router.post("/", response_model=ObservationOptionResponse)
def create_observation_option(
    data: ObservationOptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    option = ObservationOption(
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


@router.put("/{option_id}", response_model=ObservationOptionResponse)
def update_observation_option(
    option_id: str,
    data: ObservationOptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    option = db.query(ObservationOption).filter(
        ObservationOption.id == option_id,
        ObservationOption.clinic_id == current_user.clinic_id
    ).first()
    if not option:
        raise HTTPException(status_code=404, detail="Observation option not found")
    
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
def delete_observation_option(
    option_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
):
    option = db.query(ObservationOption).filter(
        ObservationOption.id == option_id,
        ObservationOption.clinic_id == current_user.clinic_id
    ).first()
    if not option:
        raise HTTPException(status_code=404, detail="Observation option not found")
    
    db.delete(option)
    db.commit()
    return {"message": "Observation option deleted"}
