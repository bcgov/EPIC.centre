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
"""Unit tests for ApplicationsService.create_access_request."""
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.exc import IntegrityError

from centre_api.enums.epic_app import EpicAppName
from centre_api.services.applications_service import ApplicationsService


SERVICE = 'centre_api.services.applications_service'


def _app(name=EpicAppName.EPIC_TRACK.value, is_active=True):
    """Build a fake application."""
    return SimpleNamespace(id=7, name=name, title='App', is_active=is_active)


@pytest.fixture
def mocks():
    """Patch the app lookup, pending-request lookup, persistence and email queueing."""
    with (
        patch(f'{SERVICE}.TokenInfo.get_id', return_value='user-guid'),
        patch(f'{SERVICE}.ApplicationModel.find_by_id') as mock_find_app,
        patch(f'{SERVICE}.ApplicationsService._find_pending_request') as mock_find_pending,
        patch(f'{SERVICE}.session_scope') as mock_session_scope,
        patch(f'{SERVICE}.ApplicationsService._queue_access_request_submitted_email'),
        patch(f'{SERVICE}.ApplicationsService._queue_access_request_received_dst_email'),
        patch(f'{SERVICE}.ApplicationsService._queue_access_request_notification_app_admin'),
    ):
        mock_find_pending.return_value = None
        yield SimpleNamespace(find_app=mock_find_app, find_pending=mock_find_pending, session_scope=mock_session_scope)


class TestCreateAccessRequest:
    """Test suite for creating access requests."""

    def test_unknown_app_is_rejected(self, mocks):
        """An app id that doesn't exist is rejected."""
        mocks.find_app.return_value = None

        with pytest.raises(ValueError):
            ApplicationsService.create_access_request(999)

        mocks.session_scope.assert_not_called()

    def test_inactive_app_is_rejected(self, mocks):
        """An inactive app cannot be requested."""
        mocks.find_app.return_value = _app(is_active=False)

        with pytest.raises(ValueError):
            ApplicationsService.create_access_request(7)

        mocks.session_scope.assert_not_called()

    @pytest.mark.parametrize('app_name', sorted(ApplicationsService.REQUEST_CATALOG_EXCLUDED_APPS))
    def test_app_outside_catalogue_is_rejected(self, mocks, app_name):
        """Apps excluded from the request catalogue cannot be requested by id."""
        mocks.find_app.return_value = _app(name=app_name)

        with pytest.raises(ValueError):
            ApplicationsService.create_access_request(7)

        mocks.session_scope.assert_not_called()

    def test_existing_pending_request_is_returned(self, mocks):
        """A second submit returns the pending request without inserting or emailing."""
        mocks.find_app.return_value = _app()
        existing = SimpleNamespace(id=1)
        mocks.find_pending.return_value = existing

        assert ApplicationsService.create_access_request(7) is existing
        mocks.session_scope.assert_not_called()

    def test_lost_race_returns_the_winning_request(self, mocks):
        """If a concurrent submit inserts first, the unique index error returns its request."""
        mocks.find_app.return_value = _app()
        winner = SimpleNamespace(id=2)
        mocks.find_pending.side_effect = [None, winner]
        scope = MagicMock()
        scope.__enter__.side_effect = IntegrityError('INSERT', {}, Exception('duplicate key'))
        mocks.session_scope.return_value = scope

        assert ApplicationsService.create_access_request(7) is winner

    def test_integrity_error_without_pending_request_is_raised(self, mocks):
        """An IntegrityError that isn't a duplicate pending request still propagates."""
        mocks.find_app.return_value = _app()
        scope = MagicMock()
        scope.__enter__.side_effect = IntegrityError('INSERT', {}, Exception('fk violation'))
        mocks.session_scope.return_value = scope

        with pytest.raises(IntegrityError):
            ApplicationsService.create_access_request(7)
