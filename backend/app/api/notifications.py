from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from datetime import date, datetime
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user, require_plugin
from app.models.models import (
    User, Clinic, Doctor, NotificationLog, Patient,
    NotificationStatusEnum, NotificationTypeEnum,
    NotificationChannelEnum, generate_uuid,
)
from app.schemas.schemas import (
    NotificationConfigUpdate, NotificationConfigResponse,
    NotificationLogResponse, NotificationStatsResponse,
    NotificationHistoryResponse,
)
from app.services.notification_service import (
    process_vaccination_reminders, process_follow_up_reminders,
    send_notification, _get_notification_config,
    has_communication_consent, _already_notified_today,
)
from app.services.vaccination_service import compute_due_vaccines

router = APIRouter()


@router.get("/config", response_model=NotificationConfigResponse)
async def get_notification_config(
    current_user: User = Depends(require_plugin("notifications")),
    db: Session = Depends(get_db),
):
    """Get the clinic's notification configuration."""
    clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()
    config = _get_notification_config(clinic)
    return NotificationConfigResponse(
        msg91_auth_key_set=bool(config["msg91_auth_key"]),
        sender_id=config["sender_id"],
        reminder_days_before=config["reminder_days_before"],
        send_overdue=config["send_overdue"],
        send_follow_up=config["send_follow_up"],
    )


@router.put("/config", response_model=NotificationConfigResponse)
async def update_notification_config(
    data: NotificationConfigUpdate,
    current_user: User = Depends(require_plugin("notifications")),
    db: Session = Depends(get_db),
):
    """Update the clinic's notification configuration."""
    clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()
    existing = clinic.notification_config or {}

    if data.msg91_auth_key is not None:
        existing["msg91_auth_key"] = data.msg91_auth_key
    if data.sender_id is not None:
        existing["sender_id"] = data.sender_id
    existing["reminder_days_before"] = data.reminder_days_before
    existing["send_overdue"] = data.send_overdue
    existing["send_follow_up"] = data.send_follow_up

    clinic.notification_config = existing
    db.commit()
    db.refresh(clinic)

    config = _get_notification_config(clinic)
    return NotificationConfigResponse(
        msg91_auth_key_set=bool(config["msg91_auth_key"]),
        sender_id=config["sender_id"],
        reminder_days_before=config["reminder_days_before"],
        send_overdue=config["send_overdue"],
        send_follow_up=config["send_follow_up"],
    )


@router.get("/history", response_model=NotificationHistoryResponse)
async def get_notification_history(
    patient_id: Optional[str] = None,
    status: Optional[str] = None,
    notification_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_plugin("notifications")),
    db: Session = Depends(get_db),
):
    """Get paginated notification history for the clinic."""
    query = db.query(NotificationLog).filter(
        NotificationLog.clinic_id == current_user.clinic_id
    )

    if patient_id:
        query = query.filter(NotificationLog.patient_id == patient_id)
    if status:
        query = query.filter(NotificationLog.status == status)
    if notification_type:
        query = query.filter(NotificationLog.notification_type == notification_type)

    total = query.count()
    logs = query.order_by(NotificationLog.created_at.desc()).offset(
        (page - 1) * limit
    ).limit(limit).all()

    # Fetch patient names
    patient_ids = {log.patient_id for log in logs if log.patient_id}
    patient_map = {}
    if patient_ids:
        patients = db.query(Patient).filter(Patient.id.in_(patient_ids)).all()
        patient_map = {p.id: p.full_name for p in patients}

    items = []
    for log in logs:
        item = NotificationLogResponse(
            id=log.id,
            clinic_id=log.clinic_id,
            patient_id=log.patient_id,
            phone=log.phone,
            channel=log.channel,
            notification_type=log.notification_type,
            status=log.status,
            message_body=log.message_body,
            template_id=log.template_id,
            provider_message_id=log.provider_message_id,
            error_message=log.error_message,
            sent_at=log.sent_at,
            delivered_at=log.delivered_at,
            created_at=log.created_at,
            patient_name=patient_map.get(log.patient_id),
        )
        items.append(item)

    return NotificationHistoryResponse(items=items, total=total, page=page, limit=limit)


@router.get("/stats", response_model=NotificationStatsResponse)
async def get_notification_stats(
    current_user: User = Depends(require_plugin("notifications")),
    db: Session = Depends(get_db),
):
    """Get notification stats for today."""
    today_start = datetime.combine(date.today(), datetime.min.time())
    base = db.query(NotificationLog).filter(
        NotificationLog.clinic_id == current_user.clinic_id,
        NotificationLog.created_at >= today_start,
    )

    total_sent = base.filter(NotificationLog.status == NotificationStatusEnum.SENT).count()
    total_delivered = base.filter(NotificationLog.status == NotificationStatusEnum.DELIVERED).count()
    total_failed = base.filter(NotificationLog.status == NotificationStatusEnum.FAILED).count()

    by_type = {}
    for ntype in NotificationTypeEnum:
        count = base.filter(NotificationLog.notification_type == ntype).count()
        if count > 0:
            by_type[ntype.value] = count

    return NotificationStatsResponse(
        total_sent=total_sent,
        total_delivered=total_delivered,
        total_failed=total_failed,
        by_type=by_type,
    )


@router.post("/send-test")
async def send_test_notification(
    current_user: User = Depends(require_plugin("notifications")),
    db: Session = Depends(get_db),
):
    """Send a test notification to the clinic owner's phone number."""
    clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()
    config = _get_notification_config(clinic)

    if not config["msg91_auth_key"]:
        raise HTTPException(status_code=400, detail="MSG91 auth key not configured")

    phone = clinic.phone or current_user.phone
    if not phone:
        raise HTTPException(status_code=400, detail="No phone number found for clinic or user")

    message = f"Test notification from {clinic.name} via DocEase. Your notification setup is working!"
    log = send_notification(
        db, clinic, None, phone,
        NotificationTypeEnum.VACCINATION_DUE,
        message, None, None,
    )

    return {
        "success": log.status == NotificationStatusEnum.SENT,
        "channel": log.channel.value if log.channel else None,
        "error": log.error_message,
    }


@router.post("/trigger")
async def trigger_reminders(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_plugin("notifications")),
    db: Session = Depends(get_db),
):
    """Manually trigger reminder processing for the clinic."""
    clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()
    config = _get_notification_config(clinic)

    if not config["msg91_auth_key"]:
        raise HTTPException(status_code=400, detail="MSG91 auth key not configured")

    vacc_count = process_vaccination_reminders(db, clinic)
    fu_count = process_follow_up_reminders(db, clinic)

    return {
        "vaccination_reminders_sent": vacc_count,
        "follow_up_reminders_sent": fu_count,
    }


@router.post("/send-reminder/{patient_id}")
async def send_patient_reminder(
    patient_id: str,
    current_user: User = Depends(require_plugin("notifications")),
    db: Session = Depends(get_db),
):
    """Send a vaccination reminder to a specific patient via WhatsApp/SMS."""
    clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()
    config = _get_notification_config(clinic)

    if not config["msg91_auth_key"]:
        raise HTTPException(status_code=400, detail="MSG91 auth key not configured")

    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_user.clinic_id,
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    phone = patient.phone or getattr(patient, 'guardian_phone', None)
    if not phone:
        raise HTTPException(status_code=400, detail="No phone number available for this patient")

    # Check consent
    if not has_communication_consent(db, patient_id, clinic):
        raise HTTPException(status_code=400, detail="Patient has not given communication consent")

    # Get due/overdue vaccines
    due_vaccines = compute_due_vaccines(db, patient_id, current_user.clinic_id)
    if not due_vaccines:
        raise HTTPException(status_code=400, detail="No due or overdue vaccines for this patient")

    overdue = [v for v in due_vaccines if v["status"] == "overdue"]
    due = [v for v in due_vaccines if v["status"] == "due"]

    # Determine notification type and build message
    if overdue:
        notification_type = NotificationTypeEnum.VACCINATION_OVERDUE
        vaccine_names = ", ".join(v["dose_label"] or v["vaccine_name"] for v in overdue)
    else:
        notification_type = NotificationTypeEnum.VACCINATION_DUE
        vaccine_names = ", ".join(v["dose_label"] or v["vaccine_name"] for v in due)

    parent_name = getattr(patient, 'guardian_name', None) or patient.full_name
    child_name = patient.full_name
    clinic_name = clinic.name or "the clinic"

    template_name = "vaccination_overdue" if overdue else "vaccination_due"
    template_params = {
        "parent_name": parent_name,
        "child_name": child_name,
        "vaccine_names": vaccine_names,
        "clinic_name": clinic_name,
    }

    message = f"Dear {parent_name}, this is a reminder that {child_name}'s vaccination ({vaccine_names}) is {'overdue' if overdue else 'due'}. Please visit {clinic_name}."

    log = send_notification(
        db, clinic, patient_id, phone,
        notification_type, message,
        template_name, template_params,
    )

    return {
        "success": log.status == NotificationStatusEnum.SENT,
        "channel": log.channel.value if log.channel else None,
        "error": log.error_message,
        "vaccines_included": vaccine_names,
    }
