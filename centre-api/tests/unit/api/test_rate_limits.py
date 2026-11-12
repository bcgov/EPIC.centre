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
"""API tests for per-user rate limits."""
from http import HTTPStatus
from unittest.mock import patch

import pytest
from flask import g

from centre_api.auth import jwt
from centre_api.models.applications import Application


@pytest.fixture
def caller():
    """Authenticate requests as whichever claims the test sets, without a real JWT."""
    claims = {'preferred_username': 'first@idir', 'sub': 'first-guid'}

    def _authenticate(*args, **kwargs):
        g.jwt_oidc_token_info = dict(claims)

    with patch.object(jwt, '_require_auth_validation', side_effect=_authenticate):
        yield claims


@pytest.fixture
def inactive_app_id(session):
    """Create an inactive app, so requests fail validation without queueing emails."""
    app = Application(title='Limit App', name='rate_limit_test_app', description='Test',
                      launch_url='https://test.com', is_active=False)
    session.add(app)
    session.commit()
    return app.id


def test_access_requests_are_limited_per_user(client, caller, inactive_app_id):
    """A user gets 429 after five access requests a minute; another user is unaffected."""
    url = f'/api/applications/{inactive_app_id}/access_request'

    for _ in range(5):
        assert client.post(url).status_code == HTTPStatus.BAD_REQUEST
    assert client.post(url).status_code == HTTPStatus.TOO_MANY_REQUESTS

    caller.update({'preferred_username': 'second@idir', 'sub': 'second-guid'})
    assert client.post(url).status_code == HTTPStatus.BAD_REQUEST
