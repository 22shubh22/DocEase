"""
Service for creating and cleaning up guest demo sessions.
Each guest gets an isolated clinic with pre-loaded demo data.
"""

import uuid
from datetime import datetime, timedelta, timezone, date
from sqlalchemy.orm import Session

from app.models.models import (
    Clinic, User, Doctor, Patient, Appointment, Visit, VisitMedicine,
    RoleEnum, GenderEnum, ClinicSpecialtyEnum, AppointmentStatusEnum,
)
from app.core.security import get_password_hash, create_access_token
from app.api.admin import generate_clinic_code
from app.utils.code_generators import generate_doctor_code
from app.api.users import create_default_permissions
from app.services.clinic_fixtures import seed_fixtures_for_clinic


DEMO_PATIENTS = [
    {
        "full_name": "Rajesh Kumar",
        "age": 45,
        "gender": GenderEnum.MALE,
        "phone": "9876543201",
        "address": "12, MG Road, Sector 5",
        "blood_group": "O+",
        "allergies": ["Penicillin"],
        "medical_history": {"conditions": ["Hypertension"], "notes": "On regular medication for BP"},
    },
    {
        "full_name": "Priya Sharma",
        "age": 32,
        "gender": GenderEnum.FEMALE,
        "phone": "9876543202",
        "address": "45, Nehru Nagar",
        "blood_group": "A+",
        "allergies": [],
        "medical_history": {},
    },
    {
        "full_name": "Amit Patel",
        "age": 58,
        "gender": GenderEnum.MALE,
        "phone": "9876543203",
        "address": "78, Gandhi Chowk",
        "blood_group": "B+",
        "allergies": ["Aspirin", "Sulfa drugs"],
        "medical_history": {"conditions": ["Diabetes Type 2"], "notes": "Insulin dependent"},
    },
    {
        "full_name": "Sunita Devi",
        "age": 28,
        "gender": GenderEnum.FEMALE,
        "phone": "9876543204",
        "address": "23, Lajpat Nagar",
        "blood_group": "AB+",
        "allergies": [],
        "medical_history": {},
    },
    {
        "full_name": "Vikram Singh",
        "age": 65,
        "gender": GenderEnum.MALE,
        "phone": "9876543205",
        "address": "56, Civil Lines",
        "blood_group": "O-",
        "allergies": ["Ibuprofen"],
        "medical_history": {"conditions": ["Arthritis", "Hypertension"], "notes": "Joint pain for 3 years"},
    },
    {
        "full_name": "Ananya Gupta",
        "age": 8,
        "gender": GenderEnum.FEMALE,
        "phone": "9876543206",
        "emergency_contact": "9876543207",
        "address": "89, Vasant Kunj",
        "blood_group": "A-",
        "allergies": ["Peanuts"],
        "medical_history": {},
    },
]


def create_guest_session(db: Session) -> dict:
    """
    Create a fully isolated guest clinic with demo data.
    Returns the same response format as login endpoint.
    """
    guest_id = str(uuid.uuid4())[:8]

    # 1. Create clinic
    clinic_code = generate_clinic_code(db)
    clinic = Clinic(
        name="Demo Clinic",
        address="123, Demo Street, Medical District",
        phone="9800000000",
        email=f"demo-{guest_id}@docease.com",
        clinic_code=clinic_code,
        opd_start_time="09:00",
        opd_end_time="18:00",
        specialty=ClinicSpecialtyEnum.GENERAL_PHYSICIAN,
        is_guest=True,
    )
    db.add(clinic)
    db.flush()

    # 2. Create guest user
    user = User(
        email=f"guest-{guest_id}@demo.docease.com",
        password_hash=get_password_hash(str(uuid.uuid4())),
        role=RoleEnum.DOCTOR,
        full_name="Dr. Demo User",
        phone="9800000001",
        clinic_id=clinic.id,
        is_guest=True,
    )
    db.add(user)
    db.flush()

    # 3. Create doctor profile
    doctor_code = generate_doctor_code(db)
    doctor = Doctor(
        user_id=user.id,
        clinic_id=clinic.id,
        doctor_code=doctor_code,
        specialization="General Physician",
        qualification="MBBS, MD",
        registration_number=f"DEMO-{guest_id}",
    )
    db.add(doctor)
    db.flush()

    # 4. Set clinic owner
    clinic.owner_doctor_id = doctor.id

    # 5. Create permissions
    permissions = create_default_permissions(user.id, clinic.id, RoleEnum.DOCTOR)
    db.add(permissions)

    # 6. Seed clinic fixtures (chief complaints, medicines, etc.)
    seed_fixtures_for_clinic(db, clinic.id, specialty="general_physician")

    # 7. Create demo patients (generate unique patient codes)
    max_pt_num = 0
    for p in db.query(Patient).all():
        if p.patient_code and '-' in p.patient_code:
            try:
                num = int(p.patient_code.split('-')[1])
                if num > max_pt_num:
                    max_pt_num = num
            except (ValueError, IndexError):
                continue

    patients = []
    for i, pdata in enumerate(DEMO_PATIENTS):
        patient = Patient(
            patient_code=f"PT-{str(max_pt_num + i + 1).zfill(4)}",
            clinic_id=clinic.id,
            created_by=user.id,
            **pdata,
        )
        db.add(patient)
        patients.append(patient)
    db.flush()

    # 8. Create OPD appointments for today (first 3 patients)
    today = date.today()
    for i, patient in enumerate(patients[:3]):
        appointment = Appointment(
            patient_id=patient.id,
            appointment_date=today,
            queue_number=i + 1,
            chief_complaints=_get_demo_complaints(i),
            status=AppointmentStatusEnum.WAITING,
            clinic_id=clinic.id,
            created_by=user.id,
        )
        db.add(appointment)

    # 9. Create a completed visit for the 4th patient (yesterday)
    yesterday = today - timedelta(days=1)
    past_appointment = Appointment(
        patient_id=patients[3].id,
        appointment_date=yesterday,
        queue_number=1,
        chief_complaints=["Fever", "Body ache"],
        status=AppointmentStatusEnum.COMPLETED,
        clinic_id=clinic.id,
        created_by=user.id,
    )
    db.add(past_appointment)
    db.flush()

    visit = Visit(
        patient_id=patients[3].id,
        appointment_id=past_appointment.id,
        visit_date=datetime.combine(yesterday, datetime.min.time()).replace(tzinfo=timezone.utc),
        visit_number=1,
        doctor_id=doctor.id,
        symptoms=["High fever", "Body ache", "Headache"],
        diagnosis=["Viral Fever"],
        observations=["Throat mildly congested", "No signs of infection"],
        recommended_tests=[],
        vitals={
            "bp_systolic": "120",
            "bp_diastolic": "80",
            "temperature": "101.2",
            "pulse": "88",
            "weight": "55",
            "spo2": "97",
        },
        prescription_notes="Rest and hydration advised. Follow up if fever persists beyond 3 days.",
        follow_up_date=today + timedelta(days=3),
        amount=500,
        clinic_id=clinic.id,
    )
    db.add(visit)
    db.flush()

    # Add medicines to the visit
    medicines = [
        VisitMedicine(visit_id=visit.id, medicine_name="Paracetamol 500mg", dosage="1 tablet", duration="5 days"),
        VisitMedicine(visit_id=visit.id, medicine_name="Cetirizine 10mg", dosage="1 tablet at night", duration="3 days"),
    ]
    for med in medicines:
        db.add(med)

    db.commit()

    # 10. Generate JWT token
    access_token = create_access_token(data={"sub": user.id, "role": user.role.value})

    return {
        "message": "Guest session created",
        "token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "clinic_id": user.clinic_id,
            "is_guest": True,
        },
    }


def cleanup_guest_session(db: Session, user_id: str) -> None:
    """Delete a guest user's clinic and all associated data via CASCADE."""
    user = db.query(User).filter(User.id == user_id, User.is_guest == True).first()
    if not user or not user.clinic_id:
        return

    clinic = db.query(Clinic).filter(Clinic.id == user.clinic_id, Clinic.is_guest == True).first()
    if not clinic:
        return

    # Clear owner FK before deleting to avoid circular reference issues
    clinic.owner_doctor_id = None
    db.flush()

    db.delete(clinic)
    db.commit()


def cleanup_expired_guests(db: Session) -> int:
    """Delete guest sessions older than 24 hours. Returns count of cleaned sessions."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    expired_users = db.query(User).filter(
        User.is_guest == True,
        User.created_at < cutoff,
    ).all()

    count = 0
    for user in expired_users:
        if user.clinic_id:
            clinic = db.query(Clinic).filter(
                Clinic.id == user.clinic_id,
                Clinic.is_guest == True,
            ).first()
            if clinic:
                clinic.owner_doctor_id = None
                db.flush()
                db.delete(clinic)
                count += 1

    if count > 0:
        db.commit()

    return count


def _get_demo_complaints(index: int) -> list[str]:
    """Return varied chief complaints for demo appointments."""
    complaints = [
        ["Fever", "Cough"],
        ["Headache", "Dizziness"],
        ["Back pain"],
    ]
    return complaints[index % len(complaints)]
