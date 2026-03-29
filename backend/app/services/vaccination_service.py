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
    """Deactivate existing schedule entries and re-seed from EPI defaults."""
    db.query(VaccinationSchedule).filter(
        VaccinationSchedule.clinic_id == clinic_id
    ).update({"is_active": False})
    db.commit()

    # Re-seed: since seed checks count > 0, we need to add directly
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
        VaccinationRecord.is_voided == False,
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

    warnings = []
    if not patient.date_of_birth:
        warnings.append("Date of birth is not set — vaccination status cannot be calculated accurately. Please update the patient's date of birth.")

    return {
        "patient_id": patient.id,
        "patient_name": patient.full_name,
        "date_of_birth": patient.date_of_birth,
        "age_days": age_days,
        "doses": doses,
        "summary": summary,
        "warnings": warnings,
    }


def compute_due_vaccines(db: Session, patient_id: str, clinic_id: str) -> list:
    """Get only due/overdue vaccines for a patient."""
    card = compute_vaccination_card(db, patient_id, clinic_id)
    if not card:
        return []
    return [d for d in card["doses"] if d["status"] in ("due", "overdue")]


def compute_vaccination_schedule_view(
    db: Session, clinic_id: str, status_filter: str = None, limit: int = 100, offset: int = 0
) -> dict:
    """Compute a flat, date-sorted list of pending vaccinations for the schedule table view."""
    cutoff_date = date.today() - timedelta(days=1825)  # 5 years ago
    children = db.query(Patient).filter(
        Patient.clinic_id == clinic_id,
        Patient.date_of_birth != None,
        Patient.date_of_birth >= cutoff_date,
        Patient.is_anonymized == False,
    ).order_by(Patient.date_of_birth.desc()).all()

    total_children = len(children)

    schedule = db.query(VaccinationSchedule).filter(
        VaccinationSchedule.clinic_id == clinic_id,
        VaccinationSchedule.is_active == True,
    ).order_by(VaccinationSchedule.display_order).all()

    child_ids = [c.id for c in children]
    records = []
    if child_ids:
        records = db.query(VaccinationRecord).filter(
            VaccinationRecord.patient_id.in_(child_ids),
            VaccinationRecord.clinic_id == clinic_id,
            VaccinationRecord.is_voided == False,
        ).all()

    patient_records = {}
    for r in records:
        patient_records.setdefault(r.patient_id, set()).add((r.vaccine_name, r.dose_number))

    items = []
    total_fully_vaccinated = 0
    overdue_count = 0
    due_now_count = 0

    for child in children:
        age_days = _age_in_days(child.date_of_birth)
        given_set = patient_records.get(child.id, set())
        phone = getattr(child, 'phone', None) or getattr(child, 'guardian_phone', None)
        guardian_name = getattr(child, 'guardian_name', None)

        child_has_due = False
        child_has_overdue = False

        for entry in schedule:
            key = (entry.vaccine_name, entry.dose_number)
            if key in given_set:
                continue

            due_date = child.date_of_birth + timedelta(days=entry.age_days)
            today = date.today()

            if age_days >= entry.age_days + 7:
                status = "overdue"
                child_has_overdue = True
            elif age_days >= entry.age_days - 7:
                status = "due"
                child_has_due = True
            else:
                continue  # upcoming, skip

            if status_filter and status != status_filter:
                continue

            days_overdue = (today - due_date).days

            items.append({
                "patient_id": child.id,
                "patient_name": child.full_name,
                "patient_code": child.patient_code,
                "date_of_birth": child.date_of_birth,
                "age_label": _age_label_from_days(age_days),
                "phone": phone,
                "guardian_name": guardian_name,
                "vaccine_name": entry.vaccine_name,
                "dose_label": entry.dose_label,
                "dose_number": entry.dose_number,
                "schedule_entry_id": entry.id,
                "age_days": entry.age_days,
                "age_label_vaccine": entry.age_label,
                "route": entry.route,
                "site": entry.site,
                "due_date": due_date,
                "status": status,
                "days_overdue": days_overdue,
            })

        if child_has_overdue:
            overdue_count += 1
        if child_has_due:
            due_now_count += 1
        if not child_has_due and not child_has_overdue:
            mandatory_keys = {(e.vaccine_name, e.dose_number) for e in schedule if e.is_mandatory}
            if mandatory_keys.issubset(given_set):
                total_fully_vaccinated += 1

    # Sort by due_date ascending (most overdue first)
    items.sort(key=lambda x: x["due_date"])

    total = len(items)
    paginated_items = items[offset:offset + limit]

    return {
        "items": paginated_items,
        "total": total,
        "stats": {
            "total_children": total_children,
            "fully_vaccinated": total_fully_vaccinated,
            "overdue_count": overdue_count,
            "due_now_count": due_now_count,
        },
    }


def compute_vaccination_dashboard(db: Session, clinic_id: str, limit: int = 50, offset: int = 0) -> dict:
    """Compute vaccination dashboard: due now, overdue, due this week."""
    # Get child patients with DOB, under 5 years, with pagination
    cutoff_date = date.today() - timedelta(days=1825)  # 5 years ago
    children = db.query(Patient).filter(
        Patient.clinic_id == clinic_id,
        Patient.date_of_birth != None,
        Patient.date_of_birth >= cutoff_date,
        Patient.is_anonymized == False,
    ).order_by(Patient.date_of_birth.desc()).offset(offset).limit(limit).all()

    total_children = db.query(Patient).filter(
        Patient.clinic_id == clinic_id,
        Patient.date_of_birth != None,
        Patient.date_of_birth >= cutoff_date,
        Patient.is_anonymized == False,
    ).count()

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
            VaccinationRecord.is_voided == False,
        ).all()

    # Build record lookup per patient
    patient_records = {}
    for r in records:
        patient_records.setdefault(r.patient_id, set()).add((r.vaccine_name, r.dose_number))

    due_now = []
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

        # Build separate patient_data for each list to avoid mixing due/overdue vaccines
        base_data = {
            "patient_id": child.id,
            "patient_name": child.full_name,
            "patient_code": child.patient_code,
            "date_of_birth": child.date_of_birth,
            "age_label": _age_label_from_days(age_days),
        }

        if child_overdue:
            overdue.append({**base_data, "due_vaccines": [], "overdue_vaccines": child_overdue})
        if child_due:
            due_now.append({**base_data, "due_vaccines": child_due, "overdue_vaccines": []})

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
            due_this_week.append({**base_data, "due_vaccines": child_due_week, "overdue_vaccines": []})

    return {
        "due_now": due_now,
        "overdue": overdue,
        "due_this_week": due_this_week,
        "stats": {
            "total_children": total_children,
            "fully_vaccinated": total_fully_vaccinated,
            "overdue_count": len(overdue),
            "due_now_count": len(due_now),
        },
    }
