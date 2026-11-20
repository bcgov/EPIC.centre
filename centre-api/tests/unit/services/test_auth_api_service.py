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
"""Unit tests for how AuthApiService reuses EPIC.auth responses."""
from unittest.mock import MagicMock, patch

import pytest
import requests
from flask import g

from centre_api.services.auth_api_service import AuthApiService
from centre_api.utils.cache import cache


SERVICE = 'centre_api.services.auth_api_service'
USER = {'username': 'caller@idir', 'groups': []}
TRACK_GROUP = {'name': 'TRACK', 'subGroups': [{'name': 'USER'}]}


def _response(body):
    """Build a successful EPIC.auth response."""
    response = MagicMock()
    response.json.return_value = body
    return response


def _error_response():
    """Build an EPIC.auth response that fails."""
    response = MagicMock()
    response.raise_for_status.side_effect = requests.HTTPError('500 Server Error')
    return response


@pytest.fixture(autouse=True)
def request_state(app):
    """Give each test a caller token and an empty group cache."""
    cache.init_app(app)
    cache.clear()
    g.authorization_header = 'Bearer caller-token'


class TestResponsesWithinARequest:
    """Lookups repeated within one request."""

    def test_repeated_lookup_calls_epic_auth_once(self):
        """The second lookup of the same user reuses the first response."""
        with patch(f'{SERVICE}.requests.get', return_value=_response(USER)) as mock_get:
            first = AuthApiService.get_user_by_username('caller@idir')
            second = AuthApiService.get_user_by_username('caller@idir')

        assert first == second == USER
        mock_get.assert_called_once()

    def test_changing_a_result_does_not_change_the_next(self):
        """Callers that add keys to a user don't affect later lookups."""
        with patch(f'{SERVICE}.requests.get', return_value=_response(USER)):
            AuthApiService.get_user_by_username('caller@idir')['apps'] = []

            assert 'apps' not in AuthApiService.get_user_by_username('caller@idir')

    @pytest.mark.parametrize('write, args, http_method', [
        ('update_user_group', ('caller@idir', 'TRACK', 'USER'), 'put'),
        ('delete_all_user_group_mapping', ('caller@idir',), 'delete'),
        ('delete_user_group', ('caller@idir', 'TRACK'), 'delete'),
        ('patch_user', ('caller@idir', {'enabled': False}), 'patch'),
    ])
    def test_write_forgets_earlier_responses(self, write, args, http_method):
        """A lookup after any write asks EPIC.auth again."""
        with (
            patch(f'{SERVICE}.requests.get', return_value=_response(USER)) as mock_get,
            patch(f'{SERVICE}.requests.{http_method}'),
        ):
            AuthApiService.get_user_by_username('caller@idir')
            getattr(AuthApiService, write)(*args)
            AuthApiService.get_user_by_username('caller@idir')

        assert mock_get.call_count == 2

    def test_failed_lookup_is_not_reused(self):
        """An error isn't stored, so the next lookup tries again."""
        with patch(f'{SERVICE}.requests.get', side_effect=[_error_response(), _response(USER)]):
            with pytest.raises(requests.HTTPError):
                AuthApiService.get_user_by_username('caller@idir')

            assert AuthApiService.get_user_by_username('caller@idir') == USER


class TestGroupCache:
    """App group lookups shared across requests."""

    def test_group_is_reused_by_the_next_request(self, app):
        """A later request gets the app group without calling EPIC.auth."""
        with patch(f'{SERVICE}.requests.get', return_value=_response(TRACK_GROUP)) as mock_get:
            AuthApiService.get_group('TRACK')
            with app.app_context():
                g.authorization_header = 'Bearer another-token'

                assert AuthApiService.get_group('TRACK') == TRACK_GROUP

        mock_get.assert_called_once()

    def test_changing_a_cached_group_does_not_change_the_next(self):
        """Callers that change a group don't affect the cached copy."""
        with patch(f'{SERVICE}.requests.get', return_value=_response(TRACK_GROUP)):
            AuthApiService.get_group('TRACK')['subGroups'].clear()

            assert AuthApiService.get_group('TRACK') == TRACK_GROUP


class TestListingFailures:
    """Listings EPIC.auth fails to return."""

    @pytest.mark.parametrize('method, args', [
        ('get_users', ()),
        ('get_group_members', ('TRACK', 'INSTANCE_ADMIN')),
    ])
    def test_failure_is_raised_not_an_empty_list(self, method, args):
        """A failed listing is an error, so callers don't mistake it for no users."""
        with patch(f'{SERVICE}.requests.get', return_value=_error_response()):
            with pytest.raises(requests.HTTPError):
                getattr(AuthApiService, method)(*args)
