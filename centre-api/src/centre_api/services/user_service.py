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

from centre_api.enums.access_request_status import AccessRequestsStatusEnum
from centre_api.enums.epic_app import (
    APP_NAME_TO_CLIENT_NAME_MAP, APP_NAME_TO_GROUP_MAP, GROUP_TO_APP_NAME_MAP, EpicAppClientName)
from centre_api.models.access_requests import AccessRequests as AccessRequestsModal
from centre_api.services.auth_api_service import AuthApiService
from centre_api.utils.token_info import TokenInfo


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
        app_roles = defaultdict(lambda: {'level': float('-inf'), 'role': None, 'group_name': None, 'group_path': None})

        current_user = AuthApiService.get_user_by_username(TokenInfo.get_username())
        current_user_is_dst_admin = AuthApiService.is_admin_of_app(current_user, EpicAppClientName.EPIC_CENTRE.value)
        for group in user.get('groups', []):
            path = group.get('path', '')
            level = group.get('level', float('-inf'))
            display_name = group.get('display_name', '')
            top_path = path.split('/')[0]
            app_name = GROUP_TO_APP_NAME_MAP.get(top_path)
            if app_name:
                if level > app_roles[app_name]['level']:
                    app_roles[app_name] = {
                        'level': level,
                        'role': display_name,
                        'group_name': group.get('name', ''),
                        'group_path': path
                    }

        for app_name in GROUP_TO_APP_NAME_MAP.values():
            if app_name not in app_roles:
                app_roles[app_name] = {
                    'level': None,
                    'role': None,
                    'group_name': None,
                    'group_path': None
                }

        apps = [
            {'name': app_name, 'role': role_info.get('role'),
             'group_name': role_info.get('group_name'), 'group_path': role_info.get('group_path')}
            for app_name, role_info in sorted(app_roles.items())
        ]

        filtered_apps = [
            app for app in apps
            if current_user_is_dst_admin or AuthApiService.is_admin_of_app(current_user,
                                                                           APP_NAME_TO_CLIENT_NAME_MAP.get(app['name'])
                                                                           )
        ]

        user['apps'] = filtered_apps
        return user

    @classmethod
    def update_user_access(cls, username: str, access_data: dict):
        """Update user group."""
        had_admin_access_on_app = cls.has_admin_access_on_app(access_data.get('app_name'))
        if not had_admin_access_on_app:
            raise PermissionError(f'User does not have permission to update access for app'
                                  f' "{access_data.get("app_name")}".')

        response = AuthApiService.update_user_group(username, access_data)
        access_request_id = access_data.get('access_request_id')
        if access_request_id:
            access_request = AccessRequestsModal.find_by_id(access_request_id)
            if access_request:
                access_request.status = AccessRequestsStatusEnum.APPROVED.value
                access_request.save()
        return response

    @classmethod
    def revoke_user_access(cls, username: str, access_data: dict):
        """Revoke user access from a specific app."""
        app_name = access_data.get('app_name')

        # Check permissions
        had_admin_access_on_app = cls.has_admin_access_on_app(app_name)
        if not had_admin_access_on_app:
            raise PermissionError(f'User does not have permission to update access for app'
                                  f' "{app_name}".')

        # Map app_name to group_name using existing mapping
        # e.g., 'epic_track' -> 'TRACK'
        group_name = APP_NAME_TO_GROUP_MAP.get(app_name)

        if not group_name:
            raise ValueError(f'Invalid app_name: {app_name}')

        # Delete from app-specific parent group + all subgroups
        response = AuthApiService.delete_user_group(
            username,
            group_name,
            del_sub_group_mappings=True
        )

        return response

    @classmethod
    def has_admin_access_on_app(cls, app_name: str):
        """Check if the user had admin access on the given app."""
        current_user = AuthApiService.get_user_by_username(TokenInfo.get_username())
        has_dst_admin_roles = AuthApiService.is_admin_of_app(current_user, EpicAppClientName.EPIC_CENTRE.value)
        if has_dst_admin_roles:
            return True

        client_name = APP_NAME_TO_CLIENT_NAME_MAP.get(app_name)
        return AuthApiService.is_admin_of_app(current_user, client_name)

    @classmethod
    def update_user_status(cls, username: str, patch_data: dict):
        """Update user status (enabled,firstName, etc.) via EPIC.auth.

        This wraps the patch_user call to allow access from resource layer.
        Allowed keys should match EPIC.auth's whitelist.

        :param username: Keycloak username
        :param patch_data: Dict of fields to update (e.g. {"enabled": True})
        :return: Updated user dict
        """
        return AuthApiService.patch_user(username, patch_data)
