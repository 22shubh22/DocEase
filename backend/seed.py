"""
Database Seed Script
Run this to populate the database with initial demo data
"""

from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.models import models
from app.core.security import get_password_hash

# Create tables
models.Base.metadata.create_all(bind=engine)


def seed_database():
    db = SessionLocal()

    try:
        print("🌱 Starting database seed...")

        # Check if data already exists
        existing_clinic = db.query(models.Clinic).first()
        if existing_clinic:
            print("⚠️  Database already seeded. Skipping...")
            return

        # Create clinic
        clinic = models.Clinic(
            name="City Health Clinic",
            address="123 Main Street, Downtown",
            phone="+1234567890",
            email="contact@cityhealthclinic.com",
            opd_start_time="09:00",
            opd_end_time="18:00",
        )
        db.add(clinic)
        db.flush()

        print(f"✅ Created clinic: {clinic.name}")

        # Create doctor user
        doctor_user = models.User(
            email="doctor@clinic.com",
            password_hash=get_password_hash("doctor123"),
            role=models.RoleEnum.DOCTOR,
            full_name="Dr. John Smith",
            phone="+1234567891",
            clinic_id=clinic.id,
        )
        db.add(doctor_user)
        db.flush()

        print(f"✅ Created doctor user: {doctor_user.email}")

        # Create doctor profile
        doctor = models.Doctor(
            user_id=doctor_user.id,
            specialization="General Physician",
            qualification="MBBS, MD",
            registration_number="MED123456",
            clinic_id=clinic.id,
        )
        db.add(doctor)

        print("✅ Created doctor profile")

        # Create assistant user
        assistant = models.User(
            email="assistant@clinic.com",
            password_hash=get_password_hash("assistant123"),
            role=models.RoleEnum.ASSISTANT,
            full_name="Sarah Johnson",
            phone="+1234567892",
            clinic_id=clinic.id,
        )
        db.add(assistant)
        db.flush()

        print(f"✅ Created assistant user: {assistant.email}")

        # Create demo patients
        patients_data = [
            {
                "patient_code": "PT-0001",
                "full_name": "Michael Brown",
                "age": 45,
                "gender": models.GenderEnum.MALE,
                "phone": "+1234567893",
                "address": "456 Oak Avenue",
                "blood_group": "O+",
                "allergies": ["Penicillin"],
            },
            {
                "patient_code": "PT-0002",
                "full_name": "Emily Davis",
                "age": 32,
                "gender": models.GenderEnum.FEMALE,
                "phone": "+1234567894",
                "address": "789 Pine Street",
                "blood_group": "A+",
                "allergies": [],
            },
            {
                "patient_code": "PT-0003",
                "full_name": "Robert Wilson",
                "age": 58,
                "gender": models.GenderEnum.MALE,
                "phone": "+1234567895",
                "address": "321 Elm Road",
                "blood_group": "B+",
                "allergies": ["Aspirin", "Peanuts"],
            },
        ]

        for patient_data in patients_data:
            patient = models.Patient(
                **patient_data,
                clinic_id=clinic.id,
                created_by=assistant.id
            )
            db.add(patient)

        db.commit()

        print(f"✅ Created {len(patients_data)} demo patients")
        print("\n✨ Seed completed successfully!\n")
        print("📝 Login credentials:")
        print("   Doctor:    doctor@clinic.com / doctor123")
        print("   Assistant: assistant@clinic.com / assistant123\n")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
