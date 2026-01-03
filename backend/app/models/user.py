from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base

class RoleEnum(str, enum.Enum):
    DOCTOR = "DOCTOR"
    ASSISTANT = "ASSISTANT"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String)
    is_active = Column(Boolean, default=True)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)

    # Relationships
    clinic = relationship("Clinic", back_populates="users")
    doctor = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    created_patients = relationship("Patient", back_populates="creator", foreign_keys="Patient.created_by")
    created_appointments = relationship("Appointment", back_populates="creator", foreign_keys="Appointment.created_by")
    created_invoices = relationship("Invoice", back_populates="creator", foreign_keys="Invoice.created_by")
