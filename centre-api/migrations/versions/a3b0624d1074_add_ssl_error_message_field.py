"""add_ssl_error_message_field

Revision ID: a3b0624d1074
Revises: e55517dc0fd8
Create Date: 2026-02-08 11:00:02.633151

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a3b0624d1074'
down_revision = 'e55517dc0fd8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('application_urls', sa.Column('ssl_error_message', sa.String(length=500), nullable=True))


def downgrade():
    op.drop_column('application_urls', 'ssl_error_message')
