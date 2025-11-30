from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Visit, Appointment, AppointmentStatusEnum
from app.schemas.schemas import VisitCreate, VisitUpdate

router = APIRouter()


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_visit(
    visit_data: VisitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new visit"""
    # Get visit number for this patient
    last_visit = db.query(Visit).filter(
        Visit.patient_id == visit_data.patient_id
    ).order_by(Visit.visit_number.desc()).first()

    visit_number = (last_visit.visit_number + 1) if last_visit else 1

    visit = Visit(
        **visit_data.model_dump(exclude={'appointment_id'}),
        appointment_id=visit_data.appointment_id,
        visit_number=visit_number,
        visit_date=date.today(),
        clinic_id=current_user.clinic_id
    )

    db.add(visit)

    # Update appointment status if exists
    if visit_data.appointment_id:
        appointment = db.query(Appointment).filter(
            Appointment.id == visit_data.appointment_id
        ).first()
        if appointment:
            appointment.status = AppointmentStatusEnum.COMPLETED

    db.commit()
    db.refresh(visit)

    return {"message": "Visit created successfully", "visit": visit}


@router.get("/{visit_id}", response_model=dict)
async def get_visit_by_id(
    visit_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get visit by ID"""
    visit = db.query(Visit).filter(
        Visit.id == visit_id,
        Visit.clinic_id == current_user.clinic_id
    ).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    return {"visit": visit}


@router.put("/{visit_id}", response_model=dict)
async def update_visit(
    visit_id: str,
    visit_data: VisitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update visit information"""
    visit = db.query(Visit).filter(
        Visit.id == visit_id,
        Visit.clinic_id == current_user.clinic_id
    ).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    update_data = visit_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(visit, field, value)

    db.commit()
    db.refresh(visit)

    return {"message": "Visit updated successfully", "visit": visit}
