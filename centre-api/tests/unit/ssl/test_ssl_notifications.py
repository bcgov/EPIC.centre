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
"""Tests for deciding, sending and logging SSL renewal notices."""
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
import requests

from centre_api.models import SslCertificate, SslNotification
from centre_api.models.application_url import ApplicationUrl
from centre_api.services.eagle_notify_service import EagleNotifyError, EagleNotifyService
from centre_api.services.ssl_notification_service import SslNotificationService


NOW = datetime(2026, 11, 24, 15, 0)
RECIPIENTS = ['renewals@example.com', 'backup@example.com']


def _certificate(session, host, days=None, failing_hours=None, ticket=None):
    """Add a checked certificate for `host`, used by one active URL."""
    certificate = SslCertificate(
        origin=f'https://{host}:443', host=host, port=443, renewal_status='NONE', ticket_reference=ticket,
        last_checked=NOW,
        expires_at=NOW + timedelta(days=days) if days is not None else None,
        failing_since=NOW - timedelta(hours=failing_hours) if failing_hours else None,
        check_error='Timed out connecting' if failing_hours else None,
    )
    session.add(certificate)
    session.add(ApplicationUrl(app_name=f'App on {host}', environment='PROD', url=f'https://{host}/',
                               certificate=certificate, is_active=True))
    session.commit()
    return certificate


@pytest.fixture
def recipients(app, monkeypatch):
    """Send notices to two addresses, through a fake Eagle Notify."""
    monkeypatch.setitem(app.config, 'SSL_NOTIFICATION_RECIPIENTS', RECIPIENTS)
    with patch.object(EagleNotifyService, 'send_email', return_value='message-1') as send:
        yield send


def _notices(certificate, now=NOW):
    return [notice.notice for notice in SslNotificationService.due_notices(certificate, now)]


class TestDueNotices:
    """Which notice a certificate is due."""

    @pytest.mark.parametrize('days, expected', [
        (61, []),
        (60, ['expires_within_60']),
        (49, ['expires_within_60']),
        (25, ['expires_within_30']),
        (0.5, ['expires_within_1']),
        (-1, ['expired']),
    ])
    def test_expiry_bands(self, session, days, expected):
        """One band at a time, the nearest one the certificate is within."""
        assert _notices(_certificate(session, 'band.example.com', days=days)) == expected

    def test_failing_check_waits_a_day(self, session):
        """A blip sends nothing; a check failing for a day does."""
        assert _notices(_certificate(session, 'blip.example.com', days=90, failing_hours=2)) == []
        assert _notices(_certificate(session, 'down.example.com', days=90, failing_hours=25)) == ['check_failing']

    def test_expired_certificate_gets_only_the_expiry_notice(self, session):
        """Its check fails because it expired; one notice says so."""
        assert _notices(_certificate(session, 'gone.example.com', days=-2, failing_hours=48)) == ['expired']

    def test_platform_certificates_get_none(self, session):
        """The platform renews these."""
        assert _notices(_certificate(session, 'eao-x.apps.gold.devops.gov.bc.ca', days=-1)) == []


class TestSendDueNotices:
    """SslNotificationService.send_due_notices."""

    def test_nothing_is_sent_without_recipients(self, app, session, monkeypatch):
        """Dev and test check certificates but leave recipients empty."""
        monkeypatch.setitem(app.config, 'SSL_NOTIFICATION_RECIPIENTS', [])
        _certificate(session, 'soon.example.com', days=5)

        with patch.object(EagleNotifyService, 'send_email') as send:
            run = SslNotificationService.send_due_notices(NOW)

        assert run.skipped_reason
        send.assert_not_called()

    def test_each_recipient_gets_one_email_with_every_notice_once(self, session, recipients):
        """One digest per recipient per run, and the next run sends nothing new."""
        _certificate(session, 'soon.example.com', days=5)
        _certificate(session, 'later.example.com', days=45)

        run = SslNotificationService.send_due_notices(NOW)

        assert run.sent == RECIPIENTS
        assert [call.args[0] for call in recipients.call_args_list] == RECIPIENTS
        subject = recipients.call_args.args[1]
        assert subject == '2 SSL certificates need renewal attention'
        assert SslNotification.query.count() == 4

        recipients.reset_mock()
        SslNotificationService.send_due_notices(NOW + timedelta(hours=1))
        recipients.assert_not_called()

    def test_failed_send_is_retried_next_run(self, session, recipients):
        """Nothing is logged for a recipient Eagle Notify refused, so they get it next time."""
        _certificate(session, 'soon.example.com', days=5)
        recipients.side_effect = [EagleNotifyError('Eagle Notify answered 429 messages_rate_limited'),
                                  'message-2']

        run = SslNotificationService.send_due_notices(NOW)

        assert run.sent == ['backup@example.com']
        assert run.failed == ['renewals@example.com: Eagle Notify answered 429 messages_rate_limited']

        recipients.reset_mock(side_effect=True)
        recipients.return_value = 'message-3'
        SslNotificationService.send_due_notices(NOW + timedelta(days=1))
        assert [call.args[0] for call in recipients.call_args_list] == ['renewals@example.com']

    def test_next_band_and_renewal_each_send_again(self, session, recipients):
        """Coming within 30 days is a new notice, and a renewed certificate starts afresh."""
        certificate = _certificate(session, 'cycle.example.com', days=45)
        SslNotificationService.send_due_notices(NOW)

        later = NOW + timedelta(days=20)
        SslNotificationService.send_due_notices(later)
        certificate.expires_at = later + timedelta(days=50)
        session.commit()
        SslNotificationService.send_due_notices(later)

        sent = SslNotification.query.filter_by(certificate_id=certificate.id, recipient=RECIPIENTS[0]).all()
        assert [(row.notice, row.occurrence) for row in sorted(sent, key=lambda row: row.id)] == [
            ('expires_within_60', (NOW + timedelta(days=45)).date().isoformat()),
            ('expires_within_30', (NOW + timedelta(days=45)).date().isoformat()),
            ('expires_within_60', (later + timedelta(days=50)).date().isoformat()),
        ]


class TestRender:
    """The email's subject and body."""

    def test_one_certificate(self, session):
        """The subject names the host and how long is left."""
        certificate = _certificate(session, 'system.example.com', days=49, ticket='INFRA-12')

        subject, html = SslNotificationService.render(SslNotificationService.due_notices(certificate, NOW), NOW)

        assert subject == 'SSL certificate for system.example.com expires in 49 days'
        assert 'App on system.example.com PROD' in html
        assert 'ticket INFRA-12' in html
        assert 'within 60, 30, 14, 7 and 1 days' in html

    def test_values_are_escaped(self, session):
        """App names are staff input; they can't add markup to the email."""
        certificate = _certificate(session, 'x.example.com', days=5)
        certificate.urls[0].app_name = '<img src=x onerror=alert(1)>'

        _, html = SslNotificationService.render(SslNotificationService.due_notices(certificate, NOW), NOW)

        assert '<img src=x' not in html
        assert '&lt;img src=x onerror=alert(1)&gt;' in html


class TestEagleNotifyService:
    """EagleNotifyService.send_email."""

    @pytest.fixture
    def endpoint(self, app, monkeypatch):
        """Point at a fake Eagle Notify and skip Keycloak."""
        monkeypatch.setitem(app.config, 'EAGLE_NOTIFY_EMAIL_ENDPOINT', 'https://notify.example.com/api/messages')
        with patch('centre_api.services.eagle_notify_service.KeycloakTokenService.get_service_account_token',
                   return_value='token'):
            yield

    def test_sends_one_html_email(self, endpoint):  # pylint: disable=unused-argument
        """The body Eagle Notify's service-sender API takes."""
        response = MagicMock(status_code=202)
        response.json.return_value = {'status': 'accepted', 'id': 'abc'}
        with patch('centre_api.services.eagle_notify_service.requests.post', return_value=response) as post:
            message_id = EagleNotifyService.send_email('a@example.com', 'Subject', '<p>Hi</p>', 'tpl')

        assert message_id == 'abc'
        assert post.call_args.args[0] == 'https://notify.example.com/api/messages'
        assert post.call_args.kwargs['headers'] == {'Authorization': 'Bearer token'}
        assert post.call_args.kwargs['json'] == {
            'to': ['a@example.com'], 'bodyType': 'html', 'subject': 'Subject', 'body': '<p>Hi</p>',
            'template_id': 'tpl', 'args': {},
        }

    def test_refusal_raises_with_the_reason(self, endpoint):  # pylint: disable=unused-argument
        """Anything but 202 is a failed send."""
        response = MagicMock(status_code=429)
        response.json.return_value = {'error': 'send_budget_exhausted'}
        with patch('centre_api.services.eagle_notify_service.requests.post', return_value=response), \
                pytest.raises(EagleNotifyError, match='429 send_budget_exhausted'):
            EagleNotifyService.send_email('a@example.com', 'Subject', '<p>Hi</p>', 'tpl')

    def test_unreachable_raises(self, endpoint):  # pylint: disable=unused-argument
        """A network failure is a failed send, not a crash."""
        with patch('centre_api.services.eagle_notify_service.requests.post',
                   side_effect=requests.ConnectionError('down')), \
                pytest.raises(EagleNotifyError, match='Could not reach Eagle Notify'):
            EagleNotifyService.send_email('a@example.com', 'Subject', '<p>Hi</p>', 'tpl')

    @pytest.mark.parametrize('failure, reason', [
        (requests.HTTPError(response=MagicMock(status_code=401)), r'Keycloak refused .* token \(401\)'),
        (requests.ConnectionError('down'), 'Could not reach Keycloak'),
        (None, 'Keycloak returned no access token'),
    ])
    def test_token_failure_names_keycloak(self, app, monkeypatch, failure, reason):
        """A bad service account secret reads as a Keycloak failure, and Eagle Notify isn't called."""
        monkeypatch.setitem(app.config, 'EAGLE_NOTIFY_EMAIL_ENDPOINT', 'https://notify.example.com/api/messages')
        token = {'side_effect': failure} if failure else {'return_value': None}
        with patch('centre_api.services.eagle_notify_service.KeycloakTokenService.get_service_account_token',
                   **token), \
                patch('centre_api.services.eagle_notify_service.requests.post') as post, \
                pytest.raises(EagleNotifyError, match=reason):
            EagleNotifyService.send_email('a@example.com', 'Subject', '<p>Hi</p>', 'tpl')
        post.assert_not_called()

    def test_unconfigured_raises(self, app, monkeypatch):
        """Recipients without an endpoint is a misconfiguration, so the run fails loudly."""
        monkeypatch.setitem(app.config, 'EAGLE_NOTIFY_EMAIL_ENDPOINT', '')
        with pytest.raises(EagleNotifyError, match='not set'):
            EagleNotifyService.send_email('a@example.com', 'Subject', '<p>Hi</p>', 'tpl')
