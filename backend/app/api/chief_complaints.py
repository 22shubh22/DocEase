from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, ChiefComplaint, RoleEnum
from app.schemas.schemas import ChiefComplaintCreate, ChiefComplaintUpdate, ChiefComplaintResponse

router = APIRouter()


@router.get("/", response_model=List[ChiefComplaintResponse])
async def get_chief_complaints(
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all chief complaints for the clinic"""
    query = db.query(ChiefComplaint).filter(
        ChiefComplaint.clinic_id == current_user.clinic_id
    )
    
    if active_only:
        query = query.filter(ChiefComplaint.is_active == True)
    
    complaints = query.order_by(ChiefComplaint.display_order.asc()).all()
    return complaints


@router.post("/", response_model=ChiefComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_chief_complaint(
    complaint_data: ChiefComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chief complaint (Doctor only)"""
    if current_user.role != RoleEnum.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can manage chief complaints")
    
    complaint = ChiefComplaint(
        name=complaint_data.name,
        description=complaint_data.description,
        is_active=complaint_data.is_active,
        display_order=complaint_data.display_order,
        clinic_id=current_user.clinic_id
    )
    
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.put("/{complaint_id}", response_model=ChiefComplaintResponse)
async def update_chief_complaint(
    complaint_id: str,
    complaint_data: ChiefComplaintUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a chief complaint (Doctor only)"""
    if current_user.role != RoleEnum.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can manage chief complaints")
    
    complaint = db.query(ChiefComplaint).filter(
        ChiefComplaint.id == complaint_id,
        ChiefComplaint.clinic_id == current_user.clinic_id
    ).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Chief complaint not found")
    
    if complaint_data.name is not None:
        complaint.name = complaint_data.name
    if complaint_data.description is not None:
        complaint.description = complaint_data.description
    if complaint_data.is_active is not None:
        complaint.is_active = complaint_data.is_active
    if complaint_data.display_order is not None:
        complaint.display_order = complaint_data.display_order
    
    db.commit()
    db.refresh(complaint)
    return complaint


@router.delete("/{complaint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chief_complaint(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chief complaint (Doctor only)"""
    if current_user.role != RoleEnum.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can manage chief complaints")
    
    complaint = db.query(ChiefComplaint).filter(
        ChiefComplaint.id == complaint_id,
        ChiefComplaint.clinic_id == current_user.clinic_id
    ).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Chief complaint not found")
    
    db.delete(complaint)
    db.commit()
    return None
