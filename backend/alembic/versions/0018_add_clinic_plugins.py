"""Add plugin flags to clinics table

Revision ID: 0018_add_clinic_plugins
Revises: 0017_add_print_templates
Create Date: 2026-03-02

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0018_add_clinic_plugins'
down_revision: Union[str, None] = '0017_add_print_templates'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('clinics', sa.Column('plugin_opd_queue', sa.Boolean(), nullable=False, server_default=sa.text('true')))
    op.add_column('clinics', sa.Column('plugin_collections', sa.Boolean(), nullable=False, server_default=sa.text('true')))


def downgrade() -> None:
    op.drop_column('clinics', 'plugin_collections')
    op.drop_column('clinics', 'plugin_opd_queue')
