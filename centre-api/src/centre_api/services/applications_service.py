"""Service for applications management."""
import datetime
import os
from collections import defaultdict

import requests

from centre_api.enums.access_request_status import AccessRequestsStatusEnum
from centre_api.enums.emai_queue_templates import EmailQueueTemplate
from centre_api.enums.epic_app import APP_NAME_TO_GROUP_MAP, GROUP_MAP, GROUP_TO_APP_NAME_MAP, EpicAppName
from centre_api.models import Application as ApplicationModel
from centre_api.models import EmailQueue
from centre_api.models.access_requests import AccessRequests as AccessRequestsModal
from centre_api.models.db import session_scope
from centre_api.models.eao_analytics import EaoAnalytics
from centre_api.services.auth_api_service import AuthApiService
from centre_api.utils.app_config import get_app_launch_url
from centre_api.utils.datetime_util import convert_utc_to_local_str
from centre_api.utils.token_info import TokenInfo


class ApplicationsService:
    """Applications service."""

    @classmethod
    def _get_last_accessed_from_login_history(cls, user_auth_guid: str, app_id: int):
        """Get last accessed time from login_histories table for a specific user and app."""
        if not user_auth_guid:
            return None
        login_record = EaoAnalytics.get_user_app_login(user_auth_guid, app_id)
        if login_record and login_record.last_login_time:
            return login_record.last_login_time
        return None

    @classmethod
    def _get_last_accessed_batch(cls, user_auth_guid: str, app_ids: list[int]):
        """Get last accessed times from login_histories table for a specific user and multiple apps in one query.

        Returns a dictionary mapping app_id to last_login_time.
        """
        if not user_auth_guid:
            return {}
        return EaoAnalytics.get_user_app_logins_batch(user_auth_guid, app_ids)

    @classmethod
    def _get_current_user_access_levels(cls):
        """Get the current logged-in user's access levels (roles) for all apps from their Keycloak groups."""
        try:
            user_id = TokenInfo.get_id()
            if not user_id:
                return {}

            user = AuthApiService.get_user_by_id(user_id)
            if not user or 'groups' not in user:
                return {}

            app_roles = defaultdict(lambda: {'level': float('-inf'), 'role': None})

            for group in user.get('groups', []):
                path = group.get('path', '')
                level = group.get('level', float('-inf'))
                display_name = group.get('display_name', '')
                top_path = path.split('/')[0]
                app_name = GROUP_TO_APP_NAME_MAP.get(top_path)

                if app_name and level > app_roles[app_name]['level']:
                    app_roles[app_name] = {
                        'level': level,
                        'role': display_name
                    }

            result = {}
            for app_name, role_info in app_roles.items():
                if role_info['role']:
                    result[app_name] = role_info['role']
            return result
        except (requests.RequestException, AttributeError, KeyError):
            return {}

    @classmethod
    def get_all(cls):
        """Get all apps."""
        access_levels = cls._get_current_user_access_levels()
        accessed_apps = set(access_levels.keys())
        public_apps = [EpicAppName.DOCUMENT_SEARCH.value, EpicAppName.INTRANET.value]
        accessed_apps.update(public_apps)

        if not accessed_apps:
            return []

        apps = ApplicationModel.get_all()
        apps = [(app, user_app) for app, user_app in apps if app.name in accessed_apps and app.is_active]

        user_access_levels = cls._get_current_user_access_levels()
        user_auth_username = TokenInfo.get_username()

        app_ids = [app.id for app, _ in apps]
        last_accessed_map = cls._get_last_accessed_batch(user_auth_username, app_ids)

        return [
            {
                'id': app.id,
                'name': app.name,
                'title': app.title,
                'description': app.description,
                'launch_url': get_app_launch_url(app.name),
                'is_active': app.is_active,
                'is_public': app.name in public_apps,
                'user': {
                    'user_auth_guid': user_app.user_auth_guid if user_app else None,
                    'access_level': (
                        user_access_levels.get(app.name) or
                        (user_app.access_level if user_app else None)
                    ),
                    'last_accessed': last_accessed_map.get(app.id),
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
                          EpicAppName.DOCUMENT_SEARCH.value, EpicAppName.INTRANET.value}
        filtered_apps = [(app, user_app) for app, user_app in apps if app.name not in exception_apps and app.is_active]

        access_levels = cls._get_current_user_access_levels()
        accessed_apps = set(access_levels.keys())
        access_requests = AccessRequestsModal.get_all_requests_by_user(TokenInfo.get_id(),
                                                                       status=AccessRequestsStatusEnum.PENDING.value)

        user_access_levels = cls._get_current_user_access_levels()

        user_auth_username = TokenInfo.get_username()
        app_ids = [app.id for app, _ in filtered_apps]
        last_accessed_map = cls._get_last_accessed_batch(user_auth_username, app_ids)

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
                    'access_level': user_access_levels.get(app.name) or (user_app.access_level if user_app else None),
                    'last_accessed': last_accessed_map.get(app.id),
                    'sort_order': user_app.sort_order if user_app else None,
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
                'application_url': get_app_launch_url(app.name),
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
        auth_link = (
            f"{os.getenv('EPIC_CENTRE_WEB_URL')}/request-access/auth/users/"
            f"{user_details.get('username', '')}"
        )
        email_queue = EmailQueue(
            template_name=EmailQueueTemplate.ACCESS_REQUEST_RECEIVED_NOTIFICATION.value,
            payload={
                'recipients': recipients,
                'user_name': f"{user_details.get('first_name', '')} {user_details.get('last_name', '')}".strip(),
                'user_email': user_details.get('email_address'),
                'application_name': app.title,
                'auth_link': auth_link,
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
        auth_link = (
            f"{os.getenv('EPIC_CENTRE_WEB_URL')}/request-access/auth/users/"
            f"{user_details.get('username', '')}"
        )
        email_queue = EmailQueue(
            template_name=EmailQueueTemplate.ACCESS_REQUEST_RECEIVED_NOTIFICATION.value,
            payload={
                'recipients': [os.getenv('DST_EMAIL')],
                'user_name': f"{user_details.get('first_name', '')} {user_details.get('last_name', '')}".strip(),
                'user_email': user_details.get('email_address'),
                'application_name': app.title,
                'auth_link': auth_link,
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
        existing_request = (AccessRequestsModal.query
                            .filter_by(app_id=app_id, user_auth_guid=user_auth_id,
                                       status=AccessRequestsStatusEnum.PENDING.value)
                            .first())
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
    def get_app_access_levels(cls, app_name):
        """Get access levels for the given app name."""
        group_name = APP_NAME_TO_GROUP_MAP.get(app_name)
        app_group = AuthApiService.get_group(group_name)
        role_groups = list(app_group.get('subGroups', []))
        access_levels = [
            {
                'id': role_group.get('id'),
                'name': role_group.get('attributes', {}).get('display_name', [''])[0],
                'level': role_group.get('attributes', {}).get('level', [''])[0],
                'group_name': role_group.get('name'),
                'group_path': role_group.get('path'),
                'description': role_group.get('attributes', {}).get('description', [''])[0],
                'hide_in_centre': role_group.get('attributes', {}).get('hide_in_centre', ['false'])[0] == 'true',
            }
            for role_group in role_groups
        ]
        access_levels = [access_level for access_level in access_levels if not access_level['hide_in_centre'] and access_level['name']]

        access_levels.sort(key=lambda x: int(x['level']) if x['level'] else 0)

        return access_levels

    @classmethod
    def get_by_name(cls, app_name: str):
        """Get application by name."""
        return ApplicationModel.query.filter_by(name=app_name).first()
