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
"""Unit tests for AccessRequestsService.process_access_request."""
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from centre_api.enums.access_request_status import AccessRequestsStatusEnum
from centre_api.enums.epic_app import EpicAdminGroupsPath, EpicAppName
from centre_api.services.access_requests import AccessRequestsService


DST_ADMIN = {'groups': [{'path': EpicAdminGroupsPath.CENTRE.value}]}
TRACK_ADMIN = {'groups': [{'path': EpicAdminGroupsPath.TRACK.value}]}
REJECTED = AccessRequestsStatusEnum.REJECTED.value


def _access_request(app_name, status=AccessRequestsStatusEnum.PENDING):
    """Build a fake access request."""
    access_request = SimpleNamespace(app=SimpleNamespace(name=app_name), status=status, user_auth_guid='guid-1')
    access_request.to_dict = lambda: {'status': access_request.status}
    return access_request


@pytest.fixture
def mocks():
    """Patch the access request lookup, persistence and the caller's groups."""
    with (
        patch('centre_api.services.access_requests._queue_access_request_email'),
        patch('centre_api.services.access_requests.session_scope'),
        patch('centre_api.services.access_requests.AuthApiService.get_user_by_id', return_value={}),
        patch('centre_api.services.user_service.TokenInfo.get_username'),
        patch('centre_api.services.access_requests.AccessRequestsModal.find_by_id') as mock_find,
        patch('centre_api.services.user_service.AuthApiService.get_user_by_username') as mock_get_user,
    ):
        yield SimpleNamespace(find=mock_find, get_user=mock_get_user)


class TestProcessAccessRequest:
    """Test suite for rejecting access requests."""

    def test_dst_admin_can_reject_compliance_request(self, mocks):
        """DST admins can reject compliance requests."""
        mocks.get_user.return_value = DST_ADMIN
        access_request = _access_request(EpicAppName.EPIC_COMPLIANCE.value)
        mocks.find.return_value = access_request

        AccessRequestsService.process_access_request(1, REJECTED)

        assert access_request.status == REJECTED

    def test_other_app_admin_cannot_reject_compliance_request(self, mocks):
        """Admins of other apps cannot reject compliance requests."""
        mocks.get_user.return_value = TRACK_ADMIN
        access_request = _access_request(EpicAppName.EPIC_COMPLIANCE.value)
        mocks.find.return_value = access_request

        with pytest.raises(PermissionError):
            AccessRequestsService.process_access_request(1, REJECTED)

        assert access_request.status == AccessRequestsStatusEnum.PENDING

    @pytest.mark.parametrize('status', ['APPROVED', 'PENDING', 'CANCELLED', None])
    def test_only_rejection_is_allowed(self, mocks, status):
        """Approving or other status changes are refused."""
        with pytest.raises(ValueError):
            AccessRequestsService.process_access_request(1, status)

        mocks.find.assert_not_called()

    def test_only_pending_requests_can_be_rejected(self, mocks):
        """An already approved request cannot be rejected."""
        mocks.get_user.return_value = DST_ADMIN
        access_request = _access_request(EpicAppName.EPIC_TRACK.value, status=AccessRequestsStatusEnum.APPROVED)
        mocks.find.return_value = access_request

        with pytest.raises(ValueError):
            AccessRequestsService.process_access_request(1, REJECTED)

        assert access_request.status == AccessRequestsStatusEnum.APPROVED
