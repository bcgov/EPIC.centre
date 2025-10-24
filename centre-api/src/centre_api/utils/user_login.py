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
"""User login utility functions."""
from flask import g
from sqlalchemy.exc import IntegrityError

from centre_api.models.db import db
from centre_api.models.user import User


def handle_first_time_login():
    """Handle first time login by creating user entry in staff_users table."""
    try:
        # Skip if no token info (public endpoints)
        if not hasattr(g, 'jwt_oidc_token_info'):
            return

        # Skip if user context is already set (avoid duplicate processing)
        if hasattr(g, 'user_created'):
            return

        token_info = g.jwt_oidc_token_info
        username = token_info.get('preferred_username') or token_info.get('username')

        if not username:
            return

        # Check if user already exists
        existing_user = User.find_by_username(username)
        if existing_user:
            g.user_created = False
            return

        # Create new user from token information
        user_data = {
            'username': username,
            'first_name': token_info.get('given_name') or token_info.get('firstname'),
            'last_name': token_info.get('family_name') or token_info.get('lastname'),
            'email_address': token_info.get('email'),
        }

        User.create_user(user_data)
        g.user_created = True

    except IntegrityError:
        # User might have been created by another request simultaneously
        db.session.rollback()
        g.user_created = False
    except (ValueError, AttributeError, KeyError) as e:
        # Log error but don't block the request
        from flask import current_app
        current_app.logger.error(f'Error handling first time login: {str(e)}')
        g.user_created = False
