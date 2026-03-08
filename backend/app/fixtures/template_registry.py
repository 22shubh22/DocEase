"""
Specialty template registry.
Maps clinic specialties to their fixture data.
To add a new specialty, create a fixtures file and register it here.
"""

from app.fixtures.common_fixtures import COMMON_DOSAGES, COMMON_DURATIONS

from app.fixtures.dental_fixtures import (
    DENTAL_CHIEF_COMPLAINTS, DENTAL_DIAGNOSES, DENTAL_OBSERVATIONS,
    DENTAL_TEST_OPTIONS, DENTAL_MEDICINES, DENTAL_SYMPTOMS,
)
from app.fixtures.dermatology_fixtures import (
    DERMATOLOGY_CHIEF_COMPLAINTS, DERMATOLOGY_DIAGNOSES, DERMATOLOGY_OBSERVATIONS,
    DERMATOLOGY_TEST_OPTIONS, DERMATOLOGY_MEDICINES, DERMATOLOGY_SYMPTOMS,
)
from app.fixtures.general_physician_fixtures import (
    GENERAL_CHIEF_COMPLAINTS, GENERAL_DIAGNOSES, GENERAL_OBSERVATIONS,
    GENERAL_TEST_OPTIONS, GENERAL_MEDICINES, GENERAL_SYMPTOMS,
)

SPECIALTY_TEMPLATES = {
    "dental": {
        "chief_complaints": DENTAL_CHIEF_COMPLAINTS,
        "diagnoses": DENTAL_DIAGNOSES,
        "observations": DENTAL_OBSERVATIONS,
        "tests": DENTAL_TEST_OPTIONS,
        "medicines": DENTAL_MEDICINES,
        "symptoms": DENTAL_SYMPTOMS,
    },
    "dermatology": {
        "chief_complaints": DERMATOLOGY_CHIEF_COMPLAINTS,
        "diagnoses": DERMATOLOGY_DIAGNOSES,
        "observations": DERMATOLOGY_OBSERVATIONS,
        "tests": DERMATOLOGY_TEST_OPTIONS,
        "medicines": DERMATOLOGY_MEDICINES,
        "symptoms": DERMATOLOGY_SYMPTOMS,
    },
    "general_physician": {
        "chief_complaints": GENERAL_CHIEF_COMPLAINTS,
        "diagnoses": GENERAL_DIAGNOSES,
        "observations": GENERAL_OBSERVATIONS,
        "tests": GENERAL_TEST_OPTIONS,
        "medicines": GENERAL_MEDICINES,
        "symptoms": GENERAL_SYMPTOMS,
    },
}


def get_template(specialty: str) -> dict:
    """
    Get the fixture template for a given specialty from Python files.
    Returns specialty-specific data plus common dosages/durations.
    Falls back to empty lists for unknown specialties.
    """
    template = SPECIALTY_TEMPLATES.get(specialty, {
        "chief_complaints": [],
        "diagnoses": [],
        "observations": [],
        "tests": [],
        "medicines": [],
        "symptoms": [],
    })

    return {
        **template,
        "dosages": COMMON_DOSAGES,
        "durations": COMMON_DURATIONS,
    }


def get_template_from_db(db, specialty: str) -> dict:
    """
    Get the fixture template from the database.
    Returns data grouped by category in the same format as get_template().
    Returns None if no DB templates exist for this specialty.
    """
    from app.models.models import FixtureTemplate
    from collections import defaultdict

    templates = db.query(FixtureTemplate).filter(
        FixtureTemplate.specialty == specialty,
        FixtureTemplate.is_active == True
    ).order_by(FixtureTemplate.display_order).all()

    if not templates:
        return None

    result = defaultdict(list)
    for t in templates:
        result[t.category].append({
            "name": t.name,
            "description": t.description,
            "display_order": t.display_order,
        })

    return dict(result)
