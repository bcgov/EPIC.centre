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
"""Tests for the configuration module."""
import os
import subprocess
import sys

from centre_api.config import _mask_password


class TestConnectionStringLogging:
    """Connection string logging."""

    def test_import_prints_connection_strings_without_passwords(self):
        """Printed connection strings mask the password."""
        env = {
            **os.environ,
            'DATABASE_USERNAME': 'app',
            'DATABASE_PASSWORD': 'dev-secret-pw',
            'DATABASE_HOST': 'db-host',
            'DATABASE_PORT': '5432',
            'DATABASE_NAME': 'centre',
            'DATABASE_DOCKER_USERNAME': 'docker',
            'DATABASE_DOCKER_PASSWORD': 'docker-secret-pw',
            'DATABASE_DOCKER_HOST': 'docker-host',
            'DATABASE_DOCKER_NAME': 'centre',
        }

        result = subprocess.run(
            [sys.executable, '-c', 'import centre_api.config'],
            env=env, capture_output=True, text=True, check=True
        )
        output = result.stdout + result.stderr

        assert 'dev-secret-pw' not in output
        assert 'docker-secret-pw' not in output
        assert 'postgresql://app:***@db-host:5432/centre' in output
        assert 'postgresql://docker:***@docker-host:5432/centre' in output

    def test_empty_password_leaves_connection_string_unchanged(self):
        """An empty password leaves the string unchanged."""
        assert _mask_password('postgresql://app:@db-host:5432/centre', '') == 'postgresql://app:@db-host:5432/centre'
