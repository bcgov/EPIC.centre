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
"""user functions."""
from centre_api.enums.epic_app import GROUP_TO_APP_NAME_MAP
from centre_api.services.auth_api_service import AuthApiService


class UserService:
    """Service for handling user-related operations."""

    @classmethod
    def get_users(cls):
        """Retrieve users and enrich them with application access information."""
        users = AuthApiService.get_users()
        return [cls._enrich_user_with_apps(user) for user in users]

    @staticmethod
    def _enrich_user_with_apps(user):
        """Enrich a single user dictionary with app names based on their groups."""
        group_paths = [group['path'] for group in user.get('groups', [])]
        app_names = {GROUP_TO_APP_NAME_MAP.get(path.split('/')[0]) for path in group_paths}
        user['apps'] = sorted(filter(None, app_names))
        return user
