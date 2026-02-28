#!/usr/bin/env python3
"""
Script to seed master data (medicines, dosages, tests, etc.) for all clinics in the database.
Run from the backend directory: python -m scripts.seed_all_clinics
"""

import sys
import os

# Add the parent directory to the path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.models import (
    Clinic,
    ChiefComplaint,
    DiagnosisOption,
    ObservationOption,
    TestOption,
    MedicineOption,
    DosageOption,
    DurationOption,
    SymptomOption,
)
from app.fixtures.template_registry import get_template


# Mapping from template keys to SQLAlchemy model classes
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


def seed_missing_data_for_clinic(db: Session, clinic_id: str, specialty: str = "dental") -> dict:
    """
    Seed only the missing master data categories for a clinic.
    Returns a dict with counts of what was seeded.
    """
    seeded = {}
    template = get_template(specialty)

    for category_key, items in template.items():
        model_class = _CATEGORY_MODEL_MAP.get(category_key)
        if model_class is None:
            continue

        if db.query(model_class).filter(model_class.clinic_id == clinic_id).count() == 0:
            for item in items:
                db.add(model_class(
                    clinic_id=clinic_id,
                    name=item["name"],
                    description=item["description"],
                    display_order=item["display_order"],
                    is_active=True,
                ))
            if items:
                seeded[category_key] = len(items)

    return seeded


def seed_all_clinics():
    """
    Seed missing master data for all clinics in the database.
    Only seeds categories that are completely empty for each clinic.
    """
    db = SessionLocal()

    try:
        # Get all clinics
        clinics = db.query(Clinic).all()

        if not clinics:
            print("No clinics found in the database.")
            return

        print(f"Found {len(clinics)} clinic(s) in the database.\n")

        total_seeded = {}

        for clinic in clinics:
            specialty = clinic.specialty or "dental"
            print(f"Processing clinic: {clinic.name} (ID: {clinic.id}, Specialty: {specialty})")

            seeded = seed_missing_data_for_clinic(db, clinic.id, specialty)

            if seeded:
                db.commit()
                print(f"  Seeded: {', '.join(f'{k}({v})' for k, v in seeded.items())}")
                for key, value in seeded.items():
                    total_seeded[key] = total_seeded.get(key, 0) + value
            else:
                print(f"  All data already exists")

        print(f"\n{'='*50}")
        print(f"Summary - Total records added:")
        if total_seeded:
            for category, count in total_seeded.items():
                print(f"  - {category}: {count}")
        else:
            print("  No new records were added (all data already exists)")
        print(f"{'='*50}")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_all_clinics()
