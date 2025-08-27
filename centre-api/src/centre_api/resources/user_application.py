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

from flask_restx import Namespace, Resource

from centre_api.auth import auth
from centre_api.services.user_application_service import UserApplicationsService
from centre_api.utils.util import cors_preflight

from .apihelper import Api as ApiHelper
from ..schemas.user_application import UserApplicationSchema

API = Namespace('user-applications', description='Endpoints for user applications management')
"""Custom exception messages
"""


@cors_preflight('PATCH, OPTIONS')
@API.route('/bookmarks', methods=['PATCH', 'OPTIONS'])
class UserApplicationBookmarks(Resource):
    """Resource for managing user application bookmarks."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Update bookmarks for a user application')
    @auth.require
    def patch():
        """Update bookmarks for a user application."""
        payload = API.payload
        app_id = payload.get('app_id')
        bookmarks = payload.get('bookmarks')

        if not app_id or bookmarks is None:
            return {'message': 'Missing required fields'}, HTTPStatus.BAD_REQUEST

        user_app = UserApplicationsService.update_user_application_bookmarks(app_id, bookmarks)
        return UserApplicationSchema().dump(user_app), HTTPStatus.OK
