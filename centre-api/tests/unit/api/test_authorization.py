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
"""API tests for authorization on the user and analytics endpoints."""
from http import HTTPStatus
from unittest.mock import patch

import pytest
from flask import g

from centre_api.auth import jwt
from centre_api.enums.epic_app import EpicAppName
from centre_api.models.eao_analytics import EaoAnalytics


CALLER_CLAIMS = {'preferred_username': 'caller@idir', 'sub': 'caller-sub-guid'}
NON_ADMIN = {'username': 'caller@idir', 'groups': []}


@pytest.fixture
def caller_token():
    """Authenticate requests as CALLER_CLAIMS without a real JWT."""
    def _authenticate(*args, **kwargs):
        g.jwt_oidc_token_info = CALLER_CLAIMS

    with patch.object(jwt, '_require_auth_validation', side_effect=_authenticate):
        yield CALLER_CLAIMS


class TestEaoAnalyticsAuthorization:
    """Authorization on the analytics endpoints."""

    @pytest.mark.parametrize('identity', ['caller@idir', 'caller-sub-guid'])
    def test_record_own_login(self, client, session, caller_token, identity):
        """A caller can record their own login."""
        response = client.post('/api/eao-analytics', json={
            'user_auth_guid': identity,
            'app_name': EpicAppName.EPIC_TRACK.value,
        })

        assert response.status_code == HTTPStatus.OK
        assert response.get_json()['user_auth_guid'] == identity

    def test_cannot_record_login_for_another_user(self, client, session, caller_token):
        """A caller cannot record a login for someone else."""
        response = client.post('/api/eao-analytics', json={
            'user_auth_guid': 'someone@idir',
            'app_name': EpicAppName.EPIC_TRACK.value,
        })

        assert response.status_code == HTTPStatus.FORBIDDEN
        assert EaoAnalytics.query.filter_by(user_auth_guid='someone@idir').first() is None

    @patch('centre_api.resources.eao_analytics.UserService.has_admin_access_on_app', return_value=False)
    def test_non_dst_admin_cannot_read_analytics(self, mock_has_admin, client, session, caller_token):
        """Non-DST admins cannot read login history."""
        response = client.get('/api/eao-analytics')

        assert response.status_code == HTTPStatus.FORBIDDEN
        mock_has_admin.assert_called_once_with(EpicAppName.EPIC_CENTRE.value)

    @patch('centre_api.resources.eao_analytics.UserService.has_admin_access_on_app', return_value=True)
    def test_dst_admin_can_read_analytics(self, _mock_has_admin, client, session, caller_token):
        """DST admins can read login history."""
        response = client.get('/api/eao-analytics')

        assert response.status_code == HTTPStatus.OK


class TestAccessRequestUpdates:
    """Access requests are only rejected directly; approval goes through granting access."""

    def test_cannot_approve_access_request_directly(self, client, caller_token):
        """Setting an access request to APPROVED is refused."""
        response = client.put('/api/access-requests/1?status=APPROVED')

        assert response.status_code == HTTPStatus.BAD_REQUEST


@patch('centre_api.services.user_service.UserService.has_admin_access_on_app', return_value=True)
class TestUserAccessValidation:
    """Invalid access changes return 400."""

    @patch('centre_api.services.user_service.AuthApiService.update_user_group')
    @patch('centre_api.services.user_service.AuthApiService.get_group',
           return_value={'subGroups': [{'name': 'INSTANCE_ADMIN'}]})
    def test_grant_with_invalid_group_returns_400(self, _mock_get_group, mock_update_group, _mock_has_admin,
                                                  client, caller_token):
        """Granting a group outside the app returns 400."""
        response = client.put('/api/users/someone@idir/access', json={
            'app_name': EpicAppName.EPIC_TRACK.value,
            'group_name': 'SUPER_USER',
        })

        assert response.status_code == HTTPStatus.BAD_REQUEST
        assert 'Invalid group_name' in response.get_json()['message']
        mock_update_group.assert_not_called()

    @patch('centre_api.services.user_service.AuthApiService.delete_user_group')
    def test_revoke_unknown_app_returns_400(self, mock_delete_group, _mock_has_admin, client, caller_token):
        """Revoking access to an unknown app returns 400."""
        response = client.delete('/api/users/someone@idir/access', json={'app_name': 'not_an_app'})

        assert response.status_code == HTTPStatus.BAD_REQUEST
        mock_delete_group.assert_not_called()


class TestUsersAuthorization:
    """Authorization on the user endpoints."""

    @patch('centre_api.services.user_service.AuthApiService.get_users')
    @patch('centre_api.services.user_service.AuthApiService.get_user_by_username', return_value=NON_ADMIN)
    def test_non_admin_cannot_list_users(self, _mock_get_user, mock_get_users, client, caller_token):
        """A non-admin cannot list users."""
        response = client.get('/api/users')

        assert response.status_code == HTTPStatus.FORBIDDEN
        assert 'permission' in response.get_json()['message']
        mock_get_users.assert_not_called()

    @patch('centre_api.services.user_service.AuthApiService.patch_user')
    @patch('centre_api.services.user_service.AuthApiService.get_user_by_username', return_value=NON_ADMIN)
    def test_non_dst_admin_cannot_disable_user(self, _mock_get_user, mock_patch_user, client, caller_token):
        """A non-DST admin cannot disable a user."""
        response = client.patch('/api/users/username/someone@idir', json={'enabled': False})

        assert response.status_code == HTTPStatus.FORBIDDEN
        mock_patch_user.assert_not_called()
