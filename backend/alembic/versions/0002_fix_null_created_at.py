"""Fix NULL created_at values in users table

Revision ID: 0002_fix_null_created_at
Revises: 0001_initial
Create Date: 2026-01-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0002_fix_null_created_at'
down_revision: Union[str, None] = '0001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update all NULL created_at values to a default date (2024-01-01 00:00:00)
    op.execute(
        "UPDATE users SET created_at = '2024-01-01 00:00:00+00' WHERE created_at IS NULL"
    )


def downgrade() -> None:
    # No downgrade needed - we don't want to revert to NULL values
    pass
