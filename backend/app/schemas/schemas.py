from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from app.models.models import RoleEnum, GenderEnum, AppointmentStatusEnum, PaymentStatusEnum, PaymentModeEnum


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: RoleEnum


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    is_active: bool
    clinic_id: Optional[str] = None
    created_at: datetime
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


# Clinic Schemas
class ClinicBase(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    opd_start_time: Optional[str] = None
    opd_end_time: Optional[str] = None


class ClinicUpdate(ClinicBase):
    pass


class ClinicResponse(ClinicBase):
    id: str
    clinic_code: Optional[str] = None
    logo_url: Optional[str] = None
    owner_doctor_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Doctor Schemas
class DoctorBase(BaseModel):
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    registration_number: Optional[str] = None


class DoctorUpdate(DoctorBase):
    pass


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
    gender: Optional[GenderEnum] = None
    phone: str
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[List[str]] = []
    medical_history: Optional[dict] = None


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


# Invoice Schemas
class InvoiceItemBase(BaseModel):
    description: str
    amount: Decimal
    quantity: int = 1


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemResponse(InvoiceItemBase):
    id: str

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    patient_id: str
    visit_id: Optional[str] = None
    payment_status: PaymentStatusEnum = PaymentStatusEnum.UNPAID
    payment_mode: Optional[PaymentModeEnum] = None
    payment_date: Optional[date] = None
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate]


class InvoiceUpdate(BaseModel):
    paid_amount: Optional[Decimal] = None
    payment_status: Optional[PaymentStatusEnum] = None
    payment_mode: Optional[PaymentModeEnum] = None
    payment_date: Optional[date] = None


class InvoiceResponse(InvoiceBase):
    id: str
    invoice_number: str
    total_amount: Decimal
    paid_amount: Decimal
    items: List[InvoiceItemResponse]
    created_at: datetime

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


class MedicineOptionCreate(MedicineOptionBase):
    pass


class MedicineOptionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


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
    # Billing Management
    can_view_invoices: bool = True
    can_create_invoices: bool = True
    can_edit_invoices: bool = True
    can_view_collections: bool = True
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
