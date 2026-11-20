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
from marshmallow import ValidationError

from centre_api.auth import auth
from centre_api.extensions import WRITE_LIMIT, limiter
from centre_api.services.user_application_service import UserApplicationsService

from ..schemas.user_application import MAX_BOOKMARKS, BookmarkSchema, UserApplicationSchema
from .apihelper import Api as ApiHelper
from .apihelper import json_body


API = Namespace('user-applications', description='Endpoints for user applications management')
"""Custom exception messages
"""


@API.route('/bookmarks', methods=['PATCH'])
class UserApplicationBookmarks(Resource):
    """Resource for managing user application bookmarks."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Update bookmarks for a user application')
    @auth.require
    @limiter.limit(WRITE_LIMIT)
    def patch():
        """Update bookmarks for a user application."""
        payload = json_body()
        app_id = payload.get('app_id')
        bookmarks = payload.get('bookmarks')

        if not app_id or bookmarks is None:
            return {'message': 'Missing required fields'}, HTTPStatus.BAD_REQUEST
        if not isinstance(app_id, int) or isinstance(app_id, bool):
            return {'message': 'app_id must be an application id'}, HTTPStatus.BAD_REQUEST
        if not isinstance(bookmarks, list) or len(bookmarks) > MAX_BOOKMARKS:
            return {'message': f'Bookmarks must be a list of at most {MAX_BOOKMARKS}'}, HTTPStatus.BAD_REQUEST
        try:
            bookmarks = BookmarkSchema(many=True).load(bookmarks)
        except ValidationError as err:
            return {'message': 'Invalid bookmarks', 'errors': err.messages}, HTTPStatus.BAD_REQUEST

        try:
            user_app = UserApplicationsService.update_user_application_bookmarks(app_id, bookmarks)
        except ValueError as err:
            return {'message': str(err)}, HTTPStatus.BAD_REQUEST
        return UserApplicationSchema().dump(user_app), HTTPStatus.OK


@API.route('/sort-order', methods=['PATCH'])
class UserApplicationSortOrder(Resource):
    """Resource for managing user application sort orders."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Update bookmarks for a user application')
    @auth.require
    @limiter.limit(WRITE_LIMIT)
    def patch():
        """Update sort order for a user application."""
        app_ids = json_body(list)
        if not all(isinstance(app_id, int) and not isinstance(app_id, bool) for app_id in app_ids):
            return {'message': 'Sort order must be a list of app ids'}, HTTPStatus.BAD_REQUEST
        # One upsert can't update the same row twice
        if len(set(app_ids)) != len(app_ids):
            return {'message': 'Sort order must not repeat an app id'}, HTTPStatus.BAD_REQUEST

        try:
            UserApplicationsService.update_sort_order(app_ids)
        except ValueError as err:
            return {'message': str(err)}, HTTPStatus.BAD_REQUEST
        return 'sort order updated successfully', HTTPStatus.OK
