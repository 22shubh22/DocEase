from sqlalchemy.orm import Session
from app.models.models import Patient


def anonymize_patient(db: Session, patient_id: str) -> list[str]:
    """Anonymize a patient's PII while preserving clinical records.
    Returns list of anonymized field names."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        return []

    anonymized_fields = []

    patient.full_name = f"ANONYMIZED-{patient.patient_code}"
    anonymized_fields.append("full_name")

    patient.phone = "0000000000"
    anonymized_fields.append("phone")

    if patient.emergency_contact:
        patient.emergency_contact = None
        anonymized_fields.append("emergency_contact")

    if patient.address:
        patient.address = None
        anonymized_fields.append("address")

    if patient.allergies:
        patient.allergies = []
        anonymized_fields.append("allergies")

    if patient.medical_history:
        patient.medical_history = None
        anonymized_fields.append("medical_history")

    patient.is_anonymized = True

    # Keep: patient_code, age, gender, blood_group (non-identifying clinical data)
    # Keep: visits, appointments (clinical records remain intact)

    db.commit()
    return anonymized_fields
