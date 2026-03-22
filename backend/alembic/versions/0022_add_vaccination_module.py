"""Add vaccination tracking module: vaccination_schedules and vaccination_records tables,
date_of_birth on patients, plugin_vaccination on clinics.

Revision ID: 0022_add_vaccination_module
Revises: 0021_add_fixture_templates
Create Date: 2026-03-21

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0022_add_vaccination_module'
down_revision: Union[str, None] = '0021_add_fixture_templates'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add date_of_birth to patients
    op.add_column('patients', sa.Column('date_of_birth', sa.Date(), nullable=True))

    # Add plugin_vaccination to clinics
    op.add_column('clinics', sa.Column('plugin_vaccination', sa.Boolean(),
                                       nullable=False, server_default=sa.text('false')))

    # Create vaccination_schedules table
    op.execute("""
        CREATE TABLE vaccination_schedules (
            id VARCHAR NOT NULL,
            clinic_id VARCHAR NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
            vaccine_name VARCHAR NOT NULL,
            dose_number INTEGER NOT NULL,
            dose_label VARCHAR,
            age_days INTEGER NOT NULL,
            age_label VARCHAR,
            vaccine_group VARCHAR,
            route VARCHAR,
            site VARCHAR,
            is_mandatory BOOLEAN DEFAULT TRUE,
            display_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ,
            PRIMARY KEY (id),
            CONSTRAINT uq_clinic_vaccine_dose UNIQUE (clinic_id, vaccine_name, dose_number)
        )
    """)

    # Create vaccination_records table
    op.execute("""
        CREATE TABLE vaccination_records (
            id VARCHAR NOT NULL,
            patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
            clinic_id VARCHAR NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
            schedule_entry_id VARCHAR REFERENCES vaccination_schedules(id) ON DELETE SET NULL,
            visit_id VARCHAR REFERENCES visits(id) ON DELETE SET NULL,
            vaccine_name VARCHAR NOT NULL,
            dose_number INTEGER NOT NULL,
            dose_label VARCHAR,
            date_administered DATE NOT NULL,
            age_at_dose_days INTEGER,
            batch_number VARCHAR,
            administered_by VARCHAR REFERENCES users(id) ON DELETE SET NULL,
            injection_site VARCHAR,
            route VARCHAR,
            adverse_reaction TEXT,
            notes TEXT,
            created_by VARCHAR NOT NULL REFERENCES users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ,
            PRIMARY KEY (id),
            CONSTRAINT uq_patient_vaccine_dose UNIQUE (patient_id, vaccine_name, dose_number)
        )
    """)

    # Add indexes for performance
    op.create_index('ix_vaccination_records_patient_id', 'vaccination_records', ['patient_id'])
    op.create_index('ix_vaccination_records_clinic_id', 'vaccination_records', ['clinic_id'])
    op.create_index('ix_vaccination_records_date_administered', 'vaccination_records', ['date_administered'])
    op.create_index('ix_vaccination_schedules_clinic_id', 'vaccination_schedules', ['clinic_id'])


def downgrade() -> None:
    op.drop_index('ix_vaccination_schedules_clinic_id', table_name='vaccination_schedules')
    op.drop_index('ix_vaccination_records_date_administered', table_name='vaccination_records')
    op.drop_index('ix_vaccination_records_clinic_id', table_name='vaccination_records')
    op.drop_index('ix_vaccination_records_patient_id', table_name='vaccination_records')
    op.execute("DROP TABLE IF EXISTS vaccination_records")
    op.execute("DROP TABLE IF EXISTS vaccination_schedules")
    op.drop_column('clinics', 'plugin_vaccination')
    op.drop_column('patients', 'date_of_birth')
