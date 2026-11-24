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
"""API tests for application URLs."""
from http import HTTPStatus
from unittest.mock import patch

import pytest
from flask import g

from centre_api.auth import jwt
from centre_api.models import SslCertificate
from centre_api.models.application_url import ApplicationUrl


EDITOR_CLAIMS = {
    'preferred_username': 'editor@idir',
    'sub': 'app-url-editor-guid',
    'resource_access': {'epic-centre': {'roles': ['edit_app_url']}},
}


@pytest.fixture
def editor_token():
    """Authenticate requests as a user who can edit application URLs."""
    def _authenticate(*args, **kwargs):
        g.jwt_oidc_token_info = EDITOR_CLAIMS

    with patch.object(jwt, '_require_auth_validation', side_effect=_authenticate):
        yield EDITOR_CLAIMS


@pytest.fixture
def url_id(client, editor_token, session):
    """Create an application URL through the API and return its id."""
    return _create(client, app_name='Test App', environment='DEV',
                   url='https://test-app-dev.example.com').get_json()['id']


def _create(client, **fields):
    payload = {'app_name': 'New App', 'environment': 'PROD', 'url': 'https://new-app.example.com', **fields}
    return client.post('/api/application-urls', json=payload)


class TestSeededUrls:
    """The migration links the seeded URLs to their certificates."""

    def test_urls_on_one_host_share_a_certificate(self, session):
        """Centre, Track, Compliance and Condition PROD all use system.eao.gov.bc.ca."""
        certificate = SslCertificate.query.filter_by(origin='https://system.eao.gov.bc.ca:443').one()

        assert sorted(url.app_name for url in certificate.urls) == [
            'Condition Repository', 'EPIC Centre', 'EPIC Compliance', 'EPIC Track',
        ]


class TestListApplicationUrls:
    """GET /api/application-urls."""

    def test_order_does_not_change_after_an_update(self, client, editor_token, session):
        """Rows come back by app and environment, not in storage order."""
        for environment in ('TEST', 'DEV', 'PROD'):
            _create(client, app_name='Order App', environment=environment,
                    url=f'https://order-{environment.lower()}.example.com')
        dev = next(row for row in client.get('/api/application-urls').get_json()
                   if row['app_name'] == 'Order App' and row['environment'] == 'DEV')
        client.put(f"/api/application-urls/{dev['id']}", json={'url': 'https://order-dev2.example.com'})

        rows = client.get('/api/application-urls').get_json()

        assert [row['environment'] for row in rows if row['app_name'] == 'Order App'] == ['DEV', 'PROD', 'TEST']


class TestCreateApplicationUrl:
    """POST /api/application-urls."""

    def test_input_is_trimmed_and_creator_recorded(self, client, editor_token, session):
        """Stored the way the web app sends it, whoever calls the API."""
        response = _create(client, app_name='  Trim App ', environment=' demo ', url=' https://trim.example.com ')

        assert response.status_code == HTTPStatus.CREATED
        body = response.get_json()
        assert (body['app_name'], body['environment'], body['url']) == ('Trim App', 'DEMO', 'https://trim.example.com')
        assert session.get(ApplicationUrl, body['id']).created_by == 'editor@idir'

    def test_urls_on_one_host_share_a_certificate(self, client, editor_token, session):
        """The certificate belongs to the host, so a second app on it reuses it."""
        first = _create(client, app_name='Host App', url='https://shared.example.com/one').get_json()
        second = _create(client, app_name='Other App', url='https://SHARED.example.com:443/two').get_json()

        assert first['certificate_id'] is not None
        assert second['certificate_id'] == first['certificate_id']
        assert session.get(SslCertificate, first['certificate_id']).origin == 'https://shared.example.com:443'

    def test_http_url_has_no_certificate(self, client, editor_token, session):
        """Plain http has no certificate to check."""
        response = _create(client, url='http://plain.example.com')

        assert response.status_code == HTTPStatus.CREATED
        assert response.get_json()['certificate_id'] is None

    @pytest.mark.parametrize('url', ['ftp://files.example.com', 'https://intranet'])
    def test_non_web_url_is_rejected(self, client, editor_token, url):
        """Only http(s) URLs, since they're rendered as links."""
        response = _create(client, url=url)

        assert response.status_code == HTTPStatus.BAD_REQUEST
        assert 'url' in response.get_json()['errors']

    def test_second_url_for_an_environment_is_rejected(self, client, editor_token, url_id):
        """One URL per app and environment, ignoring case."""
        response = _create(client, app_name='test app', environment='dev')

        assert response.status_code == HTTPStatus.CONFLICT
        assert response.get_json()['errors']['environment'] == [
            'Test App already has a DEV URL. Edit that one instead.'
        ]

    def test_new_environment_uses_the_existing_app_name(self, client, editor_token, url_id):
        """A differently-cased name joins the existing app instead of starting a new one."""
        response = _create(client, app_name='TEST APP', environment='UAT')

        assert response.status_code == HTTPStatus.CREATED
        assert response.get_json()['app_name'] == 'Test App'


class TestUpdateApplicationUrl:
    """PUT /api/application-urls/<id>."""

    def test_new_host_moves_the_url_to_its_certificate(self, client, editor_token, session, url_id):
        """The old host's certificate says nothing about the new one."""
        before = session.get(ApplicationUrl, url_id).certificate_id

        response = client.put(f'/api/application-urls/{url_id}', json={'url': 'https://moved.example.com'})

        body = response.get_json()
        assert response.status_code == HTTPStatus.OK
        assert body['certificate_id'] != before
        assert session.get(SslCertificate, body['certificate_id']).host == 'moved.example.com'
        assert session.get(ApplicationUrl, url_id).updated_by == 'editor@idir'

    def test_new_path_keeps_the_certificate(self, client, editor_token, session, url_id):
        """Same host, same certificate."""
        before = session.get(ApplicationUrl, url_id).certificate_id

        response = client.put(f'/api/application-urls/{url_id}', json={'url': 'https://test-app-dev.example.com/app'})

        assert response.get_json()['certificate_id'] == before

    def test_url_is_required(self, client, editor_token, url_id):
        """Renewal tracking moved to the certificate, so the URL is the only field."""
        response = client.put(f'/api/application-urls/{url_id}', json={'ticket_reference': 'OPS-1'})

        assert response.status_code == HTTPStatus.BAD_REQUEST
        assert 'url' in response.get_json()['errors']


class TestDeleteApplicationUrl:
    """DELETE /api/application-urls/<id>."""

    def test_delete_deactivates_the_row(self, client, editor_token, session, url_id):
        """The row stays for history but is gone from the list and can't be edited."""
        response = client.delete(f'/api/application-urls/{url_id}')

        assert response.status_code == HTTPStatus.NO_CONTENT
        row = session.get(ApplicationUrl, url_id)
        assert row.is_active is False
        assert row.updated_by == 'editor@idir'
        assert url_id not in [url['id'] for url in client.get('/api/application-urls').get_json()]
        put = client.put(f'/api/application-urls/{url_id}', json={'url': 'https://x.example.com'})
        assert put.status_code == HTTPStatus.NOT_FOUND
        assert client.delete(f'/api/application-urls/{url_id}').status_code == HTTPStatus.NOT_FOUND

    def test_deleted_environment_can_be_added_again(self, client, editor_token, url_id):
        """A deactivated row doesn't count as a duplicate."""
        client.delete(f'/api/application-urls/{url_id}')

        response = _create(client, app_name='Test App', environment='DEV')

        assert response.status_code == HTTPStatus.CREATED
