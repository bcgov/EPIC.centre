# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""This module initializes and configures the Flask-Limiter extension for rate limiting.

Limits are set per endpoint with @limiter.limit, placed below @auth.require so the
caller's token is available as the key. There are no default limits: they would run
before authentication and key on the OpenShift router's address, which all users share.
Counters are in memory, so each gunicorn worker counts separately.
"""

from flask import g
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


# Endpoints that queue emails
EMAIL_LIMIT = '5/minute;30/day'
# Endpoints that write to the database, EPIC.auth or EPIC.submit
WRITE_LIMIT = '30/minute'
# Endpoints that fan out to EPIC.auth
SEARCH_LIMIT = '60/minute'


def get_user_identifier():
    """Key requests by the caller's token subject, falling back to the remote address."""
    token_info = getattr(g, 'jwt_oidc_token_info', None) or {}
    return token_info.get('sub') or token_info.get('preferred_username') or get_remote_address()


# Limiter instance — initialized later in app factory
limiter = Limiter(key_func=get_user_identifier, default_limits=[])
