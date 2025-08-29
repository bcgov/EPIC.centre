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

from .apihelper import Api as ApiHelper
from ..schemas.application import ApplicationSchema

API = Namespace('applications', description='Endpoints for applications management')
"""Custom exception messages
"""


@cors_preflight('GET, OPTIONS, POST')
@API.route('', methods=['POST', 'GET', 'OPTIONS'])
class Users(Resource):
    """Resource for managing applications."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Fetch all applications')
    @auth.require
    def get():
        """Fetch all applications."""
        applications = ApplicationsService.get_all()
        return ApplicationSchema(many=True).dump(applications), HTTPStatus.OK


@API.route('/request-catalog', methods=['GET'])
class CatalogApplications(Resource):
    """Resource for applications that can be requested."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Fetch applications that are'
                                                            ' available to request access to')
    @auth.require
    def get():
        """Fetch apps the user can request access to."""
        applications = ApplicationsService.get_request_catalog()
        return ApplicationSchema(many=True).dump(applications), HTTPStatus.OK
