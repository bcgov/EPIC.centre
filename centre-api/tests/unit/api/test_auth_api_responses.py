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
"""API tests that EPIC.auth responses are reused only within one request."""
from http import HTTPStatus
from unittest.mock import MagicMock, patch

import pytest
from flask import g

from centre_api.auth import jwt


CALLER_CLAIMS = {'preferred_username': 'caller@idir', 'sub': 'reuse-caller-guid'}


@pytest.fixture
def caller_token():
    """Authenticate requests as CALLER_CLAIMS without a real JWT."""
    def _authenticate(*args, **kwargs):
        g.jwt_oidc_token_info = CALLER_CLAIMS

    with patch.object(jwt, '_require_auth_validation', side_effect=_authenticate):
        yield CALLER_CLAIMS


@pytest.mark.usefixtures('caller_token')
def test_each_request_asks_epic_auth_again(client):
    """Requests sharing an app context, as in tests, don't reuse each other's responses."""
    response = MagicMock()
    response.json.return_value = {'username': 'caller@idir', 'groups': []}

    with patch('centre_api.services.auth_api_service.requests.get', return_value=response) as mock_get:
        for _ in range(2):
            assert client.get('/api/users/username/caller@idir').status_code == HTTPStatus.OK

    assert mock_get.call_count == 2
