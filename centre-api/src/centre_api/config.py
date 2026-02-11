# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""All of the configuration for the service is captured here.

All items are loaded,
or have Constants defined here that are loaded into the Flask configuration.
All modules and lookups get their configuration from the Flask config,
rather than reading environment variables directly or by accessing this configuration directly.
"""

import os
import sys

from dotenv import find_dotenv, load_dotenv

# this will load all the envars from a .env file located in the project root (api)
load_dotenv(find_dotenv())

from centre_api.enums.epic_app import APP_LAUNCH_URLS, APP_USER_MANAGEMENT_URLS


def get_named_config(config_name: str = 'development'):
    """Return the configuration object based on the name.

    :raise: KeyError: if an unknown configuration is requested
    """
    if config_name in ['production', 'staging', 'default']:
        config = ProdConfig()
    elif config_name == 'testing':
        config = TestConfig()
    elif config_name == 'development':
        config = DevConfig()
    elif config_name == 'docker':
        config = DockerConfig()
    else:
        raise KeyError("Unknown configuration '{config_name}'")
    return config


class _Config():  # pylint: disable=too-few-public-methods
    """Base class configuration that should set reasonable defaults for all the other configurations."""

    PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))

    SECRET_KEY = 'a secret'

    TESTING = False
    DEBUG = False

    # POSTGRESQL
    DB_USER = os.getenv('DATABASE_USERNAME', '')
    DB_PASSWORD = os.getenv('DATABASE_PASSWORD', '')
    DB_NAME = os.getenv('DATABASE_NAME', '')
    DB_HOST = os.getenv('DATABASE_HOST', '')
    DB_PORT = os.getenv('DATABASE_PORT', '5432')
    SQLALCHEMY_DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{int(DB_PORT)}/{DB_NAME}'
    SQLALCHEMY_ECHO = True
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT_OIDC Settings
    JWT_OIDC_WELL_KNOWN_CONFIG = os.getenv('JWT_OIDC_WELL_KNOWN_CONFIG')
    JWT_OIDC_ALGORITHMS = os.getenv('JWT_OIDC_ALGORITHMS', 'RS256')
    JWT_OIDC_JWKS_URI = os.getenv('JWT_OIDC_JWKS_URI')
    JWT_OIDC_ISSUER = os.getenv('JWT_OIDC_ISSUER')
    JWT_OIDC_AUDIENCE = os.getenv('JWT_OIDC_AUDIENCE', 'account')
    JWT_OIDC_CACHING_ENABLED = os.getenv('JWT_OIDC_CACHING_ENABLED', 'True')
    JWT_OIDC_JWKS_CACHE_TIMEOUT = 300

    # Service account details
    KEYCLOAK_BASE_URL = os.getenv('KEYCLOAK_BASE_URL')
    KEYCLOAK_REALM_NAME = os.getenv('KEYCLOAK_REALM_NAME')
    KEYCLOAK_SERVICE_ACCOUNT_ID = os.getenv('MET_ADMIN_CLIENT_ID')
    KEYCLOAK_SERVICE_ACCOUNT_SECRET = os.getenv('MET_ADMIN_CLIENT_SECRET')
    KEYCLOAK_ADMIN_CLIENT = os.getenv('KEYCLOAK_ADMIN_CLIENT')
    KEYCLOAK_ADMIN_SECRET = os.getenv('KEYCLOAK_ADMIN_SECRET')

    APP_NAME = os.getenv('APP_NAME')
    DST_EMAIL = os.getenv('DST_EMAIL')
    EPIC_CENTRE_WEB_URL = os.getenv('EPIC_CENTRE_WEB_URL', 'http://localhost:5173')

    AUTH_API = os.getenv('AUTH_API', 'http://localhost:8080')
    SUBMIT_API_URL = os.getenv('SUBMIT_API_URL', 'http://localhost:8080')

    # Application Launch & User Management URLs (from epic_app._CFG)
    APP_LAUNCH_URLS = APP_LAUNCH_URLS
    APP_USER_MANAGEMENT_URLS = APP_USER_MANAGEMENT_URLS

    # Epic group names (Keycloak top-level group names)
    EPIC_GROUP_COMPLIANCE = os.getenv('EPIC_GROUP_COMPLIANCE', 'COMPLIANCE')
    EPIC_GROUP_CONDITION_REPO = os.getenv('EPIC_GROUP_CONDITION_REPO', 'CONDITION-REPO')
    EPIC_GROUP_SUBMIT = os.getenv('EPIC_GROUP_SUBMIT', 'SUBMIT')
    EPIC_GROUP_TRACK = os.getenv('EPIC_GROUP_TRACK', 'TRACK')
    EPIC_GROUP_ENGAGE = os.getenv('EPIC_GROUP_ENGAGE', 'ENGAGE')
    EPIC_GROUP_CENTRE = os.getenv('EPIC_GROUP_CENTRE', 'CENTRE')
    EPIC_GROUP_PUBLIC = os.getenv('EPIC_GROUP_PUBLIC', 'PUBLIC')

    # Epic admin subgroup names (Keycloak group names)
    EPIC_ADMIN_SUBGROUP_ADMIN = os.getenv('EPIC_ADMIN_SUBGROUP_ADMIN', 'ADMIN')
    EPIC_ADMIN_SUBGROUP_EAO_MANAGER = os.getenv('EPIC_ADMIN_SUBGROUP_EAO_MANAGER', 'EAO_MANAGER')
    EPIC_ADMIN_SUBGROUP_INSTANCE_ADMIN = os.getenv('EPIC_ADMIN_SUBGROUP_INSTANCE_ADMIN', 'INSTANCE_ADMIN')
    EPIC_ADMIN_SUBGROUP_SUPERUSER = os.getenv('EPIC_ADMIN_SUBGROUP_SUPERUSER', 'SUPERUSER')
    EPIC_ADMIN_SUBGROUP_SUPER_USER = os.getenv('EPIC_ADMIN_SUBGROUP_SUPER_USER', 'SUPER_USER')

    # Epic admin group paths (Group/Subgroup)
    EPIC_ADMIN_GROUP_PATH_COMPLIANCE = os.getenv('EPIC_ADMIN_GROUP_PATH_COMPLIANCE', 'COMPLIANCE/SUPERUSER')
    EPIC_ADMIN_GROUP_PATH_CONDITION_REPO = os.getenv('EPIC_ADMIN_GROUP_PATH_CONDITION_REPO', 'CONDITION-REPO/ADMIN')
    EPIC_ADMIN_GROUP_PATH_SUBMIT = os.getenv('EPIC_ADMIN_GROUP_PATH_SUBMIT', 'SUBMIT/EAO_MANAGER')
    EPIC_ADMIN_GROUP_PATH_TRACK = os.getenv('EPIC_ADMIN_GROUP_PATH_TRACK', 'TRACK/INSTANCE_ADMIN')
    EPIC_ADMIN_GROUP_PATH_ENGAGE = os.getenv('EPIC_ADMIN_GROUP_PATH_ENGAGE', 'ENGAGE/INSTANCE_ADMIN')
    EPIC_ADMIN_GROUP_PATH_CENTRE = os.getenv('EPIC_ADMIN_GROUP_PATH_CENTRE', 'CENTRE/SUPER_USER')
    EPIC_ADMIN_GROUP_PATH_PUBLIC = os.getenv('EPIC_ADMIN_GROUP_PATH_PUBLIC', 'PUBLIC/ADMIN')

    # Epic app client names (Keycloak client IDs)
    EPIC_APP_CLIENT_CONDITION_REPOSITORY = os.getenv('EPIC_APP_CLIENT_CONDITION_REPOSITORY', 'epic-condition')
    EPIC_APP_CLIENT_EPIC_COMPLIANCE = os.getenv('EPIC_APP_CLIENT_EPIC_COMPLIANCE', 'epic-compliance')
    EPIC_APP_CLIENT_EPIC_TRACK = os.getenv('EPIC_APP_CLIENT_EPIC_TRACK', 'epictrack-web')
    EPIC_APP_CLIENT_EPIC_PUBLIC = os.getenv('EPIC_APP_CLIENT_EPIC_PUBLIC', 'epic-public')
    EPIC_APP_CLIENT_EPIC_SUBMIT = os.getenv('EPIC_APP_CLIENT_EPIC_SUBMIT', 'epic-submit')
    EPIC_APP_CLIENT_EPIC_ENGAGE = os.getenv('EPIC_APP_CLIENT_EPIC_ENGAGE', 'epic-engage')
    EPIC_APP_CLIENT_EPIC_CENTRE = os.getenv('EPIC_APP_CLIENT_EPIC_CENTRE', 'epic-centre')


class DevConfig(_Config):  # pylint: disable=too-few-public-methods
    """Dev Config."""

    TESTING = False
    DEBUG = True
    print(f'SQLAlchemy URL (DevConfig): {_Config.SQLALCHEMY_DATABASE_URI}')


class TestConfig(_Config):  # pylint: disable=too-few-public-methods
    """In support of testing only.used by the py.test suite."""

    DEBUG = True
    TESTING = True
    DEBUG = True
    TESTING = True

    # POSTGRESQL
    DB_USER = os.getenv('DATABASE_TEST_USERNAME', 'postgres')
    DB_PASSWORD = os.getenv('DATABASE_TEST_PASSWORD', 'postgres')
    DB_NAME = os.getenv('DATABASE_TEST_NAME', 'testdb')
    DB_HOST = os.getenv('DATABASE_TEST_HOST', 'localhost')
    DB_PORT = os.getenv('DATABASE_TEST_PORT', '5432')
    SQLALCHEMY_DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{int(DB_PORT)}/{DB_NAME}'

    JWT_OIDC_TEST_MODE = True
    # JWT_OIDC_ISSUER = _get_config('JWT_OIDC_TEST_ISSUER')
    JWT_OIDC_TEST_AUDIENCE = os.getenv('JWT_OIDC_TEST_AUDIENCE')
    JWT_OIDC_TEST_CLIENT_SECRET = os.getenv('JWT_OIDC_TEST_CLIENT_SECRET')
    JWT_OIDC_TEST_ISSUER = os.getenv('JWT_OIDC_TEST_ISSUER')
    JWT_OIDC_WELL_KNOWN_CONFIG = os.getenv('JWT_OIDC_WELL_KNOWN_CONFIG')
    JWT_OIDC_TEST_ALGORITHMS = os.getenv('JWT_OIDC_TEST_ALGORITHMS')
    JWT_OIDC_TEST_JWKS_URI = os.getenv('JWT_OIDC_TEST_JWKS_URI', default=None)


class DockerConfig(_Config):  # pylint: disable=too-few-public-methods
    """In support of testing only.used by the py.test suite."""

    # POSTGRESQL
    DB_USER = os.getenv('DATABASE_DOCKER_USERNAME')
    DB_PASSWORD = os.getenv('DATABASE_DOCKER_PASSWORD')
    DB_NAME = os.getenv('DATABASE_DOCKER_NAME')
    DB_HOST = os.getenv('DATABASE_DOCKER_HOST')
    DB_PORT = os.getenv('DATABASE_DOCKER_PORT', '5432')
    SQLALCHEMY_DATABASE_URI = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{int(DB_PORT)}/{DB_NAME}'

    print(f'SQLAlchemy URL (Docker): {SQLALCHEMY_DATABASE_URI}')


class ProdConfig(_Config):  # pylint: disable=too-few-public-methods
    """Production Config."""

    SECRET_KEY = os.getenv('SECRET_KEY', None)

    if not SECRET_KEY:
        SECRET_KEY = os.urandom(24)
        print('WARNING: SECRET_KEY being set as a one-shot', file=sys.stderr)

    TESTING = False
    DEBUG = False
