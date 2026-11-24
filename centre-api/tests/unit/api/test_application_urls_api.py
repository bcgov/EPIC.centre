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
from datetime import datetime
from http import HTTPStatus
from unittest.mock import patch

import pytest
from flask import g

from centre_api.auth import jwt
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
def url_id(session):
    """Create an application URL with checked certificate details and return its id."""
    app_url = ApplicationUrl(app_name='Test App', environment='DEV', url='https://test-app-dev.example.com',
                             ssl_status='Valid', ssl_expiry=datetime(2030, 1, 1), last_checked=datetime(2026, 1, 1),
                             is_active=True)
    session.add(app_url)
    session.commit()
    return app_url.id


def _create(client, **fields):
    payload = {'app_name': 'New App', 'environment': 'PROD', 'url': 'https://new-app.example.com', **fields}
    return client.post('/api/application-urls', json=payload)


class TestListApplicationUrls:
    """GET /api/application-urls."""

    def test_order_does_not_change_after_an_update(self, client, editor_token, session):
        """Rows come back by app and environment, not in storage order."""
        for environment in ('TEST', 'DEV', 'PROD'):
            _create(client, app_name='Order App', environment=environment,
                    url=f'https://order-{environment.lower()}.example.com')
        dev = next(row for row in client.get('/api/application-urls').get_json()
                   if row['app_name'] == 'Order App' and row['environment'] == 'DEV')
        client.put(f"/api/application-urls/{dev['id']}", json={'ticket_reference': 'OPS-1'})

        rows = client.get('/api/application-urls').get_json()

        assert [row['environment'] for row in rows if row['app_name'] == 'Order App'] == ['DEV', 'PROD', 'TEST']

    def test_timestamps_are_marked_utc(self, client, editor_token, url_id):
        """Without an offset, browsers would read the expiry as local time."""
        rows = client.get('/api/application-urls').get_json()
        row = next(row for row in rows if row['id'] == url_id)

        assert row['ssl_expiry'] == '2030-01-01T00:00:00+00:00'
        assert row['last_checked'] == '2026-01-01T00:00:00+00:00'


class TestCreateApplicationUrl:
    """POST /api/application-urls."""

    def test_input_is_trimmed_and_creator_recorded(self, client, editor_token, session):
        """Stored the way the web app sends it, whoever calls the API."""
        response = _create(client, app_name='  Trim App ', environment=' demo ',
                           url=' https://trim.example.com ', ticket_reference='  ')

        assert response.status_code == HTTPStatus.CREATED
        body = response.get_json()
        assert (body['app_name'], body['environment'], body['url']) == ('Trim App', 'DEMO', 'https://trim.example.com')
        assert body['ticket_reference'] is None
        assert session.get(ApplicationUrl, body['id']).created_by == 'editor@idir'

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

    def test_ticket_reference_at_column_limit_is_saved(self, client, editor_token, url_id):
        """A 50 character ticket reference fits the column."""
        response = client.put(f'/api/application-urls/{url_id}', json={'ticket_reference': 'x' * 50})

        assert response.status_code == HTTPStatus.OK
        assert response.get_json()['ticket_reference'] == 'x' * 50

    def test_long_ticket_reference_is_rejected(self, client, editor_token, url_id):
        """Too long for the column: a 400 naming the field, not a database error."""
        response = client.put(f'/api/application-urls/{url_id}', json={'ticket_reference': 'x' * 51})

        assert response.status_code == HTTPStatus.BAD_REQUEST
        assert 'ticket_reference' in response.get_json()['errors']

    def test_ssl_details_cannot_be_set(self, client, editor_token, url_id):
        """Only certificate checks set the SSL details."""
        response = client.put(f'/api/application-urls/{url_id}',
                              json={'ssl_status': 'Expired', 'ssl_expiry': '2020-01-01T00:00:00'})

        assert response.status_code == HTTPStatus.OK
        body = response.get_json()
        assert (body['ssl_status'], body['ssl_expiry']) == ('Valid', '2030-01-01T00:00:00+00:00')

    def test_new_host_clears_ssl_details(self, client, editor_token, session, url_id):
        """The old host's certificate says nothing about the new one."""
        response = client.put(f'/api/application-urls/{url_id}', json={'url': 'https://moved.example.com'})

        body = response.get_json()
        assert (body['ssl_status'], body['ssl_expiry'], body['last_checked']) == ('Unknown', None, None)
        assert session.get(ApplicationUrl, url_id).updated_by == 'editor@idir'

    def test_new_path_keeps_ssl_details(self, client, editor_token, url_id):
        """Same host, same certificate."""
        response = client.put(f'/api/application-urls/{url_id}',
                              json={'url': 'https://test-app-dev.example.com/app'})

        assert response.get_json()['ssl_status'] == 'Valid'


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
        assert client.put(f'/api/application-urls/{url_id}', json={}).status_code == HTTPStatus.NOT_FOUND
        assert client.delete(f'/api/application-urls/{url_id}').status_code == HTTPStatus.NOT_FOUND

    def test_deleted_environment_can_be_added_again(self, client, editor_token, url_id):
        """A deactivated row doesn't count as a duplicate."""
        client.delete(f'/api/application-urls/{url_id}')

        response = _create(client, app_name='Test App', environment='DEV')

        assert response.status_code == HTTPStatus.CREATED
