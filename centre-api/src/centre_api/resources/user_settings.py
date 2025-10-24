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
"""API endpoints for managing user settings."""

from http import HTTPStatus

from flask import g, request
from flask_restx import Namespace, Resource

from centre_api.auth import auth
from centre_api.models.user_settings import UserSettings
from centre_api.resources.apihelper import Api as ApiHelper
from centre_api.schemas.user_settings import UserSettingsSchema
from centre_api.utils.util import cors_preflight


API = Namespace('user-settings', description='Endpoints for user settings management')


@cors_preflight('GET, OPTIONS')
@API.route('', methods=['GET', 'OPTIONS'])
class GetUserSettings(Resource):
    """Resource for fetching user settings."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Get current user settings')
    @auth.require
    def get():
        """Get current user settings."""
        try:
            token_info = g.jwt_oidc_token_info
            username = token_info.get('preferred_username') or token_info.get('username')

            if not username:
                return {'message': 'Username not found in token'}, HTTPStatus.BAD_REQUEST

            user_settings = UserSettings.find_by_username(username)

            if not user_settings:
                # Return default settings if none exist
                return {
                    'username': username,
                    'card_positions': {},
                    'settings': {}
                }, HTTPStatus.OK

            return UserSettingsSchema().dump(user_settings), HTTPStatus.OK

        except (ValueError, KeyError) as e:
            return {'message': f'Error fetching user settings: {str(e)}'}, HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('PUT, OPTIONS')
@API.route('/card-positions', methods=['PUT', 'OPTIONS'])
class UpdateCardPositions(Resource):
    """Resource for updating card positions."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Update card positions')
    @auth.require
    def put():
        """Update card positions for current user."""
        try:
            token_info = g.jwt_oidc_token_info
            username = token_info.get('preferred_username') or token_info.get('username')

            if not username:
                return {'message': 'Username not found in token'}, HTTPStatus.BAD_REQUEST

            data = request.get_json()
            card_positions = data.get('card_positions', {})

            user_settings = UserSettings.update_card_positions(username, card_positions)
            return UserSettingsSchema().dump(user_settings), HTTPStatus.OK

        except (ValueError, KeyError) as e:
            return {'message': f'Error updating card positions: {str(e)}'}, HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('PUT, OPTIONS')
@API.route('/settings', methods=['PUT', 'OPTIONS'])
class UpdateSettings(Resource):
    """Resource for updating general settings."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Update user settings')
    @auth.require
    def put():
        """Update settings for current user."""
        try:
            token_info = g.jwt_oidc_token_info
            username = token_info.get('preferred_username') or token_info.get('username')

            if not username:
                return {'message': 'Username not found in token'}, HTTPStatus.BAD_REQUEST

            data = request.get_json()
            settings = data.get('settings', {})

            user_settings = UserSettings.create_or_update_settings(username, settings=settings)
            return UserSettingsSchema().dump(user_settings), HTTPStatus.OK

        except (ValueError, KeyError) as e:
            return {'message': f'Error updating settings: {str(e)}'}, HTTPStatus.INTERNAL_SERVER_ERROR
