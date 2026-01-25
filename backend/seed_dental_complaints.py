"""
Seed dental clinic chief complaints
Run this to add common dental complaints to the clinic
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.models import Clinic, ChiefComplaint


def seed_dental_complaints():
    db = SessionLocal()

    try:
        print("🦷 Seeding dental clinic chief complaints...")

        clinic = db.query(Clinic).first()
        if not clinic:
            print("❌ No clinic found. Please run the main seed first.")
            return

        existing = db.query(ChiefComplaint).filter(
            ChiefComplaint.clinic_id == clinic.id
        ).first()
        
        if existing:
            print("⚠️  Chief complaints already exist for this clinic. Skipping...")
            return

        dental_complaints = [
            {"name": "Toothache", "description": "Pain in or around a tooth", "display_order": 1},
            {"name": "Tooth Decay / Cavity", "description": "Cavities or holes in teeth", "display_order": 2},
            {"name": "Tooth Sensitivity", "description": "Sensitivity to hot, cold, or sweet", "display_order": 3},
            {"name": "Gum Pain / Swelling", "description": "Pain or swelling in the gums", "display_order": 4},
            {"name": "Bleeding Gums", "description": "Gums that bleed during brushing", "display_order": 5},
            {"name": "Bad Breath (Halitosis)", "description": "Persistent bad breath", "display_order": 6},
            {"name": "Broken / Chipped Tooth", "description": "Damaged or fractured tooth", "display_order": 7},
            {"name": "Loose Tooth", "description": "Tooth that feels loose or wobbly", "display_order": 8},
            {"name": "Jaw Pain / TMJ", "description": "Pain in the jaw or temporomandibular joint", "display_order": 9},
            {"name": "Tooth Extraction", "description": "Need for tooth removal", "display_order": 10},
            {"name": "Root Canal Treatment", "description": "Root canal procedure needed", "display_order": 11},
            {"name": "Dental Filling", "description": "Filling replacement or new filling", "display_order": 12},
            {"name": "Teeth Cleaning / Scaling", "description": "Professional cleaning and scaling", "display_order": 13},
            {"name": "Dental Crown / Cap", "description": "Crown or cap placement", "display_order": 14},
            {"name": "Dentures / Partial Dentures", "description": "Denture fitting or adjustment", "display_order": 15},
            {"name": "Dental Implant", "description": "Implant consultation or follow-up", "display_order": 16},
            {"name": "Teeth Whitening", "description": "Cosmetic teeth whitening", "display_order": 17},
            {"name": "Braces / Orthodontic Consultation", "description": "Orthodontic treatment consultation", "display_order": 18},
            {"name": "Wisdom Tooth Issue", "description": "Pain or problems with wisdom teeth", "display_order": 19},
            {"name": "Mouth Ulcer / Sore", "description": "Ulcers or sores in the mouth", "display_order": 20},
            {"name": "Routine Checkup", "description": "Regular dental examination", "display_order": 21},
            {"name": "Follow-up Visit", "description": "Follow-up after previous treatment", "display_order": 22},
        ]

        for complaint_data in dental_complaints:
            complaint = ChiefComplaint(
                name=complaint_data["name"],
                description=complaint_data["description"],
                display_order=complaint_data["display_order"],
                is_active=True,
                clinic_id=clinic.id
            )
            db.add(complaint)

        db.commit()
        print(f"✅ Added {len(dental_complaints)} dental chief complaints")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_dental_complaints()
