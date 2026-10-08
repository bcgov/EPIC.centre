# Copyright © 2019 Province of British Columbia
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
"""Lightweight fixtures for pure-mock service unit tests.

These overrides provide a minimal Flask app (config only, no DB or JWT manager)
so service-layer unit tests that mock all I/O can run without a database or
Keycloak. They shadow the heavier session fixtures in the root conftest for
tests under ``tests/unit/services``.
"""
import pytest
from flask import Flask


@pytest.fixture(scope='session')
def app():
    """Return a minimal Flask app carrying only the config services read."""
    _app = Flask(__name__)
    _app.config.update(
        KEYCLOAK_BASE_URL='https://kc.example.com',
        KEYCLOAK_REALM_NAME='eao-epic',
        KEYCLOAK_SERVICE_ACCOUNT_ID='centre-admin',
        KEYCLOAK_SERVICE_ACCOUNT_SECRET='a-secret',
        SUBMIT_API_URL='https://submit.example.com',
        CONNECT_TIMEOUT=30,
    )
    return _app


@pytest.fixture(autouse=True)
def app_context(app):  # pylint: disable=redefined-outer-name
    """Push an application context for every service unit test."""
    with app.app_context():
        yield


@pytest.fixture(scope='session')
def db():  # pylint: disable=invalid-name
    """No-op database fixture; service unit tests mock all persistence."""
    return None


@pytest.fixture(scope='session', autouse=True)
def cleanup_database():
    """Override the root cleanup fixture; nothing to clean without a DB."""
    yield
