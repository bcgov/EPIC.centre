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
import os
from collections import defaultdict

import requests

from centre_api.enums.access_request_status import AccessRequestsStatusEnum
from centre_api.enums.emai_queue_templates import EmailQueueTemplate
from centre_api.enums.epic_app import (
    APP_NAME_TO_CLIENT_NAME_MAP, APP_NAME_TO_GROUP_MAP, GROUP_TO_APP_NAME_MAP, EpicAppClientName, EpicAppName)
from centre_api.models.access_requests import AccessRequests as AccessRequestsModal
from centre_api.models.db import session_scope
from centre_api.models.email_queue import EmailQueue
from centre_api.services.auth_api_service import AuthApiService
from centre_api.services.submit_api_service import SubmitApiService
from centre_api.utils.token_info import TokenInfo


class UserService:
    """Service for handling user-related operations."""

    @classmethod
    def get_user_by_username(cls, username: str):
        """Retrieve a user by username and enrich with application access information."""
        current_username = TokenInfo.get_username()
        current_user = AuthApiService.get_user_by_username(current_username)
        is_self = bool(current_username) and username.lower() == current_username.lower()
        if not is_self and not AuthApiService.is_admin(current_user):
            raise PermissionError('User does not have permission to view other users.')

        user = current_user if is_self else AuthApiService.get_user_by_username(username)
        return cls._enrich_user_with_apps(user, current_user)

    @classmethod
    def get_users(cls, search_text: str = None, include_groups: bool = True):
        """Retrieve users and enrich them with application access information."""
        current_user = AuthApiService.get_user_by_username(TokenInfo.get_username())
        if not AuthApiService.is_admin(current_user):
            raise PermissionError('User does not have permission to list users.')

        users = AuthApiService.get_users(search_text, include_groups)
        return [cls._enrich_user_with_apps(user, current_user) for user in users]

    @staticmethod
    def _enrich_user_with_apps(user, current_user=None):
        """Enrich a single user dictionary with app names and highest level roles based on their groups."""
        app_roles = defaultdict(lambda: {'level': float('-inf'), 'role': None, 'group_name': None, 'group_path': None})

        if current_user is None:
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
        app_name = access_data.get('app_name')
        # DST admins can revoke compliance access but not grant it
        allow_dst_admin = app_name != EpicAppName.EPIC_COMPLIANCE.value
        had_admin_access_on_app = cls.has_admin_access_on_app(app_name, allow_dst_admin=allow_dst_admin)
        if not had_admin_access_on_app:
            raise PermissionError(f'User does not have permission to update access for app'
                                  f' "{app_name}".')

        # Don't trust the client's parent_group_name; EPIC.auth uses it as the target group
        parent_group_name = APP_NAME_TO_GROUP_MAP.get(app_name)
        if not parent_group_name:
            raise ValueError(f'Invalid app_name: {app_name}')

        group_name = access_data.get('group_name')
        cls._validate_sub_group(parent_group_name, group_name)

        access_request, auth_user_response = cls._get_matching_access_request(
            access_data.get('access_request_id'), username, app_name
        )

        response = AuthApiService.update_user_group(username, parent_group_name, group_name)
        if app_name == EpicAppName.EPIC_SUBMIT.value:
            try:
                # Get the user's email
                user = AuthApiService.get_user_by_username(username)
                full_group_name = f'{parent_group_name}/{group_name}'
                SubmitApiService.create_staff_user(user.get('email_address'), full_group_name)
            except requests.RequestException:
                # Log error but don't fail as the main access is already granted
                pass

        if access_request:
            app = access_request.app
            with session_scope() as session:
                access_request.status = AccessRequestsStatusEnum.APPROVED.value
                session.add(access_request)
                _queue_access_granted_email(session, app, auth_user_response, access_data)
                session.commit()
        return response

    @staticmethod
    def _get_matching_access_request(access_request_id, username: str, app_name: str):
        """Return the access request and requester if they match this grant."""
        if not access_request_id:
            return None, None

        access_request = AccessRequestsModal.find_by_id(access_request_id)
        if not access_request:
            return None, None

        auth_user_response = AuthApiService.get_user_by_id(access_request.user_auth_guid)
        requester_username = str(auth_user_response.get('username', ''))
        if access_request.app.name != app_name or requester_username.lower() != username.lower():
            raise ValueError(f'Access request {access_request_id} does not match this access grant.')

        return access_request, auth_user_response

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

        # Revoking EPIC.track access must also remove the user's EPIC.submit
        # staff work assignments. Submit keys these off the identity id, which
        # is the Keycloak username (e.g. "<guid>@idir") carried in `username`.
        if app_name == EpicAppName.EPIC_TRACK.value:
            try:
                SubmitApiService.remove_staff_user_work_by_user(username)
            except requests.RequestException:
                # Log error but don't fail as the main access is already revoked
                pass

        return response

    @classmethod
    def has_admin_access_on_app(cls, app_name: str, allow_dst_admin: bool = True):
        """Check if the user had admin access on the given app."""
        current_user = AuthApiService.get_user_by_username(TokenInfo.get_username())
        has_dst_admin_roles = AuthApiService.is_admin_of_app(current_user, EpicAppClientName.EPIC_CENTRE.value)
        if allow_dst_admin and has_dst_admin_roles:
            return True

        client_name = APP_NAME_TO_CLIENT_NAME_MAP.get(app_name)
        return AuthApiService.is_admin_of_app(current_user, client_name)

    @staticmethod
    def _validate_sub_group(parent_group_name: str, group_name: str):
        """Ensure group_name is a subgroup of the app group."""
        app_group = AuthApiService.get_group(parent_group_name)
        sub_group_names = {sub_group.get('name') for sub_group in app_group.get('subGroups', [])}
        if group_name not in sub_group_names:
            raise ValueError(f'Invalid group_name "{group_name}" for app group "{parent_group_name}".')

    @classmethod
    def update_user_status(cls, username: str, patch_data: dict):
        """Update user status (enabled,firstName, etc.) via EPIC.auth.

        This wraps the patch_user call to allow access from resource layer.
        Allowed keys should match EPIC.auth's whitelist.

        :param username: Keycloak username
        :param patch_data: Dict of fields to update (e.g. {"enabled": True})
        :return: Updated user dict
        """
        current_user = AuthApiService.get_user_by_username(TokenInfo.get_username())
        if not AuthApiService.is_admin_of_app(current_user, EpicAppClientName.EPIC_CENTRE.value):
            raise PermissionError('User does not have permission to update user status.')

        return AuthApiService.patch_user(username, patch_data)


def _queue_access_granted_email(session, app, auth_user_response, access_data):
    """Queue access request granted email."""
    app_name = access_data.get('app_name')
    group_name = APP_NAME_TO_GROUP_MAP.get(app_name)
    app_group = AuthApiService.get_group(group_name)
    role_groups = list(app_group.get('subGroups', []))
    role_group = next(role_group for role_group in role_groups if role_group['name'] == access_data.get('group_name'))
    email_queue = EmailQueue(
        template_name=EmailQueueTemplate.ACCESS_GRANTED_NOTIFICATION.value,
        payload={
            'recipients': [auth_user_response.get('email_address')],
            'user_name': (
                f"{auth_user_response.get('first_name', '')} "
                f"{auth_user_response.get('last_name', '')}"
            ).strip(),
            'application_name': app.title,
            'auth_link': f"{os.getenv('EPIC_CENTRE_WEB_URL')}/launchpad",
            'access_level': role_group.get('attributes', {}).get('display_name', [''])[0],
            'sender': os.getenv('DST_EMAIL')
        },
    )
    session.add(email_queue)
