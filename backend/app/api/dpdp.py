from fastapi import APIRouter, Depends, HTTPException, Request, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.deps import get_current_user, require_clinic_owner, require_permission, require_plugin, get_client_ip
from app.models.models import (
    User, Patient, Visit, VisitMedicine, Appointment,
    PatientConsent, DataRetentionPolicy, DataErasureRequest, DataBreachLog,
    AuditActionEnum, ConsentStatusEnum, ErasureStatusEnum,
)
from app.schemas.schemas import (
    PatientConsentCreate, PatientConsentResponse,
    DataRetentionPolicyUpdate, DataRetentionPolicyResponse,
    DataErasureRequestCreate, DataErasureRequestResponse, DataErasureRejectRequest,
    DataBreachReportCreate, DataBreachReportResponse,
)
from app.services.audit_service import create_audit_log
from app.services.anonymization_service import anonymize_patient

router = APIRouter()


# ── Consent Management ──

@router.post("/consent", response_model=dict, status_code=status.HTTP_201_CREATED)
async def record_consent(
    consent_data: PatientConsentCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("can_edit_patients")),
    _plugin: User = Depends(require_plugin("dpdp_compliance")),
    db: Session = Depends(get_db)
):
    """Record patient consent for data processing"""
    patient = db.query(Patient).filter(
        Patient.id == consent_data.patient_id,
        Patient.clinic_id == current_user.clinic_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    consent = PatientConsent(
        patient_id=consent_data.patient_id,
        clinic_id=current_user.clinic_id,
        purpose=consent_data.purpose,
        status=ConsentStatusEnum.GIVEN,
        consent_text=consent_data.consent_text,
        consent_version=consent_data.consent_version,
        collected_by=current_user.id,
        ip_address=get_client_ip(request),
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)

    background_tasks.add_task(
        create_audit_log,
        action=AuditActionEnum.CONSENT_GIVEN,
        resource_type="patient_consents",
        resource_id=consent.id,
        user_id=current_user.id,
        user_email=current_user.email,
        clinic_id=current_user.clinic_id,
        description=f"Consent recorded for patient {patient.patient_code}: {consent_data.purpose.value}",
        ip_address=get_client_ip(request),
    )

    return {"message": "Consent recorded", "consent_id": consent.id}


@router.get("/consent/{patient_id}", response_model=dict)
async def get_patient_consents(
    patient_id: str,
    current_user: User = Depends(require_permission("can_view_patients")),
    _plugin: User = Depends(require_plugin("dpdp_compliance")),
    db: Session = Depends(get_db)
):
    """Get all consent records for a patient"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_user.clinic_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    consents = db.query(PatientConsent).filter(
        PatientConsent.patient_id == patient_id,
        PatientConsent.clinic_id == current_user.clinic_id
    ).order_by(PatientConsent.given_at.desc()).all()

    return {
        "consents": [
            {
                "id": c.id,
                "patient_id": c.patient_id,
                "clinic_id": c.clinic_id,
                "purpose": c.purpose.value if c.purpose else None,
                "status": c.status.value if c.status else None,
                "consent_text": c.consent_text,
                "consent_version": c.consent_version,
                "given_at": c.given_at.isoformat() if c.given_at else None,
                "revoked_at": c.revoked_at.isoformat() if c.revoked_at else None,
                "collected_by": c.collected_by,
            }
            for c in consents
        ]
    }


@router.put("/consent/{consent_id}/revoke", response_model=dict)
async def revoke_consent(
    consent_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("can_edit_patients")),
    _plugin: User = Depends(require_plugin("dpdp_compliance")),
    db: Session = Depends(get_db)
):
    """Revoke a patient consent"""
    consent = db.query(PatientConsent).filter(
        PatientConsent.id == consent_id,
        PatientConsent.clinic_id == current_user.clinic_id
    ).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent record not found")

    if consent.status == ConsentStatusEnum.REVOKED:
        raise HTTPException(status_code=400, detail="Consent already revoked")

    consent.status = ConsentStatusEnum.REVOKED
    consent.revoked_at = datetime.utcnow()
    db.commit()

    background_tasks.add_task(
        create_audit_log,
        action=AuditActionEnum.CONSENT_REVOKED,
        resource_type="patient_consents",
        resource_id=consent.id,
        user_id=current_user.id,
        user_email=current_user.email,
        clinic_id=current_user.clinic_id,
        description=f"Consent revoked for patient {consent.patient_id}: {consent.purpose.value}",
        ip_address=get_client_ip(request),
    )

    return {"message": "Consent revoked"}


# ── Data Erasure ──

@router.post("/erasure-request", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_erasure_request(
    erasure_data: DataErasureRequestCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("can_edit_patients")),
    _plugin: User = Depends(require_plugin("dpdp_compliance")),
    db: Session = Depends(get_db)
):
    """Create a data erasure request for a patient"""
    patient = db.query(Patient).filter(
        Patient.id == erasure_data.patient_id,
        Patient.clinic_id == current_user.clinic_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if patient.is_anonymized:
        raise HTTPException(status_code=400, detail="Patient data already anonymized")

    # Check for existing pending request
    existing = db.query(DataErasureRequest).filter(
        DataErasureRequest.patient_id == erasure_data.patient_id,
        DataErasureRequest.clinic_id == current_user.clinic_id,
        DataErasureRequest.status == ErasureStatusEnum.REQUESTED
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="An erasure request already exists for this patient")

    erasure_req = DataErasureRequest(
        patient_id=erasure_data.patient_id,
        clinic_id=current_user.clinic_id,
        requested_by=current_user.id,
        reason=erasure_data.reason,
        status=ErasureStatusEnum.REQUESTED,
    )
    db.add(erasure_req)
    db.commit()
    db.refresh(erasure_req)

    background_tasks.add_task(
        create_audit_log,
        action=AuditActionEnum.DATA_ERASURE,
        resource_type="data_erasure_requests",
        resource_id=erasure_req.id,
        user_id=current_user.id,
        user_email=current_user.email,
        clinic_id=current_user.clinic_id,
        description=f"Erasure request created for patient {patient.patient_code}",
        ip_address=get_client_ip(request),
    )

    return {"message": "Erasure request created", "request_id": erasure_req.id}


@router.get("/erasure-requests", response_model=dict)
async def list_erasure_requests(
    current_user: User = Depends(require_clinic_owner),
    _plugin: User = Depends(require_plugin("dpdp_compliance")),
    db: Session = Depends(get_db)
):
    """List all erasure requests for the clinic (owner only)"""
    requests = db.query(DataErasureRequest).filter(
        DataErasureRequest.clinic_id == current_user.clinic_id
    ).order_by(DataErasureRequest.created_at.desc()).all()

    result = []
    for req in requests:
        patient = db.query(Patient).filter(Patient.id == req.patient_id).first() if req.patient_id else None
        result.append({
            "id": req.id,
            "patient_id": req.patient_id,
            "patient_code": patient.patient_code if patient else None,
            "patient_name": patient.full_name if patient else "Deleted",
            "requested_by": req.requested_by,
            "reason": req.reason,
            "status": req.status.value if req.status else None,
            "approved_by": req.approved_by,
            "completed_at": req.completed_at.isoformat() if req.completed_at else None,
            "anonymized_fields": req.anonymized_fields,
            "created_at": req.created_at.isoformat() if req.created_at else None,
        })

    return {"requests": result}


@router.put("/erasure-requests/{request_id}/approve", response_model=dict)
async def approve_erasure_request(
    request_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_clinic_owner),
    _plugin: User = Depends(require_plugin("dpdp_compliance")),
    db: Session = Depends(get_db)
):
    """Approve and execute an erasure request (anonymize patient data)"""
    erasure_req = db.query(DataErasureRequest).filter(
        DataErasureRequest.id == request_id,
        DataErasureRequest.clinic_id == current_user.clinic_id
    ).first()
    if not erasure_req:
        raise HTTPException(status_code=404, detail="Erasure request not found")
    if erasure_req.status != ErasureStatusEnum.REQUESTED:
        raise HTTPException(status_code=400, detail=f"Request is already {erasure_req.status.value}")

    # Execute anonymization
    anonymized_fields = anonymize_patient(db, erasure_req.patient_id)

    erasure_req.status = ErasureStatusEnum.COMPLETED
    erasure_req.approved_by = current_user.id
    erasure_req.completed_at = datetime.utcnow()
    erasure_req.anonymized_fields = anonymized_fields
    db.commit()

    background_tasks.add_task(
        create_audit_log,
        action=AuditActionEnum.DATA_ERASURE,
        resource_type="data_erasure_requests",
        resource_id=erasure_req.id,
        user_id=current_user.id,
        user_email=current_user.email,
        clinic_id=current_user.clinic_id,
        description=f"Erasure approved and executed for patient {erasure_req.patient_id}. Fields anonymized: {anonymized_fields}",
        ip_address=get_client_ip(request),
    )

    return {"message": "Erasure completed", "anonymized_fields": anonymized_fields}


@router.put("/erasure-requests/{request_id}/reject", response_model=dict)
async def reject_erasure_request(
    request_id: str,
    reject_data: DataErasureRejectRequest,
    current_user: User = Depends(require_clinic_owner),
    _plugin: User = Depends(require_plugin("dpdp_compliance")),
    db: Session = Depends(get_db)
):
    """Reject an erasure request"""
    erasure_req = db.query(DataErasureRequest).filter(
        DataErasureRequest.id == request_id,
        DataErasureRequest.clinic_id == current_user.clinic_id
    ).first()
    if not erasure_req:
        raise HTTPException(status_code=404, detail="Erasure request not found")
    if erasure_req.status != ErasureStatusEnum.REQUESTED:
        raise HTTPException(status_code=400, detail=f"Request is already {erasure_req.status.value}")

    erasure_req.status = ErasureStatusEnum.REJECTED
    erasure_req.approved_by = current_user.id
    erasure_req.reason = f"{erasure_req.reason or ''}\n[REJECTED] {reject_data.reason}".strip()
    db.commit()

    return {"message": "Erasure request rejected"}


# ── Patient Data Export ──

@router.get("/export/{patient_id}", response_model=dict)
async def export_patient_data(
    patient_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_permission("can_view_patients")),
    _plugin: User = Depends(require_plugin("dpdp_compliance")),
    db: Session = Depends(get_db)
):
    """Export all patient data as JSON (DPDP right to data portability)"""
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_user.clinic_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Gather all patient data
    visits = db.query(Visit).filter(Visit.patient_id == patient_id).order_by(Visit.visit_date.desc()).all()
    appointments = db.query(Appointment).filter(Appointment.patient_id == patient_id).order_by(Appointment.appointment_date.desc()).all()
    consents = db.query(PatientConsent).filter(PatientConsent.patient_id == patient_id).all()

    visit_data = []
    for v in visits:
        medicines = db.query(VisitMedicine).filter(VisitMedicine.visit_id == v.id).all()
        visit_data.append({
            "visit_date": v.visit_date.isoformat() if v.visit_date else None,
            "visit_number": v.visit_number,
            "symptoms": v.symptoms,
            "diagnosis": v.diagnosis,
            "observations": v.observations,
            "recommended_tests": v.recommended_tests,
            "follow_up_date": v.follow_up_date.isoformat() if v.follow_up_date else None,
            "vitals": v.vitals,
            "prescription_notes": v.prescription_notes,
            "amount": float(v.amount) if v.amount else None,
            "medicines": [
                {"medicine_name": m.medicine_name, "dosage": m.dosage, "duration": m.duration}
                for m in medicines
            ],
        })

    background_tasks.add_task(
        create_audit_log,
        action=AuditActionEnum.DATA_EXPORT,
        resource_type="patients",
        resource_id=patient_id,
        user_id=current_user.id,
        user_email=current_user.email,
        clinic_id=current_user.clinic_id,
        description=f"Exported data for patient {patient.patient_code}",
        ip_address=get_client_ip(request),
    )

    return {
        "export": {
            "patient": {
                "patient_code": patient.patient_code,
                "full_name": patient.full_name,
                "age": patient.age,
                "gender": patient.gender.value if patient.gender else None,
                "phone": patient.phone,
                "emergency_contact": patient.emergency_contact,
                "address": patient.address,
                "blood_group": patient.blood_group,
                "allergies": patient.allergies,
                "medical_history": patient.medical_history,
                "created_at": patient.created_at.isoformat() if patient.created_at else None,
            },
            "visits": visit_data,
            "appointments": [
                {
                    "date": a.appointment_date.isoformat() if a.appointment_date else None,
                    "chief_complaints": a.chief_complaints,
                    "status": a.status.value if a.status else None,
                }
                for a in appointments
            ],
            "consents": [
                {
                    "purpose": c.purpose.value if c.purpose else None,
                    "status": c.status.value if c.status else None,
                    "consent_text": c.consent_text,
                    "given_at": c.given_at.isoformat() if c.given_at else None,
                    "revoked_at": c.revoked_at.isoformat() if c.revoked_at else None,
                }
                for c in consents
            ],
            "exported_at": datetime.utcnow().isoformat(),
        }
    }


# ── Data Retention Policy ──

@router.get("/retention-policy", response_model=dict)
async def get_retention_policy(
    current_user: User = Depends(require_clinic_owner),
    _plugin: User = Depends(require_plugin("dpdp_compliance")),
    db: Session = Depends(get_db)
):
    """Get the clinic's data retention policy"""
    policy = db.query(DataRetentionPolicy).filter(
        DataRetentionPolicy.clinic_id == current_user.clinic_id
    ).first()

    if not policy:
        # Return defaults
        return {
            "policy": {
                "patient_data_retention_months": 120,
                "audit_log_retention_months": 60,
                "inactive_patient_archive_months": 36,
            }
        }

    return {
        "policy": {
            "id": policy.id,
            "clinic_id": policy.clinic_id,
            "patient_data_retention_months": policy.patient_data_retention_months,
            "audit_log_retention_months": policy.audit_log_retention_months,
            "inactive_patient_archive_months": policy.inactive_patient_archive_months,
            "created_at": policy.created_at.isoformat() if policy.created_at else None,
            "updated_at": policy.updated_at.isoformat() if policy.updated_at else None,
        }
    }


@router.put("/retention-policy", response_model=dict)
async def update_retention_policy(
    policy_data: DataRetentionPolicyUpdate,
    current_user: User = Depends(require_clinic_owner),
    _plugin: User = Depends(require_plugin("dpdp_compliance")),
    db: Session = Depends(get_db)
):
    """Update the clinic's data retention policy"""
    policy = db.query(DataRetentionPolicy).filter(
        DataRetentionPolicy.clinic_id == current_user.clinic_id
    ).first()

    if not policy:
        policy = DataRetentionPolicy(clinic_id=current_user.clinic_id)
        db.add(policy)

    update_data = policy_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(policy, field, value)

    db.commit()
    db.refresh(policy)

    return {
        "message": "Retention policy updated",
        "policy": {
            "patient_data_retention_months": policy.patient_data_retention_months,
            "audit_log_retention_months": policy.audit_log_retention_months,
            "inactive_patient_archive_months": policy.inactive_patient_archive_months,
        }
    }


# ── Data Breach Logging ──

@router.post("/breach-report", response_model=dict, status_code=status.HTTP_201_CREATED)
async def report_breach(
    breach_data: DataBreachReportCreate,
    current_user: User = Depends(require_clinic_owner),
    _plugin: User = Depends(require_plugin("dpdp_compliance")),
    db: Session = Depends(get_db)
):
    """Log a data breach incident"""
    breach = DataBreachLog(
        clinic_id=current_user.clinic_id,
        reported_by=current_user.id,
        description=breach_data.description,
        severity=breach_data.severity,
        affected_records_count=breach_data.affected_records_count,
        containment_actions=breach_data.containment_actions,
    )
    db.add(breach)
    db.commit()
    db.refresh(breach)

    return {"message": "Breach report created", "report_id": breach.id}


@router.get("/breach-reports", response_model=dict)
async def list_breach_reports(
    current_user: User = Depends(require_clinic_owner),
    _plugin: User = Depends(require_plugin("dpdp_compliance")),
    db: Session = Depends(get_db)
):
    """List all breach reports for the clinic"""
    reports = db.query(DataBreachLog).filter(
        DataBreachLog.clinic_id == current_user.clinic_id
    ).order_by(DataBreachLog.created_at.desc()).all()

    return {
        "reports": [
            {
                "id": r.id,
                "description": r.description,
                "severity": r.severity,
                "affected_records_count": r.affected_records_count,
                "containment_actions": r.containment_actions,
                "reported_to_authority": r.reported_to_authority,
                "reported_at": r.reported_at.isoformat() if r.reported_at else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reports
        ]
    }
