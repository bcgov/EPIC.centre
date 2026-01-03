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
"""API endpoints for managing EAO Analytics."""
from http import HTTPStatus

from flask import request
from flask_restx import Namespace, Resource

from centre_api.auth import auth
from centre_api.resources.apihelper import Api as ApiHelper
from centre_api.schemas.eao_analytics import EaoAnalyticsCreateSchema, EaoAnalyticsSchema
from centre_api.services.eao_analytics_service import EaoAnalyticsService
from centre_api.utils.util import cors_preflight


API = Namespace('eao-analytics', description='Endpoints for EAO Analytics management')


@cors_preflight('POST, OPTIONS')
@API.route('', methods=['POST', 'OPTIONS'])
class CreateEaoAnalytics(Resource):
    """Resource for creating/updating EAO Analytics."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Create or update EAO Analytics record')
    @auth.require
    def post():
        """Create or update EAO Analytics record."""
        try:
            data = request.get_json()
            schema = EaoAnalyticsCreateSchema()
            validated_data = schema.load(data)

            user_auth_guid = validated_data.get('user_auth_guid')
            app_name = validated_data.get('app_name')

            analytics = EaoAnalyticsService.record_login_by_app_name(
                user_auth_guid=user_auth_guid,
                app_name=app_name
            )

            return EaoAnalyticsSchema().dump(analytics), HTTPStatus.OK

        except ValueError as e:
            return {'message': f'Invalid data: {str(e)}'}, HTTPStatus.BAD_REQUEST
        except (RuntimeError, AttributeError) as e:
            return {'message': f'Error creating analytics record: {str(e)}'}, HTTPStatus.INTERNAL_SERVER_ERROR


@cors_preflight('GET, OPTIONS')
@API.route('', methods=['GET', 'OPTIONS'])
class GetEaoAnalytics(Resource):
    """Resource for fetching EAO Analytics with optional filtering."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Get EAO Analytics records with optional filters')
    @auth.require
    def get():
        """Get EAO Analytics records with optional filtering by user_auth_guid and/or app_name."""
        try:
            user_auth_guid = request.args.get('user_auth_guid', type=str)
            app_name = request.args.get('app_name', type=str)

            analytics = EaoAnalyticsService.get_analytics(
                user_auth_guid=user_auth_guid,
                app_name=app_name
            )

            return EaoAnalyticsSchema(many=True).dump(analytics), HTTPStatus.OK

        except (RuntimeError, AttributeError) as e:
            return {'message': f'Error fetching analytics: {str(e)}'}, HTTPStatus.INTERNAL_SERVER_ERROR
