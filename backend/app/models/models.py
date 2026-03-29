from sqlalchemy import Column, String, Integer, Boolean, DateTime, Date, ForeignKey, Enum, Numeric, ARRAY, JSON, Text, text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
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


class ClinicSpecialtyEnum(str, enum.Enum):
    DENTAL = "dental"
    DERMATOLOGY = "dermatology"
    GENERAL_PHYSICIAN = "general_physician"
    PEDIATRICS = "pediatrics"
    ORTHOPEDICS = "orthopedics"


class AppointmentStatusEnum(str, enum.Enum):
    WAITING = "WAITING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"


class OnboardingRequestStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class AuditActionEnum(str, enum.Enum):
    CREATE = "CREATE"
    READ = "READ"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    LOGIN_FAILED = "LOGIN_FAILED"
    LOGOUT = "LOGOUT"
    PASSWORD_CHANGE = "PASSWORD_CHANGE"
    DATA_EXPORT = "DATA_EXPORT"
    DATA_ERASURE = "DATA_ERASURE"
    CONSENT_GIVEN = "CONSENT_GIVEN"
    CONSENT_REVOKED = "CONSENT_REVOKED"


class ConsentPurposeEnum(str, enum.Enum):
    TREATMENT = "TREATMENT"
    DATA_STORAGE = "DATA_STORAGE"
    COMMUNICATION = "COMMUNICATION"


class ConsentStatusEnum(str, enum.Enum):
    GIVEN = "GIVEN"
    REVOKED = "REVOKED"


class ErasureStatusEnum(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"


class NotificationChannelEnum(str, enum.Enum):
    WHATSAPP = "WHATSAPP"
    SMS = "SMS"


class NotificationStatusEnum(str, enum.Enum):
    QUEUED = "QUEUED"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"


class NotificationTypeEnum(str, enum.Enum):
    VACCINATION_DUE = "VACCINATION_DUE"
    VACCINATION_OVERDUE = "VACCINATION_OVERDUE"
    FOLLOW_UP_REMINDER = "FOLLOW_UP_REMINDER"


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
    specialty = Column(Enum(ClinicSpecialtyEnum, values_callable=lambda x: [e.value for e in x]), nullable=True, default=ClinicSpecialtyEnum.DENTAL)
    is_guest = Column(Boolean, default=False, nullable=False)
    plugin_opd_queue = Column(Boolean, default=True, nullable=False, server_default=text('true'))
    plugin_collections = Column(Boolean, default=True, nullable=False, server_default=text('true'))
    plugin_dpdp_compliance = Column(Boolean, default=False, nullable=False, server_default=text('false'))
    plugin_vaccination = Column(Boolean, default=False, nullable=False, server_default=text('false'))
    plugin_notifications = Column(Boolean, default=False, nullable=False, server_default=text('false'))
    notification_config = Column(JSON, nullable=True)
    owner_doctor_id = Column(String, ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    users = relationship("User", back_populates="clinic", cascade="all, delete-orphan")
    doctors = relationship("Doctor", back_populates="clinic", cascade="all, delete-orphan", foreign_keys="Doctor.clinic_id")
    owner_doctor = relationship("Doctor", foreign_keys=[owner_doctor_id], post_update=True)
    patients = relationship("Patient", back_populates="clinic", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="clinic", cascade="all, delete-orphan")
    visits = relationship("Visit", back_populates="clinic", cascade="all, delete-orphan")
    admins = relationship("ClinicAdmin", back_populates="clinic", cascade="all, delete-orphan")
    chief_complaints = relationship("ChiefComplaint", back_populates="clinic", cascade="all, delete-orphan")
    diagnosis_options = relationship("DiagnosisOption", back_populates="clinic", cascade="all, delete-orphan")
    observation_options = relationship("ObservationOption", back_populates="clinic", cascade="all, delete-orphan")
    test_options = relationship("TestOption", back_populates="clinic", cascade="all, delete-orphan")
    medicine_options = relationship("MedicineOption", back_populates="clinic", cascade="all, delete-orphan")
    dosage_options = relationship("DosageOption", back_populates="clinic", cascade="all, delete-orphan")
    duration_options = relationship("DurationOption", back_populates="clinic", cascade="all, delete-orphan")
    symptom_options = relationship("SymptomOption", back_populates="clinic", cascade="all, delete-orphan")
    user_permissions = relationship("UserPermission", back_populates="clinic", cascade="all, delete-orphan")
    print_template = relationship("PrintTemplate", back_populates="clinic", uselist=False, cascade="all, delete-orphan")
    vaccination_schedule = relationship("VaccinationSchedule", back_populates="clinic", cascade="all, delete-orphan")
    vaccination_records = relationship("VaccinationRecord", back_populates="clinic", cascade="all, delete-orphan")
    notification_logs = relationship("NotificationLog", back_populates="clinic", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True, index=True)
    initial_password = Column(String, nullable=True)
    role = Column(Enum(RoleEnum), nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String)
    is_active = Column(Boolean, default=True)
    is_guest = Column(Boolean, default=False, nullable=False)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))

    clinic = relationship("Clinic", back_populates="users")
    managed_clinics = relationship("ClinicAdmin", back_populates="admin", cascade="all, delete-orphan")
    doctor = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    created_patients = relationship("Patient", back_populates="creator")
    created_appointments = relationship("Appointment", back_populates="creator")
    permissions = relationship("UserPermission", back_populates="user", uselist=False, cascade="all, delete-orphan")


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


class Patient(Base):
    __tablename__ = "patients"
    __table_args__ = (
        UniqueConstraint('clinic_id', 'patient_code', name='uq_clinic_patient_code'),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_code = Column(String, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    age = Column(Integer)
    gender = Column(Enum(GenderEnum))
    phone = Column(String, nullable=False, index=True)
    emergency_contact = Column(String)
    address = Column(Text)
    blood_group = Column(String)
    allergies = Column(ARRAY(String), default=[])
    medical_history = Column(JSON)
    is_anonymized = Column(Boolean, default=False, nullable=False, server_default=text('false'))
    is_deleted = Column(Boolean, default=False, nullable=False, server_default=text('false'))
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    date_of_birth = Column(Date, nullable=True)

    guardian_name = Column(String, nullable=True)
    guardian_phone = Column(String, nullable=True)
    guardian_relationship = Column(String, nullable=True)

    clinic = relationship("Clinic", back_populates="patients")
    creator = relationship("User", back_populates="created_patients")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    visits = relationship("Visit", back_populates="patient", cascade="all, delete-orphan")
    vaccination_records = relationship("VaccinationRecord", back_populates="patient", cascade="all, delete-orphan")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    appointment_date = Column(Date, nullable=False, index=True)
    queue_number = Column(Integer)
    chief_complaints = Column(ARRAY(String), default=[])
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
    visit_date = Column(DateTime(timezone=True), nullable=False, index=True)
    visit_number = Column(Integer, nullable=False)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=False)
    symptoms = Column(ARRAY(String), default=[])
    diagnosis = Column(ARRAY(String), default=[])
    observations = Column(ARRAY(String), default=[])
    recommended_tests = Column(ARRAY(String), default=[])
    follow_up_date = Column(Date)
    vitals = Column(JSON)
    prescription_notes = Column(Text)
    amount = Column(Numeric(10, 2), nullable=True)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="visits")
    appointment = relationship("Appointment", back_populates="visit")
    doctor = relationship("Doctor", back_populates="visits")
    clinic = relationship("Clinic", back_populates="visits")
    medicines = relationship("VisitMedicine", back_populates="visit", cascade="all, delete-orphan")
    vaccination_records = relationship("VaccinationRecord", back_populates="visit")


class VisitMedicine(Base):
    __tablename__ = "visit_medicines"

    id = Column(String, primary_key=True, default=generate_uuid)
    visit_id = Column(String, ForeignKey("visits.id", ondelete="CASCADE"), nullable=False)
    medicine_name = Column(String, nullable=False)
    dosage = Column(String)
    duration = Column(String)

    visit = relationship("Visit", back_populates="medicines")


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


class DiagnosisOption(Base):
    __tablename__ = "diagnosis_options"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    clinic = relationship("Clinic", back_populates="diagnosis_options")


class ObservationOption(Base):
    __tablename__ = "observation_options"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    clinic = relationship("Clinic", back_populates="observation_options")


class TestOption(Base):
    __tablename__ = "test_options"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    clinic = relationship("Clinic", back_populates="test_options")


class MedicineOption(Base):
    __tablename__ = "medicine_options"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    default_dosage = Column(String, nullable=True)
    default_duration = Column(String, nullable=True)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    clinic = relationship("Clinic", back_populates="medicine_options")


class DosageOption(Base):
    __tablename__ = "dosage_options"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    clinic = relationship("Clinic", back_populates="dosage_options")


class DurationOption(Base):
    __tablename__ = "duration_options"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    clinic = relationship("Clinic", back_populates="duration_options")


class SymptomOption(Base):
    __tablename__ = "symptom_options"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    clinic = relationship("Clinic", back_populates="symptom_options")


class UserPermission(Base):
    __tablename__ = "user_permissions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)

    # Patient Management
    can_view_patients = Column(Boolean, default=True)
    can_create_patients = Column(Boolean, default=True)
    can_edit_patients = Column(Boolean, default=True)
    can_delete_patients = Column(Boolean, default=False)

    # OPD Management
    can_view_opd = Column(Boolean, default=True)
    can_manage_opd = Column(Boolean, default=True)

    # Visit/Prescription Management
    can_view_visits = Column(Boolean, default=True)
    can_create_visits = Column(Boolean, default=False)
    can_edit_visits = Column(Boolean, default=False)

    # Settings Management
    can_manage_clinic_options = Column(Boolean, default=False)
    can_edit_print_settings = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="permissions")
    clinic = relationship("Clinic", back_populates="user_permissions")


class FixtureTemplate(Base):
    __tablename__ = "fixture_templates"

    id = Column(String, primary_key=True, default=generate_uuid)
    specialty = Column(Enum(ClinicSpecialtyEnum, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    category = Column(String, nullable=False, index=True)  # e.g., "chief_complaints", "diagnoses", etc.
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class OnboardingRequest(Base):
    __tablename__ = "onboarding_requests"

    id = Column(String, primary_key=True, default=generate_uuid)

    # Doctor info
    doctor_name = Column(String, nullable=False)
    doctor_email = Column(String, nullable=False, index=True)
    doctor_phone = Column(String, nullable=False)
    specialization = Column(String, nullable=True)
    qualification = Column(String, nullable=True)
    registration_number = Column(String, nullable=True)

    # Clinic info
    clinic_name = Column(String, nullable=False)
    clinic_address = Column(String, nullable=True)
    clinic_city = Column(String, nullable=True)
    clinic_state = Column(String, nullable=True)
    clinic_pincode = Column(String, nullable=True)
    clinic_phone = Column(String)
    clinic_email = Column(String)
    clinic_specialty = Column(Enum(ClinicSpecialtyEnum), nullable=True)
    expected_patient_volume = Column(String)

    additional_notes = Column(Text)

    # Status tracking
    status = Column(Enum(OnboardingRequestStatusEnum), nullable=False, default=OnboardingRequestStatusEnum.PENDING, index=True)
    reviewed_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    admin_notes = Column(Text, nullable=True)

    # Links to created entities (populated on approval)
    created_clinic_id = Column(String, ForeignKey("clinics.id", ondelete="SET NULL"), nullable=True)
    created_user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    reviewer = relationship("User", foreign_keys=[reviewed_by])


class PrintTemplate(Base):
    __tablename__ = "print_templates"

    id = Column(String, primary_key=True, default=generate_uuid)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Core mode: "letterhead" (pre-printed paper) or "digital" (print header/footer digitally)
    print_mode = Column(String, nullable=False, default="letterhead")

    # Which preset layout is selected
    preset_id = Column(String, nullable=False, default="classic")

    # Content positioning (pixels)
    content_top_px = Column(Integer, nullable=False, default=280)
    content_left_px = Column(Integer, nullable=False, default=40)
    content_right_px = Column(Integer, nullable=False, default=40)

    # JSON blob for header/footer/watermark config
    template_config = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    clinic = relationship("Clinic", back_populates="print_template")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    clinic_id = Column(String, nullable=True, index=True)
    user_id = Column(String, nullable=True, index=True)
    user_email = Column(String, nullable=True)
    action = Column(Enum(AuditActionEnum), nullable=False, index=True)
    resource_type = Column(String, nullable=False, index=True)
    resource_id = Column(String, nullable=True, index=True)
    description = Column(String, nullable=True)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class PatientConsent(Base):
    __tablename__ = "patient_consents"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    purpose = Column(Enum(ConsentPurposeEnum), nullable=False)
    status = Column(Enum(ConsentStatusEnum), nullable=False, default=ConsentStatusEnum.GIVEN)
    consent_text = Column(Text, nullable=False)
    consent_version = Column(String, nullable=False, default="1.0")
    given_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    collected_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ip_address = Column(String, nullable=True)

    patient = relationship("Patient")
    collector = relationship("User")


class DataRetentionPolicy(Base):
    __tablename__ = "data_retention_policies"

    id = Column(String, primary_key=True, default=generate_uuid)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False, unique=True)
    patient_data_retention_months = Column(Integer, nullable=False, default=120)
    audit_log_retention_months = Column(Integer, nullable=False, default=60)
    inactive_patient_archive_months = Column(Integer, nullable=False, default=36)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    clinic = relationship("Clinic")


class DataErasureRequest(Base):
    __tablename__ = "data_erasure_requests"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    requested_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason = Column(Text, nullable=True)
    status = Column(Enum(ErasureStatusEnum), nullable=False, default=ErasureStatusEnum.REQUESTED)
    approved_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    anonymized_fields = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient")
    requester = relationship("User", foreign_keys=[requested_by])
    approver = relationship("User", foreign_keys=[approved_by])


class DataBreachLog(Base):
    __tablename__ = "data_breach_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    reported_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=False)
    severity = Column(String, nullable=False, default="LOW")
    affected_records_count = Column(Integer, nullable=True)
    containment_actions = Column(Text, nullable=True)
    reported_to_authority = Column(Boolean, default=False)
    reported_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    reporter = relationship("User")


class ClinicDailyStats(Base):
    __tablename__ = "clinic_daily_stats"

    id = Column(String, primary_key=True, default=generate_uuid)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False, index=True)
    stat_date = Column(Date, nullable=False, index=True)

    # Activity metrics (from audit_logs LOGIN events)
    unique_logins = Column(Integer, default=0)
    total_logins = Column(Integer, default=0)

    # Business metrics (from patients, visits, appointments)
    patients_created = Column(Integer, default=0)
    appointments_created = Column(Integer, default=0)
    visits_completed = Column(Integer, default=0)
    prescriptions_written = Column(Integer, default=0)

    # Collections (from visits.amount)
    total_collections = Column(Numeric(10, 2), default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('clinic_id', 'stat_date', name='uq_clinic_daily_stats'),
    )


class VaccinationSchedule(Base):
    __tablename__ = "vaccination_schedules"

    id = Column(String, primary_key=True, default=generate_uuid)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    vaccine_name = Column(String, nullable=False)
    dose_number = Column(Integer, nullable=False)
    dose_label = Column(String)
    age_days = Column(Integer, nullable=False)
    age_label = Column(String)
    vaccine_group = Column(String)
    route = Column(String)
    site = Column(String)
    is_mandatory = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    clinic = relationship("Clinic", back_populates="vaccination_schedule")

    __table_args__ = (
        UniqueConstraint('clinic_id', 'vaccine_name', 'dose_number', name='uq_clinic_vaccine_dose'),
    )


class VaccinationRecord(Base):
    __tablename__ = "vaccination_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    schedule_entry_id = Column(String, ForeignKey("vaccination_schedules.id", ondelete="SET NULL"), nullable=True)
    visit_id = Column(String, ForeignKey("visits.id", ondelete="SET NULL"), nullable=True)
    vaccine_name = Column(String, nullable=False)
    dose_number = Column(Integer, nullable=False)
    dose_label = Column(String)
    date_administered = Column(Date, nullable=False)
    age_at_dose_days = Column(Integer)
    batch_number = Column(String, nullable=True)
    administered_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    injection_site = Column(String, nullable=True)
    route = Column(String, nullable=True)
    adverse_reaction = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_voided = Column(Boolean, default=False, server_default="false")
    void_reason = Column(String, nullable=True)
    voided_at = Column(DateTime(timezone=True), nullable=True)
    voided_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    patient = relationship("Patient", back_populates="vaccination_records")
    clinic = relationship("Clinic", back_populates="vaccination_records")
    visit = relationship("Visit", back_populates="vaccination_records")
    schedule_entry = relationship("VaccinationSchedule")
    administerer = relationship("User", foreign_keys=[administered_by])
    creator = relationship("User", foreign_keys=[created_by])
    voider = relationship("User", foreign_keys=[voided_by])

    __table_args__ = (
        UniqueConstraint('patient_id', 'vaccine_name', 'dose_number', name='uq_patient_vaccine_dose'),
    )


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="SET NULL"), nullable=True, index=True)
    phone = Column(String, nullable=False)
    channel = Column(Enum(NotificationChannelEnum), nullable=False)
    notification_type = Column(Enum(NotificationTypeEnum), nullable=False)
    status = Column(Enum(NotificationStatusEnum), nullable=False, default=NotificationStatusEnum.QUEUED)
    message_body = Column(Text, nullable=False)
    template_id = Column(String, nullable=True)
    provider_message_id = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    clinic = relationship("Clinic", back_populates="notification_logs")
    patient = relationship("Patient")
