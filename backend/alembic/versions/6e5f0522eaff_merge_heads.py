"""merge_heads

Revision ID: 6e5f0522eaff
Revises: a1b2c3d4e5f6, e1a2b3c4d5e6
Create Date: 2026-01-17 15:34:47.206157

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6e5f0522eaff'
down_revision: Union[str, None] = ('a1b2c3d4e5f6', 'e1a2b3c4d5e6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
