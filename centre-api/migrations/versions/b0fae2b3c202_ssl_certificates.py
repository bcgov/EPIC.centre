"""track SSL certificates per host, and the renewal notices sent

One ssl_certificates row per https origin; check results and renewal tracking move there.

Revision ID: b0fae2b3c202
Revises: 7f3a91c2d4e8
Create Date: 2026-11-24 10:00:00.000000

"""
from datetime import datetime
from urllib.parse import urlsplit

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b0fae2b3c202'
down_revision = '7f3a91c2d4e8'
branch_labels = None
depends_on = None

ENV_ORDER = {'PROD': 1, 'TEST': 2, 'DEV': 3}
RENEWAL_COLUMNS = ('ticket_reference', 'renewal_status', 'renewal_comments')


def _https_origin(url):
    """Return (origin, host, port) for an https URL, else None. Mirrors SslCertificate.origin_of."""
    try:
        parts = urlsplit((url or '').strip())
        port = parts.port or 443
    except ValueError:
        return None
    if parts.scheme.lower() != 'https' or not parts.hostname:
        return None
    host = parts.hostname.lower()
    return f'https://{host}:{port}', host, port


def _has_renewal_data(row):
    return bool(row.ticket_reference or row.renewal_comments or (row.renewal_status or 'NONE') != 'NONE')


def upgrade():
    op.create_table(
        'ssl_certificates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('origin', sa.String(length=300), nullable=False),
        sa.Column('host', sa.String(length=255), nullable=False),
        sa.Column('port', sa.Integer(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('issuer', sa.String(length=255), nullable=True),
        sa.Column('subject', sa.String(length=255), nullable=True),
        sa.Column('serial_number', sa.String(length=100), nullable=True),
        sa.Column('fingerprint_sha256', sa.String(length=64), nullable=True),
        sa.Column('check_error', sa.String(length=500), nullable=True),
        sa.Column('last_checked', sa.DateTime(), nullable=True),
        sa.Column('failing_since', sa.DateTime(), nullable=True),
        sa.Column('ticket_reference', sa.String(length=50), nullable=True),
        sa.Column('renewal_status', sa.String(length=50), server_default='NONE', nullable=False),
        sa.Column('renewal_comments', sa.Text(), nullable=True),
        sa.Column('created_date', sa.DateTime(), nullable=False),
        sa.Column('updated_date', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(length=50), nullable=True),
        sa.Column('updated_by', sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('origin', name='uq_ssl_certificates_origin'),
    )
    op.create_table(
        'ssl_notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('certificate_id', sa.Integer(), nullable=False),
        sa.Column('notice', sa.String(length=30), nullable=False),
        # The expiry date or failure start the notice was about, so a renewal starts afresh
        sa.Column('occurrence', sa.String(length=40), nullable=False),
        sa.Column('recipient', sa.String(length=255), nullable=False),
        sa.Column('message_id', sa.String(length=100), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['certificate_id'], ['ssl_certificates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('certificate_id', 'notice', 'occurrence', 'recipient',
                            name='uq_ssl_notifications_once'),
    )
    op.add_column('application_urls', sa.Column('certificate_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_application_urls_certificate', 'application_urls', 'ssl_certificates',
                          ['certificate_id'], ['id'])
    op.create_index('ix_application_urls_certificate_id', 'application_urls', ['certificate_id'])

    _link_urls_to_certificates()

    for column in ('ssl_expiry', 'ssl_status', 'ssl_error_message', 'last_checked') + RENEWAL_COLUMNS:
        op.drop_column('application_urls', column)

    # One active URL per app and environment, keeping the oldest of any duplicates
    op.execute(
        """
        UPDATE application_urls SET is_active = false
        WHERE is_active AND id NOT IN (
            SELECT MIN(id) FROM application_urls WHERE is_active
            GROUP BY lower(app_name), upper(environment)
        )
        """
    )
    op.create_index(
        'uq_application_urls_one_active_env',
        'application_urls',
        [sa.text('lower(app_name)'), sa.text('upper(environment)')],
        unique=True,
        postgresql_where=sa.text('is_active'),
    )


def _link_urls_to_certificates():
    """Create a certificate per https origin, carrying over the renewal details staff entered."""
    bind = op.get_bind()
    rows = bind.execute(sa.text(
        'SELECT id, app_name, environment, url, ticket_reference, renewal_status, renewal_comments '
        'FROM application_urls ORDER BY id'
    )).fetchall()

    by_origin = {}
    for row in rows:
        parsed = _https_origin(row.url)
        if parsed:
            by_origin.setdefault(parsed, []).append(row)

    now = datetime.utcnow()
    for (origin, host, port), origin_rows in by_origin.items():
        # Renewal details from the row most likely to stand for the host
        source = min(origin_rows, key=lambda row: (
            not _has_renewal_data(row),
            urlsplit(row.url).path not in ('', '/'),
            ENV_ORDER.get((row.environment or '').upper(), 99),
            row.id,
        ))
        certificate_id = bind.execute(
            sa.text(
                'INSERT INTO ssl_certificates (origin, host, port, ticket_reference, renewal_status, '
                'renewal_comments, created_date, created_by) '
                'VALUES (:origin, :host, :port, :ticket, :status, :comments, :now, :by) RETURNING id'
            ),
            {
                'origin': origin, 'host': host, 'port': port, 'ticket': source.ticket_reference,
                'status': source.renewal_status or 'NONE', 'comments': source.renewal_comments,
                'now': now, 'by': 'system',
            },
        ).scalar()
        bind.execute(
            sa.text('UPDATE application_urls SET certificate_id = :certificate_id WHERE id = ANY(:ids)'),
            {'certificate_id': certificate_id, 'ids': [row.id for row in origin_rows]},
        )


def downgrade():
    op.drop_index('uq_application_urls_one_active_env', table_name='application_urls')
    op.add_column('application_urls', sa.Column('ssl_expiry', sa.DateTime(), nullable=True))
    op.add_column('application_urls', sa.Column('ssl_status', sa.String(length=50), nullable=True))
    op.add_column('application_urls', sa.Column('ssl_error_message', sa.String(length=500), nullable=True))
    op.add_column('application_urls', sa.Column('last_checked', sa.DateTime(), nullable=True))
    op.add_column('application_urls', sa.Column('ticket_reference', sa.String(length=50), nullable=True))
    op.add_column('application_urls', sa.Column('renewal_status', sa.String(length=50), nullable=True))
    op.add_column('application_urls', sa.Column('renewal_comments', sa.Text(), nullable=True))
    # Every URL gets its certificate's details back
    op.execute(
        """
        UPDATE application_urls u SET
            ssl_expiry = c.expires_at,
            ssl_error_message = c.check_error,
            last_checked = c.last_checked,
            ticket_reference = c.ticket_reference,
            renewal_status = c.renewal_status,
            renewal_comments = c.renewal_comments
        FROM ssl_certificates c WHERE u.certificate_id = c.id
        """
    )
    op.drop_index('ix_application_urls_certificate_id', table_name='application_urls')
    op.drop_constraint('fk_application_urls_certificate', 'application_urls', type_='foreignkey')
    op.drop_column('application_urls', 'certificate_id')
    op.drop_table('ssl_notifications')
    op.drop_table('ssl_certificates')
