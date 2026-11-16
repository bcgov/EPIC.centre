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
"""API tests that malformed requests get a 400, not a 500."""
from http import HTTPStatus
from unittest.mock import patch

import pytest
import requests
from flask import g

from centre_api.auth import jwt


CALLER_CLAIMS = {'preferred_username': 'caller@idir', 'sub': 'validation-caller-guid'}
DST_ADMIN = {'username': 'caller@idir', 'groups': []}
NO_BODY = object()


@pytest.fixture
def caller_token():
    """Authenticate requests as CALLER_CLAIMS without a real JWT."""
    def _authenticate(*args, **kwargs):
        g.jwt_oidc_token_info = CALLER_CLAIMS

    with patch.object(jwt, '_require_auth_validation', side_effect=_authenticate):
        yield CALLER_CLAIMS


@pytest.mark.parametrize('method, path, body', [
    ('put', '/api/user-settings/card-positions', NO_BODY),
    ('put', '/api/user-settings/card-positions', ['not', 'an', 'object']),
    ('put', '/api/user-settings/card-positions', {'card_positions': ['not', 'an', 'object']}),
    ('put', '/api/user-settings/settings', NO_BODY),
    ('put', '/api/user-settings/settings', {'settings': 'not an object'}),
    ('patch', '/api/user-applications/bookmarks', NO_BODY),
    ('patch', '/api/user-applications/bookmarks', ['not', 'an', 'object']),
    ('patch', '/api/user-applications/sort-order', NO_BODY),
    ('patch', '/api/user-applications/sort-order', {'app_ids': [1, 2]}),
    ('patch', '/api/user-applications/sort-order', [1, 'two']),
    ('patch', '/api/user-applications/sort-order', [True, False]),
    ('put', '/api/users/someone@idir/access', NO_BODY),
    ('delete', '/api/users/someone@idir/access', NO_BODY),
    ('patch', '/api/users/username/someone@idir', ['not', 'an', 'object']),
])
@pytest.mark.usefixtures('caller_token')
def test_bad_body_returns_400(client, method, path, body):
    """A missing body, or one of the wrong shape, is a 400."""
    kwargs = {} if body is NO_BODY else {'json': body}

    response = getattr(client, method)(path, **kwargs)

    assert response.status_code == HTTPStatus.BAD_REQUEST


@pytest.mark.usefixtures('caller_token')
def test_malformed_json_returns_400(client):
    """A body that isn't valid JSON is a 400."""
    response = client.put('/api/user-settings/settings', data='{"settings": ', content_type='application/json')

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert response.get_json()['message'] == 'Request body must be a JSON object.'


@pytest.mark.parametrize('path', ['/api/access-requests', '/api/access-requests/users/someone-guid'])
@patch('centre_api.services.access_requests.AuthApiService.get_user_by_username', return_value=DST_ADMIN)
@pytest.mark.usefixtures('caller_token')
def test_unknown_status_filter_returns_400(_mock_get_user, client, path):
    """Filtering access requests by a status that doesn't exist is a 400."""
    response = client.get(path, query_string={'status': 'NOT_A_STATUS'})

    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert 'NOT_A_STATUS' in response.get_json()['message']
    _mock_get_user.assert_not_called()


@patch('centre_api.services.access_requests.AuthApiService.get_user_by_username',
       side_effect=requests.JSONDecodeError('Expecting value', '<html>', 0))
@pytest.mark.usefixtures('caller_token')
def test_broken_epic_auth_response_is_not_a_400(_mock_get_user, client):
    """An EPIC.auth response that isn't JSON is a server error, not the caller's fault."""
    with pytest.raises(requests.JSONDecodeError):
        client.get('/api/access-requests', query_string={'status': 'PENDING'})
