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
"""Unit tests for UserService.revoke_user_access."""
from unittest.mock import patch

import requests

from centre_api.enums.epic_app import EpicAppName
from centre_api.services.user_service import UserService


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
