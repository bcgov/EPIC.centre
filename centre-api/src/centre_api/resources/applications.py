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
from centre_api.services.applications_service import ApplicationsService
from centre_api.utils.util import cors_preflight

from ..schemas.access_request import AccessRequestCatalogSchema, AccessRequestSchema
from ..schemas.application import ApplicationSchema
from .apihelper import Api as ApiHelper


API = Namespace('applications', description='Endpoints for applications management')
"""Custom exception messages
"""


@cors_preflight('GET, OPTIONS')
@API.route('', methods=['GET', 'OPTIONS'])
class Applications(Resource):
    """Resource for managing applications."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Fetch all applications')
    @auth.require
    def get():
        """Fetch all applications."""
        applications = ApplicationsService.get_all()
        return ApplicationSchema(many=True).dump(applications), HTTPStatus.OK


@cors_preflight('GET, OPTIONS')
@API.route('/request-catalog', methods=['GET'])
class CatalogApplications(Resource):
    """Resource for applications that can be requested."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Fetch access request catalogs that are'
                                                            ' available to request access to')
    @auth.require
    def get():
        """Fetch apps the user can request access to."""
        access_request_catalog = ApplicationsService.get_request_catalog()
        return AccessRequestCatalogSchema(many=True).dump(access_request_catalog), HTTPStatus.OK


@cors_preflight('OPTIONS, POST')
@API.route('/<int:app_id>/access_request', methods=['POST'])
class CatalogApplication(Resource):
    """Resource for applications that can be requested."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Fetch access request catalogs that are')
    @auth.require
    def post(app_id):
        """Create access request."""
        access_request = ApplicationsService.create_access_request(app_id)
        return AccessRequestSchema().dump(access_request), HTTPStatus.OK


@cors_preflight('GET, OPTIONS')
@API.route('/<app_name>/access-levels', methods=['GET'])
class CatalogApplications(Resource):
    """Resource for applications that can be requested."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Fetch access request catalogs that are'
                                                            ' available to request access to')
    @auth.require
    def get(app_name):
        """Fetch apps the user can request access to."""
        access_levels = ApplicationsService.get_app_access_levels(app_name)
        return access_levels, HTTPStatus.OK
