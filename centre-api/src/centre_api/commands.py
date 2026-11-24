"""Flask CLI commands, run as `flask <group> <command>`."""
import click
from flask.cli import AppGroup
from sqlalchemy import text

from centre_api.models.db import db
from centre_api.services.ssl_check_service import SslCheckService
from centre_api.services.ssl_notification_service import SslNotificationService


# Advisory lock key: a manual run can't overlap the scheduled one
SSL_RUN_LOCK_KEY = 735_201

ssl_cli = AppGroup('ssl', help='SSL certificate checks and renewal notices.')


@ssl_cli.command('run')
@click.option('--no-notify', is_flag=True, help='Check certificates without sending notices.')
def run_ssl(no_notify):
    """Check every certificate in use, then send the renewal notices that are due.

    Exits non-zero only when a notice couldn't be sent. A certificate that fails its check is
    a result, recorded on the certificate, not a failed run.
    """
    with db.engine.connect() as lock:
        if not lock.execute(text('SELECT pg_try_advisory_lock(:key)'), {'key': SSL_RUN_LOCK_KEY}).scalar():
            click.echo('Another SSL run is in progress, so this one did nothing.')
            return
        try:
            _check_and_notify(no_notify)
        finally:
            lock.execute(text('SELECT pg_advisory_unlock(:key)'), {'key': SSL_RUN_LOCK_KEY})


def _check_and_notify(no_notify):
    certificates = SslCheckService.check_all()
    for certificate in certificates:
        expires = certificate.expires_at.date().isoformat() if certificate.expires_at else '-'
        click.echo(f'{certificate.origin}  {certificate.status()}  expires {expires}  {certificate.check_error or ""}'
                   .rstrip())
    click.echo(f'Checked {len(certificates)} certificate(s).')

    if no_notify:
        return
    run = SslNotificationService.send_due_notices()
    if run.skipped_reason:
        click.echo(run.skipped_reason)
        return
    click.echo(f'{run.due} notice(s) due; emailed {len(run.sent)} recipient(s).')
    if run.failed:
        failures = '; '.join(run.failed)
        raise click.ClickException(f'Some notices were not sent and will be retried next run: {failures}')
