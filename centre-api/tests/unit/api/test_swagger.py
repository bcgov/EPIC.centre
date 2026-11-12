# Copyright © 2026 Province of British Columbia
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
"""Swagger is off unless ENABLE_SWAGGER is set."""
from http import HTTPStatus

import pytest
from flask import Blueprint, Flask

from centre_api.resources import ENABLE_SWAGGER
from centre_api.resources.apihelper import Api


@pytest.mark.skipif(ENABLE_SWAGGER, reason='ENABLE_SWAGGER is set in this environment')
@pytest.mark.parametrize('path', ['/api/', '/api/swagger.json', '/ops/', '/ops/swagger.json'])
def test_swagger_is_not_served_by_default(client, path):
    """Neither the UI nor the spec is public."""
    assert client.get(path).status_code == HTTPStatus.NOT_FOUND


def test_health_check_is_still_served(client):
    """Turning docs off leaves the ops endpoints in place."""
    assert client.get('/ops/healthz').status_code == HTTPStatus.OK


@pytest.mark.parametrize('enable_docs, expected', [(True, HTTPStatus.OK), (False, HTTPStatus.NOT_FOUND)])
def test_enable_docs_controls_spec_and_ui_routes(enable_docs, expected):
    """enable_docs serves or leaves out both swagger.json and the UI."""
    blueprint = Blueprint(f'docs_{enable_docs}', __name__, url_prefix='/docs-test')
    Api(blueprint, enable_docs=enable_docs)
    flask_app = Flask(__name__)
    flask_app.register_blueprint(blueprint)

    with flask_app.test_client() as test_client:
        assert test_client.get('/docs-test/swagger.json').status_code == expected
        assert test_client.get('/docs-test/').status_code == expected
