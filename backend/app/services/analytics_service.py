"""
Clinic usage analytics service.
Computes daily stats by querying existing tables (audit_logs, patients, visits, appointments).
"""

import logging
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Float, Date as SADate
from app.models.models import (
    ClinicDailyStats, Clinic, AuditLog, AuditActionEnum,
    Patient, Appointment, Visit, VisitMedicine, generate_uuid,
)

logger = logging.getLogger(__name__)


def compute_daily_stats(db: Session, clinic_id: str, target_date: date) -> None:
    """Compute and upsert daily stats for a single clinic on a given date."""
    # Unique logins
    login_q = db.query(
        func.count(func.distinct(AuditLog.user_id)).label("unique"),
        func.count(AuditLog.id).label("total"),
    ).filter(
        AuditLog.clinic_id == clinic_id,
        AuditLog.action == AuditActionEnum.LOGIN,
        func.date(AuditLog.created_at) == target_date,
    ).one()
    unique_logins = login_q.unique or 0
    total_logins = login_q.total or 0

    # Patients created
    patients_created = db.query(func.count(Patient.id)).filter(
        Patient.clinic_id == clinic_id,
        func.date(Patient.created_at) == target_date,
    ).scalar() or 0

    # Appointments created
    appointments_created = db.query(func.count(Appointment.id)).filter(
        Appointment.clinic_id == clinic_id,
        func.date(Appointment.created_at) == target_date,
    ).scalar() or 0

    # Visits completed
    visits_completed = db.query(func.count(Visit.id)).filter(
        Visit.clinic_id == clinic_id,
        func.date(Visit.visit_date) == target_date,
    ).scalar() or 0

    # Prescriptions written (visit_medicines via visits)
    prescriptions_written = db.query(func.count(VisitMedicine.id)).join(
        Visit, VisitMedicine.visit_id == Visit.id
    ).filter(
        Visit.clinic_id == clinic_id,
        func.date(Visit.visit_date) == target_date,
    ).scalar() or 0

    # Total collections
    total_collections = db.query(
        func.coalesce(func.sum(cast(Visit.amount, Float)), 0)
    ).filter(
        Visit.clinic_id == clinic_id,
        func.date(Visit.visit_date) == target_date,
    ).scalar() or 0

    # Upsert
    existing = db.query(ClinicDailyStats).filter(
        ClinicDailyStats.clinic_id == clinic_id,
        ClinicDailyStats.stat_date == target_date,
    ).first()

    if existing:
        existing.unique_logins = unique_logins
        existing.total_logins = total_logins
        existing.patients_created = patients_created
        existing.appointments_created = appointments_created
        existing.visits_completed = visits_completed
        existing.prescriptions_written = prescriptions_written
        existing.total_collections = total_collections
    else:
        stat = ClinicDailyStats(
            id=generate_uuid(),
            clinic_id=clinic_id,
            stat_date=target_date,
            unique_logins=unique_logins,
            total_logins=total_logins,
            patients_created=patients_created,
            appointments_created=appointments_created,
            visits_completed=visits_completed,
            prescriptions_written=prescriptions_written,
            total_collections=total_collections,
        )
        db.add(stat)

    db.commit()


def compute_all_clinics_daily(db: Session, target_date: date) -> int:
    """Compute daily stats for all non-guest clinics. Returns count processed."""
    clinics = db.query(Clinic).filter(Clinic.is_guest == False).all()
    count = 0
    for clinic in clinics:
        try:
            compute_daily_stats(db, clinic.id, target_date)
            count += 1
        except Exception:
            logger.exception("Failed to compute stats for clinic %s on %s", clinic.id, target_date)
            db.rollback()
    return count


def backfill_stats(db: Session, date_from: date, date_to: date) -> int:
    """Backfill stats for all clinics over a date range. Returns total rows processed."""
    clinics = db.query(Clinic).filter(Clinic.is_guest == False).all()
    total = 0
    current = date_from
    while current <= date_to:
        for clinic in clinics:
            try:
                compute_daily_stats(db, clinic.id, current)
                total += 1
            except Exception:
                logger.exception("Backfill failed for clinic %s on %s", clinic.id, current)
                db.rollback()
        current += timedelta(days=1)
    return total


def compute_clinic_health(db: Session, clinic_id: str) -> dict:
    """Compute health metrics for a single clinic from pre-aggregated daily stats."""
    today = date.today()

    def _sum(field, days):
        start = today - timedelta(days=days)
        result = db.query(func.coalesce(func.sum(field), 0)).filter(
            ClinicDailyStats.clinic_id == clinic_id,
            ClinicDailyStats.stat_date >= start,
            ClinicDailyStats.stat_date <= today,
        ).scalar()
        return float(result) if result else 0

    def _avg(field, days):
        start = today - timedelta(days=days)
        result = db.query(func.coalesce(func.avg(field), 0)).filter(
            ClinicDailyStats.clinic_id == clinic_id,
            ClinicDailyStats.stat_date >= start,
            ClinicDailyStats.stat_date <= today,
        ).scalar()
        return round(float(result), 1) if result else 0

    # Last active date (from pre-aggregated stats)
    last_active = db.query(func.max(ClinicDailyStats.stat_date)).filter(
        ClinicDailyStats.clinic_id == clinic_id,
        ClinicDailyStats.unique_logins > 0,
    ).scalar()

    # Also check today's audit_logs directly for real-time accuracy
    if not last_active or last_active < today:
        today_logins = db.query(func.count(AuditLog.id)).filter(
            AuditLog.clinic_id == clinic_id,
            AuditLog.action == AuditActionEnum.LOGIN,
            func.date(AuditLog.created_at) == today,
        ).scalar() or 0
        if today_logins > 0:
            last_active = today

    days_since_active = (today - last_active).days if last_active else 999

    # Status
    if days_since_active <= 7:
        status = "active"
    elif days_since_active <= 30:
        status = "at_risk"
    elif days_since_active <= 60:
        status = "inactive"
    else:
        status = "churned"

    # Trend: compare last 14d vs prior 14d
    recent_start = today - timedelta(days=14)
    prior_start = today - timedelta(days=28)
    recent_activity = db.query(
        func.coalesce(func.sum(ClinicDailyStats.unique_logins + ClinicDailyStats.visits_completed), 0)
    ).filter(
        ClinicDailyStats.clinic_id == clinic_id,
        ClinicDailyStats.stat_date >= recent_start,
    ).scalar() or 0

    prior_activity = db.query(
        func.coalesce(func.sum(ClinicDailyStats.unique_logins + ClinicDailyStats.visits_completed), 0)
    ).filter(
        ClinicDailyStats.clinic_id == clinic_id,
        ClinicDailyStats.stat_date >= prior_start,
        ClinicDailyStats.stat_date < recent_start,
    ).scalar() or 0

    if prior_activity == 0:
        trend = "growing" if recent_activity > 0 else "stable"
    else:
        ratio = recent_activity / prior_activity
        if ratio > 1.1:
            trend = "growing"
        elif ratio < 0.7:
            trend = "declining"
        else:
            trend = "stable"

    return {
        "last_active_date": last_active.isoformat() if last_active else None,
        "days_since_active": days_since_active if last_active else None,
        "status": status,
        "trend": trend,
        "dau_avg_7d": _avg(ClinicDailyStats.unique_logins, 7),
        "visits_last_7d": int(_sum(ClinicDailyStats.visits_completed, 7)),
        "visits_last_30d": int(_sum(ClinicDailyStats.visits_completed, 30)),
        "patients_last_7d": int(_sum(ClinicDailyStats.patients_created, 7)),
        "patients_last_30d": int(_sum(ClinicDailyStats.patients_created, 30)),
        "collections_last_30d": round(_sum(ClinicDailyStats.total_collections, 30), 2),
    }


def get_all_clinics_health(db: Session, clinic_ids: list) -> dict:
    """Get health overview for multiple clinics."""
    clinics = db.query(Clinic).filter(
        Clinic.id.in_(clinic_ids),
        Clinic.is_guest == False,
    ).all()

    results = []
    for clinic in clinics:
        health = compute_clinic_health(db, clinic.id)
        results.append({
            "clinic_id": clinic.id,
            "clinic_name": clinic.name,
            "clinic_code": clinic.clinic_code,
            "specialty": clinic.specialty.value if clinic.specialty else None,
            **health,
        })

    # Summary counts
    summary = {"total_clinics": len(results), "active": 0, "at_risk": 0, "inactive": 0, "churned": 0}
    for r in results:
        summary[r["status"]] = summary.get(r["status"], 0) + 1

    return {"clinics": results, "summary": summary}


def get_clinic_sparkline(db: Session, clinic_id: str, days: int = 30) -> list:
    """Get daily stats for the last N days for sparkline charts."""
    start = date.today() - timedelta(days=days)
    rows = db.query(ClinicDailyStats).filter(
        ClinicDailyStats.clinic_id == clinic_id,
        ClinicDailyStats.stat_date >= start,
    ).order_by(ClinicDailyStats.stat_date).all()

    return [
        {
            "date": row.stat_date.isoformat(),
            "logins": row.unique_logins,
            "visits": row.visits_completed,
            "patients": row.patients_created,
            "collections": float(row.total_collections or 0),
        }
        for row in rows
    ]
