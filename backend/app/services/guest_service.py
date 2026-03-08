"""
Service for creating and cleaning up guest demo sessions.
Each guest gets an isolated clinic with pre-loaded demo data.
"""

import uuid
from datetime import datetime, timedelta, timezone, date, time
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


# Additional completed visits seeded for collection report demo data.
# Ordered oldest-first so visit_number assignment is naturally sequential per patient.
DEMO_HISTORICAL_VISITS = [
    {
        "patient_index": 4,  # Vikram Singh
        "days_ago": 12,
        "queue_number": 1,
        "visit_time": time(10, 0),
        "chief_complaints": ["BP check", "General weakness"],
        "symptoms": ["General weakness", "Occasional dizziness"],
        "diagnosis": ["Essential Hypertension", "Age-related weakness"],
        "observations": ["BP controlled on medication", "Gait steady"],
        "recommended_tests": ["CBC", "Thyroid Profile"],
        "vitals": {
            "bp_systolic": "134", "bp_diastolic": "82",
            "temperature": "98.4", "pulse": "70",
            "weight": "83", "spo2": "97",
        },
        "prescription_notes": "Continue current medications. Blood tests advised. Review after reports.",
        "follow_up_days": 7,
        "amount": 800,
        "medicines": [
            ("Telmisartan 40mg", "1 tablet morning", "30 days"),
            ("Methylcobalamin 1500mcg", "1 tablet daily", "30 days"),
            ("Multivitamin", "1 tablet daily", "30 days"),
        ],
    },
    {
        "patient_index": 5,  # Ananya Gupta
        "days_ago": 8,
        "queue_number": 1,
        "visit_time": time(14, 30),
        "chief_complaints": ["Cough", "Cold"],
        "symptoms": ["Persistent cough", "Runny nose", "Low-grade fever"],
        "diagnosis": ["Upper Respiratory Tract Infection"],
        "observations": ["Chest clear", "Mild rhinorrhea", "No respiratory distress"],
        "recommended_tests": [],
        "vitals": {
            "bp_systolic": "100", "bp_diastolic": "65",
            "temperature": "99.8", "pulse": "96",
            "weight": "24", "spo2": "98",
        },
        "prescription_notes": "Adequate rest and fluids. Keep child warm. Follow up if symptoms worsen.",
        "follow_up_days": None,
        "amount": 350,
        "medicines": [
            ("Cetirizine Syrup 5ml", "5ml at night", "5 days"),
            ("Ambroxol Syrup", "5ml twice daily", "5 days"),
        ],
    },
    {
        "patient_index": 2,  # Amit Patel
        "days_ago": 5,
        "queue_number": 1,
        "visit_time": time(9, 45),
        "chief_complaints": ["Diabetes follow-up", "Increased thirst"],
        "symptoms": ["Increased thirst", "Frequent urination", "Tingling in feet"],
        "diagnosis": ["Type 2 Diabetes Mellitus - uncontrolled"],
        "observations": ["Dry skin on feet", "Peripheral sensation reduced"],
        "recommended_tests": ["HbA1c", "Fasting Blood Sugar", "Kidney Function Test"],
        "vitals": {
            "bp_systolic": "130", "bp_diastolic": "84",
            "temperature": "98.2", "pulse": "82",
            "weight": "75", "spo2": "97",
        },
        "prescription_notes": "Strict diet control advised. Monitor blood sugar daily. Insulin dose adjustment needed.",
        "follow_up_days": 10,
        "amount": 600,
        "medicines": [
            ("Metformin 500mg", "1 tablet twice daily", "30 days"),
            ("Glimepiride 1mg", "1 tablet before breakfast", "30 days"),
        ],
    },
    {
        "patient_index": 1,  # Priya Sharma
        "days_ago": 3,
        "queue_number": 1,
        "visit_time": time(11, 0),
        "chief_complaints": ["Sore throat", "Runny nose"],
        "symptoms": ["Sore throat", "Nasal congestion", "Sneezing"],
        "diagnosis": ["Acute Pharyngitis"],
        "observations": ["Pharynx congested", "No tonsillar enlargement"],
        "recommended_tests": [],
        "vitals": {
            "bp_systolic": "118", "bp_diastolic": "76",
            "temperature": "99.0", "pulse": "80",
            "weight": "60", "spo2": "98",
        },
        "prescription_notes": "Warm saline gargles. Plenty of fluids. Rest for 2 days.",
        "follow_up_days": None,
        "amount": 400,
        "medicines": [
            ("Amoxicillin 500mg", "1 capsule thrice daily", "5 days"),
            ("Chlorpheniramine 4mg", "1 tablet at night", "3 days"),
        ],
    },
    {
        "patient_index": 0,  # Rajesh Kumar
        "days_ago": 0,  # today
        "queue_number": 10,  # high to avoid conflict with WAITING queue 1-3
        "visit_time": time(10, 30),
        "chief_complaints": ["Blood pressure check", "Routine follow-up"],
        "symptoms": ["Mild headache", "Fatigue"],
        "diagnosis": ["Essential Hypertension"],
        "observations": ["BP slightly elevated", "Advised lifestyle changes"],
        "recommended_tests": ["Lipid Profile"],
        "vitals": {
            "bp_systolic": "145", "bp_diastolic": "92",
            "temperature": "98.4", "pulse": "76",
            "weight": "78", "spo2": "98",
        },
        "prescription_notes": "Continue Amlodipine. Reduce salt intake. Review in 2 weeks.",
        "follow_up_days": 14,
        "amount": 300,
        "medicines": [
            ("Amlodipine 5mg", "1 tablet morning", "30 days"),
            ("Ecosprin 75mg", "1 tablet after lunch", "30 days"),
        ],
    },
    {
        "patient_index": 4,  # Vikram Singh (second visit)
        "days_ago": 0,  # today
        "queue_number": 11,
        "visit_time": time(12, 15),
        "chief_complaints": ["Knee pain", "Difficulty walking"],
        "symptoms": ["Bilateral knee pain", "Morning stiffness", "Swelling in right knee"],
        "diagnosis": ["Osteoarthritis - Knee"],
        "observations": ["Crepitus in both knees", "Mild swelling right knee", "Limited range of motion"],
        "recommended_tests": ["X-Ray Knee AP/Lateral"],
        "vitals": {
            "bp_systolic": "138", "bp_diastolic": "85",
            "temperature": "98.6", "pulse": "72",
            "weight": "82", "spo2": "97",
        },
        "prescription_notes": "Hot fomentation advised. Avoid stairs. Physiotherapy recommended.",
        "follow_up_days": 7,
        "amount": 700,
        "medicines": [
            ("Diclofenac 50mg", "1 tablet twice daily after food", "7 days"),
            ("Pantoprazole 40mg", "1 tablet before breakfast", "7 days"),
            ("Calcium + Vitamin D3", "1 tablet daily", "30 days"),
        ],
    },
]


def create_guest_session(db: Session, plugin_opd_queue: bool = True, plugin_collections: bool = True) -> dict:
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
        plugin_opd_queue=plugin_opd_queue,
        plugin_collections=plugin_collections,
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

    # 10. Create additional completed visits for collection report demo data
    first_of_month = today.replace(day=1)
    patient_visit_counts = {patients[3].id: 1}  # Sunita already has visit_number=1

    for vdata in DEMO_HISTORICAL_VISITS:
        visit_date_date = today - timedelta(days=vdata["days_ago"])

        # Skip visits that would fall before the current month
        if visit_date_date < first_of_month:
            continue

        patient = patients[vdata["patient_index"]]

        hist_appt = Appointment(
            patient_id=patient.id,
            appointment_date=visit_date_date,
            queue_number=vdata["queue_number"],
            chief_complaints=vdata["chief_complaints"],
            status=AppointmentStatusEnum.COMPLETED,
            clinic_id=clinic.id,
            created_by=user.id,
        )
        db.add(hist_appt)
        db.flush()

        patient_visit_counts[patient.id] = patient_visit_counts.get(patient.id, 0) + 1
        v_number = patient_visit_counts[patient.id]

        follow_up = None
        if vdata["follow_up_days"] is not None:
            follow_up = visit_date_date + timedelta(days=vdata["follow_up_days"])

        hist_visit = Visit(
            patient_id=patient.id,
            appointment_id=hist_appt.id,
            visit_date=datetime.combine(visit_date_date, vdata["visit_time"]).replace(tzinfo=timezone.utc),
            visit_number=v_number,
            doctor_id=doctor.id,
            symptoms=vdata["symptoms"],
            diagnosis=vdata["diagnosis"],
            observations=vdata["observations"],
            recommended_tests=vdata["recommended_tests"],
            vitals=vdata["vitals"],
            prescription_notes=vdata["prescription_notes"],
            follow_up_date=follow_up,
            amount=vdata["amount"],
            clinic_id=clinic.id,
        )
        db.add(hist_visit)
        db.flush()

        for med_name, med_dosage, med_duration in vdata["medicines"]:
            db.add(VisitMedicine(
                visit_id=hist_visit.id,
                medicine_name=med_name,
                dosage=med_dosage,
                duration=med_duration,
            ))

    db.commit()

    # 11. Generate JWT token
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
            "enabled_plugins": {
                "opd_queue": plugin_opd_queue,
                "collections": plugin_collections,
            },
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
