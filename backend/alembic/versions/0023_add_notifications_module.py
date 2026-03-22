"""Add notifications module: notification_logs table,
plugin_notifications and notification_config on clinics.

Revision ID: 0023_add_notifications_module
Revises: 0022_add_vaccination_module
Create Date: 2026-03-22

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0023_add_notifications_module'
down_revision: Union[str, None] = '0022_add_vaccination_module'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add plugin_notifications and notification_config to clinics (idempotent)
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE clinics ADD COLUMN plugin_notifications BOOLEAN NOT NULL DEFAULT false;
        EXCEPTION WHEN duplicate_column THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE clinics ADD COLUMN notification_config JSON;
        EXCEPTION WHEN duplicate_column THEN null;
        END $$;
    """)

    # Create enum types (idempotent)
    op.execute("DO $$ BEGIN CREATE TYPE notificationchannelenum AS ENUM ('WHATSAPP', 'SMS'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE notificationstatusenum AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE notificationtypeenum AS ENUM ('VACCINATION_DUE', 'VACCINATION_OVERDUE', 'FOLLOW_UP_REMINDER'); EXCEPTION WHEN duplicate_object THEN null; END $$;")

    # Create notification_logs table (idempotent)
    op.execute("""
        CREATE TABLE IF NOT EXISTS notification_logs (
            id VARCHAR NOT NULL PRIMARY KEY,
            clinic_id VARCHAR NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
            patient_id VARCHAR REFERENCES patients(id) ON DELETE SET NULL,
            phone VARCHAR NOT NULL,
            channel notificationchannelenum NOT NULL,
            notification_type notificationtypeenum NOT NULL,
            status notificationstatusenum NOT NULL DEFAULT 'QUEUED',
            message_body TEXT NOT NULL,
            template_id VARCHAR,
            provider_message_id VARCHAR,
            error_message VARCHAR,
            sent_at TIMESTAMP WITH TIME ZONE,
            delivered_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)

    # Create indexes (idempotent)
    op.execute("CREATE INDEX IF NOT EXISTS ix_notification_logs_clinic_id ON notification_logs (clinic_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notification_logs_patient_id ON notification_logs (patient_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notification_logs_created_at ON notification_logs (created_at)")


def downgrade() -> None:
    op.drop_table('notification_logs')
    op.execute("DROP TYPE notificationtypeenum")
    op.execute("DROP TYPE notificationstatusenum")
    op.execute("DROP TYPE notificationchannelenum")
    op.drop_column('clinics', 'notification_config')
    op.drop_column('clinics', 'plugin_notifications')
