from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.models import User, RoleEnum, Doctor, Clinic, UserPermission

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user

def get_current_doctor(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != RoleEnum.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access this resource"
        )
    return current_user

def require_role(required_role: str):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker


def require_clinic_owner(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Require the current user to be the clinic owner"""
    if current_user.role != RoleEnum.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the clinic owner can access this resource"
        )

    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()

    if not doctor or not clinic or clinic.owner_doctor_id != doctor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the clinic owner can access this resource"
        )

    return current_user


# Default permissions for each role
DEFAULT_ASSISTANT_PERMISSIONS = [
    'can_view_patients', 'can_create_patients', 'can_edit_patients',
    'can_view_opd', 'can_manage_opd', 'can_view_visits',
    'can_view_invoices', 'can_create_invoices', 'can_edit_invoices',
    'can_view_collections'
]

DEFAULT_DOCTOR_PERMISSIONS = [
    'can_view_patients', 'can_create_patients', 'can_edit_patients', 'can_delete_patients',
    'can_view_opd', 'can_manage_opd',
    'can_view_visits', 'can_create_visits', 'can_edit_visits',
    'can_view_invoices', 'can_create_invoices', 'can_edit_invoices', 'can_view_collections',
    'can_manage_clinic_options', 'can_edit_print_settings'
]


def require_permission(permission_name: str):
    """Factory function to create permission checkers"""
    def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        # Clinic owner has all permissions
        if current_user.role == RoleEnum.DOCTOR:
            doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
            clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()
            if doctor and clinic and clinic.owner_doctor_id == doctor.id:
                return current_user  # Owner has all permissions

        # Check user permissions from database
        permission = db.query(UserPermission).filter(
            UserPermission.user_id == current_user.id,
            UserPermission.clinic_id == current_user.clinic_id
        ).first()

        if permission:
            # Explicit permissions set - check specific permission
            if not getattr(permission, permission_name, False):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to perform this action"
                )
            return current_user

        # No explicit permissions set - use role defaults
        if current_user.role == RoleEnum.DOCTOR:
            if permission_name in DEFAULT_DOCTOR_PERMISSIONS:
                return current_user
        elif current_user.role == RoleEnum.ASSISTANT:
            if permission_name in DEFAULT_ASSISTANT_PERMISSIONS:
                return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to perform this action"
        )

    return permission_checker
