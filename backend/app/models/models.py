from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, ForeignKey, Enum, Numeric, ARRAY, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class RoleEnum(str, enum.Enum):
    DOCTOR = "DOCTOR"
    ASSISTANT = "ASSISTANT"
    ADMIN = "ADMIN"


class GenderEnum(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"


class AppointmentStatusEnum(str, enum.Enum):
    WAITING = "WAITING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class PaymentStatusEnum(str, enum.Enum):
    PAID = "PAID"
    UNPAID = "UNPAID"
    PARTIAL = "PARTIAL"


class PaymentModeEnum(str, enum.Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"
    OTHER = "OTHER"


class Clinic(Base):
    __tablename__ = "clinics"

    id = Column(String, primary_key=True, default=generate_uuid)
    clinic_code = Column(String, unique=True, nullable=True, index=True)  # "CL-0001"
    name = Column(String, nullable=False)
    address = Column(Text)
    phone = Column(String)
    email = Column(String)
    logo_url = Column(String)
    opd_start_time = Column(String)
    opd_end_time = Column(String)
    owner_doctor_id = Column(String, ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    users = relationship("User", back_populates="clinic", cascade="all, delete-orphan")
    doctors = relationship("Doctor", back_populates="clinic", cascade="all, delete-orphan", foreign_keys="Doctor.clinic_id")
    owner_doctor = relationship("Doctor", foreign_keys=[owner_doctor_id], post_update=True)
    patients = relationship("Patient", back_populates="clinic", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="clinic", cascade="all, delete-orphan")
    visits = relationship("Visit", back_populates="clinic", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="clinic", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="clinic", cascade="all, delete-orphan")
    admins = relationship("ClinicAdmin", back_populates="clinic", cascade="all, delete-orphan")
    chief_complaints = relationship("ChiefComplaint", back_populates="clinic", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    initial_password = Column(String, nullable=True)
    role = Column(Enum(RoleEnum), nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String)
    is_active = Column(Boolean, default=True)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))

    clinic = relationship("Clinic", back_populates="users")
    managed_clinics = relationship("ClinicAdmin", back_populates="admin", cascade="all, delete-orphan")
    doctor = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    created_patients = relationship("Patient", back_populates="creator")
    created_appointments = relationship("Appointment", back_populates="creator")
    created_invoices = relationship("Invoice", back_populates="creator")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String, primary_key=True, default=generate_uuid)
    doctor_code = Column(String, unique=True, nullable=True, index=True)  # "DR-0001"
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialization = Column(String)
    qualification = Column(String)
    registration_number = Column(String)
    signature_url = Column(String)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="doctor")
    clinic = relationship("Clinic", back_populates="doctors", foreign_keys=[clinic_id])
    visits = relationship("Visit", back_populates="doctor")
    prescriptions = relationship("Prescription", back_populates="doctor")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_code = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    age = Column(Integer)
    gender = Column(Enum(GenderEnum))
    phone = Column(String, nullable=False, index=True)
    emergency_contact = Column(String)
    address = Column(Text)
    blood_group = Column(String)
    allergies = Column(ARRAY(String), default=[])
    medical_history = Column(JSON)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    clinic = relationship("Clinic", back_populates="patients")
    creator = relationship("User", back_populates="created_patients")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    visits = relationship("Visit", back_populates="patient", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="patient", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="patient", cascade="all, delete-orphan")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    appointment_date = Column(Date, nullable=False, index=True)
    queue_number = Column(Integer)
    chief_complaint = Column(String, nullable=True)
    status = Column(Enum(AppointmentStatusEnum), default=AppointmentStatusEnum.WAITING)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="appointments")
    clinic = relationship("Clinic", back_populates="appointments")
    creator = relationship("User", back_populates="created_appointments")
    visit = relationship("Visit", back_populates="appointment", uselist=False, cascade="all, delete-orphan")


class Visit(Base):
    __tablename__ = "visits"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(String, ForeignKey("appointments.id"), unique=True)
    visit_date = Column(Date, nullable=False, index=True)
    visit_number = Column(Integer, nullable=False)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=False)
    symptoms = Column(Text)
    diagnosis = Column(Text)
    observations = Column(Text)
    recommended_tests = Column(ARRAY(String), default=[])
    follow_up_date = Column(Date)
    vitals = Column(JSON)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="visits")
    appointment = relationship("Appointment", back_populates="visit")
    doctor = relationship("Doctor", back_populates="visits")
    clinic = relationship("Clinic", back_populates="visits")
    prescriptions = relationship("Prescription", back_populates="visit", cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="visit", uselist=False, cascade="all, delete-orphan")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String, primary_key=True, default=generate_uuid)
    visit_id = Column(String, ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=False)
    prescription_date = Column(Date, nullable=False)
    notes = Column(Text)
    pdf_url = Column(String)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    visit = relationship("Visit", back_populates="prescriptions")
    patient = relationship("Patient", back_populates="prescriptions")
    doctor = relationship("Doctor", back_populates="prescriptions")
    clinic = relationship("Clinic", back_populates="prescriptions")
    medicines = relationship("PrescriptionMedicine", back_populates="prescription", cascade="all, delete-orphan")


class PrescriptionMedicine(Base):
    __tablename__ = "prescription_medicines"

    id = Column(String, primary_key=True, default=generate_uuid)
    prescription_id = Column(String, ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False)
    medicine_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    duration = Column(String, nullable=False)
    instructions = Column(Text)
    quantity = Column(Integer)

    prescription = relationship("Prescription", back_populates="medicines")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=generate_uuid)
    invoice_number = Column(String, unique=True, nullable=False, index=True)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    visit_id = Column(String, ForeignKey("visits.id"), unique=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    paid_amount = Column(Numeric(10, 2), default=0)
    payment_status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.UNPAID)
    payment_mode = Column(Enum(PaymentModeEnum))
    payment_date = Column(Date)
    notes = Column(Text)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="invoices")
    visit = relationship("Visit", back_populates="invoice")
    clinic = relationship("Clinic", back_populates="invoices")
    creator = relationship("User", back_populates="created_invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    invoice_id = Column(String, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, default=1)

    invoice = relationship("Invoice", back_populates="items")


class ClinicAdmin(Base):
    __tablename__ = "clinic_admins"

    id = Column(String, primary_key=True, default=generate_uuid)
    admin_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    admin = relationship("User", back_populates="managed_clinics")
    clinic = relationship("Clinic", back_populates="admins")


class ChiefComplaint(Base):
    __tablename__ = "chief_complaints"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    clinic = relationship("Clinic", back_populates="chief_complaints")
