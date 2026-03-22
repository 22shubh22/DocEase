"""
Notification service: SMS/WhatsApp reminders for vaccinations and follow-ups via MSG91.
"""
import logging
from datetime import date, datetime, timedelta
from typing import Optional

import httpx
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func

from app.models.models import (
    Clinic, Patient, Visit, NotificationLog, PatientConsent,
    NotificationChannelEnum, NotificationStatusEnum, NotificationTypeEnum,
    ConsentPurposeEnum, ConsentStatusEnum,
    generate_uuid,
)
from app.services.vaccination_service import compute_vaccination_dashboard

logger = logging.getLogger(__name__)

MSG91_WHATSAPP_URL = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/"
MSG91_SMS_URL = "https://api.msg91.com/api/v5/flow/"


def _get_notification_config(clinic: Clinic) -> dict:
    """Get notification config with defaults."""
    config = clinic.notification_config or {}
    return {
        "msg91_auth_key": config.get("msg91_auth_key", ""),
        "sender_id": config.get("sender_id", "DOCEZE"),
        "reminder_days_before": config.get("reminder_days_before", 2),
        "send_overdue": config.get("send_overdue", True),
        "send_follow_up": config.get("send_follow_up", True),
    }


def send_whatsapp(phone: str, template_name: str, params: dict, auth_key: str) -> dict:
    """Send WhatsApp message via MSG91 API."""
    headers = {"authkey": auth_key, "Content-Type": "application/json"}
    payload = {
        "integrated_number": "",
        "content_type": "template",
        "payload": {
            "messaging_product": "whatsapp",
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": "en", "policy": "deterministic"},
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": str(v)} for v in params.values()
                        ],
                    }
                ],
            },
            "to": phone,
        },
    }
    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post(MSG91_WHATSAPP_URL, json=payload, headers=headers)
            data = resp.json()
            if resp.status_code == 200 and data.get("type") != "error":
                return {"success": True, "request_id": data.get("request_id", ""), "error": None}
            return {"success": False, "request_id": None, "error": data.get("message", str(data))}
    except Exception as e:
        return {"success": False, "request_id": None, "error": str(e)}


def send_sms(phone: str, message: str, auth_key: str, sender_id: str = "DOCEZE") -> dict:
    """Send SMS via MSG91 API."""
    headers = {"authkey": auth_key, "Content-Type": "application/json"}
    payload = {
        "sender": sender_id,
        "route": "4",
        "country": "91",
        "sms": [{"message": message, "to": [phone]}],
    }
    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post(MSG91_SMS_URL, json=payload, headers=headers)
            data = resp.json()
            if resp.status_code == 200 and data.get("type") != "error":
                return {"success": True, "request_id": data.get("request_id", ""), "error": None}
            return {"success": False, "request_id": None, "error": data.get("message", str(data))}
    except Exception as e:
        return {"success": False, "request_id": None, "error": str(e)}


def send_notification(
    db: Session,
    clinic: Clinic,
    patient_id: Optional[str],
    phone: str,
    notification_type: NotificationTypeEnum,
    message: str,
    template_name: Optional[str] = None,
    template_params: Optional[dict] = None,
) -> NotificationLog:
    """Send a notification via WhatsApp (with SMS fallback) and log it."""
    config = _get_notification_config(clinic)
    auth_key = config["msg91_auth_key"]
    sender_id = config["sender_id"]

    log = NotificationLog(
        id=generate_uuid(),
        clinic_id=clinic.id,
        patient_id=patient_id,
        phone=phone,
        channel=NotificationChannelEnum.WHATSAPP,
        notification_type=notification_type,
        status=NotificationStatusEnum.QUEUED,
        message_body=message,
        template_id=template_name,
    )
    db.add(log)
    db.flush()

    # Try WhatsApp first
    if template_name and template_params and auth_key:
        result = send_whatsapp(phone, template_name, template_params, auth_key)
        if result["success"]:
            log.status = NotificationStatusEnum.SENT
            log.channel = NotificationChannelEnum.WHATSAPP
            log.provider_message_id = result["request_id"]
            log.sent_at = datetime.utcnow()
            db.commit()
            return log

        # Fallback to SMS
        sms_result = send_sms(phone, message, auth_key, sender_id)
        if sms_result["success"]:
            log.status = NotificationStatusEnum.SENT
            log.channel = NotificationChannelEnum.SMS
            log.provider_message_id = sms_result["request_id"]
            log.sent_at = datetime.utcnow()
            db.commit()
            return log

        # Both failed
        log.status = NotificationStatusEnum.FAILED
        log.error_message = f"WhatsApp: {result['error']}; SMS: {sms_result['error']}"
        db.commit()
        return log

    # No auth key configured — mark as failed
    log.status = NotificationStatusEnum.FAILED
    log.error_message = "MSG91 auth key not configured"
    db.commit()
    return log


def has_communication_consent(db: Session, patient_id: str, clinic: Clinic) -> bool:
    """Check if patient has communication consent. If DPDP is disabled, assume implicit consent."""
    if not clinic.plugin_dpdp_compliance:
        return True
    consent = db.query(PatientConsent).filter(
        PatientConsent.patient_id == patient_id,
        PatientConsent.clinic_id == clinic.id,
        PatientConsent.purpose == ConsentPurposeEnum.COMMUNICATION,
        PatientConsent.status == ConsentStatusEnum.GIVEN,
    ).first()
    return consent is not None


def _already_notified_today(db: Session, patient_id: str, notification_type: NotificationTypeEnum) -> bool:
    """Check if a notification of this type was already sent to this patient today."""
    today_start = datetime.combine(date.today(), datetime.min.time())
    return db.query(NotificationLog).filter(
        NotificationLog.patient_id == patient_id,
        NotificationLog.notification_type == notification_type,
        NotificationLog.created_at >= today_start,
        NotificationLog.status != NotificationStatusEnum.FAILED,
    ).first() is not None


def _last_notified_date(db: Session, patient_id: str, notification_type: NotificationTypeEnum) -> Optional[date]:
    """Get the last date a notification of this type was successfully sent."""
    log = db.query(NotificationLog).filter(
        NotificationLog.patient_id == patient_id,
        NotificationLog.notification_type == notification_type,
        NotificationLog.status != NotificationStatusEnum.FAILED,
    ).order_by(NotificationLog.created_at.desc()).first()
    return log.created_at.date() if log else None


def process_vaccination_reminders(db: Session, clinic: Clinic) -> int:
    """Process and send vaccination reminders for a clinic. Returns count sent."""
    config = _get_notification_config(clinic)
    dashboard = compute_vaccination_dashboard(db, clinic.id)
    sent_count = 0

    # Process due vaccines
    for child_data in dashboard["due_today"]:
        patient_id = child_data["patient_id"]
        if _already_notified_today(db, patient_id, NotificationTypeEnum.VACCINATION_DUE):
            continue
        if not has_communication_consent(db, patient_id, clinic):
            continue

        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient or not patient.phone:
            continue

        vaccine_names = ", ".join(child_data["due_vaccines"])
        guardian_display = patient.guardian_name or "Parent"
        message = (
            f"Dear {guardian_display}, reminder from {clinic.name}: "
            f"{child_data['patient_name']}'s vaccination is due - {vaccine_names}. "
            f"Please visit the clinic. Reply STOP to opt out."
        )
        template_params = {
            "parent_name": guardian_display,
            "clinic_name": clinic.name,
            "child_name": child_data["patient_name"],
            "vaccine_names": vaccine_names,
        }
        send_notification(
            db, clinic, patient_id, patient.phone,
            NotificationTypeEnum.VACCINATION_DUE,
            message, "vaccination_due", template_params,
        )
        sent_count += 1

    # Process overdue vaccines
    if config["send_overdue"]:
        for child_data in dashboard["overdue"]:
            patient_id = child_data["patient_id"]
            # For overdue, only re-send weekly
            last_date = _last_notified_date(db, patient_id, NotificationTypeEnum.VACCINATION_OVERDUE)
            if last_date and (date.today() - last_date).days < 7:
                continue
            if not has_communication_consent(db, patient_id, clinic):
                continue

            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            if not patient or not patient.phone:
                continue

            vaccine_names = ", ".join(child_data["overdue_vaccines"])
            guardian_display = patient.guardian_name or "Parent"
            message = (
                f"Dear {guardian_display}, {child_data['patient_name']} has overdue vaccination(s) "
                f"at {clinic.name}: {vaccine_names}. Please visit soon. Reply STOP to opt out."
            )
            template_params = {
                "parent_name": guardian_display,
                "child_name": child_data["patient_name"],
                "clinic_name": clinic.name,
                "vaccine_names": vaccine_names,
            }
            send_notification(
                db, clinic, patient_id, patient.phone,
                NotificationTypeEnum.VACCINATION_OVERDUE,
                message, "vaccination_overdue", template_params,
            )
            sent_count += 1

    return sent_count


def process_follow_up_reminders(db: Session, clinic: Clinic) -> int:
    """Process and send follow-up reminders. Returns count sent."""
    config = _get_notification_config(clinic)
    if not config["send_follow_up"]:
        return 0

    reminder_days = config["reminder_days_before"]
    target_date = date.today() + timedelta(days=reminder_days)

    visits = db.query(Visit).filter(
        Visit.clinic_id == clinic.id,
        Visit.follow_up_date == target_date,
    ).all()

    sent_count = 0
    for visit in visits:
        patient_id = visit.patient_id
        if _already_notified_today(db, patient_id, NotificationTypeEnum.FOLLOW_UP_REMINDER):
            continue
        if not has_communication_consent(db, patient_id, clinic):
            continue

        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient or not patient.phone:
            continue

        doctor_name = ""
        if visit.doctor and visit.doctor.user:
            doctor_name = visit.doctor.user.full_name

        message = (
            f"Dear {patient.full_name}, reminder from {clinic.name}: "
            f"your follow-up visit is on {target_date.strftime('%d %b %Y')}"
            f"{f' with Dr. {doctor_name}' if doctor_name else ''}. "
            f"Reply STOP to opt out."
        )
        template_params = {
            "patient_name": patient.full_name,
            "clinic_name": clinic.name,
            "follow_up_date": target_date.strftime("%d %b %Y"),
            "doctor_name": doctor_name or "your doctor",
        }
        send_notification(
            db, clinic, patient_id, patient.phone,
            NotificationTypeEnum.FOLLOW_UP_REMINDER,
            message, "follow_up_reminder", template_params,
        )
        sent_count += 1

    return sent_count
