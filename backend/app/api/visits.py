from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import date, datetime
from typing import Optional
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Visit, Appointment, AppointmentStatusEnum, Doctor, Patient, VisitMedicine, User as UserModel
from app.schemas.schemas import VisitCreate, VisitUpdate

router = APIRouter()


@router.get("/", response_model=dict)
async def get_doctor_visits(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    start_date: Optional[date] = Query(None, description="Filter visits from this date"),
    end_date: Optional[date] = Query(None, description="Filter visits until this date"),
    patient_search: Optional[str] = Query(None, description="Search by patient name or code"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all visits for the current doctor with pagination and filters.
    """
    # Get the doctor record for the current user
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=400, detail="No doctor profile found for current user")

    # Base query with join to Patient for search and display
    query = db.query(Visit).join(Patient, Visit.patient_id == Patient.id).filter(
        Visit.doctor_id == doctor.id,
        Visit.clinic_id == current_user.clinic_id
    )

    # Apply date range filters
    if start_date:
        query = query.filter(Visit.visit_date >= start_date)
    if end_date:
        query = query.filter(Visit.visit_date <= end_date)

    # Apply patient name/code search
    if patient_search:
        search_term = f"%{patient_search}%"
        query = query.filter(
            or_(
                Patient.full_name.ilike(search_term),
                Patient.patient_code.ilike(search_term)
            )
        )

    # Get total count for pagination
    total = query.count()

    # Apply pagination and ordering (most recent first)
    skip = (page - 1) * limit
    visits = query.order_by(Visit.visit_date.desc(), Visit.created_at.desc()).offset(skip).limit(limit).all()

    # Format response with patient info
    visit_list = []
    for visit in visits:
        patient = db.query(Patient).filter(Patient.id == visit.patient_id).first()
        visit_list.append({
            "id": visit.id,
            "visit_date": visit.visit_date.isoformat() if visit.visit_date else None,
            "visit_number": visit.visit_number,
            "patient_id": visit.patient_id,
            "patient_code": patient.patient_code if patient else None,
            "patient_name": patient.full_name if patient else None,
            "symptoms": visit.symptoms,
            "diagnosis": visit.diagnosis,
            "follow_up_date": visit.follow_up_date.isoformat() if visit.follow_up_date else None,
            "created_at": visit.created_at.isoformat() if visit.created_at else None,
        })

    return {
        "visits": visit_list,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit if total > 0 else 1
        }
    }


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_visit(
    visit_data: VisitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new visit or update existing one if appointment already has a visit"""
    # Get the doctor record for the current user
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=400, detail="No doctor profile found for current user")

    # Check if a visit already exists for this appointment (handles OPD reopen case)
    existing_visit = None
    if visit_data.appointment_id:
        existing_visit = db.query(Visit).filter(
            Visit.appointment_id == visit_data.appointment_id
        ).first()

    if existing_visit:
        # Update existing visit instead of creating a new one
        update_fields = ['symptoms', 'diagnosis', 'observations', 'recommended_tests', 'follow_up_date', 'vitals', 'prescription_notes']
        for field in update_fields:
            value = getattr(visit_data, field, None)
            if value is not None:
                setattr(existing_visit, field, value)

        # Handle medicines update - delete existing and add new
        if visit_data.medicines is not None:
            # Delete existing medicines
            db.query(VisitMedicine).filter(VisitMedicine.visit_id == existing_visit.id).delete()
            # Add new medicines
            for med_data in visit_data.medicines:
                medicine = VisitMedicine(
                    visit_id=existing_visit.id,
                    medicine_name=med_data.medicine_name,
                    dosage=med_data.dosage,
                    duration=med_data.duration
                )
                db.add(medicine)

        # Update appointment status to COMPLETED
        appointment = db.query(Appointment).filter(
            Appointment.id == visit_data.appointment_id
        ).first()
        if appointment:
            appointment.status = AppointmentStatusEnum.COMPLETED

        db.commit()
        db.refresh(existing_visit)
        return {"message": "Visit updated successfully", "visit_id": existing_visit.id}

    # Create new visit
    # Get visit number for this patient
    last_visit = db.query(Visit).filter(
        Visit.patient_id == visit_data.patient_id
    ).order_by(Visit.visit_number.desc()).first()

    visit_number = (last_visit.visit_number + 1) if last_visit else 1

    # Exclude medicines from visit_dict as they need separate handling
    visit_dict = visit_data.model_dump(exclude={'appointment_id', 'doctor_id', 'medicines'})
    visit = Visit(
        **visit_dict,
        doctor_id=visit_data.doctor_id or doctor.id,
        appointment_id=visit_data.appointment_id,
        visit_number=visit_number,
        visit_date=datetime.now(),
        clinic_id=current_user.clinic_id
    )

    db.add(visit)
    db.flush()  # Get the visit ID before adding medicines

    # Add medicines if provided
    if visit_data.medicines:
        for med_data in visit_data.medicines:
            medicine = VisitMedicine(
                visit_id=visit.id,
                medicine_name=med_data.medicine_name,
                dosage=med_data.dosage,
                duration=med_data.duration
            )
            db.add(medicine)

    # Update appointment status if exists
    if visit_data.appointment_id:
        appointment = db.query(Appointment).filter(
            Appointment.id == visit_data.appointment_id
        ).first()
        if appointment:
            appointment.status = AppointmentStatusEnum.COMPLETED

    db.commit()
    db.refresh(visit)

    return {"message": "Visit created successfully", "visit_id": visit.id}


@router.get("/{visit_id}", response_model=dict)
async def get_visit_by_id(
    visit_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get visit by ID with patient and medicines details"""
    visit = db.query(Visit).filter(
        Visit.id == visit_id,
        Visit.clinic_id == current_user.clinic_id
    ).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    # Get patient info
    patient = db.query(Patient).filter(Patient.id == visit.patient_id).first()

    # Get doctor info
    doctor = db.query(Doctor).filter(Doctor.id == visit.doctor_id).first()
    doctor_user = db.query(User).filter(User.id == doctor.user_id).first() if doctor else None

    # Get medicines for this visit
    medicines = db.query(VisitMedicine).filter(VisitMedicine.visit_id == visit_id).all()
    medicines_data = [
        {
            "id": med.id,
            "medicine_name": med.medicine_name,
            "dosage": med.dosage,
            "duration": med.duration
        }
        for med in medicines
    ]

    return {
        "visit": {
            "id": visit.id,
            "visit_date": visit.visit_date.isoformat() if visit.visit_date else None,
            "visit_number": visit.visit_number,
            "symptoms": visit.symptoms,
            "diagnosis": visit.diagnosis,
            "observations": visit.observations,
            "recommended_tests": visit.recommended_tests or [],
            "follow_up_date": visit.follow_up_date.isoformat() if visit.follow_up_date else None,
            "vitals": visit.vitals,
            "prescription_notes": visit.prescription_notes,
            "created_at": visit.created_at.isoformat() if visit.created_at else None,
            "patient": {
                "id": patient.id,
                "full_name": patient.full_name,
                "patient_code": patient.patient_code,
                "age": patient.age,
                "gender": patient.gender.value if patient.gender else None,
                "blood_group": patient.blood_group,
                "allergies": patient.allergies or [],
                "phone": patient.phone
            } if patient else None,
            "doctor": {
                "id": doctor.id,
                "name": doctor_user.full_name if doctor_user else None,
                "doctor_code": doctor.doctor_code,
                "specialization": doctor.specialization,
                "registration_number": doctor.registration_number
            } if doctor else None,
            "medicines": medicines_data
        }
    }


@router.put("/{visit_id}", response_model=dict)
async def update_visit(
    visit_id: str,
    visit_data: VisitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update visit information"""
    visit = db.query(Visit).filter(
        Visit.id == visit_id,
        Visit.clinic_id == current_user.clinic_id
    ).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    update_data = visit_data.model_dump(exclude_unset=True)

    # Handle medicines separately
    medicines_data = update_data.pop('medicines', None)

    for field, value in update_data.items():
        setattr(visit, field, value)

    # Handle medicines update if provided
    if medicines_data is not None:
        # Delete existing medicines
        db.query(VisitMedicine).filter(VisitMedicine.visit_id == visit_id).delete()
        # Add new medicines
        for med_data in medicines_data:
            medicine = VisitMedicine(
                visit_id=visit_id,
                medicine_name=med_data.get('medicine_name') or med_data.medicine_name,
                dosage=med_data.get('dosage') if isinstance(med_data, dict) else med_data.dosage,
                duration=med_data.get('duration') if isinstance(med_data, dict) else med_data.duration
            )
            db.add(medicine)

    db.commit()
    db.refresh(visit)

    # Get updated medicines
    medicines = db.query(VisitMedicine).filter(VisitMedicine.visit_id == visit_id).all()

    return {
        "message": "Visit updated successfully",
        "visit": {
            "id": visit.id,
            "visit_date": visit.visit_date.isoformat() if visit.visit_date else None,
            "visit_number": visit.visit_number,
            "symptoms": visit.symptoms,
            "diagnosis": visit.diagnosis,
            "observations": visit.observations,
            "recommended_tests": visit.recommended_tests or [],
            "follow_up_date": visit.follow_up_date.isoformat() if visit.follow_up_date else None,
            "vitals": visit.vitals,
            "prescription_notes": visit.prescription_notes,
            "medicines": [
                {
                    "id": med.id,
                    "medicine_name": med.medicine_name,
                    "dosage": med.dosage,
                    "duration": med.duration
                }
                for med in medicines
            ]
        }
    }
