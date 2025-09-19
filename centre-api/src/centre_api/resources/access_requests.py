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
"""API endpoints for managing a access requests."""

from http import HTTPStatus

from flask_restx import Namespace, Resource

from centre_api.auth import auth
from centre_api.resources.apihelper import Api as ApiHelper
from centre_api.services.access_requests import AccessRequestsService
from centre_api.utils.util import cors_preflight


API = Namespace('access-requests', description='Endpoints for access requests management')
"""Custom exception messages
"""


@cors_preflight('GET, OPTIONS')
@API.route('/status/<status>', methods=['GET', 'OPTIONS'])
class Applications(Resource):
    """Resource for managing access requests."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Fetch all access requests')
    @auth.require
    def get(status):
        """Fetch all access requests."""
        access_requests = AccessRequestsService.get_all_by_status(status)
        return access_requests, HTTPStatus.OK
