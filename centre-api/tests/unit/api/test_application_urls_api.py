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
"""API tests for application URL validation."""
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
    """Create an application URL and return its id."""
    app_url = ApplicationUrl(app_name='Test App', environment='DEV', url='https://test-app-dev.example.com',
                             ssl_status='Unknown', is_active=True)
    session.add(app_url)
    session.commit()
    return app_url.id


class TestUpdateApplicationUrl:
    """Validation on PUT /api/application-urls/<id>."""

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
