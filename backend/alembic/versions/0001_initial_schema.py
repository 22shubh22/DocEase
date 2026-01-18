"""Initial schema - creates all tables from scratch

Revision ID: 0001_initial
Revises:
Create Date: 2026-01-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types
    op.execute("CREATE TYPE roleenum AS ENUM ('DOCTOR', 'ASSISTANT', 'ADMIN')")
    op.execute("CREATE TYPE genderenum AS ENUM ('MALE', 'FEMALE', 'OTHER')")
    op.execute("CREATE TYPE appointmentstatusenum AS ENUM ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')")
    op.execute("CREATE TYPE paymentstatusenum AS ENUM ('PAID', 'UNPAID', 'PARTIAL')")
    op.execute("CREATE TYPE paymentmodeenum AS ENUM ('CASH', 'UPI', 'CARD', 'OTHER')")

    # Create clinics table (no foreign keys initially due to circular dependency with doctors)
    op.create_table('clinics',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('clinic_code', sa.String(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('logo_url', sa.String(), nullable=True),
        sa.Column('opd_start_time', sa.String(), nullable=True),
        sa.Column('opd_end_time', sa.String(), nullable=True),
        sa.Column('owner_doctor_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_clinics_clinic_code', 'clinics', ['clinic_code'], unique=True)

    # Create users table
    op.create_table('users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('initial_password', sa.String(), nullable=True),
        sa.Column('role', postgresql.ENUM('DOCTOR', 'ASSISTANT', 'ADMIN', name='roleenum', create_type=False), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('clinic_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Create doctors table
    op.create_table('doctors',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('doctor_code', sa.String(), nullable=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('specialization', sa.String(), nullable=True),
        sa.Column('qualification', sa.String(), nullable=True),
        sa.Column('registration_number', sa.String(), nullable=True),
        sa.Column('signature_url', sa.String(), nullable=True),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('ix_doctors_doctor_code', 'doctors', ['doctor_code'], unique=True)

    # Add foreign key from clinics to doctors (for owner_doctor_id)
    op.create_foreign_key('fk_clinics_owner_doctor', 'clinics', 'doctors', ['owner_doctor_id'], ['id'], ondelete='SET NULL')

    # Create patients table
    op.create_table('patients',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('patient_code', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('age', sa.Integer(), nullable=True),
        sa.Column('gender', postgresql.ENUM('MALE', 'FEMALE', 'OTHER', name='genderenum', create_type=False), nullable=True),
        sa.Column('phone', sa.String(), nullable=False),
        sa.Column('emergency_contact', sa.String(), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('blood_group', sa.String(), nullable=True),
        sa.Column('allergies', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('medical_history', sa.JSON(), nullable=True),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_patients_patient_code', 'patients', ['patient_code'], unique=True)
    op.create_index('ix_patients_phone', 'patients', ['phone'], unique=False)

    # Create appointments table
    op.create_table('appointments',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('appointment_date', sa.Date(), nullable=False),
        sa.Column('queue_number', sa.Integer(), nullable=True),
        sa.Column('chief_complaint', sa.String(), nullable=True),
        sa.Column('status', postgresql.ENUM('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', name='appointmentstatusenum', create_type=False), nullable=True),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_appointments_appointment_date', 'appointments', ['appointment_date'], unique=False)

    # Create visits table
    op.create_table('visits',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('appointment_id', sa.String(), nullable=True),
        sa.Column('visit_date', sa.Date(), nullable=False),
        sa.Column('visit_number', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.String(), nullable=False),
        sa.Column('symptoms', sa.Text(), nullable=True),
        sa.Column('diagnosis', sa.Text(), nullable=True),
        sa.Column('observations', sa.Text(), nullable=True),
        sa.Column('recommended_tests', sa.ARRAY(sa.String()), nullable=True),
        sa.Column('follow_up_date', sa.Date(), nullable=True),
        sa.Column('vitals', sa.JSON(), nullable=True),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id']),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id']),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('appointment_id')
    )
    op.create_index('ix_visits_visit_date', 'visits', ['visit_date'], unique=False)

    # Create prescriptions table
    op.create_table('prescriptions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('visit_id', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('doctor_id', sa.String(), nullable=False),
        sa.Column('prescription_date', sa.Date(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('pdf_url', sa.String(), nullable=True),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id']),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['visit_id'], ['visits.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create prescription_medicines table
    op.create_table('prescription_medicines',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('prescription_id', sa.String(), nullable=False),
        sa.Column('medicine_name', sa.String(), nullable=False),
        sa.Column('dosage', sa.String(), nullable=False),
        sa.Column('frequency', sa.String(), nullable=False),
        sa.Column('duration', sa.String(), nullable=False),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['prescription_id'], ['prescriptions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create invoices table
    op.create_table('invoices',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('invoice_number', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('visit_id', sa.String(), nullable=True),
        sa.Column('total_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('paid_amount', sa.Numeric(10, 2), nullable=True, default=0),
        sa.Column('payment_status', postgresql.ENUM('PAID', 'UNPAID', 'PARTIAL', name='paymentstatusenum', create_type=False), nullable=True),
        sa.Column('payment_mode', postgresql.ENUM('CASH', 'UPI', 'CARD', 'OTHER', name='paymentmodeenum', create_type=False), nullable=True),
        sa.Column('payment_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['visit_id'], ['visits.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('visit_id')
    )
    op.create_index('ix_invoices_invoice_number', 'invoices', ['invoice_number'], unique=True)

    # Create invoice_items table
    op.create_table('invoice_items',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('invoice_id', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=True, default=1),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create clinic_admins table
    op.create_table('clinic_admins',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('admin_id', sa.String(), nullable=False),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create chief_complaints table
    op.create_table('chief_complaints',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('display_order', sa.Integer(), nullable=True, default=0),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create diagnosis_options table
    op.create_table('diagnosis_options',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('display_order', sa.Integer(), nullable=True, default=0),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create observation_options table
    op.create_table('observation_options',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('display_order', sa.Integer(), nullable=True, default=0),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('observation_options')
    op.drop_table('diagnosis_options')
    op.drop_table('chief_complaints')
    op.drop_table('clinic_admins')
    op.drop_table('invoice_items')
    op.drop_table('invoices')
    op.drop_table('prescription_medicines')
    op.drop_table('prescriptions')
    op.drop_table('visits')
    op.drop_table('appointments')
    op.drop_table('patients')
    op.drop_constraint('fk_clinics_owner_doctor', 'clinics', type_='foreignkey')
    op.drop_table('doctors')
    op.drop_table('users')
    op.drop_table('clinics')

    op.execute("DROP TYPE paymentmodeenum")
    op.execute("DROP TYPE paymentstatusenum")
    op.execute("DROP TYPE appointmentstatusenum")
    op.execute("DROP TYPE genderenum")
    op.execute("DROP TYPE roleenum")
