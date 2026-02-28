from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime, timezone

from app.core.deps import get_db, get_current_user
from app.models.models import (
    User, Clinic, Doctor, ClinicAdmin, UserPermission,
    RoleEnum, OnboardingRequest, OnboardingRequestStatusEnum
)
from app.schemas.schemas import (
    OnboardingRequestCreate, OnboardingRequestResponse,
    OnboardingRequestListItem, OnboardingApproveRequest,
    OnboardingRejectRequest
)
from app.core.security import get_password_hash
from app.services.clinic_fixtures import seed_fixtures_for_clinic
from app.utils.code_generators import generate_doctor_code
from app.api.admin import generate_clinic_code
from app.api.users import generate_random_password, create_default_permissions

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# ─── Public endpoint ───

@router.post("/request", status_code=status.HTTP_201_CREATED)
async def submit_onboarding_request(
    data: OnboardingRequestCreate,
    db: Session = Depends(get_db)
):
    """Public endpoint for doctors to submit an onboarding request."""

    # Check duplicate email in pending requests
    existing_request = db.query(OnboardingRequest).filter(
        OnboardingRequest.doctor_email == data.doctor_email,
        OnboardingRequest.status == OnboardingRequestStatusEnum.PENDING
    ).first()
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A request with this email is already pending review."
        )

    # Check if email already registered as a user
    existing_user = db.query(User).filter(User.email == data.doctor_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already registered in our system."
        )

    request = OnboardingRequest(**data.dict())
    db.add(request)
    db.commit()
    db.refresh(request)

    return {
        "message": "Your onboarding request has been submitted successfully. You will be contacted once it is reviewed.",
        "request_id": request.id
    }


# ─── Admin endpoints ───

@router.get("/requests", response_model=None)
async def list_onboarding_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all onboarding requests with filtering and pagination."""
    query = db.query(OnboardingRequest)

    if status_filter:
        try:
            status_enum = OnboardingRequestStatusEnum(status_filter)
            query = query.filter(OnboardingRequest.status == status_enum)
        except ValueError:
            pass

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                OnboardingRequest.doctor_name.ilike(search_term),
                OnboardingRequest.doctor_email.ilike(search_term),
                OnboardingRequest.clinic_name.ilike(search_term),
                OnboardingRequest.doctor_phone.ilike(search_term),
            )
        )

    total = query.count()
    skip = (page - 1) * limit
    requests = query.order_by(OnboardingRequest.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for r in requests:
        items.append({
            "id": r.id,
            "doctor_name": r.doctor_name,
            "doctor_email": r.doctor_email,
            "doctor_phone": r.doctor_phone,
            "clinic_name": r.clinic_name,
            "clinic_specialty": r.clinic_specialty.value if r.clinic_specialty else None,
            "status": r.status.value if r.status else None,
            "created_at": r.created_at,
        })

    return {
        "requests": items,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit if limit > 0 else 0
        }
    }


@router.get("/requests/{request_id}", response_model=OnboardingRequestResponse)
async def get_onboarding_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get full details of an onboarding request."""
    request = db.query(OnboardingRequest).filter(OnboardingRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Onboarding request not found")
    return request


@router.post("/requests/{request_id}/approve")
async def approve_onboarding_request(
    request_id: str,
    approve_data: OnboardingApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Approve an onboarding request — creates clinic + doctor account."""
    onboarding_req = db.query(OnboardingRequest).filter(
        OnboardingRequest.id == request_id
    ).first()
    if not onboarding_req:
        raise HTTPException(status_code=404, detail="Onboarding request not found")

    if onboarding_req.status != OnboardingRequestStatusEnum.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Request is already {onboarding_req.status.value.lower()}. Only pending requests can be approved."
        )

    # Check email is still available
    existing_user = db.query(User).filter(User.email == onboarding_req.doctor_email).first()
    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="This email has been registered since the request was submitted. Cannot approve."
        )

    try:
        # 1. Create Clinic
        address_parts = [p for p in [onboarding_req.clinic_address, onboarding_req.clinic_city, onboarding_req.clinic_state] if p]
        full_address = ", ".join(address_parts)
        if onboarding_req.clinic_pincode:
            full_address = f"{full_address} - {onboarding_req.clinic_pincode}" if full_address else ""
        clinic_code = generate_clinic_code(db)
        clinic = Clinic(
            name=onboarding_req.clinic_name,
            address=full_address or None,
            phone=onboarding_req.clinic_phone,
            email=onboarding_req.clinic_email,
            specialty=onboarding_req.clinic_specialty,
            clinic_code=clinic_code
        )
        db.add(clinic)
        db.flush()

        # 2. Seed fixtures (default to dental if specialty not yet specified)
        specialty = onboarding_req.clinic_specialty.value if onboarding_req.clinic_specialty else "dental"
        seed_fixtures_for_clinic(db, clinic.id, specialty=specialty)

        # 3. Create ClinicAdmin link
        clinic_admin = ClinicAdmin(admin_id=current_user.id, clinic_id=clinic.id)
        db.add(clinic_admin)

        # 4. Create User
        initial_password = generate_random_password()
        user = User(
            email=onboarding_req.doctor_email,
            password_hash=get_password_hash(initial_password),
            initial_password=initial_password,
            role=RoleEnum.DOCTOR,
            full_name=onboarding_req.doctor_name,
            phone=onboarding_req.doctor_phone,
            clinic_id=clinic.id
        )
        db.add(user)
        db.flush()

        # 5. Create Doctor
        doctor_code = generate_doctor_code(db)
        doctor = Doctor(
            user_id=user.id,
            clinic_id=clinic.id,
            doctor_code=doctor_code,
            specialization=onboarding_req.specialization or "",
            qualification=onboarding_req.qualification or "",
            registration_number=onboarding_req.registration_number or ""
        )
        db.add(doctor)
        db.flush()

        # 6. Set clinic owner
        clinic.owner_doctor_id = doctor.id

        # 7. Create permissions
        permissions = create_default_permissions(user.id, clinic.id, RoleEnum.DOCTOR)
        db.add(permissions)

        # 8. Update onboarding request
        onboarding_req.status = OnboardingRequestStatusEnum.APPROVED
        onboarding_req.reviewed_by = current_user.id
        onboarding_req.reviewed_at = datetime.now(timezone.utc)
        onboarding_req.admin_notes = approve_data.admin_notes
        onboarding_req.created_clinic_id = clinic.id
        onboarding_req.created_user_id = user.id

        db.commit()

        return {
            "message": "Request approved. Clinic and doctor account created successfully.",
            "clinic": {
                "id": clinic.id,
                "clinic_code": clinic.clinic_code,
                "name": clinic.name,
            },
            "doctor": {
                "id": doctor.id,
                "doctor_code": doctor.doctor_code,
                "email": user.email,
                "full_name": user.full_name,
                "initial_password": initial_password,
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/requests/{request_id}/reject")
async def reject_onboarding_request(
    request_id: str,
    reject_data: OnboardingRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Reject an onboarding request with a reason."""
    onboarding_req = db.query(OnboardingRequest).filter(
        OnboardingRequest.id == request_id
    ).first()
    if not onboarding_req:
        raise HTTPException(status_code=404, detail="Onboarding request not found")

    if onboarding_req.status != OnboardingRequestStatusEnum.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Request is already {onboarding_req.status.value.lower()}. Only pending requests can be rejected."
        )

    onboarding_req.status = OnboardingRequestStatusEnum.REJECTED
    onboarding_req.reviewed_by = current_user.id
    onboarding_req.reviewed_at = datetime.now(timezone.utc)
    onboarding_req.admin_notes = reject_data.admin_notes

    db.commit()

    return {"message": "Request rejected."}
