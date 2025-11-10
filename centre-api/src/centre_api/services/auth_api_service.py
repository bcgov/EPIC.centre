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
"""auth admin functions."""
import os
from urllib.parse import urlencode

import requests
from flask import current_app, g


class AuthApiService:
    """Keycloak services."""

    @staticmethod
    def get_group_members(group_name, sub_group_name=None):
        """Get members of group."""
        try:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': g.authorization_header,
            }

            url = f'{os.getenv("AUTH_API")}/api/users/groups/{group_name}/members'
            if sub_group_name:
                url += f'?sub_group_name={sub_group_name}'

            timeout = current_app.config.get('CONNECT_TIMEOUT', 30)
            response = requests.get(url, headers=headers, timeout=timeout)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            current_app.logger.error(f'Error fetching group members: {e}')
            return []

    @staticmethod
    def get_users(search_text: str = None, include_groups: bool = True):
        """Fetch users from the Auth API, optionally filtered by search text."""
        try:
            base_url = f'{os.getenv("AUTH_API")}/api/users'
            query_params = {'include_groups': 'true' if include_groups else 'false'}

            if search_text:
                query_params['search'] = search_text

            query_string = urlencode(query_params)
            url = f'{base_url}?{query_string}'

            headers = {
                'Content-Type': 'application/json',
                'Authorization': g.authorization_header,
            }

            timeout = current_app.config.get('CONNECT_TIMEOUT', 30)
            response = requests.get(url, headers=headers, timeout=timeout)
            response.raise_for_status()

            return response.json()

        except requests.RequestException as error:
            current_app.logger.error(f'Error fetching users: {error}')
            return []

    @staticmethod
    def get_user_by_id(user_auth_guid):
        """Fetch a single user by username from the Auth API."""
        try:
            base_url = f'{os.getenv("AUTH_API")}/api/users/guid/{user_auth_guid}?group_brief_representation=false'

            headers = {
                'Content-Type': 'application/json',
                'Authorization': g.authorization_header,
            }

            timeout = current_app.config.get('CONNECT_TIMEOUT', 30)
            response = requests.get(base_url, headers=headers, timeout=timeout)
            response.raise_for_status()

            return response.json()
        except requests.RequestException as error:
            current_app.logger.error(f'Error fetching user by username: {error}')
            raise error

    @staticmethod
    def get_user_by_username(username):
        """Fetch a single user by username from the Auth API."""
        try:
            base_url = f'{os.getenv("AUTH_API")}/api/users/{username}?group_brief_representation=false'

            headers = {
                'Content-Type': 'application/json',
                'Authorization': g.authorization_header,
            }

            timeout = current_app.config.get('CONNECT_TIMEOUT', 30)
            response = requests.get(base_url, headers=headers, timeout=timeout)
            response.raise_for_status()

            return response.json()
        except requests.RequestException as error:
            current_app.logger.error(f'Error fetching user by username: {error}')
            raise error

    @staticmethod
    def get_group(group_name):
        """Fetch app groups from the Auth API."""
        try:
            base_url = f'{os.getenv("AUTH_API")}/api/groups/{group_name}?include_sub_groups=true'

            headers = {
                'Content-Type': 'application/json',
                'Authorization': g.authorization_header,
            }

            timeout = current_app.config.get('CONNECT_TIMEOUT', 30)
            response = requests.get(base_url, headers=headers, timeout=timeout)
            response.raise_for_status()

            return response.json()
        except requests.RequestException as error:
            current_app.logger.error(f'Error fetching app groups: {error}')
            raise error

    @staticmethod
    def update_user_group(username: str, group_data):
        """Fetch a single user by username from the Auth API."""
        try:
            base_url = f'{os.getenv("AUTH_API")}/api/users/{username}/groups'

            headers = {
                'Content-Type': 'application/json',
                'Authorization': g.authorization_header,
            }

            timeout = current_app.config.get('CONNECT_TIMEOUT', 30)
            request_body = {
                'app_name': group_data.get('parent_group_name'),
                'group_name': group_data.get('group_name')
            }
            response = requests.put(base_url, headers=headers, timeout=timeout, json=request_body)
            response.raise_for_status()

            return response
        except requests.RequestException as error:
            current_app.logger.error(f'Error fetching user by username: {error}')
            raise error

    @staticmethod
    def delete_all_user_group_mapping(username: str):
        """Delete all user group mappings."""
        try:
            base_url = f'{os.getenv("AUTH_API")}/api/users/{username}/groups'

            headers = {
                'Content-Type': 'application/json',
                'Authorization': g.authorization_header,
            }

            timeout = current_app.config.get('CONNECT_TIMEOUT', 30)
            response = requests.delete(base_url, headers=headers, timeout=timeout)
            response.raise_for_status()

            return response
        except requests.RequestException as error:
            current_app.logger.error(f'Error deleting user group mappings: {error}')
            raise error

    @staticmethod
    def patch_user(username: str, patch_data: dict):
        """Patch a user's information in the Auth API.

        This forwards a partial update to EPIC.auth's PATCH /users/<username> endpoint.

        :param username: The user's Keycloak username
        :param patch_data: Dictionary of allowed fields (e.g. 'enabled', 'attributes')
        :return: The updated user dict
        """
        try:
            base_url = f'{os.getenv("AUTH_API")}/api/users/{username}'

            headers = {
                'Content-Type': 'application/json',
                'Authorization': g.authorization_header,
            }

            timeout = current_app.config.get('CONNECT_TIMEOUT', 30)
            response = requests.patch(base_url, headers=headers, timeout=timeout, json=patch_data)
            response.raise_for_status()

            return
        except requests.RequestException as error:
            current_app.logger.error(f'Error patching user "{username}": {error}')
            raise error
