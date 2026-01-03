from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ClinicAdmin(Base):
    __tablename__ = "clinic_admins"

    id = Column(String, primary_key=True)
    admin_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    clinic_id = Column(String, ForeignKey("clinics.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    admin = relationship("User", back_populates="managed_clinics")
    clinic = relationship("Clinic", back_populates="admins")
