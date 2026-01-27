from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import require_clinic_owner, DEFAULT_ASSISTANT_PERMISSIONS, DEFAULT_DOCTOR_PERMISSIONS
from app.models.models import User, UserPermission, Doctor, Clinic, RoleEnum
from app.schemas.schemas import UserPermissionUpdate, UserPermissionResponse, UserWithPermissions

router = APIRouter()


def get_default_permissions_for_role(role: RoleEnum) -> dict:
    """Get default permission values based on role"""
    all_permissions = [
        'can_view_patients', 'can_create_patients', 'can_edit_patients', 'can_delete_patients',
        'can_view_opd', 'can_manage_opd',
        'can_view_visits', 'can_create_visits', 'can_edit_visits',
        'can_view_invoices', 'can_create_invoices', 'can_edit_invoices', 'can_view_collections',
        'can_manage_clinic_options'
    ]

    if role == RoleEnum.DOCTOR:
        return {perm: perm in DEFAULT_DOCTOR_PERMISSIONS for perm in all_permissions}
    else:  # ASSISTANT
        return {perm: perm in DEFAULT_ASSISTANT_PERMISSIONS for perm in all_permissions}


@router.get("/clinic-users", response_model=List[UserWithPermissions])
async def get_clinic_users_with_permissions(
    current_user: User = Depends(require_clinic_owner),
    db: Session = Depends(get_db)
):
    """Get all clinic users with their permissions (owner only)"""
    users = db.query(User).filter(
        User.clinic_id == current_user.clinic_id,
        User.role.in_([RoleEnum.DOCTOR, RoleEnum.ASSISTANT])
    ).all()

    # Get clinic to check owner
    clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()

    result = []
    for user in users:
        # Check if this user is the owner
        is_owner = False
        if user.role == RoleEnum.DOCTOR:
            doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
            if doctor and clinic and clinic.owner_doctor_id == doctor.id:
                is_owner = True

        # Get user's permissions
        permission = db.query(UserPermission).filter(
            UserPermission.user_id == user.id
        ).first()

        user_data = {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "is_owner": is_owner,
            "permissions": permission
        }
        result.append(UserWithPermissions(**user_data))

    return result


@router.get("/{user_id}", response_model=UserPermissionResponse)
async def get_user_permissions(
    user_id: str,
    current_user: User = Depends(require_clinic_owner),
    db: Session = Depends(get_db)
):
    """Get permissions for a specific user (owner only)"""
    # Verify user belongs to the same clinic
    user = db.query(User).filter(
        User.id == user_id,
        User.clinic_id == current_user.clinic_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    permission = db.query(UserPermission).filter(
        UserPermission.user_id == user_id
    ).first()

    if not permission:
        # Return default permissions based on role
        defaults = get_default_permissions_for_role(user.role)
        return UserPermissionResponse(
            id="",
            user_id=user_id,
            clinic_id=current_user.clinic_id,
            **defaults
        )

    return permission


@router.put("/{user_id}", response_model=UserPermissionResponse)
async def update_user_permissions(
    user_id: str,
    permission_data: UserPermissionUpdate,
    current_user: User = Depends(require_clinic_owner),
    db: Session = Depends(get_db)
):
    """Update permissions for a specific user (owner only)"""
    # Verify user belongs to the same clinic
    user = db.query(User).filter(
        User.id == user_id,
        User.clinic_id == current_user.clinic_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Cannot modify owner's permissions
    if user.role == RoleEnum.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()
        if doctor and clinic and clinic.owner_doctor_id == doctor.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify owner's permissions"
            )

    # Get or create permission record
    permission = db.query(UserPermission).filter(
        UserPermission.user_id == user_id
    ).first()

    if not permission:
        permission = UserPermission(
            user_id=user_id,
            clinic_id=current_user.clinic_id
        )
        db.add(permission)

    # Update permissions
    update_data = permission_data.model_dump()
    for field, value in update_data.items():
        setattr(permission, field, value)

    db.commit()
    db.refresh(permission)

    return permission


@router.post("/{user_id}/reset", response_model=UserPermissionResponse)
async def reset_user_permissions(
    user_id: str,
    current_user: User = Depends(require_clinic_owner),
    db: Session = Depends(get_db)
):
    """Reset user permissions to role defaults (owner only)"""
    # Verify user belongs to the same clinic
    user = db.query(User).filter(
        User.id == user_id,
        User.clinic_id == current_user.clinic_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Cannot modify owner's permissions
    if user.role == RoleEnum.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()
        if doctor and clinic and clinic.owner_doctor_id == doctor.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify owner's permissions"
            )

    # Get or create permission record
    permission = db.query(UserPermission).filter(
        UserPermission.user_id == user_id
    ).first()

    defaults = get_default_permissions_for_role(user.role)

    if not permission:
        permission = UserPermission(
            user_id=user_id,
            clinic_id=current_user.clinic_id,
            **defaults
        )
        db.add(permission)
    else:
        for field, value in defaults.items():
            setattr(permission, field, value)

    db.commit()
    db.refresh(permission)

    return permission
