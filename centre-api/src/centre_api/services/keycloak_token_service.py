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
"""Keycloak service account token retrieval.

Provides a ``client_credentials`` token for service-to-service calls (e.g.
calling the submit API from centre-api). This does not handle user or group
management, which continue to go through epic.auth.
"""

import requests
from flask import current_app


class KeycloakTokenService:
    """Minimal Keycloak client for obtaining service account tokens."""

    @staticmethod
    def get_service_account_token() -> str:
        """Obtain a service account token via the client_credentials grant.

        :return: The access token string.
        """
        config = current_app.config
        base_url = config.get('KEYCLOAK_BASE_URL')
        realm = config.get('KEYCLOAK_REALM_NAME')
        client_id = config.get('KEYCLOAK_SERVICE_ACCOUNT_ID')
        client_secret = config.get('KEYCLOAK_SERVICE_ACCOUNT_SECRET')
        timeout = int(config.get('CONNECT_TIMEOUT', 30))

        token_url = f'{base_url}/auth/realms/{realm}/protocol/openid-connect/token'
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        data = {
            'client_id': client_id,
            'grant_type': 'client_credentials',
            'client_secret': client_secret,
        }

        response = requests.post(token_url, data=data, headers=headers, timeout=timeout)
        response.raise_for_status()
        return response.json().get('access_token')
