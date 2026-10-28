# Copyright © 2019 Province of British Columbia
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
"""Unit tests for UserService."""
from types import SimpleNamespace
from unittest.mock import patch

import pytest
import requests

from centre_api.enums.access_request_status import AccessRequestsStatusEnum
from centre_api.enums.epic_app import EpicAdminGroupsPath, EpicAppClientName, EpicAppName, EpicGroups
from centre_api.services.user_service import UserService


TRACK_GROUP = {'name': EpicGroups.TRACK.value, 'subGroups': [{'name': 'INSTANCE_ADMIN'}, {'name': 'USER'}]}
SUBMIT_GROUP = {'name': EpicGroups.SUBMIT.value, 'subGroups': [{'name': 'EAO_MANAGER'}]}
COMPLIANCE_GROUP = {'name': EpicGroups.COMPLIANCE.value, 'subGroups': [{'name': 'VIEWER'}]}
NON_ADMIN = {'username': 'caller@idir', 'groups': []}
TRACK_ADMIN = {'username': 'caller@idir', 'groups': [{'path': EpicAdminGroupsPath.TRACK.value}]}
DST_ADMIN = {'username': 'caller@idir', 'groups': [{'path': EpicAdminGroupsPath.CENTRE.value}]}
COMPLIANCE_ADMIN = {'username': 'caller@idir', 'groups': [{'path': EpicAdminGroupsPath.COMPLIANCE.value}]}


def _access_request(app_name):
    """Build a fake access request."""
    return SimpleNamespace(app=SimpleNamespace(name=app_name), user_auth_guid='requester-guid', status=None)


class TestUserLookup:
    """Test suite for who may view and list users."""

    @patch('centre_api.services.user_service.AuthApiService.get_user_by_username')
    @patch('centre_api.services.user_service.TokenInfo.get_username')
    def test_user_can_look_up_themselves(self, mock_get_username, mock_get_user):
        """A non-admin can fetch their own record."""
        mock_get_username.return_value = 'caller@idir'
        mock_get_user.return_value = dict(NON_ADMIN)

        user = UserService.get_user_by_username('CALLER@idir')

        assert user['username'] == 'caller@idir'
        mock_get_user.assert_called_once_with('caller@idir')

    @patch('centre_api.services.user_service.AuthApiService.get_user_by_username')
    @patch('centre_api.services.user_service.TokenInfo.get_username')
    def test_non_admin_cannot_look_up_others(self, mock_get_username, mock_get_user):
        """A non-admin cannot fetch another user's record."""
        mock_get_username.return_value = 'caller@idir'
        mock_get_user.return_value = dict(NON_ADMIN)

        with pytest.raises(PermissionError):
            UserService.get_user_by_username('someone@idir')

        mock_get_user.assert_called_once_with('caller@idir')

    @patch('centre_api.services.user_service.AuthApiService.get_user_by_username')
    @patch('centre_api.services.user_service.TokenInfo.get_username')
    def test_app_admin_can_look_up_others(self, mock_get_username, mock_get_user):
        """An admin of any app can fetch another user's record."""
        mock_get_username.return_value = 'caller@idir'
        mock_get_user.side_effect = lambda username: {
            'caller@idir': dict(TRACK_ADMIN),
            'someone@idir': {'username': 'someone@idir', 'groups': []},
        }[username]

        user = UserService.get_user_by_username('someone@idir')

        assert user['username'] == 'someone@idir'

    @patch('centre_api.services.user_service.AuthApiService.get_users')
    @patch('centre_api.services.user_service.AuthApiService.get_user_by_username')
    @patch('centre_api.services.user_service.TokenInfo.get_username')
    def test_non_admin_cannot_list_users(self, mock_get_username, mock_get_user, mock_get_users):
        """A non-admin cannot list users."""
        mock_get_username.return_value = 'caller@idir'
        mock_get_user.return_value = dict(NON_ADMIN)

        with pytest.raises(PermissionError):
            UserService.get_users()

        mock_get_users.assert_not_called()

    @patch('centre_api.services.user_service.AuthApiService.get_users')
    @patch('centre_api.services.user_service.AuthApiService.get_user_by_username')
    @patch('centre_api.services.user_service.TokenInfo.get_username')
    def test_app_admin_can_list_users(self, mock_get_username, mock_get_user, mock_get_users):
        """An admin of any app can list users."""
        mock_get_username.return_value = 'caller@idir'
        mock_get_user.return_value = dict(TRACK_ADMIN)
        mock_get_users.return_value = [{'username': 'someone@idir', 'groups': []}]

        users = UserService.get_users()

        assert [user['username'] for user in users] == ['someone@idir']


class TestUpdateUserAccess:
    """Test suite for granting user access to an app group."""

    @patch('centre_api.services.user_service.AuthApiService.update_user_group')
    @patch('centre_api.services.user_service.AuthApiService.get_group')
    @patch('centre_api.services.user_service.UserService.has_admin_access_on_app')
    def test_parent_group_is_derived_from_app_name(
        self, mock_has_admin, mock_get_group, mock_update_group
    ):
        """The parent group comes from app_name, not the client."""
        mock_has_admin.return_value = True
        mock_get_group.return_value = TRACK_GROUP

        UserService.update_user_access('abc123@idir', {
            'app_name': EpicAppName.EPIC_TRACK.value,
            'parent_group_name': EpicGroups.CENTRE.value,
            'group_name': 'INSTANCE_ADMIN',
        })

        mock_has_admin.assert_called_once_with(EpicAppName.EPIC_TRACK.value, allow_dst_admin=True)
        mock_get_group.assert_called_once_with(EpicGroups.TRACK.value)
        mock_update_group.assert_called_once_with('abc123@idir', EpicGroups.TRACK.value, 'INSTANCE_ADMIN')

    @patch('centre_api.services.user_service.AuthApiService.update_user_group')
    @patch('centre_api.services.user_service.AuthApiService.get_group')
    @patch('centre_api.services.user_service.UserService.has_admin_access_on_app')
    def test_app_admin_cannot_grant_group_outside_their_app(
        self, mock_has_admin, mock_get_group, mock_update_group
    ):
        """A track admin cannot grant CENTRE/SUPER_USER."""
        mock_has_admin.return_value = True
        mock_get_group.return_value = TRACK_GROUP

        with pytest.raises(ValueError):
            UserService.update_user_access('abc123@idir', {
                'app_name': EpicAppName.EPIC_TRACK.value,
                'parent_group_name': EpicGroups.CENTRE.value,
                'group_name': 'SUPER_USER',
            })

        mock_update_group.assert_not_called()

    @patch('centre_api.services.user_service.AuthApiService.update_user_group')
    @patch('centre_api.services.user_service.UserService.has_admin_access_on_app')
    def test_unknown_app_name_is_rejected(self, mock_has_admin, mock_update_group):
        """An app_name with no mapped group is rejected."""
        mock_has_admin.return_value = True

        with pytest.raises(ValueError):
            UserService.update_user_access('abc123@idir', {
                'app_name': 'not_an_app',
                'parent_group_name': EpicGroups.CENTRE.value,
                'group_name': 'SUPER_USER',
            })

        mock_update_group.assert_not_called()

    @patch('centre_api.services.user_service.AuthApiService.update_user_group')
    @patch('centre_api.services.user_service.UserService.has_admin_access_on_app')
    def test_non_admin_is_rejected(self, mock_has_admin, mock_update_group):
        """A non-admin of the app cannot grant access."""
        mock_has_admin.return_value = False

        with pytest.raises(PermissionError):
            UserService.update_user_access('abc123@idir', {
                'app_name': EpicAppName.EPIC_TRACK.value,
                'group_name': 'INSTANCE_ADMIN',
            })

        mock_update_group.assert_not_called()

    @patch('centre_api.services.user_service.SubmitApiService.create_staff_user')
    @patch('centre_api.services.user_service.AuthApiService.get_user_by_username')
    @patch('centre_api.services.user_service.AuthApiService.update_user_group')
    @patch('centre_api.services.user_service.AuthApiService.get_group')
    @patch('centre_api.services.user_service.UserService.has_admin_access_on_app')
    def test_submit_staff_user_uses_derived_parent_group(
        self, mock_has_admin, mock_get_group, mock_update_group, mock_get_user, mock_create_staff
    ):
        """The submit staff group is built from the derived parent group."""
        mock_has_admin.return_value = True
        mock_get_group.return_value = SUBMIT_GROUP
        mock_get_user.return_value = {'email_address': 'user@gov.bc.ca'}

        UserService.update_user_access('abc123@idir', {
            'app_name': EpicAppName.EPIC_SUBMIT.value,
            'parent_group_name': EpicGroups.CENTRE.value,
            'group_name': 'EAO_MANAGER',
        })

        mock_create_staff.assert_called_once_with('user@gov.bc.ca', f'{EpicGroups.SUBMIT.value}/EAO_MANAGER')

    @patch('centre_api.services.user_service.AuthApiService.update_user_group')
    @patch('centre_api.services.user_service.AuthApiService.get_user_by_id')
    @patch('centre_api.services.user_service.AccessRequestsModal.find_by_id')
    @patch('centre_api.services.user_service.AuthApiService.get_group')
    @patch('centre_api.services.user_service.UserService.has_admin_access_on_app')
    def test_access_request_for_another_app_is_rejected(
        self, mock_has_admin, mock_get_group, mock_find_request, mock_get_user_by_id, mock_update_group
    ):
        """An access request for another app is rejected."""
        mock_has_admin.return_value = True
        mock_get_group.return_value = TRACK_GROUP
        mock_find_request.return_value = _access_request(EpicAppName.EPIC_COMPLIANCE.value)
        mock_get_user_by_id.return_value = {'username': 'abc123@idir'}

        with pytest.raises(ValueError):
            UserService.update_user_access('abc123@idir', {
                'app_name': EpicAppName.EPIC_TRACK.value,
                'group_name': 'INSTANCE_ADMIN',
                'access_request_id': 7,
            })

        mock_update_group.assert_not_called()

    @patch('centre_api.services.user_service.AuthApiService.update_user_group')
    @patch('centre_api.services.user_service.AuthApiService.get_user_by_id')
    @patch('centre_api.services.user_service.AccessRequestsModal.find_by_id')
    @patch('centre_api.services.user_service.AuthApiService.get_group')
    @patch('centre_api.services.user_service.UserService.has_admin_access_on_app')
    def test_access_request_for_another_user_is_rejected(
        self, mock_has_admin, mock_get_group, mock_find_request, mock_get_user_by_id, mock_update_group
    ):
        """An access request for another user is rejected."""
        mock_has_admin.return_value = True
        mock_get_group.return_value = TRACK_GROUP
        mock_find_request.return_value = _access_request(EpicAppName.EPIC_TRACK.value)
        mock_get_user_by_id.return_value = {'username': 'requester@idir'}

        with pytest.raises(ValueError):
            UserService.update_user_access('abc123@idir', {
                'app_name': EpicAppName.EPIC_TRACK.value,
                'group_name': 'INSTANCE_ADMIN',
                'access_request_id': 7,
            })

        mock_update_group.assert_not_called()

    @patch('centre_api.services.user_service._queue_access_granted_email')
    @patch('centre_api.services.user_service.session_scope')
    @patch('centre_api.services.user_service.AuthApiService.update_user_group')
    @patch('centre_api.services.user_service.AuthApiService.get_user_by_id')
    @patch('centre_api.services.user_service.AccessRequestsModal.find_by_id')
    @patch('centre_api.services.user_service.AuthApiService.get_group')
    @patch('centre_api.services.user_service.UserService.has_admin_access_on_app')
    def test_matching_access_request_is_approved(
        self, mock_has_admin, mock_get_group, mock_find_request, mock_get_user_by_id, mock_update_group,
        _mock_session_scope, mock_queue_email
    ):
        """A matching access request is approved."""
        access_request = _access_request(EpicAppName.EPIC_TRACK.value)
        mock_has_admin.return_value = True
        mock_get_group.return_value = TRACK_GROUP
        mock_find_request.return_value = access_request
        mock_get_user_by_id.return_value = {'username': 'abc123@idir'}

        UserService.update_user_access('abc123@idir', {
            'app_name': EpicAppName.EPIC_TRACK.value,
            'group_name': 'INSTANCE_ADMIN',
            'access_request_id': 7,
        })

        mock_update_group.assert_called_once()
        assert access_request.status == AccessRequestsStatusEnum.APPROVED.value
        mock_queue_email.assert_called_once()


@patch('centre_api.services.user_service.TokenInfo.get_username')
@patch('centre_api.services.user_service.AuthApiService.get_user_by_username')
class TestComplianceAccess:
    """Who may grant and revoke compliance access."""

    @patch('centre_api.services.user_service.AuthApiService.update_user_group')
    def test_dst_admin_cannot_grant_compliance_access(self, mock_update_group, mock_get_user, _mock_get_username):
        """A DST admin cannot grant compliance access."""
        mock_get_user.return_value = DST_ADMIN

        with pytest.raises(PermissionError):
            UserService.update_user_access('abc123@idir', {
                'app_name': EpicAppName.EPIC_COMPLIANCE.value,
                'group_name': 'VIEWER',
            })

        mock_update_group.assert_not_called()

    @patch('centre_api.services.user_service.AuthApiService.update_user_group')
    @patch('centre_api.services.user_service.AuthApiService.get_group', return_value=COMPLIANCE_GROUP)
    def test_compliance_admin_can_grant_compliance_access(
        self, _mock_get_group, mock_update_group, mock_get_user, _mock_get_username
    ):
        """A compliance admin can grant compliance access."""
        mock_get_user.return_value = COMPLIANCE_ADMIN

        UserService.update_user_access('abc123@idir', {
            'app_name': EpicAppName.EPIC_COMPLIANCE.value,
            'group_name': 'VIEWER',
        })

        mock_update_group.assert_called_once_with('abc123@idir', EpicGroups.COMPLIANCE.value, 'VIEWER')

    @patch('centre_api.services.user_service.AuthApiService.delete_user_group')
    def test_dst_admin_can_revoke_compliance_access(self, mock_delete_group, mock_get_user, _mock_get_username):
        """A DST admin can revoke compliance access."""
        mock_get_user.return_value = DST_ADMIN

        UserService.revoke_user_access('abc123@idir', {'app_name': EpicAppName.EPIC_COMPLIANCE.value})

        mock_delete_group.assert_called_once()


class TestUpdateUserStatus:
    """Test suite for enabling/disabling users."""

    @patch('centre_api.services.user_service.AuthApiService.patch_user')
    @patch('centre_api.services.user_service.AuthApiService.is_admin_of_app')
    @patch('centre_api.services.user_service.AuthApiService.get_user_by_username')
    @patch('centre_api.services.user_service.TokenInfo.get_username')
    def test_non_dst_admin_cannot_update_status(
        self, mock_get_username, mock_get_user, mock_is_admin, mock_patch_user
    ):
        """A non-DST admin cannot disable a user."""
        mock_get_username.return_value = 'caller@idir'
        mock_get_user.return_value = {'groups': []}
        mock_is_admin.return_value = False

        with pytest.raises(PermissionError):
            UserService.update_user_status('victim@idir', {'enabled': False})

        mock_is_admin.assert_called_once_with({'groups': []}, EpicAppClientName.EPIC_CENTRE.value)
        mock_patch_user.assert_not_called()

    @patch('centre_api.services.user_service.AuthApiService.patch_user')
    @patch('centre_api.services.user_service.AuthApiService.is_admin_of_app')
    @patch('centre_api.services.user_service.AuthApiService.get_user_by_username')
    @patch('centre_api.services.user_service.TokenInfo.get_username')
    def test_dst_admin_can_update_status(
        self, mock_get_username, mock_get_user, mock_is_admin, mock_patch_user
    ):
        """A DST admin can disable a user."""
        mock_get_username.return_value = 'admin@idir'
        mock_get_user.return_value = {'groups': []}
        mock_is_admin.return_value = True

        UserService.update_user_status('someone@idir', {'enabled': False})

        mock_patch_user.assert_called_once_with('someone@idir', {'enabled': False})


class TestRevokeUserAccess:
    """Test suite for revoking user access and the EPIC.track -> submit hook."""

    @patch('centre_api.services.user_service.SubmitApiService.remove_staff_user_work_by_user')
    @patch('centre_api.services.user_service.AuthApiService.delete_user_group')
    @patch('centre_api.services.user_service.UserService.has_admin_access_on_app')
    def test_revoke_epic_track_also_removes_submit_work(
        self, mock_has_admin, mock_delete_group, mock_remove_work
    ):
        """Revoking EPIC.track removes the user's submit staff work assignments."""
        mock_has_admin.return_value = True
        mock_delete_group.return_value = {'ok': True}

        username = 'abc123@idir'
        UserService.revoke_user_access(
            username, {'app_name': EpicAppName.EPIC_TRACK.value}
        )

        mock_delete_group.assert_called_once()
        mock_remove_work.assert_called_once_with(username)

    @patch('centre_api.services.user_service.SubmitApiService.remove_staff_user_work_by_user')
    @patch('centre_api.services.user_service.AuthApiService.delete_user_group')
    @patch('centre_api.services.user_service.UserService.has_admin_access_on_app')
    def test_revoke_non_track_does_not_call_submit(
        self, mock_has_admin, mock_delete_group, mock_remove_work
    ):
        """Revoking a non-track app must not call the submit removal."""
        mock_has_admin.return_value = True
        mock_delete_group.return_value = {'ok': True}

        UserService.revoke_user_access(
            'abc123@idir', {'app_name': EpicAppName.EPIC_ENGAGE.value}
        )

        mock_remove_work.assert_not_called()

    @patch('centre_api.services.user_service.SubmitApiService.remove_staff_user_work_by_user')
    @patch('centre_api.services.user_service.AuthApiService.delete_user_group')
    @patch('centre_api.services.user_service.UserService.has_admin_access_on_app')
    def test_revoke_epic_track_swallows_submit_error(
        self, mock_has_admin, mock_delete_group, mock_remove_work
    ):
        """A submit failure must not fail the primary revoke."""
        mock_has_admin.return_value = True
        mock_delete_group.return_value = {'ok': True}
        mock_remove_work.side_effect = requests.ConnectionError('submit down')

        # Should not raise
        result = UserService.revoke_user_access(
            'abc123@idir', {'app_name': EpicAppName.EPIC_TRACK.value}
        )

        assert result == {'ok': True}
        mock_remove_work.assert_called_once()
