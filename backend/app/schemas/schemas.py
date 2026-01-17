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
    pass


class PatientUpdate(PatientBase):
    full_name: Optional[str] = None
    phone: Optional[str] = None


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


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    status: AppointmentStatusEnum


class AppointmentResponse(AppointmentBase):
    id: str
    appointment_date: date
    queue_number: Optional[int] = None
    status: AppointmentStatusEnum
    created_at: datetime

    class Config:
        from_attributes = True


# Visit Schemas
class VisitBase(BaseModel):
    patient_id: str
    doctor_id: str
    appointment_id: Optional[str] = None
    symptoms: Optional[str] = None
    diagnosis: Optional[str] = None
    observations: Optional[str] = None
    recommended_tests: Optional[List[str]] = []
    follow_up_date: Optional[date] = None
    vitals: Optional[dict] = None


class VisitCreate(VisitBase):
    pass


class VisitUpdate(BaseModel):
    symptoms: Optional[str] = None
    diagnosis: Optional[str] = None
    observations: Optional[str] = None
    recommended_tests: Optional[List[str]] = None
    follow_up_date: Optional[date] = None
    vitals: Optional[dict] = None


class VisitResponse(VisitBase):
    id: str
    visit_date: date
    visit_number: int
    clinic_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Prescription Schemas
class PrescriptionMedicineBase(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None
    quantity: Optional[int] = None


class PrescriptionMedicineCreate(PrescriptionMedicineBase):
    pass


class PrescriptionMedicineResponse(PrescriptionMedicineBase):
    id: str

    class Config:
        from_attributes = True


class PrescriptionBase(BaseModel):
    visit_id: str
    patient_id: str
    doctor_id: str
    notes: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    medicines: List[PrescriptionMedicineCreate]


class PrescriptionResponse(PrescriptionBase):
    id: str
    prescription_date: date
    pdf_url: Optional[str] = None
    medicines: List[PrescriptionMedicineResponse]
    created_at: datetime

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
