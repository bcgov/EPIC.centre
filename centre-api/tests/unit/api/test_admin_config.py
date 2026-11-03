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
"""Tests for Admin Config API endpoints."""
from http import HTTPStatus
from unittest.mock import patch

from centre_api.enums.epic_app import EpicAppClientName


class TestAdminConfigAPI:
    """Test suite for admin-config endpoints."""

    @patch('centre_api.resources.admin_config.auth.require')
    def test_get_group_paths_success(self, mock_auth, client):
        """Return the admin group paths map with a 200."""
        response = client.get(
            '/api/admin-config/group-paths',
            headers={'Authorization': 'Bearer test-token'}
        )

        assert response.status_code == HTTPStatus.OK
        data = response.get_json()
        assert data[EpicAppClientName.EPIC_CENTRE.value] == 'CENTRE/SUPER_USER'

    @patch('centre_api.resources.admin_config.auth.require')
    def test_get_group_paths_uses_service(self, mock_auth, client):
        """The endpoint returns exactly what the service provides."""
        with patch(
            'centre_api.resources.admin_config.AdminConfigService.get_admin_group_paths',
            return_value={'epic-centre': 'CENTRE/SUPER_USER'},
        ):
            response = client.get(
                '/api/admin-config/group-paths',
                headers={'Authorization': 'Bearer test-token'}
            )

        assert response.status_code == HTTPStatus.OK
        assert response.get_json() == {'epic-centre': 'CENTRE/SUPER_USER'}
