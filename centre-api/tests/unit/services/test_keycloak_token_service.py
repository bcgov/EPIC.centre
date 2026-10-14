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
"""Unit tests for KeycloakTokenService."""
from unittest.mock import MagicMock, patch

import pytest
import requests

from centre_api.services.keycloak_token_service import KeycloakTokenService


class TestKeycloakTokenService:
    """Test suite for the service account token client."""

    @patch('centre_api.services.keycloak_token_service.requests.post')
    def test_get_service_account_token_success(self, mock_post):
        """Return the access token from a successful client_credentials request."""
        mock_response = MagicMock()
        mock_response.json.return_value = {'access_token': 'a-service-token'}
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        token = KeycloakTokenService.get_service_account_token()

        assert token == 'a-service-token'
        assert mock_post.call_count == 1
        _args, kwargs = mock_post.call_args
        # Token endpoint built from base url + realm
        assert kwargs.get('data', {}).get('grant_type') == 'client_credentials'

    @patch('centre_api.services.keycloak_token_service.requests.post')
    def test_get_service_account_token_raises_on_http_error(self, mock_post):
        """Propagate HTTP errors from the token endpoint."""
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = requests.HTTPError('boom')
        mock_post.return_value = mock_response

        with pytest.raises(requests.HTTPError):
            KeycloakTokenService.get_service_account_token()
