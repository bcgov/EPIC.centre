"""The App Initiation file.

This module is for the initiation of the flask app.
"""

import os
from http import HTTPStatus

import secure
from flask import Flask, current_app, g, request
from flask_cors import CORS

from centre_api.auth import jwt
from centre_api.config import get_named_config
from centre_api.models import db, ma, migrate
from centre_api.utils.cache import cache
from centre_api.utils.util import allowedorigins


# Security Response headers
csp = (
    secure.ContentSecurityPolicy()
    .default_src("'self'")
    .script_src("'self' 'unsafe-inline'")
    .style_src("'self' 'unsafe-inline'")
    .img_src("'self' data:")
    .object_src("'self'")
    .connect_src("'self'")
)

hsts = secure.StrictTransportSecurity().include_subdomains().preload().max_age(31536000)
referrer = secure.ReferrerPolicy().no_referrer()
cache_value = secure.CacheControl().no_store().max_age(0)
xfo_value = secure.XFrameOptions().deny()
secure_headers = secure.Secure(
    csp=csp,
    hsts=hsts,
    referrer=referrer,
    cache=cache_value,
    xfo=xfo_value
)


def create_app(run_mode=os.getenv('FLASK_ENV', 'development')):
    """Create flask app."""
    from centre_api.resources import (  # pylint: disable=import-outside-toplevel
        API_BLUEPRINT, OPS_BLUEPRINT)

    # Flask app initialize
    app = Flask(__name__)

    # All configuration are in config file
    app.config.from_object(get_named_config(run_mode))

    CORS(app, origins=allowedorigins(), supports_credentials=True)

    # Register blueprints
    app.register_blueprint(API_BLUEPRINT)
    app.register_blueprint(OPS_BLUEPRINT)

    # Setup jwt for keycloak
    if os.getenv('FLASK_ENV', 'production') != 'testing':
        setup_jwt_manager(app, jwt)

    # Database connection initialize
    db.init_app(app)

    # Database migrate initialize
    migrate.init_app(app, db)

    # Marshmallow initialize
    ma.init_app(app)

    @app.before_request
    def set_origin():
        g.origin_url = request.environ.get('HTTP_ORIGIN', 'localhost')

    build_cache(app)

    @app.after_request
    def set_secure_headers(response):
        """Set CORS headers for security."""
        secure_headers.framework.flask(response)
        response.headers.add('Cross-Origin-Resource-Policy', '*')
        response.headers['Cross-Origin-Opener-Policy'] = '*'
        response.headers['Cross-Origin-Embedder-Policy'] = 'unsafe-none'
        return response

    @app.errorhandler(Exception)
    def handle_error(err):
        if run_mode != "production":
            # To get stacktrace in local development for internal server errors
            raise err
        current_app.logger.error(str(err))
        return "Internal server error", HTTPStatus.INTERNAL_SERVER_ERROR

    # Return App for run in run.py file
    return app


def build_cache(app):
    """Build cache."""
    cache.init_app(app)


def setup_jwt_manager(app, jwt_manager):
    """Use flask app to configure the JWTManager to work for a particular Realm."""

    def get_roles(a_dict):
        realm_access = a_dict.get('realm_access', {})
        realm_roles = realm_access.get('roles', [])

        client_name = current_app.config.get('JWT_OIDC_AUDIENCE')

        resource_access = a_dict.get('resource_access', {})
        client_roles = resource_access.get(client_name, {}).get('roles', [])

        return realm_roles + client_roles

    app.config['JWT_ROLE_CALLBACK'] = get_roles

    jwt_manager.init_app(app)
