"""Add soft-delete fields to vaccination_records.

Revision ID: 0028_vacc_record_soft_delete
Revises: 0027_add_medicine_defaults
Create Date: 2026-03-22
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0028_vacc_record_soft_delete'
down_revision: Union[str, None] = '0027_add_medicine_defaults'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("vaccination_records", sa.Column("is_voided", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("vaccination_records", sa.Column("void_reason", sa.String(), nullable=True))
    op.add_column("vaccination_records", sa.Column("voided_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("vaccination_records", sa.Column("voided_by", sa.String(), nullable=True))
    op.create_foreign_key("fk_vaccination_records_voided_by", "vaccination_records", "users", ["voided_by"], ["id"], ondelete="SET NULL")


def downgrade() -> None:
    op.drop_constraint("fk_vaccination_records_voided_by", "vaccination_records", type_="foreignkey")
    op.drop_column("vaccination_records", "voided_by")
    op.drop_column("vaccination_records", "voided_at")
    op.drop_column("vaccination_records", "void_reason")
    op.drop_column("vaccination_records", "is_voided")
