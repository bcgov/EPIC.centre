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
from collections import defaultdict

from centre_api.enums.epic_app import GROUP_TO_APP_NAME_MAP
from centre_api.services.auth_api_service import AuthApiService


class UserService:
    """Service for handling user-related operations."""

    @classmethod
    def get_user_by_username(cls, username: str):
        """Retrieve a user by username and enrich with application access information."""
        user = AuthApiService.get_user_by_username(username)
        return cls._enrich_user_with_apps(user)

    @classmethod
    def get_users(cls, search_text: str = None, include_groups: bool = True):
        """Retrieve users and enrich them with application access information."""
        users = AuthApiService.get_users(search_text, include_groups)
        return [cls._enrich_user_with_apps(user) for user in users]

    @staticmethod
    def _enrich_user_with_apps(user):
        """Enrich a single user dictionary with app names and highest level roles based on their groups."""
        app_roles = defaultdict(lambda: {'level': float('-inf'), 'role': None, 'group_name': None})

        for group in user.get('groups', []):
            path = group.get('path', '')
            level = group.get('level', float('-inf'))
            display_name = group.get('display_name', '')
            top_path = path.split('/')[0]
            app_name = GROUP_TO_APP_NAME_MAP.get(top_path)

            if app_name:
                # Check if this group has a higher level for the app
                if level > app_roles[app_name]['level']:
                    app_roles[app_name] = {
                        'level': level,
                        'role': display_name,
                        'group_name': group.get('name', ''),
                        'group_path': path
                    }

        # Initialize all apps from GROUP_TO_APP_NAME_MAP with defaults
        all_apps = {}
        for _, app_name in GROUP_TO_APP_NAME_MAP.items():
            if app_name not in app_roles:
                all_apps[app_name] = {
                    'level': float('-inf'),
                    'role': None,
                    'group_name': None
                }
            else:
                all_apps[app_name] = app_roles[app_name]

        # Construct the apps field as required
        user['apps'] = [
            {'name': app_name, 'role': role_info['role'],
             'group_name': role_info['group_name'], 'group_path': role_info['group_path']}
            for app_name, role_info in sorted(app_roles.items())
        ]

        return user

    @classmethod
    def update_user_group(cls, username: str, group_data: dict):
        """Update user group."""
        response = AuthApiService.update_user_group(username, group_data)
        return response
