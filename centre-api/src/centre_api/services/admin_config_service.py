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
"""Service for admin configuration management."""

from centre_api.enums.epic_app import EPIC_CLIENT_TO__ADMIN_GROUPS_PATHS


class AdminConfigService:
    """Service for handling admin configuration operations."""

    @classmethod
    def get_admin_group_paths(cls):
        """Return the admin group paths keyed by Epic app client name.

        Only clients with a non-empty admin group path are included. Paths are
        returned without a leading slash (e.g. "CENTRE/SUPER_USER") to match the
        normalized group path format used across the apps.
        """
        return {
            client_name: group_path
            for client_name, group_path in EPIC_CLIENT_TO__ADMIN_GROUPS_PATHS.items()
            if group_path
        }
