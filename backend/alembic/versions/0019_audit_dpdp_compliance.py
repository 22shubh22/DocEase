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
    # Create enum types
    audit_action_enum = sa.Enum(
        'CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGIN_FAILED',
        'LOGOUT', 'PASSWORD_CHANGE', 'DATA_EXPORT', 'DATA_ERASURE',
        'CONSENT_GIVEN', 'CONSENT_REVOKED',
        name='auditactionenum'
    )
    consent_purpose_enum = sa.Enum('TREATMENT', 'DATA_STORAGE', 'COMMUNICATION', name='consentpurposeenum')
    consent_status_enum = sa.Enum('GIVEN', 'REVOKED', name='consentstatusenum')
    erasure_status_enum = sa.Enum('REQUESTED', 'APPROVED', 'COMPLETED', 'REJECTED', name='erasurestatusenum')

    # audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('clinic_id', sa.String(), nullable=True, index=True),
        sa.Column('user_id', sa.String(), nullable=True, index=True),
        sa.Column('user_email', sa.String(), nullable=True),
        sa.Column('action', audit_action_enum, nullable=False, index=True),
        sa.Column('resource_type', sa.String(), nullable=False, index=True),
        sa.Column('resource_id', sa.String(), nullable=True, index=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('old_values', sa.JSON(), nullable=True),
        sa.Column('new_values', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
    )

    # patient_consents table
    op.create_table(
        'patient_consents',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('patient_id', sa.String(), sa.ForeignKey('patients.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('clinic_id', sa.String(), sa.ForeignKey('clinics.id', ondelete='CASCADE'), nullable=False),
        sa.Column('purpose', consent_purpose_enum, nullable=False),
        sa.Column('status', consent_status_enum, nullable=False),
        sa.Column('consent_text', sa.Text(), nullable=False),
        sa.Column('consent_version', sa.String(), nullable=False, server_default='1.0'),
        sa.Column('given_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('collected_by', sa.String(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
    )

    # data_retention_policies table
    op.create_table(
        'data_retention_policies',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('clinic_id', sa.String(), sa.ForeignKey('clinics.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('patient_data_retention_months', sa.Integer(), nullable=False, server_default='120'),
        sa.Column('audit_log_retention_months', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('inactive_patient_archive_months', sa.Integer(), nullable=False, server_default='36'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # data_erasure_requests table
    op.create_table(
        'data_erasure_requests',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('patient_id', sa.String(), sa.ForeignKey('patients.id', ondelete='SET NULL'), nullable=True),
        sa.Column('clinic_id', sa.String(), sa.ForeignKey('clinics.id', ondelete='CASCADE'), nullable=False),
        sa.Column('requested_by', sa.String(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('status', erasure_status_enum, nullable=False),
        sa.Column('approved_by', sa.String(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('anonymized_fields', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # data_breach_logs table
    op.create_table(
        'data_breach_logs',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('clinic_id', sa.String(), sa.ForeignKey('clinics.id', ondelete='CASCADE'), nullable=False),
        sa.Column('reported_by', sa.String(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(), nullable=False, server_default='LOW'),
        sa.Column('affected_records_count', sa.Integer(), nullable=True),
        sa.Column('containment_actions', sa.Text(), nullable=True),
        sa.Column('reported_to_authority', sa.Boolean(), server_default='false'),
        sa.Column('reported_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # Add columns to existing tables
    op.add_column('patients', sa.Column('is_anonymized', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('clinics', sa.Column('plugin_dpdp_compliance', sa.Boolean(), nullable=False, server_default='false'))


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
