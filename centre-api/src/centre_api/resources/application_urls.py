"""Application URL resources."""
from flask import g, request
from flask_restx import Namespace, Resource
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

from centre_api.auth import auth
from centre_api.models import SslCertificate
from centre_api.models.application_url import ApplicationUrl
from centre_api.models.db import db
from centre_api.schemas.application_url_schema import ApplicationUrlSchema, ApplicationUrlUpdateSchema


API = Namespace('application-urls', description='Endpoints for Application URLs')
EPIC_CENTRE_CLIENT = 'epic-centre'
VIEW_SSL_INFO_ROLE = 'view_ssl_info'
EDIT_APP_URL_ROLE = 'edit_app_url'

# Initialize schemas
create_schema = ApplicationUrlSchema()
update_schema = ApplicationUrlUpdateSchema()


def current_username():
    """Return the caller's username for created_by/updated_by."""
    username = g.token_info.get('preferred_username') or g.token_info.get('username')
    return username[:50] if isinstance(username, str) else None


def _duplicate_environment(app_name, environment):
    message = f'{app_name} already has a {environment} URL. Edit that one instead.'
    return {'message': message, 'errors': {'environment': [message]}}, 409


@API.route('')
class ApplicationUrls(Resource):
    """Resource for managing application URLs."""

    @staticmethod
    @auth.require_any_role([VIEW_SSL_INFO_ROLE, EDIT_APP_URL_ROLE], client_names=[EPIC_CENTRE_CLIENT])
    def get():
        """Fetch all active application URLs."""
        urls = ApplicationUrl.find_all_active()
        return [url.to_dict() for url in urls], 200

    @staticmethod
    @auth.require_any_role([EDIT_APP_URL_ROLE], client_names=[EPIC_CENTRE_CLIENT])
    def post():
        """Create a new application URL."""
        try:
            data = create_schema.load(request.get_json())
        except ValidationError as err:
            return {'message': 'Validation failed', 'errors': err.messages}, 400

        same_app = ApplicationUrl.find_active_by_app_name(data['app_name'])
        # Keep the existing spelling so the app's URLs stay in one group
        app_name = same_app[0].app_name if same_app else data['app_name']
        if any(row.environment.upper() == data['environment'] for row in same_app):
            return _duplicate_environment(app_name, data['environment'])

        new_url = ApplicationUrl(
            app_name=app_name,
            environment=data['environment'],
            url=data['url'],
            certificate=SslCertificate.find_or_create_for_url(data['url']),
            is_active=True,
            created_by=current_username(),
        )
        try:
            new_url.save()
        except IntegrityError:
            # Another request added this environment since the check above
            db.session.rollback()
            return _duplicate_environment(app_name, data['environment'])

        return new_url.to_dict(), 201


@API.route('/<int:url_id>')
class ApplicationUrlResource(Resource):
    """Resource for updating a specific application URL."""

    @staticmethod
    @auth.require_any_role([EDIT_APP_URL_ROLE], client_names=[EPIC_CENTRE_CLIENT])
    def put(url_id):
        """Change an application URL, moving it to its new host's certificate if the host changed."""
        app_url = ApplicationUrl.find_active_by_id(url_id)
        if not app_url:
            return {'message': 'URL not found'}, 404

        try:
            data = update_schema.load(request.get_json())
        except ValidationError as err:
            return {'message': 'Validation failed', 'errors': err.messages}, 400

        app_url.url = data['url']
        app_url.certificate = SslCertificate.find_or_create_for_url(data['url'])
        app_url.updated_by = current_username()
        app_url.save()
        return app_url.to_dict(), 200

    @staticmethod
    @auth.require_any_role([EDIT_APP_URL_ROLE], client_names=[EPIC_CENTRE_CLIENT])
    def delete(url_id):
        """Deactivate an application URL, keeping the row for history."""
        app_url = ApplicationUrl.find_active_by_id(url_id)
        if not app_url:
            return {'message': 'URL not found'}, 404

        app_url.is_active = False
        app_url.updated_by = current_username()
        app_url.save()
        return '', 204
