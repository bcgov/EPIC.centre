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
"""API endpoints for managing app configurations."""

from http import HTTPStatus

from flask_restx import Namespace, Resource

from centre_api.auth import auth
from centre_api.resources.apihelper import Api as ApiHelper
from centre_api.schemas.app_config import AppConfigSchema
from centre_api.services.app_config_service import AppConfigService
from centre_api.utils.util import cors_preflight


API = Namespace('app-configs', description='Endpoints for app configuration management')
"""Custom exception messages
"""


@cors_preflight('GET, OPTIONS')
@API.route('', methods=['GET', 'OPTIONS'])
class AppConfigs(Resource):
    """Resource for managing app configurations."""

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Fetch all app configurations')
    @auth.require
    def get():
        """Fetch all app configurations."""
        app_configs = AppConfigService.get_all_app_configs()
        return AppConfigSchema(many=True).dump(app_configs), HTTPStatus.OK
