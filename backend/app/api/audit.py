from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime
from app.core.database import get_db
from app.core.deps import require_clinic_owner
from app.models.models import User, AuditLog, AuditActionEnum

router = APIRouter()


@router.get("/logs", response_model=dict)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    resource_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(require_clinic_owner),
    db: Session = Depends(get_db)
):
    """Get audit logs for the clinic (clinic owner only)"""
    query = db.query(AuditLog).filter(AuditLog.clinic_id == current_user.clinic_id)

    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
    if resource_id:
        query = query.filter(AuditLog.resource_id == resource_id)
    if start_date:
        query = query.filter(AuditLog.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(AuditLog.created_at <= datetime.combine(end_date, datetime.max.time()))

    total = query.count()
    skip = (page - 1) * limit
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "logs": [
            {
                "id": log.id,
                "clinic_id": log.clinic_id,
                "user_id": log.user_id,
                "user_email": log.user_email,
                "action": log.action.value if log.action else None,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "description": log.description,
                "old_values": log.old_values,
                "new_values": log.new_values,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit if total > 0 else 1,
        }
    }


@router.get("/logs/{log_id}", response_model=dict)
async def get_audit_log_detail(
    log_id: str,
    current_user: User = Depends(require_clinic_owner),
    db: Session = Depends(get_db)
):
    """Get single audit log detail"""
    log = db.query(AuditLog).filter(
        AuditLog.id == log_id,
        AuditLog.clinic_id == current_user.clinic_id
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")

    return {
        "log": {
            "id": log.id,
            "clinic_id": log.clinic_id,
            "user_id": log.user_id,
            "user_email": log.user_email,
            "action": log.action.value if log.action else None,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "description": log.description,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
    }
