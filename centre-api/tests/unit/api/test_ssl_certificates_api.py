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
"""API tests for SSL certificates."""
from datetime import datetime, timedelta
from http import HTTPStatus
from unittest.mock import patch

import pytest
from flask import g

from centre_api.auth import jwt
from centre_api.models import SslCertificate
from centre_api.models.application_url import ApplicationUrl
from centre_api.services.ssl_check_service import CertificateReading, SslCheckService


EDITOR = {'preferred_username': 'editor@idir', 'sub': 'editor-guid',
          'resource_access': {'epic-centre': {'roles': ['edit_app_url']}}}
VIEWER = {'preferred_username': 'viewer@idir', 'sub': 'viewer-guid',
          'resource_access': {'epic-centre': {'roles': ['view_ssl_info']}}}
SHARED_ORIGIN = 'https://system.eao.gov.bc.ca:443'


@pytest.fixture
def sign_in():
    """Return a function that authenticates the next requests with the claims it's given."""
    claims = {}

    def _authenticate(*args, **kwargs):
        g.jwt_oidc_token_info = claims

    with patch.object(jwt, '_require_auth_validation', side_effect=_authenticate):
        yield lambda new_claims: claims.update(new_claims)


def _shared_certificate_id():
    return SslCertificate.query.filter_by(origin=SHARED_ORIGIN).one().id


def _unused_certificate(session):
    """Add a certificate only a deactivated URL uses, as when a URL moves to another host."""
    unused = SslCertificate(origin='https://old.example.com:443', host='old.example.com', port=443)
    session.add(unused)
    session.add(ApplicationUrl(app_name='Old App', environment='PROD', url='https://old.example.com',
                               certificate=unused, is_active=False))
    session.commit()
    return unused


class TestListCertificates:
    """GET /api/ssl-certificates."""

    def test_viewer_sees_certificates_in_use(self, client, session, sign_in):
        """One per host the active URLs use, never checked yet."""
        sign_in(VIEWER)

        response = client.get('/api/ssl-certificates')

        assert response.status_code == HTTPStatus.OK
        shared = next(row for row in response.get_json() if row['origin'] == SHARED_ORIGIN)
        assert shared['status'] == 'Unknown'
        assert shared['is_platform_managed'] is False
        platform = next(row for row in response.get_json() if row['host'].endswith('.devops.gov.bc.ca'))
        assert platform['is_platform_managed'] is True

    def test_certificate_without_active_urls_is_left_out(self, client, session, sign_in):
        """A host no active URL uses any more isn't tracked."""
        sign_in(VIEWER)
        _unused_certificate(session)

        origins = [row['origin'] for row in client.get('/api/ssl-certificates').get_json()]

        assert 'https://old.example.com:443' not in origins


class TestUpdateRenewal:
    """PATCH /api/ssl-certificates/<id>."""

    def test_editor_records_renewal_progress(self, client, session, sign_in):
        """Trimmed, blanks as null, and who changed it."""
        sign_in(EDITOR)
        certificate_id = _shared_certificate_id()

        response = client.patch(f'/api/ssl-certificates/{certificate_id}', json={
            'ticket_reference': ' INFRA-12 ', 'renewal_status': 'ORDERED', 'renewal_comments': '  ',
        })

        assert response.status_code == HTTPStatus.OK
        body = response.get_json()
        assert (body['ticket_reference'], body['renewal_status'], body['renewal_comments']) == \
            ('INFRA-12', 'ORDERED', None)
        assert session.get(SslCertificate, certificate_id).updated_by == 'editor@idir'

    def test_check_results_cannot_be_set(self, client, session, sign_in):
        """Only checks set the expiry."""
        sign_in(EDITOR)
        certificate_id = _shared_certificate_id()

        client.patch(f'/api/ssl-certificates/{certificate_id}', json={'expires_at': '2030-01-01T00:00:00'})

        assert session.get(SslCertificate, certificate_id).expires_at is None

    def test_unknown_status_is_rejected(self, client, session, sign_in):
        """Renewal status is one of the listed stages."""
        sign_in(EDITOR)

        response = client.patch(f'/api/ssl-certificates/{_shared_certificate_id()}', json={'renewal_status': 'DONE'})

        assert response.status_code == HTTPStatus.BAD_REQUEST
        assert 'renewal_status' in response.get_json()['errors']

    def test_viewer_cannot_edit(self, client, session, sign_in):
        """Editing needs edit_app_url."""
        sign_in(VIEWER)

        response = client.patch(f'/api/ssl-certificates/{_shared_certificate_id()}', json={'renewal_status': 'ORDERED'})

        assert response.status_code == HTTPStatus.FORBIDDEN


class TestCheckNow:
    """POST /api/ssl-certificates/<id>/check."""

    def test_editor_checks_one_certificate(self, client, session, sign_in):
        """Checks the host now and returns the result."""
        sign_in(EDITOR)
        reading = CertificateReading(expires_at=datetime.utcnow() + timedelta(days=200), issuer='Entrust')
        with patch.object(SslCheckService, 'read_certificate', return_value=reading) as read:
            response = client.post(f'/api/ssl-certificates/{_shared_certificate_id()}/check')

        assert response.status_code == HTTPStatus.OK
        assert read.call_args.args[:2] == ('system.eao.gov.bc.ca', 443)
        body = response.get_json()
        assert (body['status'], body['issuer']) == ('Valid', 'Entrust')
        assert body['last_checked'].endswith('+00:00')

    def test_unknown_certificate(self, client, session, sign_in):
        """404, without connecting anywhere."""
        sign_in(EDITOR)
        with patch.object(SslCheckService, 'read_certificate') as read:
            response = client.post('/api/ssl-certificates/999999/check')

        assert response.status_code == HTTPStatus.NOT_FOUND
        read.assert_not_called()

    def test_certificate_without_active_urls_cannot_be_edited_or_checked(self, client, session, sign_in):
        """The list hides it, so neither endpoint finds it either."""
        sign_in(EDITOR)
        certificate_id = _unused_certificate(session).id

        with patch.object(SslCheckService, 'read_certificate') as read:
            check = client.post(f'/api/ssl-certificates/{certificate_id}/check')
        renewal = client.patch(f'/api/ssl-certificates/{certificate_id}', json={'renewal_status': 'ORDERED'})

        assert (check.status_code, renewal.status_code) == (HTTPStatus.NOT_FOUND, HTTPStatus.NOT_FOUND)
        read.assert_not_called()
        assert session.get(SslCertificate, certificate_id).renewal_status == 'NONE'
