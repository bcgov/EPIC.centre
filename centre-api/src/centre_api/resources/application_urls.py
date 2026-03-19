"""Application URL resources."""

from flask_restx import Namespace, Resource
from flask import request
from marshmallow import ValidationError

from centre_api.auth import auth
from centre_api.models.application_url import ApplicationUrl
from centre_api.schemas.application_url_schema import ApplicationUrlSchema, ApplicationUrlUpdateSchema


API = Namespace('application-urls', description='Endpoints for Application URLs')
EPIC_CENTRE_CLIENT = 'epic-centre'
VIEW_SSL_INFO_ROLE = 'view_ssl_info'
EDIT_APP_URL_ROLE = 'edit_app_url'

# Initialize schemas
create_schema = ApplicationUrlSchema()
update_schema = ApplicationUrlUpdateSchema()


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
            
        new_url = ApplicationUrl(
            app_name=data['app_name'],
            environment=data['environment'],
            url=data['url'],
            ssl_status='Unknown',  # Default until checked
            ticket_reference=data.get('ticket_reference'),
            renewal_status=data.get('renewal_status') or 'NONE',
            renewal_comments=data.get('renewal_comments'),
            is_active=True
        )
        new_url.save()
        
        return new_url.to_dict(), 201


@API.route('/<int:url_id>')
class ApplicationUrlResource(Resource):
    """Resource for updating a specific application URL."""

    @staticmethod
    @auth.require_any_role([EDIT_APP_URL_ROLE], client_names=[EPIC_CENTRE_CLIENT])
    def put(url_id):
        """Update an existing application URL."""
        app_url = ApplicationUrl.find_by_id(url_id)
        if not app_url:
            return {'message': 'URL not found'}, 404

        try:
            data = update_schema.load(request.get_json(), partial=True)
        except ValidationError as err:
            return {'message': 'Validation failed', 'errors': err.messages}, 400
        
        # Update only provided fields
        for key, value in data.items():
            setattr(app_url, key, value)
        
        app_url.save()
        return app_url.to_dict(), 200

    @staticmethod
    @auth.require_any_role([EDIT_APP_URL_ROLE], client_names=[EPIC_CENTRE_CLIENT])
    def delete(url_id):
        """Delete an application URL."""
        app_url = ApplicationUrl.find_by_id(url_id)
        if not app_url:
            return {'message': 'URL not found'}, 404

        app_url.delete()
        return '', 204
