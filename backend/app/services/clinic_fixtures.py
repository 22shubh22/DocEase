"""
Service for seeding clinic fixtures on creation.
"""

from sqlalchemy.orm import Session
from app.models.models import ChiefComplaint, DiagnosisOption, ObservationOption, TestOption, MedicineOption, DosageOption, DurationOption
from app.fixtures.dental_fixtures import (
    DENTAL_CHIEF_COMPLAINTS,
    DENTAL_DIAGNOSES,
    DENTAL_OBSERVATIONS,
    DENTAL_TEST_OPTIONS,
    DENTAL_MEDICINES,
    DENTAL_DOSAGES,
    DENTAL_DURATIONS
)


def seed_dental_fixtures_for_clinic(db: Session, clinic_id: str) -> None:
    """
    Seed all dental fixtures for a newly created clinic.

    Args:
        db: Database session
        clinic_id: The ID of the clinic to seed fixtures for
    """
    # Seed Chief Complaints
    for item in DENTAL_CHIEF_COMPLAINTS:
        db.add(ChiefComplaint(
            clinic_id=clinic_id,
            name=item["name"],
            description=item["description"],
            display_order=item["display_order"],
            is_active=True
        ))

    # Seed Diagnosis Options
    for item in DENTAL_DIAGNOSES:
        db.add(DiagnosisOption(
            clinic_id=clinic_id,
            name=item["name"],
            description=item["description"],
            display_order=item["display_order"],
            is_active=True
        ))

    # Seed Observation Options
    for item in DENTAL_OBSERVATIONS:
        db.add(ObservationOption(
            clinic_id=clinic_id,
            name=item["name"],
            description=item["description"],
            display_order=item["display_order"],
            is_active=True
        ))

    # Seed Test Options
    for item in DENTAL_TEST_OPTIONS:
        db.add(TestOption(
            clinic_id=clinic_id,
            name=item["name"],
            description=item["description"],
            display_order=item["display_order"],
            is_active=True
        ))

    # Seed Medicine Options
    for item in DENTAL_MEDICINES:
        db.add(MedicineOption(
            clinic_id=clinic_id,
            name=item["name"],
            description=item["description"],
            display_order=item["display_order"],
            is_active=True
        ))

    # Seed Dosage Options
    for item in DENTAL_DOSAGES:
        db.add(DosageOption(
            clinic_id=clinic_id,
            name=item["name"],
            description=item["description"],
            display_order=item["display_order"],
            is_active=True
        ))

    # Seed Duration Options
    for item in DENTAL_DURATIONS:
        db.add(DurationOption(
            clinic_id=clinic_id,
            name=item["name"],
            description=item["description"],
            display_order=item["display_order"],
            is_active=True
        ))
