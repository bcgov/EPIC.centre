"""Add epic_centre to applications table for analytics

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2025-02-20

"""
from datetime import datetime, timezone

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision = "c3d4e5f6a7b8"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade():
    applications_table = sa.table(
        "applications",
        sa.column("title", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.Text),
        sa.column("launch_url", sa.Text),
        sa.column("is_active", sa.Boolean),
        sa.column("created_date", sa.DateTime),
        sa.column("updated_date", sa.DateTime),
        sa.column("created_by", sa.String),
        sa.column("updated_by", sa.String),
    )

    op.bulk_insert(
        applications_table,
        [
            {
                "title": "EPIC.centre",
                "name": "epic_centre",
                "description": "Central hub for EAO applications and user management",
                "launch_url": "",
                "is_active": False,
                "created_date": datetime.now(timezone.utc),
                "updated_date": None,
                "created_by": None,
                "updated_by": None,
            }
        ],
    )


def downgrade():
    op.execute("DELETE FROM applications WHERE name = 'epic_centre'")
