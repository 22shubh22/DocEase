from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import date, datetime
from typing import Optional
from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Appointment, Invoice, Patient, AppointmentStatusEnum, Visit
from app.schemas.schemas import AppointmentCreate, AppointmentUpdate, AppointmentPositionUpdate

router = APIRouter()


@router.get("/queue", response_model=dict)
async def get_queue(
    queue_date: Optional[date] = Query(None, description="Date to filter queue (defaults to today)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get OPD queue for a specific date (defaults to today)"""
    target_date = queue_date or date.today()

    appointments = db.query(Appointment).options(
        joinedload(Appointment.patient)
    ).filter(
        Appointment.clinic_id == current_user.clinic_id,
        Appointment.appointment_date == target_date
    ).order_by(Appointment.queue_number.asc()).all()

    queue = []
    for apt in appointments:
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
                "phone": apt.patient.phone,
            } if apt.patient else None,
            "queue_number": apt.queue_number,
            "chief_complaint": apt.chief_complaint,
            "status": apt.status.value,
            "created_at": apt.created_at.isoformat() if apt.created_at else None,
        })

    return {"queue": queue, "date": target_date.isoformat()}


@router.get("/stats", response_model=dict)
async def get_daily_stats(
    stats_date: Optional[date] = Query(None, description="Date to get stats for (defaults to today)"),
    current_user: User = Depends(get_current_user),
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
            "waiting": waiting,
            "inProgress": in_progress,
            "completed": completed
        },
        "date": target_date.isoformat()
    }


@router.post("/appointments/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_to_queue(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
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
        chief_complaint=appointment_data.chief_complaint,
        status=AppointmentStatusEnum.WAITING,
        clinic_id=current_user.clinic_id,
        created_by=current_user.id,
        created_at=datetime.now()
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return {"message": "Added to queue", "appointment": {"id": appointment.id, "queue_number": appointment.queue_number}}


@router.put("/appointments/{appointment_id}/status", response_model=dict)
async def update_queue_status(
    appointment_id: str,
    status_data: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update appointment status"""
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.clinic_id == current_user.clinic_id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if status_data.status:
        appointment.status = status_data.status
    
    db.commit()
    db.refresh(appointment)

    return {"message": "Status updated", "appointment": {"id": appointment.id, "status": appointment.status.value}}


@router.put("/appointments/{appointment_id}/position", response_model=dict)
async def update_queue_position(
    appointment_id: str,
    position_data: AppointmentPositionUpdate,
    current_user: User = Depends(get_current_user),
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


@router.get("/appointments/{appointment_id}/visit", response_model=dict)
async def get_visit_by_appointment(
    appointment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get visit details linked to an appointment (for OPD reopen case)"""
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.clinic_id == current_user.clinic_id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Find visit linked to this appointment
    visit = db.query(Visit).filter(Visit.appointment_id == appointment_id).first()

    if not visit:
        return {"visit": None}

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
        }
    }
