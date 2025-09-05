"""Service for applications management."""
import datetime
import os

from centre_api.enums.emai_queue_templates import EmailQueueTemplate
from centre_api.enums.epic_app import CLIENT_NAME_TO_APP_NAME_MAP, EpicAppName
from centre_api.models import Application as ApplicationModel
from centre_api.models import EmailQueue
from centre_api.models.access_requests import AccessRequests as AccessRequestsModal
from centre_api.models.db import session_scope
from centre_api.utils.datetime_util import local_datetime, convert_utc_to_local_str, utc_datetime
from centre_api.utils.token_info import TokenInfo


class ApplicationsService:
    """Applications service."""

    @classmethod
    def get_all(cls):
        """Get all apps."""
        accessed_apps = cls.get_user_accessed_apps_names()
        public_apps = [EpicAppName.DOCUMENT_SEARCH.value]
        accessed_apps.update(public_apps)

        apps = ApplicationModel.get_all()
        if not accessed_apps:
            return []
        apps = [(app, user_app) for app, user_app in apps if app.name in accessed_apps]
        return [
            {
                'id': app.id,
                'name': app.name,
                'title': app.title,
                'description': app.description,
                'launch_url': app.launch_url,
                'is_active': app.is_active,
                'user': {
                    'user_auth_guid': user_app.user_auth_guid if user_app else None,
                    'access_level': user_app.access_level if user_app else None,
                    'last_accessed': user_app.last_accessed.isoformat() if (
                        user_app and user_app.last_accessed) else None,
                    'sort_order': user_app.sort_order if user_app else None,
                    'bookmarks': user_app.bookmarks if user_app else []
                }
            }
            for app, user_app in apps
        ]

    @classmethod
    def get_request_catalog(cls):
        """Get request access catalog."""
        apps = ApplicationModel.get_all()
        exception_apps = {EpicAppName.CONDITION_REPOSITORY.value, EpicAppName.EPIC_COMPLIANCE.value,
                          EpicAppName.DOCUMENT_SEARCH.value}
        filtered_apps = [(app, user_app) for app, user_app in apps if app.name not in exception_apps]
        accessed_apps = cls.get_user_accessed_apps_names()
        access_requests = AccessRequestsModal.get_all_requests_by_user(TokenInfo.get_id())
        return [
            {
                'id': app.id,
                'name': app.name,
                'title': app.title,
                'description': app.description,
                'is_active': app.is_active,
                'status': 'accessed' if app.name in accessed_apps else (
                    'pending' if any(req.app_id == app.id for req in access_requests) else 'not_requested'),
                'user': {
                    'user_auth_guid': user_app.user_auth_guid if user_app else None,
                    'access_level': user_app.access_level if user_app else None,
                    'last_accessed': user_app.last_accessed.isoformat() if (
                        user_app and user_app.last_accessed) else None,
                }
            }
            for app, user_app in filtered_apps
        ]

    @classmethod
    def _queue_access_request_submitted_email(cls, session, app):
        """Queue access request submitted email."""
        user_details = TokenInfo.get_user_data()
        now = datetime.datetime.utcnow()
        requested_at = convert_utc_to_local_str(now)
        email_queue = EmailQueue(
            template_name=EmailQueueTemplate.ACCESS_REQUEST_SUBMITTED_CONFIRMATION.value,
            payload={
                'recipients': [user_details.get('email_address')],
                'user_name': f"{user_details.get('first_name', '')} {user_details.get('last_name', '')}".strip(),
                'application_name': app.title,
                'application_url': app.launch_url,
                'epic_centre_link': f"{os.getenv('EPIC_CENTRE_WEB_URL')}/request-access",
                'requested_at': requested_at,
                'sender': os.getenv('DST_EMAIL')
            },
        )
        session.add(email_queue)

    @classmethod
    def create_access_request(cls, app_id: int):
        """Create an access request for the given app_id."""
        user_auth_id = TokenInfo.get_id()
        app = ApplicationModel.find_by_id(app_id)
        if not app:
            raise ValueError(f'Application with id {app_id} does not exist.')

        # Check if an access request already exists
        existing_request = AccessRequestsModal.query.filter_by(app_id=app_id, user_auth_guid=user_auth_id).first()
        if existing_request:
            return existing_request
        with session_scope() as session:
            # Queue the email within the same transaction
            new_request = AccessRequestsModal(app_id=app_id, user_auth_guid=user_auth_id)
            session.add(new_request)
            session.flush()
            cls._queue_access_request_submitted_email(session, app)
            session.commit()

        return new_request

    @classmethod
    def get_user_accessed_apps_names(cls):
        """Get names of apps the user has accessed."""
        user_data = TokenInfo.get_user_data()
        resource_access = user_data.get('resource_access', {})
        accessed_clients = list(resource_access.keys())

        accessed_apps = {CLIENT_NAME_TO_APP_NAME_MAP[client] for client in accessed_clients
                         if client in CLIENT_NAME_TO_APP_NAME_MAP}
        return accessed_apps
