"""Add user_permissions table

Revision ID: 0011_user_permissions
Revises: 0010_add_amount
Create Date: 2026-01-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0011_user_permissions'
down_revision: Union[str, None] = '0010_add_amount'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'user_permissions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('clinic_id', sa.String(), nullable=False),
        # Patient Management
        sa.Column('can_view_patients', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('can_create_patients', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('can_edit_patients', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('can_delete_patients', sa.Boolean(), nullable=False, server_default='false'),
        # OPD Management
        sa.Column('can_view_opd', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('can_manage_opd', sa.Boolean(), nullable=False, server_default='true'),
        # Visit/Prescription Management
        sa.Column('can_view_visits', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('can_create_visits', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('can_edit_visits', sa.Boolean(), nullable=False, server_default='false'),
        # Billing Management
        sa.Column('can_view_invoices', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('can_create_invoices', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('can_edit_invoices', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('can_view_collections', sa.Boolean(), nullable=False, server_default='true'),
        # Settings Management
        sa.Column('can_manage_clinic_options', sa.Boolean(), nullable=False, server_default='false'),
        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        # Constraints
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id'),
    )
    op.create_index('ix_user_permissions_user_id', 'user_permissions', ['user_id'])
    op.create_index('ix_user_permissions_clinic_id', 'user_permissions', ['clinic_id'])


def downgrade() -> None:
    op.drop_index('ix_user_permissions_clinic_id', table_name='user_permissions')
    op.drop_index('ix_user_permissions_user_id', table_name='user_permissions')
    op.drop_table('user_permissions')
