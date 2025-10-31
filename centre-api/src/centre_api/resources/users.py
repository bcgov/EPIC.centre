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
"""API endpoints for managing an user resource."""

from http import HTTPStatus

from flask import request
from flask_restx import Namespace, Resource

from centre_api.auth import auth
from centre_api.resources.apihelper import Api as ApiHelper
from centre_api.schemas.user import UserSchema
from centre_api.services.user_service import UserService
from centre_api.utils.util import cors_preflight


API = Namespace('users', description='Endpoints for applications management')
"""Custom exception messages
"""


@cors_preflight('GET, OPTIONS')
@API.route('', methods=['GET', 'OPTIONS'])
class Users(Resource):
    """Resource for fetching users."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Fetch all users')
    @auth.require
    def get():
        """Fetch all users."""
        search_text = request.args.get('search', None)
        include_groups = request.args.get('include_groups', 'true').lower() == 'true'
        users = UserService.get_users(search_text, include_groups)
        return UserSchema(many=True).dump(users), HTTPStatus.OK


@cors_preflight('GET, OPTIONS')
@API.route('/username/<username>', methods=['GET', 'OPTIONS'])
class UserByUsername(Resource):
    """Resource for fetching users."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Fetch all users')
    @auth.require
    def get(username):
        """Fetch a user by username."""
        user = UserService.get_user_by_username(username)
        if not user:
            return {'message': 'User not found'}, HTTPStatus.NOT_FOUND
        return UserSchema().dump(user), HTTPStatus.OK


@cors_preflight('PUT, OPTIONS')
@API.route('/<username>/access', methods=['PUT', 'OPTIONS'])
class User(Resource):
    """Resource for fetching users."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Fetch all users')
    @auth.require
    def put(username):
        """Update a user group assignment."""
        access_data = API.payload
        UserService.update_user_access(username, access_data)
        return 'User group updated', HTTPStatus.OK


@cors_preflight('PUT, OPTIONS')
@API.route('/<username>/access', methods=['PUT', 'OPTIONS'])
class User(Resource):
    """Resource for fetching users."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Fetch all users')
    @auth.require
    def delete(username):
        """Delete user groups assignment."""
        access_data = API.payload
        UserService.revoke_user_access(username, access_data)
        return 'User group revoked', HTTPStatus.OK
