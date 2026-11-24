# Copyright © 2026 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Tests for `flask ssl run`, the daily job."""
from datetime import datetime, timedelta
from unittest.mock import patch

import pytest
from sqlalchemy import text

from centre_api.commands import SSL_RUN_LOCK_KEY
from centre_api.models.db import db
from centre_api.services.eagle_notify_service import EagleNotifyError, EagleNotifyService
from centre_api.services.ssl_check_service import CertificateReading, SslCheckService


@pytest.fixture
def expiring_soon():
    """Every host serves a certificate expiring in 5 days."""
    reading = CertificateReading(expires_at=datetime.utcnow() + timedelta(days=5), issuer='Test CA')
    with patch.object(SslCheckService, 'read_certificate', return_value=reading):
        yield


def _run(app, *args):
    return app.test_cli_runner().invoke(args=['ssl', 'run', *args])


def test_checks_without_notifying(app, session, expiring_soon):  # pylint: disable=unused-argument
    """--no-notify checks and records, and sends nothing."""
    with patch.object(EagleNotifyService, 'send_email') as send:
        result = _run(app, '--no-notify')

    assert result.exit_code == 0, result.output
    assert 'https://system.eao.gov.bc.ca:443  Expiring Soon' in result.output
    assert 'Checked 12 certificate(s).' in result.output
    send.assert_not_called()


def test_no_recipients_skips_email(app, session, expiring_soon, monkeypatch):  # pylint: disable=unused-argument
    """Prod until Eagle Notify is live: checks run, and Keycloak and Eagle Notify aren't called."""
    monkeypatch.setitem(app.config, 'SSL_NOTIFICATION_RECIPIENTS', [])
    with patch.object(EagleNotifyService, 'send_email') as send, \
            patch('centre_api.services.eagle_notify_service.KeycloakTokenService.get_service_account_token') as token:
        result = _run(app)

    assert result.exit_code == 0, result.output
    assert 'Checked 12 certificate(s).' in result.output
    assert 'SSL_NOTIFICATION_RECIPIENTS is empty' in result.output
    send.assert_not_called()
    token.assert_not_called()


def test_failed_send_fails_the_job(app, session, expiring_soon, monkeypatch):  # pylint: disable=unused-argument
    """So OpenShift shows a failed Job instead of a quiet success."""
    monkeypatch.setitem(app.config, 'SSL_NOTIFICATION_RECIPIENTS', ['renewals@example.com'])
    with patch.object(EagleNotifyService, 'send_email', side_effect=EagleNotifyError('Eagle Notify answered 502')):
        result = _run(app)

    assert result.exit_code == 1
    assert 'will be retried next run' in result.output


def test_overlapping_run_does_nothing(app, session, expiring_soon):  # pylint: disable=unused-argument
    """A manual run while the scheduled one holds the lock can't double-send."""
    with db.engine.connect() as other_run:
        other_run.execute(text('SELECT pg_advisory_lock(:key)'), {'key': SSL_RUN_LOCK_KEY})
        try:
            with patch.object(SslCheckService, 'check_all') as check_all:
                result = _run(app)
        finally:
            other_run.execute(text('SELECT pg_advisory_unlock(:key)'), {'key': SSL_RUN_LOCK_KEY})

    assert result.exit_code == 0
    assert 'Another SSL run is in progress' in result.output
    check_all.assert_not_called()
