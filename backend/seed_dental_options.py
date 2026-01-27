#!/usr/bin/env python3
"""Seed script to add common dental diagnosis and observation options."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.models import Clinic, DiagnosisOption, ObservationOption

DENTAL_DIAGNOSES = [
    {"name": "Dental Caries", "description": "Tooth decay/cavities", "display_order": 1},
    {"name": "Gingivitis", "description": "Inflammation of gums", "display_order": 2},
    {"name": "Periodontitis", "description": "Gum disease with bone loss", "display_order": 3},
    {"name": "Pulpitis", "description": "Inflammation of tooth pulp", "display_order": 4},
    {"name": "Periapical Abscess", "description": "Infection at root tip", "display_order": 5},
    {"name": "Tooth Fracture", "description": "Broken or chipped tooth", "display_order": 6},
    {"name": "Impacted Tooth", "description": "Tooth unable to erupt properly", "display_order": 7},
    {"name": "TMJ Disorder", "description": "Temporomandibular joint dysfunction", "display_order": 8},
    {"name": "Oral Candidiasis", "description": "Fungal infection in mouth", "display_order": 9},
    {"name": "Aphthous Ulcer", "description": "Canker sores", "display_order": 10},
    {"name": "Dental Hypersensitivity", "description": "Sensitive teeth", "display_order": 11},
    {"name": "Bruxism", "description": "Teeth grinding", "display_order": 12},
    {"name": "Malocclusion", "description": "Misaligned bite", "display_order": 13},
    {"name": "Root Canal Infection", "description": "Infected root canal", "display_order": 14},
    {"name": "Alveolar Osteitis", "description": "Dry socket after extraction", "display_order": 15},
]

DENTAL_OBSERVATIONS = [
    {"name": "Oral hygiene is satisfactory", "description": "Good brushing and flossing habits evident", "display_order": 1},
    {"name": "Oral hygiene needs improvement", "description": "Plaque/tartar buildup present", "display_order": 2},
    {"name": "Gums appear healthy", "description": "Pink, firm, no bleeding", "display_order": 3},
    {"name": "Gums are inflamed", "description": "Red, swollen gums", "display_order": 4},
    {"name": "Bleeding on probing", "description": "Gums bleed when examined", "display_order": 5},
    {"name": "Visible decay present", "description": "Cavities visible on examination", "display_order": 6},
    {"name": "Tooth is mobile", "description": "Loose tooth detected", "display_order": 7},
    {"name": "Abscess/swelling noted", "description": "Visible swelling or abscess", "display_order": 8},
    {"name": "Calculus buildup present", "description": "Tartar deposits on teeth", "display_order": 9},
    {"name": "Tooth wear evident", "description": "Signs of grinding/erosion", "display_order": 10},
    {"name": "Restoration intact", "description": "Existing filling in good condition", "display_order": 11},
    {"name": "Restoration needs replacement", "description": "Filling is worn or damaged", "display_order": 12},
    {"name": "Crown/bridge intact", "description": "Prosthetic work in good condition", "display_order": 13},
    {"name": "Root exposure noted", "description": "Gum recession exposing root", "display_order": 14},
    {"name": "Soft tissue normal", "description": "No abnormalities in cheeks, tongue, palate", "display_order": 15},
]

def seed_dental_options():
    db = SessionLocal()
    try:
        clinic = db.query(Clinic).first()
        if not clinic:
            print("No clinic found. Please run the main seed script first.")
            return
        
        existing_diagnoses = db.query(DiagnosisOption).filter(DiagnosisOption.clinic_id == clinic.id).count()
        if existing_diagnoses > 0:
            print(f"Clinic already has {existing_diagnoses} diagnosis options. Skipping diagnosis seeding.")
        else:
            for diagnosis_data in DENTAL_DIAGNOSES:
                diagnosis = DiagnosisOption(
                    clinic_id=clinic.id,
                    name=diagnosis_data["name"],
                    description=diagnosis_data["description"],
                    display_order=diagnosis_data["display_order"],
                    is_active=True
                )
                db.add(diagnosis)
            db.commit()
            print(f"Added {len(DENTAL_DIAGNOSES)} dental diagnoses")

        existing_observations = db.query(ObservationOption).filter(ObservationOption.clinic_id == clinic.id).count()
        if existing_observations > 0:
            print(f"Clinic already has {existing_observations} observation options. Skipping observation seeding.")
        else:
            for obs_data in DENTAL_OBSERVATIONS:
                observation = ObservationOption(
                    clinic_id=clinic.id,
                    name=obs_data["name"],
                    description=obs_data["description"],
                    display_order=obs_data["display_order"],
                    is_active=True
                )
                db.add(observation)
            db.commit()
            print(f"Added {len(DENTAL_OBSERVATIONS)} dental observations")

        print("Dental options seeding completed!")

    except Exception as e:
        print(f"Error seeding dental options: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_dental_options()
