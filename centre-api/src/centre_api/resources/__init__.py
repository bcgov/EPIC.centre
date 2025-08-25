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
"""Exposes all of the resource endpoints mounted in Flask-Blueprint style.

Uses restplus namespaces to mount individual api endpoints into the service.

All services have 2 defaults sets of endpoints:
 - ops
 - meta
That are used to expose operational health information about the service, and meta information.
"""

from flask import Blueprint


from .apihelper import Api
from .ops import API as OPS_API

from .applications import API as APPLICATIONS_API

__all__ = ('API_BLUEPRINT', 'OPS_BLUEPRINT')

URL_PREFIX = '/api/'
API_BLUEPRINT = Blueprint('API', __name__, url_prefix=URL_PREFIX)
OPS_BLUEPRINT = Blueprint("API_OPS", __name__, url_prefix="/ops")

authorizations = {
    'Bearer Auth': {
        'type': 'apiKey',
        'in': 'header',
        'name': 'Authorization',
        'description': 'Add "Bearer " before your token'
    }
}

API_OPS = Api(
    OPS_BLUEPRINT,
    title="Service OPS API",
    version="1.0",
    description="The Core API for the Reports System",
)

API_OPS.add_namespace(OPS_API, path="/")

API = Api(
    API_BLUEPRINT,
    title='CENTRE API',
    version='1.0.0',
    description='The Core API for CENTRE',
    authorizations=authorizations
)

# HANDLER = ExceptionHandler(API)

API.add_namespace(APPLICATIONS_API)
