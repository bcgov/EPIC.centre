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
"""Bring in the common JWT Manager."""
from functools import wraps

from flask import current_app, g, request
from flask_jwt_oidc import JwtManager


jwt = (
    JwtManager()
)  # pylint: disable=invalid-name; lower case name as used by convention in most Flask apps


class Auth:  # pylint: disable=too-few-public-methods
    """Extending JwtManager to include additional functionalities."""

    @staticmethod
    def _get_roles(client_names=None):
        """Extract effective realm and selected client roles from the current token."""
        token_info = g.jwt_oidc_token_info
        realm_access = token_info.get('realm_access', {})
        realm_roles = realm_access.get('roles', [])

        resource_access = token_info.get('resource_access', {})
        client_roles = []
        clients_to_check = client_names or current_app.config.get('JWT_OIDC_AUDIENCE')

        if isinstance(clients_to_check, list):
            for client in clients_to_check:
                client_roles.extend(resource_access.get(client, {}).get('roles', []))
        else:
            client_roles = resource_access.get(clients_to_check, {}).get('roles', [])

        return set(realm_roles + client_roles)

    @classmethod
    def require(cls, f):
        """Validate the Bearer Token."""

        @jwt.requires_auth
        @wraps(f)
        def decorated(*args, **kwargs):
            g.authorization_header = request.headers.get('Authorization', None)
            g.token_info = g.jwt_oidc_token_info

            return f(*args, **kwargs)

        return decorated

    @classmethod
    def require_any_role(cls, roles, client_names=None):
        """Validate the Bearer Token and require at least one matching role."""

        def decorator(f):
            @jwt.requires_auth
            @wraps(f)
            def decorated(*args, **kwargs):
                g.authorization_header = request.headers.get('Authorization', None)
                g.token_info = g.jwt_oidc_token_info

                if not cls._get_roles(client_names).intersection(set(roles)):
                    return {'message': 'Access denied'}, 403

                return f(*args, **kwargs)

            return decorated

        return decorator


auth = (
    Auth()
)
