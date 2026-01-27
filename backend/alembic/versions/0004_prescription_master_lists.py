"""Add prescription master lists (medicine, dosage, duration options) and update prescription_medicines

Revision ID: 0004_prescription_master_lists
Revises: 0003_add_test_options
Create Date: 2026-01-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0004_prescription_master_lists'
down_revision: Union[str, None] = '0003_add_test_options'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create medicine_options table
    op.create_table('medicine_options',
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

    # Create dosage_options table
    op.create_table('dosage_options',
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

    # Create duration_options table
    op.create_table('duration_options',
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

    # Remove frequency and instructions columns from prescription_medicines
    op.drop_column('prescription_medicines', 'frequency')
    op.drop_column('prescription_medicines', 'instructions')


def downgrade() -> None:
    # Add back frequency and instructions columns
    op.add_column('prescription_medicines', sa.Column('frequency', sa.String(), nullable=True))
    op.add_column('prescription_medicines', sa.Column('instructions', sa.Text(), nullable=True))

    # Drop the new tables
    op.drop_table('duration_options')
    op.drop_table('dosage_options')
    op.drop_table('medicine_options')
