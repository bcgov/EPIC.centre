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
"""API tests for the app-wide error handler in production mode."""
from http import HTTPStatus
from unittest.mock import patch

import pytest

from centre_api import create_app


@pytest.fixture
def production_app(monkeypatch):
    """Return an app built in production mode."""
    # Keeps create_app from fetching real JWKS, as in CI
    monkeypatch.setenv('FLASK_ENV', 'testing')
    app = create_app(run_mode='production')

    def boom():
        raise RuntimeError('boom')

    app.add_url_rule('/boom', view_func=boom)
    return app


@pytest.fixture
def production_client(production_app):  # pylint: disable=redefined-outer-name
    """Return a client for the production-mode app."""
    return production_app.test_client()


@pytest.mark.parametrize('path', ['/nope', '/api/nope'])
def test_unknown_route_returns_404(production_client, path):
    """An unknown route is a 404, not a 500."""
    response = production_client.get(path)

    assert response.status_code == HTTPStatus.NOT_FOUND


def test_wrong_method_returns_405(production_client):
    """A known route with the wrong method is a 405, not a 500."""
    # A plain Flask route: flask-restx routes answer 405 without reaching the handler
    response = production_client.post('/boom')

    assert response.status_code == HTTPStatus.METHOD_NOT_ALLOWED


def test_unexpected_error_returns_500_and_logs_traceback(production_app, production_client):
    """An unexpected error is a generic 500, with the traceback logged."""
    # Patched rather than captured: caplog sees nothing from the app logger in this suite
    with patch.object(production_app.logger, 'error') as log_error:
        response = production_client.get('/boom')

    assert response.status_code == HTTPStatus.INTERNAL_SERVER_ERROR
    assert response.get_data(as_text=True) == 'Internal server error'
    log_error.assert_called_once()
    assert isinstance(log_error.call_args.kwargs['exc_info'], RuntimeError)
