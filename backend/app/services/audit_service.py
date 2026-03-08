import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.models import AuditLog, AuditActionEnum

logger = logging.getLogger(__name__)


def get_model_dict(instance, exclude_fields=None) -> dict:
    """Convert a SQLAlchemy model instance to a dict for audit snapshots."""
    exclude = set(exclude_fields or [])
    exclude.update({'_sa_instance_state'})
    result = {}
    for key, value in instance.__dict__.items():
        if key in exclude:
            continue
        if isinstance(value, datetime):
            result[key] = value.isoformat()
        elif hasattr(value, 'value'):  # Enum
            result[key] = value.value
        else:
            try:
                # Ensure JSON serializable
                import json
                json.dumps(value)
                result[key] = value
            except (TypeError, ValueError):
                result[key] = str(value)
    return result


def compute_changes(old: dict, new: dict) -> tuple[dict, dict]:
    """Return (old_values, new_values) containing only changed fields."""
    old_changes = {}
    new_changes = {}
    all_keys = set(old.keys()) | set(new.keys())
    skip_keys = {'updated_at', '_sa_instance_state'}
    for key in all_keys:
        if key in skip_keys:
            continue
        old_val = old.get(key)
        new_val = new.get(key)
        if old_val != new_val:
            old_changes[key] = old_val
            new_changes[key] = new_val
    return old_changes, new_changes


def create_audit_log(
    action: AuditActionEnum,
    resource_type: str,
    user_id: str | None = None,
    user_email: str | None = None,
    clinic_id: str | None = None,
    resource_id: str | None = None,
    description: str | None = None,
    old_values: dict | None = None,
    new_values: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
):
    """Insert an audit log entry. Uses a separate DB session for isolation."""
    db = SessionLocal()
    try:
        log = AuditLog(
            clinic_id=clinic_id,
            user_id=user_id,
            user_email=user_email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            description=description,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")
        db.rollback()
    finally:
        db.close()
