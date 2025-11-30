from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime
from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Appointment, Invoice, AppointmentStatusEnum
from app.schemas.schemas import AppointmentCreate, AppointmentUpdate

router = APIRouter()


@router.get("/queue", response_model=dict)
async def get_today_queue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's OPD queue"""
    today = date.today()

    appointments = db.query(Appointment).filter(
        Appointment.clinic_id == current_user.clinic_id,
        Appointment.appointment_date == today
    ).order_by(Appointment.queue_number.asc()).all()

    return {"appointments": appointments}


@router.get("/stats", response_model=dict)
async def get_daily_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get daily statistics"""
    today = date.today()

    total_appointments = db.query(Appointment).filter(
        Appointment.clinic_id == current_user.clinic_id,
        Appointment.appointment_date == today
    ).count()

    completed_appointments = db.query(Appointment).filter(
        Appointment.clinic_id == current_user.clinic_id,
        Appointment.appointment_date == today,
        Appointment.status == AppointmentStatusEnum.COMPLETED
    ).count()

    # Get today's revenue
    today_start = datetime.combine(today, datetime.min.time())
    revenue_result = db.query(func.sum(Invoice.paid_amount)).filter(
        Invoice.clinic_id == current_user.clinic_id,
        Invoice.created_at >= today_start,
        Invoice.payment_status == "PAID"
    ).scalar()

    total_revenue = float(revenue_result) if revenue_result else 0

    return {
        "totalAppointments": total_appointments,
        "completedAppointments": completed_appointments,
        "pendingAppointments": total_appointments - completed_appointments,
        "totalRevenue": total_revenue
    }


@router.post("/appointments", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_to_queue(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add patient to OPD queue"""
    today = date.today()

    # Get last queue number
    last_appointment = db.query(Appointment).filter(
        Appointment.clinic_id == current_user.clinic_id,
        Appointment.appointment_date == today
    ).order_by(Appointment.queue_number.desc()).first()

    queue_number = (last_appointment.queue_number + 1) if last_appointment and last_appointment.queue_number else 1

    appointment = Appointment(
        patient_id=appointment_data.patient_id,
        appointment_date=today,
        queue_number=queue_number,
        status=AppointmentStatusEnum.WAITING,
        clinic_id=current_user.clinic_id,
        created_by=current_user.id
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return {"message": "Added to queue", "appointment": appointment}


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

    appointment.status = status_data.status
    db.commit()
    db.refresh(appointment)

    return {"message": "Status updated", "appointment": appointment}
