from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
import secrets
import string
import logging
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.deps import get_current_doctor, require_clinic_owner
from app.core.security import get_password_hash
from app.models.models import User, Doctor, Clinic, RoleEnum, UserPermission
from app.schemas.schemas import UserCreate, UserUpdate, UserResponse, SubUserCreate, SubUserResponse, SubUserStats
from app.utils.code_generators import generate_doctor_code

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_SUB_USERS = 5


def generate_random_password(length: int = 12) -> str:
    """Generate a random password with letters, digits, and special characters"""
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def create_default_permissions(user_id: str, clinic_id: str, role: RoleEnum) -> UserPermission:
    """Create UserPermission record with role-based defaults"""
    # Default permissions based on role
    if role == RoleEnum.DOCTOR:
        return UserPermission(
            user_id=user_id,
            clinic_id=clinic_id,
            # Patient Management
            can_view_patients=True,
            can_create_patients=True,
            can_edit_patients=True,
            can_delete_patients=True,
            # OPD Management
            can_view_opd=True,
            can_manage_opd=True,
            # Visit/Prescription Management
            can_view_visits=True,
            can_create_visits=True,
            can_edit_visits=True,
            # Billing Management
            can_view_invoices=True,
            can_create_invoices=True,
            can_edit_invoices=True,
            can_view_collections=True,
            # Settings Management
            can_manage_clinic_options=True,
            can_edit_print_settings=True
        )
    elif role == RoleEnum.ASSISTANT:
        return UserPermission(
            user_id=user_id,
            clinic_id=clinic_id,
            # Patient Management
            can_view_patients=True,
            can_create_patients=True,
            can_edit_patients=True,
            can_delete_patients=False,
            # OPD Management
            can_view_opd=True,
            can_manage_opd=True,
            # Visit/Prescription Management
            can_view_visits=True,
            can_create_visits=False,
            can_edit_visits=False,
            # Billing Management
            can_view_invoices=True,
            can_create_invoices=True,
            can_edit_invoices=True,
            can_view_collections=True,
            # Settings Management
            can_manage_clinic_options=False,
            can_edit_print_settings=False
        )
    else:
        # Default minimal permissions for any other role
        return UserPermission(
            user_id=user_id,
            clinic_id=clinic_id,
            can_view_patients=False,
            can_create_patients=False,
            can_edit_patients=False,
            can_delete_patients=False,
            can_view_opd=False,
            can_manage_opd=False,
            can_view_visits=False,
            can_create_visits=False,
            can_edit_visits=False,
            can_view_invoices=False,
            can_create_invoices=False,
            can_edit_invoices=False,
            can_view_collections=False,
            can_manage_clinic_options=False,
            can_edit_print_settings=False
        )


@router.get("/", response_model=dict)
async def get_all_users(
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Get all users (doctor only)"""
    users = db.query(User).filter(User.clinic_id == current_user.clinic_id).all()

    user_list = [
        {
            "id": user.id,
            "email": user.email,
            "role": user.role.value,
            "full_name": user.full_name,
            "phone": user.phone,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "last_login": user.last_login
        }
        for user in users
    ]

    return {"users": user_list}


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Create a new user (doctor only)"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    try:
        # Create new user
        new_user = User(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            role=user_data.role,
            full_name=user_data.full_name,
            phone=user_data.phone,
            clinic_id=current_user.clinic_id
        )

        db.add(new_user)
        db.flush()  # Get user ID before adding related records

        # Create default permissions for the new user
        user_permissions = create_default_permissions(
            user_id=new_user.id,
            clinic_id=current_user.clinic_id,
            role=user_data.role
        )
        db.add(user_permissions)

        db.commit()
        db.refresh(new_user)

        logger.info(f"Successfully created user {new_user.email} with role {user_data.role}")

        return {
            "message": "User created successfully",
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "role": new_user.role.value,
                "full_name": new_user.full_name,
                "phone": new_user.phone,
                "is_active": new_user.is_active
            }
        }

    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create user due to database constraint violation. Please check if the email or other unique fields are already in use."
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the user. Please try again."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again."
        )


@router.put("/{user_id}", response_model=dict)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Update user (doctor only)"""
    user = db.query(User).filter(
        User.id == user_id,
        User.clinic_id == current_user.clinic_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return {
        "message": "User updated successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role.value,
            "full_name": user.full_name,
            "phone": user.phone,
            "is_active": user.is_active
        }
    }


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Delete user (doctor only)"""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    user = db.query(User).filter(
        User.id == user_id,
        User.clinic_id == current_user.clinic_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}


@router.get("/stats", response_model=SubUserStats)
async def get_sub_user_stats(
    current_user: User = Depends(require_clinic_owner),
    db: Session = Depends(get_db)
):
    """Get sub-user count statistics (owner only)"""
    # Count all users in the clinic
    total_users = db.query(User).filter(
        User.clinic_id == current_user.clinic_id
    ).count()

    # Sub-users = total users minus the owner
    sub_user_count = total_users - 1

    return SubUserStats(
        current_count=sub_user_count,
        max_allowed=MAX_SUB_USERS,
        can_create=sub_user_count < MAX_SUB_USERS
    )


@router.post("/sub-user", response_model=SubUserResponse, status_code=status.HTTP_201_CREATED)
async def create_sub_user(
    user_data: SubUserCreate,
    current_user: User = Depends(require_clinic_owner),
    db: Session = Depends(get_db)
):
    """Create a sub-user with role-based permissions (owner only)"""
    # Check 5 sub-user limit
    total_users = db.query(User).filter(
        User.clinic_id == current_user.clinic_id
    ).count()
    sub_user_count = total_users - 1

    if sub_user_count >= MAX_SUB_USERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_SUB_USERS} sub-users allowed"
        )

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    try:
        # Generate random initial password
        initial_password = generate_random_password()

        # Create user
        new_user = User(
            email=user_data.email,
            password_hash=get_password_hash(initial_password),
            initial_password=initial_password,
            role=user_data.role,
            full_name=user_data.full_name,
            phone=user_data.phone,
            clinic_id=current_user.clinic_id,
            created_at=datetime.now(timezone.utc)
        )

        db.add(new_user)
        db.flush()  # Get user ID before adding related records

        # If DOCTOR role, create Doctor profile
        if user_data.role == RoleEnum.DOCTOR:
            doctor_code = generate_doctor_code(db)
            doctor = Doctor(
                user_id=new_user.id,
                clinic_id=current_user.clinic_id,
                doctor_code=doctor_code,
                specialization=user_data.specialization,
                qualification=user_data.qualification,
                registration_number=user_data.registration_number
            )
            db.add(doctor)

        # Create default permissions for the new user
        user_permissions = create_default_permissions(
            user_id=new_user.id,
            clinic_id=current_user.clinic_id,
            role=user_data.role
        )
        db.add(user_permissions)

        db.commit()
        db.refresh(new_user)

        logger.info(f"Successfully created sub-user {new_user.email} with role {user_data.role}")

        return SubUserResponse(
            id=new_user.id,
            email=new_user.email,
            full_name=new_user.full_name,
            role=new_user.role,
            phone=new_user.phone,
            is_active=new_user.is_active,
            initial_password=initial_password,
            created_at=new_user.created_at
        )

    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error creating sub-user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create user due to database constraint violation. Please check if the email or other unique fields are already in use."
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating sub-user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the user. Please try again."
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating sub-user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again."
        )
