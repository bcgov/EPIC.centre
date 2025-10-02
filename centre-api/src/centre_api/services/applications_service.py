"""Service for applications management."""
import datetime
import os

from centre_api.enums.emai_queue_templates import EmailQueueTemplate
from centre_api.enums.epic_app import APP_NAME_TO_GROUP_MAP, CLIENT_NAME_TO_APP_NAME_MAP, GROUP_MAP, EpicAppName
from centre_api.models import Application as ApplicationModel
from centre_api.models import EmailQueue
from centre_api.models.access_requests import AccessRequests as AccessRequestsModal
from centre_api.models.db import session_scope
from centre_api.services.auth_api_service import AuthApiService
from centre_api.utils.datetime_util import convert_utc_to_local_str
from centre_api.utils.token_info import TokenInfo


class ApplicationsService:
    """Applications service."""

    @classmethod
    def get_all(cls):
        """Get all apps."""
        accessed_apps = cls.get_user_accessed_apps_names()
        public_apps = [EpicAppName.DOCUMENT_SEARCH.value]
        accessed_apps.update(public_apps)

        if not accessed_apps:
            return []

        apps = ApplicationModel.get_all()
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
    def get_app_admins(cls, app_name: str):
        """Get app admin details."""
        group_name = APP_NAME_TO_GROUP_MAP.get(app_name)
        sub_group_name = GROUP_MAP.get(group_name)
        members = AuthApiService.get_group_members(group_name, sub_group_name)
        return members

    @classmethod
    def _queue_access_request_notification_app_admin(cls, session, app):
        admins = cls.get_app_admins(app.name)
        if not admins:
            return
        user_details = TokenInfo.get_user_data()
        now = datetime.datetime.utcnow()
        requested_at = convert_utc_to_local_str(now)
        recipients = [admin.get('email') for admin in admins if admin.get('email')]
        email_queue = EmailQueue(
            template_name=EmailQueueTemplate.ACCESS_REQUEST_RECEIVED_NOTIFICATION.value,
            payload={
                'recipients': recipients,
                'user_name': f"{user_details.get('first_name', '')} {user_details.get('last_name', '')}".strip(),
                'user_email': user_details.get('email_address'),
                'application_name': app.title,
                'auth_link': f"{os.getenv('EPIC_CENTRE_WEB_URL')}",
                'requested_at': requested_at,
                'sender': os.getenv('DST_EMAIL')
            },
        )
        session.add(email_queue)

    @classmethod
    def _queue_access_request_received_dst_email(cls, session, app):
        """Queue access request submitted email."""
        user_details = TokenInfo.get_user_data()
        now = datetime.datetime.utcnow()
        requested_at = convert_utc_to_local_str(now)
        email_queue = EmailQueue(
            template_name=EmailQueueTemplate.ACCESS_REQUEST_RECEIVED_NOTIFICATION.value,
            payload={
                'recipients': [os.getenv('DST_EMAIL')],
                'user_name': f"{user_details.get('first_name', '')} {user_details.get('last_name', '')}".strip(),
                'user_email': user_details.get('email_address'),
                'application_name': app.title,
                'auth_link': f"{os.getenv('EPIC_CENTRE_WEB_URL')}/request-access",
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
            cls._queue_access_request_received_dst_email(session, app)
            cls._queue_access_request_notification_app_admin(session, app)
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

    @classmethod
    def get_app_access_levels(cls, app_name):
        """Get access levels for the given app name."""
        group_name = APP_NAME_TO_GROUP_MAP.get(app_name)
        app_group = AuthApiService.get_group(group_name)
        role_groups = [sub_group for sub_group in app_group.get('subGroups', [])]
        access_levels = [
            {
                'id': role_group.get('id'),
                'name': role_group.get('attributes', {}).get('display_name', [''])[0],
                'level': role_group.get('attributes', {}).get('level', [''])[0],
                'group_name': role_group.get('name'),
                'group_path': role_group.get('path'),
                'description': role_group.get('attributes', {}).get('description', [''])[0]
            }
            for role_group in role_groups
        ]
        return access_levels
