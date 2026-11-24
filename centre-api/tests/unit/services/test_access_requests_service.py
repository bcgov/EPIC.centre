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
"""Unit tests for AccessRequestsService."""
from types import SimpleNamespace
from unittest.mock import patch

import pytest
import requests

from centre_api.enums.access_request_status import AccessRequestsStatusEnum
from centre_api.enums.epic_app import EpicAdminGroupsPath, EpicAppName
from centre_api.exceptions import BadRequestError
from centre_api.services.access_requests import MAX_REQUESTER_LOOKUPS, AccessRequestsService


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
        patch('centre_api.services.access_requests._queue_access_request_email') as mock_queue_email,
        patch('centre_api.services.access_requests.session_scope'),
        patch('centre_api.services.access_requests.AuthApiService.get_user_by_id', return_value={}) as mock_requester,
        patch('centre_api.services.user_service.TokenInfo.get_username'),
        patch('centre_api.services.access_requests.AccessRequestsModal.find_by_id') as mock_find,
        patch('centre_api.services.user_service.AuthApiService.get_user_by_username') as mock_get_user,
    ):
        yield SimpleNamespace(find=mock_find, get_user=mock_get_user, get_requester=mock_requester,
                              queue_email=mock_queue_email)


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
        with pytest.raises(BadRequestError):
            AccessRequestsService.process_access_request(1, status)

        mocks.find.assert_not_called()

    def test_only_pending_requests_can_be_rejected(self, mocks):
        """An already approved request cannot be rejected."""
        mocks.get_user.return_value = DST_ADMIN
        access_request = _access_request(EpicAppName.EPIC_TRACK.value, status=AccessRequestsStatusEnum.APPROVED)
        mocks.find.return_value = access_request

        with pytest.raises(BadRequestError):
            AccessRequestsService.process_access_request(1, REJECTED)

        assert access_request.status == AccessRequestsStatusEnum.APPROVED

    def test_rejection_emails_the_requester(self, mocks):
        """The requester is told their request was rejected."""
        mocks.get_user.return_value = DST_ADMIN
        mocks.find.return_value = _access_request(EpicAppName.EPIC_TRACK.value)

        AccessRequestsService.process_access_request(1, REJECTED)

        mocks.queue_email.assert_called_once()

    def test_request_from_deleted_requester_can_be_rejected(self, mocks):
        """A requester EPIC.auth can't find is still rejected, with no email to send."""
        mocks.get_user.return_value = DST_ADMIN
        mocks.get_requester.side_effect = requests.HTTPError('500 Server Error')
        access_request = _access_request(EpicAppName.EPIC_TRACK.value)
        mocks.find.return_value = access_request

        AccessRequestsService.process_access_request(1, REJECTED)

        assert access_request.status == REJECTED
        mocks.queue_email.assert_not_called()


class TestUserAccessRequests:
    """Access requests listed on a user's page."""

    @pytest.fixture
    def user_mocks(self):
        """Patch the stored requests, the caller and the requester."""
        with (
            patch('centre_api.services.access_requests.AccessRequestsModal.get_all') as mock_get_all,
            patch('centre_api.services.access_requests.TokenInfo.get_user_data',
                  return_value={'username': 'caller@idir'}),
            patch('centre_api.services.access_requests.AuthApiService.get_user_by_username') as mock_get_caller,
            patch('centre_api.services.access_requests.AuthApiService.get_user_by_id') as mock_get_requester,
        ):
            mock_get_all.return_value = [_access_request(EpicAppName.EPIC_TRACK.value)]
            yield SimpleNamespace(get_caller=mock_get_caller, get_requester=mock_get_requester)

    def test_no_visible_requests_skip_the_requester_lookup(self, user_mocks):
        """When the caller can't see any of the requests, EPIC.auth isn't asked for the requester."""
        user_mocks.get_caller.return_value = {'groups': []}

        assert AccessRequestsService.get_user_access_requests('guid-1', {}) == []
        user_mocks.get_requester.assert_not_called()

    def test_deleted_requester_is_listed_without_details(self, user_mocks):
        """A requester EPIC.auth can't find doesn't fail the user's page."""
        user_mocks.get_caller.return_value = DST_ADMIN
        user_mocks.get_requester.side_effect = requests.HTTPError('500 Server Error')

        listed = AccessRequestsService.get_user_access_requests('guid-1', {})

        assert listed == [{'status': AccessRequestsStatusEnum.PENDING}]


class TestEnrichWithUserDetails:
    """Requester details on listed access requests."""

    @pytest.fixture
    def auth_mocks(self):
        """Patch both ways of fetching requesters from EPIC.auth."""
        with (
            patch('centre_api.services.access_requests.AuthApiService.get_user_by_id') as mock_get_user,
            patch('centre_api.services.access_requests.AuthApiService.get_users') as mock_get_users,
        ):
            mock_get_user.side_effect = lambda user_id: {'id': user_id, 'groups': [{'path': 'TRACK/USER'}]}
            yield SimpleNamespace(get_user=mock_get_user, get_users=mock_get_users)

    def test_few_requesters_are_looked_up_one_by_one(self, auth_mocks):
        """A few requesters are fetched one by one, not by listing every user."""
        access_requests = [{'user_auth_guid': 'a'}, {'user_auth_guid': 'b'}, {'user_auth_guid': 'a'}]

        AccessRequestsService._enrich_with_user_details(access_requests)

        assert [req['user'] for req in access_requests] == [{'id': 'a'}, {'id': 'b'}, {'id': 'a'}]
        assert auth_mocks.get_user.call_count == 2
        auth_mocks.get_users.assert_not_called()

    def test_requesters_up_to_the_limit_are_looked_up_one_by_one(self, auth_mocks):
        """Exactly MAX_REQUESTER_LOOKUPS requesters are still fetched one by one."""
        access_requests = [{'user_auth_guid': f'user-{i}'} for i in range(MAX_REQUESTER_LOOKUPS)]

        AccessRequestsService._enrich_with_user_details(access_requests)

        assert auth_mocks.get_user.call_count == MAX_REQUESTER_LOOKUPS
        auth_mocks.get_users.assert_not_called()

    def test_many_requesters_list_users_once(self, auth_mocks):
        """Past the lookup limit, one call lists the users instead."""
        user_ids = [f'user-{i}' for i in range(MAX_REQUESTER_LOOKUPS + 1)]
        auth_mocks.get_users.return_value = [{'id': user_id} for user_id in user_ids]
        access_requests = [{'user_auth_guid': user_id} for user_id in user_ids]

        AccessRequestsService._enrich_with_user_details(access_requests)

        assert all(req['user']['id'] == req['user_auth_guid'] for req in access_requests)
        auth_mocks.get_users.assert_called_once_with(include_groups=False)
        auth_mocks.get_user.assert_not_called()

    def test_requester_epic_auth_cannot_return_is_listed_without_details(self, auth_mocks):
        """A requester deleted from Keycloak doesn't fail the whole list."""
        auth_mocks.get_user.side_effect = requests.HTTPError('404 Not Found')
        access_requests = [{'user_auth_guid': 'deleted-user'}]

        AccessRequestsService._enrich_with_user_details(access_requests)

        assert 'user' not in access_requests[0]

    def test_no_requests_calls_nothing(self, auth_mocks):
        """An empty list doesn't call EPIC.auth."""
        assert not AccessRequestsService._enrich_with_user_details([])

        auth_mocks.get_user.assert_not_called()
        auth_mocks.get_users.assert_not_called()
