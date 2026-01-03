from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Clinic(Base):
    __tablename__ = "clinics"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    address = Column(String)
    phone = Column(String)
    email = Column(String)
    logo_url = Column(String)
    opd_start_time = Column(String)
    opd_end_time = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="clinic", cascade="all, delete-orphan")
    doctors = relationship("Doctor", back_populates="clinic", cascade="all, delete-orphan")
    patients = relationship("Patient", back_populates="clinic", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="clinic", cascade="all, delete-orphan")
    visits = relationship("Visit", back_populates="clinic", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="clinic", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="clinic", cascade="all, delete-orphan")
    admins = relationship("ClinicAdmin", back_populates="clinic", cascade="all, delete-orphan")
