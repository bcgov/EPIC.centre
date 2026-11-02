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
import re
from functools import wraps

from flask import g, request
from flask_jwt_oidc import JwtManager


jwt = (
    JwtManager()
)  # pylint: disable=invalid-name; lower case name as used by convention in most Flask apps


class Auth:  # pylint: disable=too-few-public-methods
    """Extending JwtManager to include additional functionalities."""

    @staticmethod
    def is_idir(token_info):
        """Check verified claims, falling back to the protected IDIR username."""
        if 'identity_provider' in token_info:
            return str(token_info['identity_provider']).lower() == 'idir'

        username = str(token_info.get('preferred_username', '')).lower()
        return re.fullmatch(r'[0-9a-f]{32}@idir', username) is not None

    @classmethod
    def require(cls, f):
        """Validate the Bearer Token."""

        @jwt.requires_auth
        @wraps(f)
        def decorated(*args, **kwargs):
            g.authorization_header = request.headers.get('Authorization', None)
            g.token_info = g.jwt_oidc_token_info
            if not cls.is_idir(g.token_info):
                return {'message': 'IDIR authentication required'}, 403

            return f(*args, **kwargs)

        return decorated

auth = (
    Auth()
)
