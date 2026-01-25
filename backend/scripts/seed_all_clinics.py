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
    DurationOption
)
from app.fixtures.dental_fixtures import (
    DENTAL_CHIEF_COMPLAINTS,
    DENTAL_DIAGNOSES,
    DENTAL_OBSERVATIONS,
    DENTAL_TEST_OPTIONS,
    DENTAL_MEDICINES,
    DENTAL_DOSAGES,
    DENTAL_DURATIONS
)


def seed_missing_data_for_clinic(db: Session, clinic_id: str) -> dict:
    """
    Seed only the missing master data categories for a clinic.
    Returns a dict with counts of what was seeded.
    """
    seeded = {}

    # Check and seed Chief Complaints
    if db.query(ChiefComplaint).filter(ChiefComplaint.clinic_id == clinic_id).count() == 0:
        for item in DENTAL_CHIEF_COMPLAINTS:
            db.add(ChiefComplaint(
                clinic_id=clinic_id,
                name=item["name"],
                description=item["description"],
                display_order=item["display_order"],
                is_active=True
            ))
        seeded["chief_complaints"] = len(DENTAL_CHIEF_COMPLAINTS)

    # Check and seed Diagnoses
    if db.query(DiagnosisOption).filter(DiagnosisOption.clinic_id == clinic_id).count() == 0:
        for item in DENTAL_DIAGNOSES:
            db.add(DiagnosisOption(
                clinic_id=clinic_id,
                name=item["name"],
                description=item["description"],
                display_order=item["display_order"],
                is_active=True
            ))
        seeded["diagnoses"] = len(DENTAL_DIAGNOSES)

    # Check and seed Observations
    if db.query(ObservationOption).filter(ObservationOption.clinic_id == clinic_id).count() == 0:
        for item in DENTAL_OBSERVATIONS:
            db.add(ObservationOption(
                clinic_id=clinic_id,
                name=item["name"],
                description=item["description"],
                display_order=item["display_order"],
                is_active=True
            ))
        seeded["observations"] = len(DENTAL_OBSERVATIONS)

    # Check and seed Tests
    if db.query(TestOption).filter(TestOption.clinic_id == clinic_id).count() == 0:
        for item in DENTAL_TEST_OPTIONS:
            db.add(TestOption(
                clinic_id=clinic_id,
                name=item["name"],
                description=item["description"],
                display_order=item["display_order"],
                is_active=True
            ))
        seeded["tests"] = len(DENTAL_TEST_OPTIONS)

    # Check and seed Medicines
    if db.query(MedicineOption).filter(MedicineOption.clinic_id == clinic_id).count() == 0:
        for item in DENTAL_MEDICINES:
            db.add(MedicineOption(
                clinic_id=clinic_id,
                name=item["name"],
                description=item["description"],
                display_order=item["display_order"],
                is_active=True
            ))
        seeded["medicines"] = len(DENTAL_MEDICINES)

    # Check and seed Dosages
    if db.query(DosageOption).filter(DosageOption.clinic_id == clinic_id).count() == 0:
        for item in DENTAL_DOSAGES:
            db.add(DosageOption(
                clinic_id=clinic_id,
                name=item["name"],
                description=item["description"],
                display_order=item["display_order"],
                is_active=True
            ))
        seeded["dosages"] = len(DENTAL_DOSAGES)

    # Check and seed Durations
    if db.query(DurationOption).filter(DurationOption.clinic_id == clinic_id).count() == 0:
        for item in DENTAL_DURATIONS:
            db.add(DurationOption(
                clinic_id=clinic_id,
                name=item["name"],
                description=item["description"],
                display_order=item["display_order"],
                is_active=True
            ))
        seeded["durations"] = len(DENTAL_DURATIONS)

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

        total_seeded = {
            "chief_complaints": 0,
            "diagnoses": 0,
            "observations": 0,
            "tests": 0,
            "medicines": 0,
            "dosages": 0,
            "durations": 0
        }

        for clinic in clinics:
            print(f"Processing clinic: {clinic.name} (ID: {clinic.id})")

            seeded = seed_missing_data_for_clinic(db, clinic.id)

            if seeded:
                db.commit()
                print(f"  ✅ Seeded: {', '.join(f'{k}({v})' for k, v in seeded.items())}")
                for key, value in seeded.items():
                    total_seeded[key] += value
            else:
                print(f"  ✓ All data already exists")

        print(f"\n{'='*50}")
        print(f"Summary - Total records added:")
        for category, count in total_seeded.items():
            if count > 0:
                print(f"  - {category}: {count}")
        if sum(total_seeded.values()) == 0:
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
