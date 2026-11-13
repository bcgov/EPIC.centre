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
"""Unit tests for AdminConfigService."""
from pathlib import Path
from unittest.mock import patch

from centre_api.enums.epic_app import GROUP_MAP, EpicAdminGroupsPath, EpicAppClientName
from centre_api.services.admin_config_service import AdminConfigService


class TestGetAdminGroupPaths:
    """Test suite for AdminConfigService.get_admin_group_paths."""

    def test_returns_centre_super_user_path(self):
        """The CENTRE client maps to its admin group path."""
        result = AdminConfigService.get_admin_group_paths()

        assert result[EpicAppClientName.EPIC_CENTRE.value] == 'CENTRE/SUPER_USER'

    def test_returns_all_configured_clients(self):
        """All non-empty admin group paths are included."""
        result = AdminConfigService.get_admin_group_paths()

        expected_clients = {
            EpicAppClientName.EPIC_CENTRE.value,
            EpicAppClientName.EPIC_TRACK.value,
            EpicAppClientName.EPIC_COMPLIANCE.value,
            EpicAppClientName.EPIC_ENGAGE.value,
            EpicAppClientName.EPIC_SUBMIT.value,
            EpicAppClientName.CONDITION_REPOSITORY.value,
            EpicAppClientName.EPIC_PUBLIC.value,
        }
        assert expected_clients.issubset(set(result.keys()))

    def test_excludes_empty_group_paths(self):
        """Clients with an empty admin group path are filtered out."""
        fake_map = {
            'epic-centre': 'CENTRE/SUPER_USER',
            'document-search': '',
        }
        with patch(
            'centre_api.services.admin_config_service.EPIC_CLIENT_TO__ADMIN_GROUPS_PATHS',
            fake_map,
        ):
            result = AdminConfigService.get_admin_group_paths()

        assert result == {'epic-centre': 'CENTRE/SUPER_USER'}
        assert 'document-search' not in result

    def test_paths_have_no_leading_slash(self):
        """Returned paths are normalized without a leading slash."""
        result = AdminConfigService.get_admin_group_paths()

        assert all(not path.startswith('/') for path in result.values())

    def test_admin_defaults_match_sample_and_chart(self):
        """Local setup, deployment and notifications agree on administrator groups."""
        root = Path(__file__).resolve().parents[4]
        sample = (root / 'centre-api/sample.env').read_text()
        chart = (root / 'deployment/charts/centre-api/values.yaml').read_text().splitlines()
        chart_keys = {
            'COMPLIANCE': 'compliance', 'CONDITION_REPO': 'conditionRepo',
            'SUBMIT': 'submit', 'TRACK': 'track', 'ENGAGE': 'engage',
            'CENTRE': 'centre', 'PUBLIC': 'public',
        }
        expected = {
            'COMPLIANCE': 'COMPLIANCE/SUPERUSER',
            'CONDITION_REPO': 'CONDITION-REPO/INSTANCE_ADMIN',
            'SUBMIT': 'SUBMIT/MPT_MANAGER',
            'TRACK': 'TRACK/INSTANCE_ADMIN',
            'ENGAGE': 'ENGAGE/EAO_IT_ADMIN',
            'CENTRE': 'CENTRE/SUPER_USER',
            'PUBLIC': 'PUBLIC/INSTANCE_ADMIN',
        }
        for name, path in expected.items():
            assert EpicAdminGroupsPath[name].value == path
            assert f'EPIC_ADMIN_GROUP_PATH_{name}={path}' in sample
            assert f'  {chart_keys[name]}: {path}' in chart
            parent, subgroup = path.rsplit('/', 1)
            assert GROUP_MAP[parent] == subgroup
