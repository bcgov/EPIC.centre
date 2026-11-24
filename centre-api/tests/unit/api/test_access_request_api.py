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
"""API tests for creating and rejecting access requests."""
from http import HTTPStatus
from unittest.mock import patch

import pytest
from flask import g

from centre_api.auth import jwt
from centre_api.models.access_requests import AccessRequests
from centre_api.models.applications import Application


CALLER_CLAIMS = {'preferred_username': 'caller@idir', 'sub': 'caller-sub-guid'}


@pytest.fixture
def caller_token():
    """Authenticate requests as CALLER_CLAIMS without a real JWT."""
    def _authenticate(*args, **kwargs):
        g.jwt_oidc_token_info = CALLER_CLAIMS

    with patch.object(jwt, '_require_auth_validation', side_effect=_authenticate):
        yield CALLER_CLAIMS


def _create_app(session, is_active):
    """Create and return a test application."""
    app = Application(title='Request Test App', name='access_request_test_app', description='Test',
                      launch_url='https://test.com', is_active=is_active)
    session.add(app)
    session.commit()
    return app


class TestCreateAccessRequestAPI:
    """Validation on POST /api/applications/<app_id>/access_request."""

    def test_unknown_app_returns_400(self, client, session, caller_token):
        """An app id that doesn't exist is a bad request, not a server error."""
        response = client.post('/api/applications/999999/access_request')

        assert response.status_code == HTTPStatus.BAD_REQUEST

    def test_inactive_app_returns_400(self, client, session, caller_token):
        """An inactive app can't be requested and no request is stored."""
        app = _create_app(session, is_active=False)

        response = client.post(f'/api/applications/{app.id}/access_request')

        assert response.status_code == HTTPStatus.BAD_REQUEST
        assert AccessRequests.query.filter_by(app_id=app.id).count() == 0

    @patch('centre_api.services.applications_service.ApplicationsService.get_app_admins', return_value=[])
    def test_created_request_reports_its_status(self, _mock_get_admins, client, session, caller_token):
        """The response carries the status value, not the enum's Python name."""
        app = _create_app(session, is_active=True)

        response = client.post(f'/api/applications/{app.id}/access_request')

        assert response.status_code == HTTPStatus.OK
        assert response.get_json()['status'] == 'PENDING'


class TestRejectAccessRequestAPI:
    """PUT /api/access-requests/<id>."""

    def test_unknown_request_returns_404(self, client, session, caller_token):
        """Rejecting a missing request is a 404 with a plain message, not a 200."""
        response = client.put('/api/access-requests/999999', query_string={'status': 'REJECTED'})

        assert response.status_code == HTTPStatus.NOT_FOUND
        assert response.get_json() == {'message': 'Access request not found.'}


class TestAccessLevelsAPI:
    """GET /api/applications/<app_name>/access-levels."""

    def test_unknown_app_returns_404(self, client, session, caller_token):
        """An app with no role groups is not found, not a server error."""
        response = client.get('/api/applications/not_an_app/access-levels')

        assert response.status_code == HTTPStatus.NOT_FOUND
