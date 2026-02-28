"""Remove invoice module

Revision ID: 0013_remove_invoice
Revises: 0012_add_print_settings_permission
Create Date: 2026-01-27

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0013_remove_invoice'
down_revision: Union[str, None] = '0012_print_settings'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop invoice tables (must drop child table first due to foreign key)
    op.drop_table('invoice_items')
    op.drop_table('invoices')

    # Drop enum types (PostgreSQL specific - will be ignored on other databases)
    op.execute("DROP TYPE IF EXISTS paymentstatusenum")
    op.execute("DROP TYPE IF EXISTS paymentmodeenum")

    # Remove invoice permission columns from user_permissions
    op.drop_column('user_permissions', 'can_view_invoices')
    op.drop_column('user_permissions', 'can_create_invoices')
    op.drop_column('user_permissions', 'can_edit_invoices')
    op.drop_column('user_permissions', 'can_view_collections')


def downgrade() -> None:
    # Re-add permission columns
    op.add_column('user_permissions',
        sa.Column('can_view_invoices', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('user_permissions',
        sa.Column('can_create_invoices', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('user_permissions',
        sa.Column('can_edit_invoices', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('user_permissions',
        sa.Column('can_view_collections', sa.Boolean(), nullable=False, server_default='true'))

    # Recreate enum types
    op.execute("CREATE TYPE paymentstatusenum AS ENUM ('PAID', 'UNPAID', 'PARTIAL')")
    op.execute("CREATE TYPE paymentmodeenum AS ENUM ('CASH', 'UPI', 'CARD', 'OTHER')")

    # Recreate invoices table
    op.create_table('invoices',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('invoice_number', sa.String(), nullable=False),
        sa.Column('patient_id', sa.String(), nullable=False),
        sa.Column('visit_id', sa.String(), nullable=True),
        sa.Column('total_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('paid_amount', sa.Numeric(10, 2), server_default='0'),
        sa.Column('payment_status', postgresql.ENUM('PAID', 'UNPAID', 'PARTIAL', name='paymentstatusenum'), nullable=True),
        sa.Column('payment_mode', postgresql.ENUM('CASH', 'UPI', 'CARD', 'OTHER', name='paymentmodeenum'), nullable=True),
        sa.Column('payment_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['visit_id'], ['visits.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('visit_id')
    )
    op.create_index('ix_invoices_invoice_number', 'invoices', ['invoice_number'], unique=True)

    # Recreate invoice_items table
    op.create_table('invoice_items',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('invoice_id', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('quantity', sa.Integer(), server_default='1'),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
