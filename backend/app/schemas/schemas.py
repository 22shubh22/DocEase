from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
import re
from app.models.models import (
    RoleEnum, GenderEnum, AppointmentStatusEnum, ClinicSpecialtyEnum,
    OnboardingRequestStatusEnum, AuditActionEnum, ConsentPurposeEnum,
    ConsentStatusEnum, ErasureStatusEnum,
    NotificationChannelEnum, NotificationStatusEnum, NotificationTypeEnum,
)


def validate_phone_number(phone: str, field_name: str = "Phone number") -> str:
    """Validates Indian phone numbers: strips +91 prefix and formatting, checks for exactly 10 digits."""
    if not phone or phone.strip() == '':
        return phone
    if not re.match(r'^[+\d\s\-()]+$', phone):
        raise ValueError(f'{field_name} can only contain digits, +, spaces, hyphens, and parentheses')
    cleaned = re.sub(r'[\s\-()]', '', phone)
    if cleaned.startswith('+91'):
        cleaned = cleaned[3:]
    elif cleaned.startswith('91') and len(cleaned) > 10:
        cleaned = cleaned[2:]
    if not re.match(r'^\d{10}$', cleaned):
        raise ValueError(f'{field_name} must be exactly 10 digits')
    return cleaned


def validate_vitals_dict(vitals: dict) -> dict:
    """Validates vital signs dictionary values are within reasonable medical ranges."""
    if not vitals:
        return vitals

    bp = vitals.get('blood_pressure')
    if bp and isinstance(bp, str) and bp.strip():
        bp = bp.strip()
        if not re.match(r'^\d{2,3}/\d{2,3}$', bp):
            raise ValueError('Blood pressure must be in format like 120/80')
        systolic, diastolic = map(int, bp.split('/'))
        if not (50 <= systolic <= 300):
            raise ValueError('Systolic BP must be between 50 and 300')
        if not (20 <= diastolic <= 200):
            raise ValueError('Diastolic BP must be between 20 and 200')

    temp = vitals.get('temperature')
    if temp is not None and str(temp).strip():
        try:
            temp_val = float(temp)
        except (ValueError, TypeError):
            raise ValueError('Temperature must be a valid number')
        if not (90 <= temp_val <= 110):
            raise ValueError('Temperature must be between 90 and 110 °F')

    numeric_ranges = {
        'pulse': (20, 300, 'bpm'),
        'weight': (0.5, 500, 'kg'),
        'height': (10, 300, 'cm'),
        'spo2': (0, 100, '%'),
    }
    for field, (lo, hi, unit) in numeric_ranges.items():
        val = vitals.get(field)
        if val is not None and str(val).strip():
            try:
                num = float(val)
            except (ValueError, TypeError):
                raise ValueError(f'{field.capitalize()} must be a valid number')
            if not (lo <= num <= hi):
                raise ValueError(f'{field.capitalize()} must be between {lo} and {hi} {unit}')

    return vitals


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token from frontend


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class GuestCleanupRequest(BaseModel):
    user_id: str


SUPPORTED_DEMO_SPECIALTIES = ["general_physician", "dental", "dermatology", "pediatrics"]


class GuestSessionRequest(BaseModel):
    plugin_opd_queue: bool = True
    plugin_collections: bool = True
    clinic_specialty: str = "general_physician"

    @field_validator("clinic_specialty")
    @classmethod
    def validate_specialty(cls, v):
        if v not in SUPPORTED_DEMO_SPECIALTIES:
            raise ValueError(f"Unsupported specialty. Choose from: {SUPPORTED_DEMO_SPECIALTIES}")
        return v


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: RoleEnum

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is None or v.strip() == '':
            return v
        return validate_phone_number(v, 'Phone number')


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is None or v.strip() == '':
            return v
        return validate_phone_number(v, 'Phone number')


class UserResponse(UserBase):
    id: str
    is_active: bool
    clinic_id: Optional[str] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserResponseWithPassword(UserResponse):
    initial_password: Optional[str] = None
    is_owner: Optional[bool] = None

    class Config:
        from_attributes = True


class SetClinicOwner(BaseModel):
    doctor_id: str


class UserUpdateByAdmin(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is None or v.strip() == '':
            return v
        return validate_phone_number(v, 'Phone number')


# Clinic Schemas
class ClinicBase(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    opd_start_time: Optional[str] = None
    opd_end_time: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is None or v.strip() == '':
            return v
        return validate_phone_number(v, 'Clinic phone')


class ClinicUpdate(ClinicBase):
    name: Optional[str] = None
    logo_url: Optional[str] = None


class ClinicPluginsUpdate(BaseModel):
    plugin_opd_queue: Optional[bool] = None
    plugin_collections: Optional[bool] = None
    plugin_dpdp_compliance: Optional[bool] = None
    plugin_vaccination: Optional[bool] = None
    plugin_notifications: Optional[bool] = None


class ClinicResponse(ClinicBase):
    id: str
    clinic_code: Optional[str] = None
    logo_url: Optional[str] = None
    owner_doctor_id: Optional[str] = None
    specialty: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Doctor Schemas
class DoctorBase(BaseModel):
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    registration_number: Optional[str] = None


class DoctorUpdate(DoctorBase):
    signature_url: Optional[str] = None


class DoctorResponse(DoctorBase):
    id: str
    doctor_code: Optional[str] = None
    user_id: str
    signature_url: Optional[str] = None

    class Config:
        from_attributes = True


# Patient Schemas
class PatientBase(BaseModel):
    full_name: str
    age: Optional[int] = None
    date_of_birth: Optional[date] = None
    gender: Optional[GenderEnum] = None
    phone: str
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[List[str]] = []
    medical_history: Optional[dict] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_relationship: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        return validate_phone_number(v, 'Phone number')

    @field_validator('emergency_contact')
    @classmethod
    def validate_emergency_contact(cls, v):
        if v is None or v.strip() == '':
            return v
        return validate_phone_number(v, 'Emergency contact')

    @field_validator('guardian_phone')
    @classmethod
    def validate_guardian_phone(cls, v):
        if v is None or v.strip() == '':
            return v
        return validate_phone_number(v, 'Guardian phone')


class PatientCreate(PatientBase):
    patient_since: Optional[date] = None


class PatientUpdate(PatientBase):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    patient_since: Optional[date] = None


class PatientResponse(PatientBase):
    id: str
    patient_code: str
    clinic_id: str
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True


# Appointment Schemas
class AppointmentBase(BaseModel):
    patient_id: str
    chief_complaints: Optional[List[str]] = []


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatusEnum] = None


class AppointmentPositionUpdate(BaseModel):
    new_position: int


class AppointmentResponse(AppointmentBase):
    id: str
    appointment_date: date
    queue_number: Optional[int] = None
    chief_complaints: Optional[List[str]] = []
    status: AppointmentStatusEnum
    created_at: datetime

    class Config:
        from_attributes = True


# Visit Medicine Schema (forward declaration for VisitCreate)
class VisitMedicineCreate(BaseModel):
    medicine_name: str
    dosage: Optional[str] = None
    duration: Optional[str] = None


# Visit Schemas
class VisitBase(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    symptoms: Optional[List[str]] = []
    diagnosis: Optional[List[str]] = []
    observations: Optional[List[str]] = []
    recommended_tests: Optional[List[str]] = []
    follow_up_date: Optional[date] = None
    vitals: Optional[dict] = None
    prescription_notes: Optional[str] = None
    amount: Optional[Decimal] = None

    @field_validator('vitals')
    @classmethod
    def validate_vitals(cls, v):
        if v is None:
            return v
        return validate_vitals_dict(v)


class VisitCreate(VisitBase):
    doctor_id: Optional[str] = None
    medicines: Optional[List[VisitMedicineCreate]] = []


class VisitUpdate(BaseModel):
    symptoms: Optional[List[str]] = None
    diagnosis: Optional[List[str]] = None
    observations: Optional[List[str]] = None
    recommended_tests: Optional[List[str]] = None
    follow_up_date: Optional[date] = None
    vitals: Optional[dict] = None
    prescription_notes: Optional[str] = None
    medicines: Optional[List[VisitMedicineCreate]] = None
    amount: Optional[Decimal] = None

    @field_validator('vitals')
    @classmethod
    def validate_vitals(cls, v):
        if v is None:
            return v
        return validate_vitals_dict(v)


class VisitMedicineResponse(BaseModel):
    id: str
    medicine_name: str
    dosage: Optional[str] = None
    duration: Optional[str] = None

    class Config:
        from_attributes = True


class VisitResponse(VisitBase):
    id: str
    doctor_id: str
    visit_date: datetime
    visit_number: int
    clinic_id: str
    created_at: datetime
    medicines: List[VisitMedicineResponse] = []

    class Config:
        from_attributes = True


# Admin Schemas
class ClinicCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    opd_start_time: Optional[str] = None
    opd_end_time: Optional[str] = None
    specialty: Optional[ClinicSpecialtyEnum] = ClinicSpecialtyEnum.DENTAL

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is None or v.strip() == '':
            return v
        return validate_phone_number(v, 'Clinic phone')


class DoctorWithUser(DoctorResponse):
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class ClinicWithDoctors(ClinicResponse):
    doctors: List[DoctorWithUser] = []

    class Config:
        from_attributes = True


class AdminClinicAssignment(BaseModel):
    clinic_id: str


class DoctorAssignment(BaseModel):
    doctor_id: str
    clinic_id: str


class AdminDashboardStats(BaseModel):
    total_clinics: int
    total_doctors: int
    total_patients: int
    pending_onboarding_requests: int = 0


# Chief Complaint Schemas
class ChiefComplaintBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    display_order: int = 0


class ChiefComplaintCreate(ChiefComplaintBase):
    pass


class ChiefComplaintUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class ChiefComplaintResponse(ChiefComplaintBase):
    id: str
    clinic_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Diagnosis Option Schemas
class DiagnosisOptionBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    display_order: int = 0


class DiagnosisOptionCreate(DiagnosisOptionBase):
    pass


class DiagnosisOptionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class DiagnosisOptionResponse(DiagnosisOptionBase):
    id: str
    clinic_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Observation Option Schemas
class ObservationOptionBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    display_order: int = 0


class ObservationOptionCreate(ObservationOptionBase):
    pass


class ObservationOptionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class ObservationOptionResponse(ObservationOptionBase):
    id: str
    clinic_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Test Option Schemas
class TestOptionBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    display_order: int = 0


class TestOptionCreate(TestOptionBase):
    pass


class TestOptionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class TestOptionResponse(TestOptionBase):
    id: str
    clinic_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Medicine Option Schemas
class MedicineOptionBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    display_order: int = 0
    default_dosage: Optional[str] = None
    default_duration: Optional[str] = None


class MedicineOptionCreate(MedicineOptionBase):
    pass


class MedicineOptionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None
    default_dosage: Optional[str] = None
    default_duration: Optional[str] = None


class MedicineOptionResponse(MedicineOptionBase):
    id: str
    clinic_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Dosage Option Schemas
class DosageOptionBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    display_order: int = 0


class DosageOptionCreate(DosageOptionBase):
    pass


class DosageOptionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class DosageOptionResponse(DosageOptionBase):
    id: str
    clinic_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Duration Option Schemas
class DurationOptionBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    display_order: int = 0


class DurationOptionCreate(DurationOptionBase):
    pass


class DurationOptionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class DurationOptionResponse(DurationOptionBase):
    id: str
    clinic_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Symptom Option Schemas
class SymptomOptionBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    display_order: int = 0


class SymptomOptionCreate(SymptomOptionBase):
    pass


class SymptomOptionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class SymptomOptionResponse(SymptomOptionBase):
    id: str
    clinic_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Collection Report Schemas
class CollectionVisitItem(BaseModel):
    visit_id: str
    patient_name: str
    patient_code: str
    doctor_name: str
    amount: float
    visit_time: str


class CollectionBreakdown(BaseModel):
    date: str
    total: float
    visit_count: int
    visits: List[CollectionVisitItem]


class CollectionPeriod(BaseModel):
    start: str
    end: str


class CollectionSummaryResponse(BaseModel):
    total_collection: float
    visit_count: int
    period: CollectionPeriod
    breakdown: List[CollectionBreakdown]


# User Permission Schemas
class UserPermissionBase(BaseModel):
    # Patient Management
    can_view_patients: bool = True
    can_create_patients: bool = True
    can_edit_patients: bool = True
    can_delete_patients: bool = False
    # OPD Management
    can_view_opd: bool = True
    can_manage_opd: bool = True
    # Visit/Prescription Management
    can_view_visits: bool = True
    can_create_visits: bool = False
    can_edit_visits: bool = False
    # Settings Management
    can_manage_clinic_options: bool = False
    can_edit_print_settings: bool = False


class UserPermissionUpdate(UserPermissionBase):
    pass


class UserPermissionResponse(UserPermissionBase):
    id: str
    user_id: str
    clinic_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserWithPermissions(BaseModel):
    id: str
    email: str
    full_name: str
    role: RoleEnum
    is_active: bool
    is_owner: bool = False
    permissions: Optional[UserPermissionResponse] = None

    class Config:
        from_attributes = True


# Sub-User Schemas
class SubUserCreate(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: RoleEnum
    # Doctor-specific fields (used when role is DOCTOR)
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    registration_number: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is None or v.strip() == '':
            return v
        return validate_phone_number(v, 'Phone number')


class SubUserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: RoleEnum
    phone: Optional[str] = None
    is_active: bool
    initial_password: str
    created_at: datetime

    class Config:
        from_attributes = True


class SubUserStats(BaseModel):
    current_count: int
    max_allowed: int
    can_create: bool


# Onboarding Request Schemas
class OnboardingRequestCreate(BaseModel):
    doctor_name: str
    doctor_email: EmailStr
    doctor_phone: str
    clinic_name: str
    password: Optional[str] = None
    google_credential: Optional[str] = None

    @field_validator('doctor_phone')
    @classmethod
    def validate_doctor_phone(cls, v):
        return validate_phone_number(v, 'Phone number')


class OnboardingRequestResponse(BaseModel):
    id: str
    doctor_name: str
    doctor_email: str
    doctor_phone: str
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    registration_number: Optional[str] = None
    clinic_name: str
    clinic_address: Optional[str] = None
    clinic_city: Optional[str] = None
    clinic_state: Optional[str] = None
    clinic_pincode: Optional[str] = None
    clinic_phone: Optional[str] = None
    clinic_email: Optional[str] = None
    clinic_specialty: Optional[str] = None
    expected_patient_volume: Optional[str] = None
    additional_notes: Optional[str] = None
    status: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    admin_notes: Optional[str] = None
    created_clinic_id: Optional[str] = None
    created_user_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OnboardingRequestListItem(BaseModel):
    id: str
    doctor_name: str
    doctor_email: str
    doctor_phone: str
    clinic_name: str
    clinic_specialty: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class OnboardingApproveRequest(BaseModel):
    admin_notes: Optional[str] = None
    clinic_specialty: Optional[str] = None

    @field_validator('clinic_specialty')
    @classmethod
    def validate_clinic_specialty(cls, v):
        if v is not None:
            valid = ['dental', 'dermatology', 'general_physician', 'pediatrics', 'orthopedics']
            if v not in valid:
                raise ValueError(f'Invalid specialty. Must be one of: {", ".join(valid)}')
        return v


class OnboardingRejectRequest(BaseModel):
    admin_notes: str


# Print Template Schemas
class PrintTemplateUpdate(BaseModel):
    print_mode: Optional[str] = None
    preset_id: Optional[str] = None
    content_top_px: Optional[int] = None
    content_left_px: Optional[int] = None
    content_right_px: Optional[int] = None
    template_config: Optional[dict] = None

    @field_validator('print_mode')
    @classmethod
    def validate_print_mode(cls, v):
        if v is not None and v not in ('letterhead', 'digital'):
            raise ValueError('print_mode must be "letterhead" or "digital"')
        return v

    @field_validator('preset_id')
    @classmethod
    def validate_preset_id(cls, v):
        if v is not None and v not in ('classic', 'modern', 'minimal', 'bold'):
            raise ValueError('preset_id must be one of: classic, modern, minimal, bold')
        return v

    @field_validator('content_top_px')
    @classmethod
    def validate_top(cls, v):
        if v is not None and not (0 <= v <= 400):
            raise ValueError('content_top_px must be between 0 and 400')
        return v

    @field_validator('content_left_px', 'content_right_px')
    @classmethod
    def validate_horizontal(cls, v):
        if v is not None and not (0 <= v <= 200):
            raise ValueError('Horizontal padding must be between 0 and 200')
        return v


class PrintTemplateResponse(BaseModel):
    id: str
    clinic_id: str
    print_mode: str
    preset_id: str
    content_top_px: int
    content_left_px: int
    content_right_px: int
    template_config: dict
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PrintModeSwitchRequest(BaseModel):
    print_mode: str

    @field_validator('print_mode')
    @classmethod
    def validate_print_mode(cls, v):
        if v not in ('letterhead', 'digital'):
            raise ValueError('print_mode must be "letterhead" or "digital"')
        return v


class ApplyPresetRequest(BaseModel):
    preset_id: str

    @field_validator('preset_id')
    @classmethod
    def validate_preset_id(cls, v):
        if v not in ('classic', 'modern', 'minimal', 'bold'):
            raise ValueError('preset_id must be one of: classic, modern, minimal, bold')
        return v


# ── Analytics Schemas ──

class MonthlyDataPoint(BaseModel):
    month: str
    count: int

class MonthlyAmountPoint(BaseModel):
    month: str
    amount: float

class ClinicAnalyticsSummary(BaseModel):
    clinic_id: str
    clinic_name: str
    clinic_code: Optional[str] = None
    specialty: Optional[str] = None
    created_at: Optional[datetime] = None
    total_patients: int
    total_visits: int
    total_prescriptions: int
    total_appointments: int
    active_doctors: int
    total_collections: float
    plugin_opd_queue: bool
    plugin_collections: bool

class DoctorActivity(BaseModel):
    name: Optional[str] = None
    last_login: Optional[datetime] = None
    visit_count: int

class ClinicDetailAnalytics(ClinicAnalyticsSummary):
    patients_by_month: List[MonthlyDataPoint]
    visits_by_month: List[MonthlyDataPoint]
    appointments_by_status: dict
    collections_by_month: List[MonthlyAmountPoint]
    doctors: List[DoctorActivity]

class PlatformAnalyticsOverview(BaseModel):
    total_clinics: int
    total_patients: int
    total_visits: int
    total_prescriptions: int
    total_collections: float
    total_active_doctors: int
    patients_by_month: List[MonthlyDataPoint]
    visits_by_month: List[MonthlyDataPoint]
    top_clinics: List[ClinicAnalyticsSummary]
    plugin_adoption: dict


# ── Audit Log Schemas ──

class AuditLogResponse(BaseModel):
    id: str
    clinic_id: Optional[str] = None
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    description: Optional[str] = None
    old_values: Optional[dict] = None
    new_values: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    logs: List[AuditLogResponse]
    pagination: dict


# ── DPDP Consent Schemas ──

class PatientConsentCreate(BaseModel):
    patient_id: str
    purpose: ConsentPurposeEnum
    consent_text: str
    consent_version: str = "1.0"


class PatientConsentResponse(BaseModel):
    id: str
    patient_id: str
    clinic_id: str
    purpose: str
    status: str
    consent_text: str
    consent_version: str
    given_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    collected_by: Optional[str] = None

    class Config:
        from_attributes = True


# ── DPDP Data Retention Schemas ──

class DataRetentionPolicyUpdate(BaseModel):
    patient_data_retention_months: Optional[int] = None
    audit_log_retention_months: Optional[int] = None
    inactive_patient_archive_months: Optional[int] = None

    @field_validator('patient_data_retention_months', 'audit_log_retention_months', 'inactive_patient_archive_months')
    @classmethod
    def validate_months(cls, v):
        if v is not None and v < 1:
            raise ValueError('Retention period must be at least 1 month')
        return v


class DataRetentionPolicyResponse(BaseModel):
    id: str
    clinic_id: str
    patient_data_retention_months: int
    audit_log_retention_months: int
    inactive_patient_archive_months: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── DPDP Erasure Schemas ──

class DataErasureRequestCreate(BaseModel):
    patient_id: str
    reason: Optional[str] = None


class DataErasureRequestResponse(BaseModel):
    id: str
    patient_id: Optional[str] = None
    clinic_id: str
    requested_by: Optional[str] = None
    reason: Optional[str] = None
    status: str
    approved_by: Optional[str] = None
    completed_at: Optional[datetime] = None
    anonymized_fields: Optional[List[str]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DataErasureRejectRequest(BaseModel):
    reason: str


# ── DPDP Breach Schemas ──

class DataBreachReportCreate(BaseModel):
    description: str
    severity: str = "LOW"
    affected_records_count: Optional[int] = None
    containment_actions: Optional[str] = None

    @field_validator('severity')
    @classmethod
    def validate_severity(cls, v):
        if v not in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'):
            raise ValueError('severity must be one of: LOW, MEDIUM, HIGH, CRITICAL')
        return v


class DataBreachReportResponse(BaseModel):
    id: str
    clinic_id: str
    reported_by: Optional[str] = None
    description: str
    severity: str
    affected_records_count: Optional[int] = None
    containment_actions: Optional[str] = None
    reported_to_authority: bool
    reported_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Fixture Template Schemas
VALID_SPECIALTIES = ['dental', 'dermatology', 'general_physician', 'pediatrics', 'orthopedics']
VALID_CATEGORIES = ['chief_complaints', 'diagnoses', 'observations', 'tests', 'medicines', 'symptoms', 'dosages', 'durations']


class FixtureTemplateCreate(BaseModel):
    specialty: str
    category: str
    name: str
    description: Optional[str] = None
    display_order: int = 0

    @field_validator('specialty')
    @classmethod
    def validate_specialty(cls, v):
        if v not in VALID_SPECIALTIES:
            raise ValueError(f'Invalid specialty. Must be one of: {", ".join(VALID_SPECIALTIES)}')
        return v

    @field_validator('category')
    @classmethod
    def validate_category(cls, v):
        if v not in VALID_CATEGORIES:
            raise ValueError(f'Invalid category. Must be one of: {", ".join(VALID_CATEGORIES)}')
        return v


class FixtureTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class FixtureTemplateResponse(BaseModel):
    id: str
    specialty: str
    category: str
    name: str
    description: Optional[str] = None
    display_order: int
    is_active: bool

    class Config:
        from_attributes = True


# ── Vaccination Schemas ──

class VaccinationScheduleEntry(BaseModel):
    id: str
    vaccine_name: str
    dose_number: int
    dose_label: Optional[str] = None
    age_days: int
    age_label: Optional[str] = None
    vaccine_group: Optional[str] = None
    route: Optional[str] = None
    site: Optional[str] = None
    is_mandatory: bool
    display_order: int
    is_active: bool

    class Config:
        from_attributes = True


class VaccinationScheduleCreate(BaseModel):
    vaccine_name: str
    dose_number: int
    dose_label: Optional[str] = None
    age_days: int
    age_label: Optional[str] = None
    vaccine_group: Optional[str] = "Custom"
    route: Optional[str] = None
    site: Optional[str] = None
    is_mandatory: bool = False


class VaccinationScheduleUpdate(BaseModel):
    vaccine_name: Optional[str] = None
    dose_label: Optional[str] = None
    age_days: Optional[int] = None
    age_label: Optional[str] = None
    vaccine_group: Optional[str] = None
    route: Optional[str] = None
    site: Optional[str] = None
    is_mandatory: Optional[bool] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class VaccinationRecordCreate(BaseModel):
    vaccine_name: str
    dose_number: int
    dose_label: Optional[str] = None
    date_administered: date
    schedule_entry_id: Optional[str] = None
    batch_number: Optional[str] = None
    injection_site: Optional[str] = None
    route: Optional[str] = None
    adverse_reaction: Optional[str] = None
    notes: Optional[str] = None


class VaccinationRecordUpdate(BaseModel):
    date_administered: Optional[date] = None
    batch_number: Optional[str] = None
    injection_site: Optional[str] = None
    route: Optional[str] = None
    adverse_reaction: Optional[str] = None
    notes: Optional[str] = None


class VaccinationRecordResponse(BaseModel):
    id: str
    patient_id: str
    vaccine_name: str
    dose_number: int
    dose_label: Optional[str] = None
    date_administered: date
    age_at_dose_days: Optional[int] = None
    batch_number: Optional[str] = None
    administered_by: Optional[str] = None
    injection_site: Optional[str] = None
    route: Optional[str] = None
    adverse_reaction: Optional[str] = None
    notes: Optional[str] = None
    visit_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VaccinationCardDose(BaseModel):
    schedule_entry_id: Optional[str] = None
    vaccine_name: str
    dose_number: int
    dose_label: Optional[str] = None
    age_days: int
    age_label: Optional[str] = None
    status: str  # "given", "due", "overdue", "upcoming"
    date_administered: Optional[date] = None
    record: Optional[VaccinationRecordResponse] = None


class VaccinationCardResponse(BaseModel):
    patient_id: str
    patient_name: str
    date_of_birth: Optional[date] = None
    age_days: Optional[int] = None
    doses: List[VaccinationCardDose]
    summary: dict
    warnings: List[str] = []


class VaccinationDashboardPatient(BaseModel):
    patient_id: str
    patient_name: str
    patient_code: str
    date_of_birth: date
    age_label: str
    due_vaccines: List[str]
    overdue_vaccines: List[str]


class VaccinationDashboardResponse(BaseModel):
    due_now: List[VaccinationDashboardPatient]
    overdue: List[VaccinationDashboardPatient]
    due_this_week: List[VaccinationDashboardPatient]
    stats: dict


class VaccinationScheduleItem(BaseModel):
    patient_id: str
    patient_name: str
    patient_code: Optional[str] = None
    date_of_birth: date
    age_label: str
    phone: Optional[str] = None
    guardian_name: Optional[str] = None
    vaccine_name: str
    dose_label: Optional[str] = None
    dose_number: int
    schedule_entry_id: Optional[str] = None
    age_days: int
    age_label_vaccine: Optional[str] = None
    route: Optional[str] = None
    site: Optional[str] = None
    due_date: date
    status: str
    days_overdue: Optional[int] = None


class VaccinationScheduleResponse(BaseModel):
    items: List[VaccinationScheduleItem]
    stats: dict
    total: int


# ── Notification Schemas ──

class NotificationConfigUpdate(BaseModel):
    msg91_auth_key: Optional[str] = None
    sender_id: Optional[str] = None
    reminder_days_before: int = 2
    send_overdue: bool = True
    send_follow_up: bool = True


class NotificationConfigResponse(BaseModel):
    msg91_auth_key_set: bool = False
    sender_id: Optional[str] = None
    reminder_days_before: int = 2
    send_overdue: bool = True
    send_follow_up: bool = True


class NotificationLogResponse(BaseModel):
    id: str
    clinic_id: str
    patient_id: Optional[str] = None
    phone: str
    channel: NotificationChannelEnum
    notification_type: NotificationTypeEnum
    status: NotificationStatusEnum
    message_body: str
    template_id: Optional[str] = None
    provider_message_id: Optional[str] = None
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    patient_name: Optional[str] = None

    class Config:
        from_attributes = True


class NotificationStatsResponse(BaseModel):
    total_sent: int = 0
    total_delivered: int = 0
    total_failed: int = 0
    by_type: dict = {}


class NotificationHistoryResponse(BaseModel):
    items: List[NotificationLogResponse]
    total: int
    page: int
    limit: int
