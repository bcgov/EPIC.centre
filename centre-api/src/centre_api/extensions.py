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
"""This module initializes and configures the Flask-Limiter extension for rate limiting."""

from flask import g
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


# Custom key function that uses user identity if available
def get_user_identifier():
    """Get user identifier for rate limiting."""
    return g.jwt_oidc_token_info.get('preferred_username') if hasattr(g,
                                                                      'jwt_oidc_token_info') else get_remote_address()


# Limiter instance — initialized later in app factory
limiter = Limiter(key_func=get_user_identifier, default_limits=[])
