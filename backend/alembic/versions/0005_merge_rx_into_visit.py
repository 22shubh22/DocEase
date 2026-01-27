"""Merge prescription into visit model

Revision ID: 0005_merge_rx_into_visit
Revises: 0004_prescription_master_lists
Create Date: 2026-01-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0005_merge_rx_into_visit'
down_revision: Union[str, None] = '0004_prescription_master_lists'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Add prescription_notes column to visits table
    op.add_column('visits', sa.Column('prescription_notes', sa.Text(), nullable=True))

    # Step 2: Create new visit_medicines table
    op.create_table('visit_medicines',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('visit_id', sa.String(), nullable=False),
        sa.Column('medicine_name', sa.String(), nullable=False),
        sa.Column('dosage', sa.String(), nullable=True),
        sa.Column('duration', sa.String(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['visit_id'], ['visits.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Step 3: Migrate data from prescriptions to visits
    # Copy prescription notes to visits
    op.execute("""
        UPDATE visits v
        SET prescription_notes = p.notes
        FROM prescriptions p
        WHERE v.id = p.visit_id
    """)

    # Step 4: Migrate prescription_medicines to visit_medicines
    # Get visit_id through the prescription relationship
    op.execute("""
        INSERT INTO visit_medicines (id, visit_id, medicine_name, dosage, duration, quantity)
        SELECT pm.id, p.visit_id, pm.medicine_name, pm.dosage, pm.duration, pm.quantity
        FROM prescription_medicines pm
        JOIN prescriptions p ON pm.prescription_id = p.id
    """)

    # Step 5: Drop old tables (prescription_medicines first due to FK, then prescriptions)
    op.drop_table('prescription_medicines')
    op.drop_table('prescriptions')


def downgrade() -> None:
    # Step 1: Recreate prescriptions table
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
        sa.ForeignKeyConstraint(['visit_id'], ['visits.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id']),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Step 2: Recreate prescription_medicines table
    op.create_table('prescription_medicines',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('prescription_id', sa.String(), nullable=False),
        sa.Column('medicine_name', sa.String(), nullable=False),
        sa.Column('dosage', sa.String(), nullable=True),
        sa.Column('duration', sa.String(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['prescription_id'], ['prescriptions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Note: Data migration back is complex and may result in data loss
    # as we'd need to recreate prescriptions from visits

    # Step 3: Drop visit_medicines table
    op.drop_table('visit_medicines')

    # Step 4: Remove prescription_notes column from visits
    op.drop_column('visits', 'prescription_notes')
