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
"""User Context to hold request scoped variables."""

import functools
from typing import Dict

from flask import g, request


def _get_context():
    """Return User context."""
    return UserContext()


class UserContext:  # pylint: disable=too-many-instance-attributes
    """Object to hold request scoped user context."""

    def __init__(self):
        """Return a User Context object."""
        token_info: Dict = _get_token_info() or {}
        self._token_info = token_info
        self._user_name = token_info.get('username', token_info.get('preferred_username', None))
        self._first_name = token_info.get('firstname', None)
        self._last_name = token_info.get('lastname', None)
        self._bearer_token = _get_token()
        self._sub = token_info.get('sub', None)
        self._name = f"{token_info.get('firstname', None)} {token_info.get('lastname', None)}"

    @property
    def user_name(self) -> str:
        """Return the user_name."""
        return self._user_name if self._user_name else None

    @property
    def first_name(self) -> str:
        """Return the user_first_name."""
        return self._first_name

    @property
    def last_name(self) -> str:
        """Return the user_last_name."""
        return self._last_name

    @property
    def bearer_token(self) -> str:
        """Return the bearer_token."""
        return self._bearer_token

    @property
    def sub(self) -> str:
        """Return the subject."""
        return self._sub

    @property
    def name(self) -> str:
        """Return the name."""
        return self._name

    @property
    def token_info(self) -> Dict:
        """Return the name."""
        return self._token_info


def user_context(function):
    """Add user context object as an argument to function."""

    @functools.wraps(function)
    def wrapper(*func_args, **func_kwargs):
        context = _get_context()
        func_kwargs['user_context'] = context
        return function(*func_args, **func_kwargs)

    return wrapper


def _get_token_info() -> Dict:
    return g.jwt_oidc_token_info if g and 'jwt_oidc_token_info' in g else {}


def _get_token() -> str:
    token: str = request.headers['Authorization'] if request and 'Authorization' in request.headers else None
    return token.replace('Bearer ', '') if token else None
