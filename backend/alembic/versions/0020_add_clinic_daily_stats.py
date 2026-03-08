"""Add clinic_daily_stats table for usage analytics

Revision ID: 0020_add_clinic_daily_stats
Revises: 0019_audit_dpdp_compliance
Create Date: 2026-03-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0020_add_clinic_daily_stats'
down_revision: Union[str, None] = '0019_audit_dpdp_compliance'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS clinic_daily_stats (
            id VARCHAR NOT NULL,
            clinic_id VARCHAR NOT NULL,
            stat_date DATE NOT NULL,
            unique_logins INTEGER DEFAULT 0,
            total_logins INTEGER DEFAULT 0,
            patients_created INTEGER DEFAULT 0,
            appointments_created INTEGER DEFAULT 0,
            visits_completed INTEGER DEFAULT 0,
            prescriptions_written INTEGER DEFAULT 0,
            total_collections NUMERIC(10, 2) DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT now(),
            PRIMARY KEY (id),
            FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
            CONSTRAINT uq_clinic_daily_stats UNIQUE (clinic_id, stat_date)
        );

        CREATE INDEX IF NOT EXISTS ix_clinic_daily_stats_clinic_id
            ON clinic_daily_stats (clinic_id);
        CREATE INDEX IF NOT EXISTS ix_clinic_daily_stats_stat_date
            ON clinic_daily_stats (stat_date);
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS clinic_daily_stats;")
