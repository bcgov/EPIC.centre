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
"""API endpoints for exposing admin configuration."""

from http import HTTPStatus

from flask_restx import Namespace, Resource

from centre_api.auth import auth
from centre_api.resources.apihelper import Api as ApiHelper
from centre_api.services.admin_config_service import AdminConfigService


API = Namespace('admin-config', description='Endpoints for admin configuration')
"""Custom exception messages
"""


@API.route('/group-paths', methods=['GET'])
class AdminGroupPaths(Resource):
    """Resource for exposing admin group paths."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Fetch admin group paths by app client')
    @auth.require
    def get():
        """Fetch the admin group paths keyed by Epic app client name."""
        group_paths = AdminConfigService.get_admin_group_paths()
        return group_paths, HTTPStatus.OK
