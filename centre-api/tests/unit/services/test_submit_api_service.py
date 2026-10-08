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
"""Unit tests for SubmitApiService."""
from unittest.mock import MagicMock, patch

import pytest
import requests

from centre_api.services.submit_api_service import SubmitApiService


class TestRemoveStaffUserWorkByUser:
    """Test suite for SubmitApiService.remove_staff_user_work_by_user."""

    @patch('centre_api.services.submit_api_service.requests.delete')
    @patch('centre_api.services.submit_api_service.KeycloakTokenService.get_service_account_token')
    def test_remove_staff_user_work_success(self, mock_token, mock_delete):
        """Call submit's by-user DELETE with a service-account bearer token."""
        mock_token.return_value = 'svc-token'
        mock_response = MagicMock()
        mock_response.json.return_value = {'message': 'removed'}
        mock_response.raise_for_status.return_value = None
        mock_delete.return_value = mock_response

        result = SubmitApiService.remove_staff_user_work_by_user('abc123@idir')

        assert result == {'message': 'removed'}
        assert mock_delete.call_count == 1
        args, kwargs = mock_delete.call_args
        called_url = args[0] if args else kwargs.get('url')
        assert called_url.endswith('/api/staff-user-works/user/abc123@idir')
        assert kwargs['headers']['Authorization'] == 'Bearer svc-token'

    @patch('centre_api.services.submit_api_service.requests.delete')
    @patch('centre_api.services.submit_api_service.KeycloakTokenService.get_service_account_token')
    def test_remove_staff_user_work_raises_on_http_error(self, mock_token, mock_delete):
        """Propagate request errors to the caller."""
        mock_token.return_value = 'svc-token'
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = requests.HTTPError('404')
        mock_delete.return_value = mock_response

        with pytest.raises(requests.RequestException):
            SubmitApiService.remove_staff_user_work_by_user('abc123@idir')
