from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Visit(Base):
    __tablename__ = "visits"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(String, ForeignKey("appointments.id"), unique=True)
    visit_date = Column(Date, default=datetime.utcnow)
    visit_number = Column(Integer, nullable=False)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=False)
    symptoms = Column(String)
    diagnosis = Column(String)
    observations = Column(String)
    recommended_tests = Column(ARRAY(String), default=[])
    follow_up_date = Column(Date)
    vitals = Column(JSONB)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="visits")
    appointment = relationship("Appointment", back_populates="visit")
    doctor = relationship("Doctor", back_populates="visits")
    clinic = relationship("Clinic", back_populates="visits")
    prescriptions = relationship("Prescription", back_populates="visit", cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="visit", uselist=False)
