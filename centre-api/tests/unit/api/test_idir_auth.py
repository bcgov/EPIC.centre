# Copyright © 2024 Province of British Columbia
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
"""Verify IDIR enforcement on both authentication decorator paths."""
from http import HTTPStatus

import pytest
from flask import Flask

from centre_api.auth import auth


@pytest.mark.parametrize('login_source,username,allowed', [
    ('idir', 'caller@idir', True),
    (' IDIR ', 'caller@idir', True),
    ('idir', 'caller', True),
    ('bceid', 'caller@idir', False),
    (' BCEID ', 'caller@idir', False),
    (None, 'caller@idir', True),
    ('', 'caller@idir', True),
    ('  ', ' CALLER@IDIR ', True),
    (123, 'caller@idir', True),
    (None, 'a' * 32 + '@idir', True),
    (None, 'caller@bceid', False),
    (None, 'caller@idir.example', False),
    (None, 'calleridir', False),
    (None, '', False),
    (None, None, False),
    (None, 123, False),
])
@pytest.mark.parametrize('role_guard', [False, True])
def test_idir_required_with_or_without_roles(app, auth_header, login_source, username, allowed, role_guard):
    """Both decorators enforce the source claim before considering the username fallback."""
    guarded_app = Flask(__name__)
    guarded_app.config.update(app.config)
    guard = auth.require_any_role(['view'], ['epic-centre']) if role_guard else auth.require

    @guarded_app.route('/protected')
    @guard
    def protected():
        return {'allowed': True}

    claims = {
        'sub': 'idir-test-user',
        'preferred_username': username,
        'resource_access': {'epic-centre': {'roles': ['view']}},
    }
    if login_source is not None:
        claims['loginSource'] = login_source
    response = guarded_app.test_client().get('/protected', headers=auth_header(claims))
    assert response.status_code == (HTTPStatus.OK if allowed else HTTPStatus.FORBIDDEN)
    if not allowed:
        assert response.get_json()['message'] == 'IDIR authentication required'
