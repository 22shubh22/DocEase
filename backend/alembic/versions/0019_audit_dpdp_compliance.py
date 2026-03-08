"""Add audit logging and DPDP compliance tables

Revision ID: 0019_audit_dpdp_compliance
Revises: 0018_add_clinic_plugins
Create Date: 2026-03-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0019_audit_dpdp_compliance'
down_revision: Union[str, None] = '0018_add_clinic_plugins'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use raw SQL with IF NOT EXISTS since Base.metadata.create_all()
    # in main.py lifespan may have already created these objects.

    # Create enum types
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE auditactionenum AS ENUM (
                'CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGIN_FAILED',
                'LOGOUT', 'PASSWORD_CHANGE', 'DATA_EXPORT', 'DATA_ERASURE',
                'CONSENT_GIVEN', 'CONSENT_REVOKED'
            );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE consentpurposeenum AS ENUM ('TREATMENT', 'DATA_STORAGE', 'COMMUNICATION');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE consentstatusenum AS ENUM ('GIVEN', 'REVOKED');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE erasurestatusenum AS ENUM ('REQUESTED', 'APPROVED', 'COMPLETED', 'REJECTED');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    # audit_logs table
    op.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR PRIMARY KEY,
            clinic_id VARCHAR,
            user_id VARCHAR,
            user_email VARCHAR,
            action auditactionenum NOT NULL,
            resource_type VARCHAR NOT NULL,
            resource_id VARCHAR,
            description VARCHAR,
            old_values JSON,
            new_values JSON,
            ip_address VARCHAR,
            user_agent VARCHAR,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_clinic_id ON audit_logs (clinic_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id ON audit_logs (user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_action ON audit_logs (action);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_resource_type ON audit_logs (resource_type);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_resource_id ON audit_logs (resource_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs (created_at);")

    # patient_consents table
    op.execute("""
        CREATE TABLE IF NOT EXISTS patient_consents (
            id VARCHAR PRIMARY KEY,
            patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            clinic_id VARCHAR NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
            purpose consentpurposeenum NOT NULL,
            status consentstatusenum NOT NULL,
            consent_text TEXT NOT NULL,
            consent_version VARCHAR NOT NULL DEFAULT '1.0',
            given_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            revoked_at TIMESTAMP WITH TIME ZONE,
            collected_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
            ip_address VARCHAR
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_patient_consents_patient_id ON patient_consents (patient_id);")

    # data_retention_policies table
    op.execute("""
        CREATE TABLE IF NOT EXISTS data_retention_policies (
            id VARCHAR PRIMARY KEY,
            clinic_id VARCHAR NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
            patient_data_retention_months INTEGER NOT NULL DEFAULT 120,
            audit_log_retention_months INTEGER NOT NULL DEFAULT 60,
            inactive_patient_archive_months INTEGER NOT NULL DEFAULT 36,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE
        );
    """)

    # data_erasure_requests table
    op.execute("""
        CREATE TABLE IF NOT EXISTS data_erasure_requests (
            id VARCHAR PRIMARY KEY,
            patient_id VARCHAR REFERENCES patients(id) ON DELETE SET NULL,
            clinic_id VARCHAR NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
            requested_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
            reason TEXT,
            status erasurestatusenum NOT NULL,
            approved_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
            completed_at TIMESTAMP WITH TIME ZONE,
            anonymized_fields JSON,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE
        );
    """)

    # data_breach_logs table
    op.execute("""
        CREATE TABLE IF NOT EXISTS data_breach_logs (
            id VARCHAR PRIMARY KEY,
            clinic_id VARCHAR NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
            reported_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
            description TEXT NOT NULL,
            severity VARCHAR NOT NULL DEFAULT 'LOW',
            affected_records_count INTEGER,
            containment_actions TEXT,
            reported_to_authority BOOLEAN DEFAULT false,
            reported_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE
        );
    """)

    # Add columns to existing tables
    op.execute("ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_anonymized BOOLEAN NOT NULL DEFAULT false;")
    op.execute("ALTER TABLE clinics ADD COLUMN IF NOT EXISTS plugin_dpdp_compliance BOOLEAN NOT NULL DEFAULT false;")


def downgrade() -> None:
    op.drop_column('clinics', 'plugin_dpdp_compliance')
    op.drop_column('patients', 'is_anonymized')
    op.drop_table('data_breach_logs')
    op.drop_table('data_erasure_requests')
    op.drop_table('data_retention_policies')
    op.drop_table('patient_consents')
    op.drop_table('audit_logs')
    sa.Enum(name='erasurestatusenum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='consentstatusenum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='consentpurposeenum').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='auditactionenum').drop(op.get_bind(), checkfirst=True)
