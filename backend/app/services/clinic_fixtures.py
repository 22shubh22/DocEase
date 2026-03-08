"""
Service for seeding clinic fixtures on creation.
"""

from sqlalchemy.orm import Session
from app.models.models import (
    ChiefComplaint, DiagnosisOption, ObservationOption, TestOption,
    MedicineOption, DosageOption, DurationOption, SymptomOption
)
from app.fixtures.template_registry import get_template, get_template_from_db

_CATEGORY_MODEL_MAP = {
    "chief_complaints": ChiefComplaint,
    "diagnoses": DiagnosisOption,
    "observations": ObservationOption,
    "tests": TestOption,
    "medicines": MedicineOption,
    "dosages": DosageOption,
    "durations": DurationOption,
    "symptoms": SymptomOption,
}


def seed_fixtures_for_clinic(db: Session, clinic_id: str, specialty: str = "dental") -> None:
    """
    Seed all fixtures for a newly created clinic based on its specialty.

    Args:
        db: Database session
        clinic_id: The ID of the clinic to seed fixtures for
        specialty: The clinic specialty (e.g., "dental", "dermatology", "general_physician")
    """
    # Try DB templates first, fall back to Python file templates
    template = get_template_from_db(db, specialty)
    if not template:
        template = get_template(specialty)

    for category_key, items in template.items():
        model_class = _CATEGORY_MODEL_MAP.get(category_key)
        if model_class is None:
            continue
        for item in items:
            db.add(model_class(
                clinic_id=clinic_id,
                name=item["name"],
                description=item["description"],
                display_order=item["display_order"],
                is_active=True,
            ))


def seed_dental_fixtures_for_clinic(db: Session, clinic_id: str) -> None:
    """Legacy function - seeds dental fixtures. Use seed_fixtures_for_clinic() instead."""
    seed_fixtures_for_clinic(db, clinic_id, specialty="dental")
