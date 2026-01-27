"""Add can_edit_print_settings permission

Revision ID: 0012_print_settings
Revises: 0011_user_permissions
Create Date: 2026-01-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0012_print_settings'
down_revision: Union[str, None] = '0011_user_permissions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the new column with default value False
    op.add_column(
        'user_permissions',
        sa.Column('can_edit_print_settings', sa.Boolean(), nullable=False, server_default='false')
    )

    # Update existing records: Set to True for doctors only
    # Update all doctor users to have permission to edit print settings
    op.execute("""
        UPDATE user_permissions
        SET can_edit_print_settings = true
        WHERE user_id IN (
            SELECT id FROM users WHERE role = 'DOCTOR'
        )
    """)


def downgrade() -> None:
    # Remove the column
    op.drop_column('user_permissions', 'can_edit_print_settings')
