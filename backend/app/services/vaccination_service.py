"""
Vaccination service: schedule seeding, card computation, dashboard queries.
"""
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.models import VaccinationSchedule, VaccinationRecord, Patient, generate_uuid
from app.fixtures.vaccination_fixtures import EPI_SCHEDULE


def seed_vaccination_schedule(db: Session, clinic_id: str) -> int:
    """Seed the default EPI vaccination schedule for a clinic. Returns count of entries created."""
    existing = db.query(VaccinationSchedule).filter(
        VaccinationSchedule.clinic_id == clinic_id
    ).count()
    if existing > 0:
        return 0

    count = 0
    for entry in EPI_SCHEDULE:
        schedule = VaccinationSchedule(
            id=generate_uuid(),
            clinic_id=clinic_id,
            **entry,
        )
        db.add(schedule)
        count += 1
    db.commit()
    return count


def reset_vaccination_schedule(db: Session, clinic_id: str) -> int:
    """Delete existing schedule and re-seed from EPI defaults."""
    db.query(VaccinationSchedule).filter(
        VaccinationSchedule.clinic_id == clinic_id
    ).delete()
    db.commit()
    return seed_vaccination_schedule(db, clinic_id)


def _age_in_days(dob: date) -> int:
    return (date.today() - dob).days


def _age_label_from_days(days: int) -> str:
    if days < 0:
        return "Not born yet"
    if days < 30:
        return f"{days} day{'s' if days != 1 else ''}"
    if days < 365:
        months = days // 30
        return f"{months} month{'s' if months != 1 else ''}"
    years = days // 365
    months = (days % 365) // 30
    if months > 0:
        return f"{years} year{'s' if years != 1 else ''} {months} month{'s' if months != 1 else ''}"
    return f"{years} year{'s' if years != 1 else ''}"


def compute_vaccination_card(db: Session, patient_id: str, clinic_id: str) -> dict:
    """Compute full vaccination card merging schedule + records."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return None

    schedule = db.query(VaccinationSchedule).filter(
        VaccinationSchedule.clinic_id == clinic_id,
        VaccinationSchedule.is_active == True,
    ).order_by(VaccinationSchedule.display_order).all()

    records = db.query(VaccinationRecord).filter(
        VaccinationRecord.patient_id == patient_id,
        VaccinationRecord.clinic_id == clinic_id,
    ).all()

    # Build lookup: (vaccine_name, dose_number) -> record
    record_map = {}
    for r in records:
        record_map[(r.vaccine_name, r.dose_number)] = r

    age_days = _age_in_days(patient.date_of_birth) if patient.date_of_birth else None

    doses = []
    summary = {"given": 0, "due": 0, "overdue": 0, "upcoming": 0}

    for entry in schedule:
        key = (entry.vaccine_name, entry.dose_number)
        record = record_map.get(key)

        if record:
            status = "given"
        elif age_days is not None:
            if age_days >= entry.age_days + 7:
                status = "overdue"
            elif age_days >= entry.age_days - 7:
                status = "due"
            else:
                status = "upcoming"
        else:
            status = "upcoming"

        summary[status] += 1

        dose_data = {
            "schedule_entry_id": entry.id,
            "vaccine_name": entry.vaccine_name,
            "dose_number": entry.dose_number,
            "dose_label": entry.dose_label,
            "age_days": entry.age_days,
            "age_label": entry.age_label,
            "status": status,
            "date_administered": record.date_administered if record else None,
            "record": {
                "id": record.id,
                "patient_id": record.patient_id,
                "vaccine_name": record.vaccine_name,
                "dose_number": record.dose_number,
                "dose_label": record.dose_label,
                "date_administered": record.date_administered,
                "age_at_dose_days": record.age_at_dose_days,
                "batch_number": record.batch_number,
                "administered_by": record.administered_by,
                "injection_site": record.injection_site,
                "route": record.route,
                "adverse_reaction": record.adverse_reaction,
                "notes": record.notes,
                "visit_id": record.visit_id,
                "created_at": record.created_at,
            } if record else None,
        }
        doses.append(dose_data)

    return {
        "patient_id": patient.id,
        "patient_name": patient.full_name,
        "date_of_birth": patient.date_of_birth,
        "age_days": age_days,
        "doses": doses,
        "summary": summary,
    }


def compute_due_vaccines(db: Session, patient_id: str, clinic_id: str) -> list:
    """Get only due/overdue vaccines for a patient."""
    card = compute_vaccination_card(db, patient_id, clinic_id)
    if not card:
        return []
    return [d for d in card["doses"] if d["status"] in ("due", "overdue")]


def compute_vaccination_dashboard(db: Session, clinic_id: str) -> dict:
    """Compute vaccination dashboard: due today, overdue, due this week."""
    # Get all child patients with DOB
    patients = db.query(Patient).filter(
        Patient.clinic_id == clinic_id,
        Patient.date_of_birth != None,
        Patient.is_anonymized == False,
    ).all()

    # Filter to children under 5 years
    today = date.today()
    children = [p for p in patients if _age_in_days(p.date_of_birth) <= 1825]  # 5 years

    schedule = db.query(VaccinationSchedule).filter(
        VaccinationSchedule.clinic_id == clinic_id,
        VaccinationSchedule.is_active == True,
    ).order_by(VaccinationSchedule.display_order).all()

    # Get all vaccination records for these children
    child_ids = [c.id for c in children]
    records = []
    if child_ids:
        records = db.query(VaccinationRecord).filter(
            VaccinationRecord.patient_id.in_(child_ids),
            VaccinationRecord.clinic_id == clinic_id,
        ).all()

    # Build record lookup per patient
    patient_records = {}
    for r in records:
        patient_records.setdefault(r.patient_id, set()).add((r.vaccine_name, r.dose_number))

    due_today = []
    overdue = []
    due_this_week = []
    total_fully_vaccinated = 0

    for child in children:
        age_days = _age_in_days(child.date_of_birth)
        given_set = patient_records.get(child.id, set())

        child_due = []
        child_overdue = []

        for entry in schedule:
            key = (entry.vaccine_name, entry.dose_number)
            if key in given_set:
                continue
            if age_days >= entry.age_days + 7:
                child_overdue.append(entry.dose_label or entry.vaccine_name)
            elif age_days >= entry.age_days - 7:
                child_due.append(entry.dose_label or entry.vaccine_name)

        if not child_due and not child_overdue:
            # Check if fully vaccinated (all mandatory doses given)
            mandatory_keys = {(e.vaccine_name, e.dose_number) for e in schedule if e.is_mandatory}
            if mandatory_keys.issubset(given_set):
                total_fully_vaccinated += 1
            continue

        patient_data = {
            "patient_id": child.id,
            "patient_name": child.full_name,
            "patient_code": child.patient_code,
            "date_of_birth": child.date_of_birth,
            "age_label": _age_label_from_days(age_days),
            "due_vaccines": child_due,
            "overdue_vaccines": child_overdue,
        }

        if child_overdue:
            overdue.append(patient_data)
        if child_due:
            due_today.append(patient_data)

        # Due this week: vaccines due within next 7 days
        child_due_week = []
        for entry in schedule:
            key = (entry.vaccine_name, entry.dose_number)
            if key in given_set:
                continue
            days_until_due = entry.age_days - age_days
            if 0 < days_until_due <= 7:
                child_due_week.append(entry.dose_label or entry.vaccine_name)
        if child_due_week:
            week_data = {**patient_data, "due_vaccines": child_due_week, "overdue_vaccines": []}
            due_this_week.append(week_data)

    return {
        "due_today": due_today,
        "overdue": overdue,
        "due_this_week": due_this_week,
        "stats": {
            "total_children": len(children),
            "fully_vaccinated": total_fully_vaccinated,
            "overdue_count": len(overdue),
            "due_today_count": len(due_today),
        },
    }
