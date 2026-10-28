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
"""submit api functions."""


import requests
from flask import current_app, g

from centre_api.services.keycloak_token_service import KeycloakTokenService
from centre_api.utils.util import quote_path_segment


class SubmitApiService:
    """Submit API services."""

    @staticmethod
    def create_staff_user(email, group_name):
        """Create staff user in submit."""
        try:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': g.authorization_header,
            }

            url = f'{current_app.config.get("SUBMIT_API_URL")}/api/staff/staff-user/'
            payload = {
                'email': email,
                'group_name': group_name
            }

            timeout = current_app.config.get('CONNECT_TIMEOUT', 30)
            response = requests.post(url, json=payload, headers=headers, timeout=timeout)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            current_app.logger.error(f'Error creating staff user in submit: {e}')
            # Propagate the error so the caller can decide how to handle it
            raise e

    @staticmethod
    def remove_staff_user_work_by_user(auth_guid):
        """Remove all of a user's staff work assignments in submit.

        Calls submit's ``DELETE /api/staff-user-works/user/<auth_guid>`` endpoint,
        which is guarded by a submit staff role. A Keycloak service account token
        is used because the inbound centre user token does not carry submit roles.

        :param auth_guid: The user's identity id as stored by submit (its
            ``auth_guid``), e.g. ``"<guid>@idir"``.
        """
        try:
            token = KeycloakTokenService.get_service_account_token()
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}',
            }

            url = (
                f'{current_app.config.get("SUBMIT_API_URL")}'
                f'/api/staff-user-works/user/{quote_path_segment(auth_guid)}'
            )

            timeout = current_app.config.get('CONNECT_TIMEOUT', 30)
            response = requests.delete(url, headers=headers, timeout=timeout)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            current_app.logger.error(
                f'Error removing staff user work in submit for '
                f'auth_guid "{auth_guid}": {e}'
            )
            # Propagate the error so the caller can decide how to handle it
            raise e
