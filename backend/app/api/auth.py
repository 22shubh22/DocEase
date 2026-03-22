import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db, SessionLocal
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user, get_client_ip
from app.models.models import User, UserPermission, PrintTemplate, Clinic, AuditActionEnum, RoleEnum
from app.schemas.schemas import LoginRequest, Token, ChangePasswordRequest, UserResponse, GuestCleanupRequest, GuestSessionRequest, GoogleAuthRequest
from app.services.guest_service import create_guest_session, cleanup_guest_session
from app.services.audit_service import create_audit_log

logger = logging.getLogger(__name__)

router = APIRouter()


def _cleanup_guest_background(user_id: str):
    """Run guest cleanup in background with its own DB session."""
    db = SessionLocal()
    try:
        cleanup_guest_session(db, user_id)
        logger.info(f"Cleaned up guest session for user {user_id}")
    except Exception as e:
        logger.error(f"Failed to cleanup guest session: {e}")
    finally:
        db.close()


@router.post("/login", response_model=dict)
async def login(
    login_data: LoginRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Authenticate user and return access token"""
    user = db.query(User).filter(User.email == login_data.email).first()
    client_ip = get_client_ip(request)

    if not user or not user.password_hash or not verify_password(login_data.password, user.password_hash):
        background_tasks.add_task(
            create_audit_log,
            action=AuditActionEnum.LOGIN_FAILED,
            resource_type="auth",
            user_email=login_data.email,
            description=f"Failed login attempt for {login_data.email}",
            ip_address=client_ip,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending approval. You'll be notified once approved.",
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    # Create access token
    access_token = create_access_token(data={"sub": user.id, "role": user.role.value})

    # Fetch user permissions
    permissions_dict = None
    permission = db.query(UserPermission).filter(
        UserPermission.user_id == user.id
    ).first()
    if permission:
        permissions_dict = {
            "can_view_patients": permission.can_view_patients,
            "can_create_patients": permission.can_create_patients,
            "can_edit_patients": permission.can_edit_patients,
            "can_delete_patients": permission.can_delete_patients,
            "can_view_opd": permission.can_view_opd,
            "can_manage_opd": permission.can_manage_opd,
            "can_view_visits": permission.can_view_visits,
            "can_create_visits": permission.can_create_visits,
            "can_edit_visits": permission.can_edit_visits,
            "can_manage_clinic_options": permission.can_manage_clinic_options,
            "can_edit_print_settings": permission.can_edit_print_settings,
        }

    # Fetch clinic print template and plugin settings
    print_template_dict = None
    enabled_plugins = None
    if user.clinic_id:
        pt = db.query(PrintTemplate).filter(
            PrintTemplate.clinic_id == user.clinic_id
        ).first()
        if pt:
            print_template_dict = {
                "id": pt.id,
                "print_mode": pt.print_mode,
                "preset_id": pt.preset_id,
                "content_top_px": pt.content_top_px,
                "content_left_px": pt.content_left_px,
                "content_right_px": pt.content_right_px,
                "template_config": pt.template_config,
            }

        clinic = db.query(Clinic).filter(Clinic.id == user.clinic_id).first()
        if clinic:
            from app.models.models import ClinicSpecialtyEnum
            vaccination_enabled = clinic.plugin_vaccination or clinic.specialty == ClinicSpecialtyEnum.PEDIATRICS
            enabled_plugins = {
                "opd_queue": clinic.plugin_opd_queue,
                "collections": clinic.plugin_collections,
                "dpdp_compliance": clinic.plugin_dpdp_compliance,
                "vaccination": vaccination_enabled,
                "notifications": clinic.plugin_notifications,
            }

    background_tasks.add_task(
        create_audit_log,
        action=AuditActionEnum.LOGIN,
        resource_type="auth",
        user_id=user.id,
        user_email=user.email,
        clinic_id=user.clinic_id,
        description=f"User {user.email} logged in",
        ip_address=client_ip,
    )

    return {
        "message": "Login successful",
        "token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "clinic_id": user.clinic_id,
            "is_guest": user.is_guest,
            "permissions": permissions_dict,
            "print_template": print_template_dict,
            "enabled_plugins": enabled_plugins,
        }
    }


@router.post("/google", response_model=dict)
async def google_login(
    google_data: GoogleAuthRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Authenticate or register user via Google Sign-In"""
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    from app.core.config import settings

    # Verify the Google ID token
    try:
        idinfo = id_token.verify_oauth2_token(
            google_data.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    google_id = idinfo["sub"]
    email = idinfo.get("email")
    full_name = idinfo.get("name", "")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account has no email address",
        )

    client_ip = get_client_ip(request)

    # Check if user exists by google_id or email
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()
        if user:
            # Link existing account to Google
            user.google_id = google_id
        else:
            # No account found — reject signup
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No account found for this email. Please register your clinic through the onboarding process.",
            )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending approval. You'll be notified once approved.",
        )

    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": user.id, "role": user.role.value})

    # Fetch permissions
    permissions_dict = None
    permission = db.query(UserPermission).filter(UserPermission.user_id == user.id).first()
    if permission:
        permissions_dict = {
            "can_view_patients": permission.can_view_patients,
            "can_create_patients": permission.can_create_patients,
            "can_edit_patients": permission.can_edit_patients,
            "can_delete_patients": permission.can_delete_patients,
            "can_view_opd": permission.can_view_opd,
            "can_manage_opd": permission.can_manage_opd,
            "can_view_visits": permission.can_view_visits,
            "can_create_visits": permission.can_create_visits,
            "can_edit_visits": permission.can_edit_visits,
            "can_manage_clinic_options": permission.can_manage_clinic_options,
            "can_edit_print_settings": permission.can_edit_print_settings,
        }

    # Fetch clinic plugins
    enabled_plugins = None
    if user.clinic_id:
        clinic = db.query(Clinic).filter(Clinic.id == user.clinic_id).first()
        if clinic:
            from app.models.models import ClinicSpecialtyEnum
            vaccination_enabled = clinic.plugin_vaccination or clinic.specialty == ClinicSpecialtyEnum.PEDIATRICS
            enabled_plugins = {
                "opd_queue": clinic.plugin_opd_queue,
                "collections": clinic.plugin_collections,
                "dpdp_compliance": clinic.plugin_dpdp_compliance,
                "vaccination": vaccination_enabled,
                "notifications": clinic.plugin_notifications,
            }

    background_tasks.add_task(
        create_audit_log,
        action=AuditActionEnum.LOGIN,
        resource_type="auth",
        user_id=user.id,
        user_email=user.email,
        clinic_id=user.clinic_id,
        description=f"User {user.email} logged in via Google",
        ip_address=client_ip,
    )

    return {
        "message": "Login successful",
        "token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "clinic_id": user.clinic_id,
            "is_guest": user.is_guest,
            "permissions": permissions_dict,
            "enabled_plugins": enabled_plugins,
        }
    }


@router.post("/guest")
async def guest_login(request: GuestSessionRequest = GuestSessionRequest(), db: Session = Depends(get_db)):
    """Create a guest demo session with isolated clinic and pre-loaded data"""
    try:
        return create_guest_session(db, plugin_opd_queue=request.plugin_opd_queue, plugin_collections=request.plugin_collections, clinic_specialty=request.clinic_specialty)
    except Exception as e:
        logger.error(f"Failed to create guest session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create guest session. Please try again.",
        )


@router.post("/logout")
async def logout(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout user. For guest users, also cleans up all demo data."""
    if current_user.is_guest:
        background_tasks.add_task(_cleanup_guest_background, current_user.id)

    background_tasks.add_task(
        create_audit_log,
        action=AuditActionEnum.LOGOUT,
        resource_type="auth",
        user_id=current_user.id,
        user_email=current_user.email,
        clinic_id=current_user.clinic_id,
        description=f"User {current_user.email} logged out",
        ip_address=get_client_ip(request),
    )

    return {"message": "Logout successful"}


@router.post("/guest-cleanup")
async def guest_cleanup(
    request: GuestCleanupRequest,
    db: Session = Depends(get_db)
):
    """Unauthenticated cleanup for expired guest sessions.
    Only deletes data for is_guest=True users. Called by the frontend
    when a guest session expires (401) or the tab is closing."""
    try:
        cleanup_guest_session(db, request.user_id)
    except Exception as e:
        logger.error(f"Guest cleanup failed for user {request.user_id}: {e}")
    return {"message": "OK"}


@router.get("/me", response_model=dict)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user profile"""
    # Fetch permissions
    permissions_dict = None
    permission = db.query(UserPermission).filter(
        UserPermission.user_id == current_user.id
    ).first()
    if permission:
        permissions_dict = {
            "can_view_patients": permission.can_view_patients,
            "can_create_patients": permission.can_create_patients,
            "can_edit_patients": permission.can_edit_patients,
            "can_delete_patients": permission.can_delete_patients,
            "can_view_opd": permission.can_view_opd,
            "can_manage_opd": permission.can_manage_opd,
            "can_view_visits": permission.can_view_visits,
            "can_create_visits": permission.can_create_visits,
            "can_edit_visits": permission.can_edit_visits,
            "can_manage_clinic_options": permission.can_manage_clinic_options,
            "can_edit_print_settings": permission.can_edit_print_settings,
        }

    # Fetch clinic plugin settings
    enabled_plugins = None
    if current_user.clinic_id:
        clinic = db.query(Clinic).filter(Clinic.id == current_user.clinic_id).first()
        if clinic:
            from app.models.models import ClinicSpecialtyEnum
            vaccination_enabled = clinic.plugin_vaccination or clinic.specialty == ClinicSpecialtyEnum.PEDIATRICS
            enabled_plugins = {
                "opd_queue": clinic.plugin_opd_queue,
                "collections": clinic.plugin_collections,
                "dpdp_compliance": clinic.plugin_dpdp_compliance,
                "vaccination": vaccination_enabled,
                "notifications": clinic.plugin_notifications,
            }

    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "phone": current_user.phone,
            "role": current_user.role.value,
            "clinic_id": current_user.clinic_id,
            "is_active": current_user.is_active,
            "is_guest": current_user.is_guest,
            "last_login": current_user.last_login,
            "permissions": permissions_dict,
            "enabled_plugins": enabled_plugins,
        }
    }


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    if current_user.is_guest:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guest accounts cannot change password",
        )

    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()

    background_tasks.add_task(
        create_audit_log,
        action=AuditActionEnum.PASSWORD_CHANGE,
        resource_type="auth",
        user_id=current_user.id,
        user_email=current_user.email,
        clinic_id=current_user.clinic_id,
        description=f"User {current_user.email} changed password",
        ip_address=get_client_ip(request),
    )

    return {"message": "Password changed successfully"}
