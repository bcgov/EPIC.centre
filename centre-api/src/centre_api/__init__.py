"""
EPIC Centre API Application.

This module initializes the Flask application and registers all blueprints.
"""

from flask import Flask
from flask_cors import CORS

from centre_api.auth import jwt
from centre_api.config import get_named_config
from centre_api.models import db, ma, migrate
from centre_api.utils.cache import cache
from centre_api.utils.util import allowedorigins


def create_app(config_object=None):
    """Create and configure the Flask application."""
    app = Flask(__name__)

    if config_object is None:
        config_object = get_named_config()

    app.config.from_object(config_object)

    # Initialize extensions with app
    db.init_app(app)
    ma.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Register blueprints
    from centre_api.resources import (
        API_BLUEPRINT,
        OPS_BLUEPRINT
    )
    app.register_blueprint(API_BLUEPRINT)
    app.register_blueprint(OPS_BLUEPRINT)

    # Enable CORS
    CORS(app, origins=allowedorigins())

    return app
