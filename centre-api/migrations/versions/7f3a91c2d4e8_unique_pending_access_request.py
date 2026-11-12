"""allow one pending access request per user and app

Revision ID: 7f3a91c2d4e8
Revises: e55517dc0fd8
Create Date: 2026-11-12 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7f3a91c2d4e8'
down_revision = 'e55517dc0fd8'
branch_labels = None
depends_on = None


def upgrade():
    # Cancel duplicate pending requests left by past double submits, keeping the oldest
    op.execute(
        """
        UPDATE access_requests SET status = 'CANCELLED'
        WHERE status = 'PENDING'
          AND id NOT IN (
              SELECT MIN(id) FROM access_requests
              WHERE status = 'PENDING'
              GROUP BY app_id, user_auth_guid
          )
        """
    )
    op.create_index(
        'uq_access_requests_one_pending',
        'access_requests',
        ['app_id', 'user_auth_guid'],
        unique=True,
        postgresql_where=sa.text("status = 'PENDING'"),
    )


def downgrade():
    op.drop_index('uq_access_requests_one_pending', table_name='access_requests')
