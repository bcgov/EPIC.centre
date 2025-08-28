""" Add initial applications

Revision ID: 9d9c97c6acbc
Revises: 15eafacef9cd
Create Date: 2025-08-28 13:46:53.796616

"""
import datetime

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9d9c97c6acbc'
down_revision = '15eafacef9cd'
branch_labels = None
depends_on = None


def upgrade():
    # Add the title column
    op.add_column('applications', sa.Column('title', sa.String(100), nullable=True))

    # Insert data with the new title field and update the name field
    op.bulk_insert(
        sa.table(
            'applications',
            sa.column('name', sa.String),
            sa.column('title', sa.String),
            sa.column('description', sa.Text),
            sa.column('launch_url', sa.Text),
            sa.column('is_active', sa.Boolean),
            sa.column('created_date', sa.DateTime),
            sa.column('updated_date', sa.DateTime),
            sa.column('created_by', sa.String),
            sa.column('updated_by', sa.String),
        ),
        [
            {
                'name': 'condition_repository',
                'title': 'Condition Repository',
                'description': 'Review and approve conditions',
                'launch_url': '',
                'is_active': True,
                'created_date': datetime.datetime.now(),
                'updated_date': None,
                'created_by': None,
                'updated_by': None,
            },
            {
                'name': 'epic_compliance',
                'title': 'EPIC.compliance',
                'description': 'Application for the Compliance & Enforcement Team',
                'launch_url': '',
                'is_active': True,
                'created_date': datetime.datetime.now(),
                'updated_date': None,
                'created_by': None,
                'updated_by': None,
            },
            {
                'name': 'document_search',
                'title': 'Document Search',
                'description': 'Search all the documents in EPIC',
                'launch_url': '',
                'is_active': True,
                'created_date': datetime.datetime.now(),
                'updated_date': None,
                'created_by': None,
                'updated_by': None,
            },
            {
                'name': 'epic_track',
                'title': 'EPIC.track',
                'description': 'Internal Project’s tracking Tool',
                'launch_url': '',
                'is_active': True,
                'created_date': datetime.datetime.now(),
                'updated_date': None,
                'created_by': None,
                'updated_by': None,
            },
            {
                'name': 'epic_public',
                'title': 'EPIC.public',
                'description': 'The public EPIC website for  projects’ information and documents',
                'launch_url': '',
                'is_active': True,
                'created_date': datetime.datetime.now(),
                'updated_date': None,
                'created_by': None,
                'updated_by': None,
            },
            {
                'name': 'epic_submit',
                'title': 'EPIC.submit',
                'description': 'Document submission Tool for Proponents and Holders',
                'launch_url': '',
                'is_active': True,
                'created_date': datetime.datetime.now(),
                'updated_date': None,
                'created_by': None,
                'updated_by': None,
            },
            {
                'name': 'epic_engage',
                'title': 'EPIC.engage',
                'description': 'Public Engagement Application',
                'launch_url': '',
                'is_active': True,
                'created_date': datetime.datetime.now(),
                'updated_date': None,
                'created_by': None,
                'updated_by': None,
            },
        ]
    )

    # Make the title column non-nullable
    op.alter_column('applications', 'title', nullable=False)


def downgrade():
    # Remove the title column
    op.drop_column('applications', 'title')
