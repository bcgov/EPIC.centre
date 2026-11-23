"""Service for applications management."""
import os

import requests

from centre_api.enums.access_request_status import AccessRequestsStatusEnum
from centre_api.enums.emai_queue_templates import EmailQueueTemplate
from centre_api.enums.epic_app import APP_NAME_TO_CLIENT_NAME_MAP, EpicAppClientName
from centre_api.models.access_requests import AccessRequests as AccessRequestsModal
from centre_api.models.db import session_scope
from centre_api.models.email_queue import EmailQueue
from centre_api.services.auth_api_service import AuthApiService
from centre_api.services.user_service import UserService
from centre_api.utils.token_info import TokenInfo


# Past this many requesters, list every user (EPIC.auth caps at 2000) instead of one call each
MAX_REQUESTER_LOOKUPS = 10


class AccessRequestsService:
    """Access requests service."""

    @classmethod
    def get_all(cls, args):
        """Return all access requests by status, enriched with user details."""
        current_user = AuthApiService.get_user_by_username(TokenInfo.get_username())
        is_dst_admin = AuthApiService.is_admin_of_app(current_user, EpicAppClientName.EPIC_CENTRE.value)
        administrated_apps = set(AuthApiService.get_administered_apps(current_user))
        access_requests = AccessRequestsModal.get_all(args)
        filtered_requests = [req for req in access_requests if is_dst_admin or req.app.name in administrated_apps]
        serialized_requests = [req.to_dict() for req in filtered_requests]
        enriched_requests = cls._enrich_with_user_details(serialized_requests)
        return enriched_requests

    @classmethod
    def _enrich_with_user_details(cls, access_requests):
        """Enrich access requests with user details from Auth API."""
        user_ids = {req['user_auth_guid'] for req in access_requests}
        if not user_ids:
            return access_requests
        if len(user_ids) <= MAX_REQUESTER_LOOKUPS:
            user_map = {user_id: cls._find_user(user_id) for user_id in user_ids}
        else:
            user_map = {user['id']: user for user in AuthApiService.get_users(include_groups=False)}
        for req in access_requests:
            user = user_map.get(req['user_auth_guid'])
            if user:
                req['user'] = user
        return access_requests

    @staticmethod
    def _find_user(user_id):
        """Return the user without groups, or None if EPIC.auth can't (e.g. deleted from Keycloak)."""
        try:
            user = AuthApiService.get_user_by_id(user_id)
        except requests.HTTPError:
            return None
        # Match the full listing, which has no groups
        user.pop('groups', None)
        return user

    @classmethod
    def get_user_access_requests(cls, user_auth_guid, args):
        """Return all access requests for a specific user, enriched with user details."""
        access_requests = AccessRequestsModal.get_all({
            **args,
            'user_auth_guid': user_auth_guid
        })

        current_user = AuthApiService.get_user_by_username(TokenInfo.get_user_data().get('username'))

        is_dst_admin = AuthApiService.is_admin_of_app(current_user, EpicAppClientName.EPIC_CENTRE.value)
        filtered_requests = [
            req for req in access_requests
            if is_dst_admin or AuthApiService.is_admin_of_app(current_user,
                                                              APP_NAME_TO_CLIENT_NAME_MAP.get(req.app.name))
        ]

        if not filtered_requests:
            return []
        user = cls._find_user(user_auth_guid)
        serialized_requests = [req.to_dict() for req in filtered_requests]
        if user is not None:
            for req in serialized_requests:
                req['user'] = user
        return serialized_requests

    @classmethod
    def process_access_request(cls, access_request_id, status):
        """Reject a pending access request; approval happens when access is granted."""
        if status != AccessRequestsStatusEnum.REJECTED.value:
            raise ValueError('Access requests can only be rejected here; grant access to approve one.')

        access_request = AccessRequestsModal.find_by_id(access_request_id)
        if not access_request:
            return None

        app_name = access_request.app.name
        has_admin_access = UserService.has_admin_access_on_app(app_name)
        if not has_admin_access:
            raise PermissionError(
                f"User does not have permission to update access requests for app '{app_name}'."
            )
        if access_request.status != AccessRequestsStatusEnum.PENDING:
            raise ValueError('This access request has already been handled. Refresh to see its current status.')

        # Looked up before the transaction. EPIC.auth just found the caller, so a failure here means
        # the requester is gone from Keycloak: the request is still rejected, with no one to email.
        requester = cls._find_user(access_request.user_auth_guid)
        with session_scope() as session:
            cls._do_update_access_request(access_request, status, session)
            if requester is not None:
                _queue_access_request_email(session, access_request.app, requester, status)
            session.commit()
        return access_request.to_dict()

    @classmethod
    def _do_update_access_request(cls, access_request, status, session):
        """Perform the update of an access request."""
        access_request.status = status
        session.add(access_request)
        return access_request


def _queue_access_request_email(session, app, auth_user_response, status):
    """Queue access request denied email."""
    if status == AccessRequestsStatusEnum.REJECTED.value:
        email_queue = EmailQueue(
            template_name=EmailQueueTemplate.ACCESS_DENIED_NOTIFICATION.value,
            payload={
                'recipients': [auth_user_response.get('email_address')],
                'user_name': (
                    f"{auth_user_response.get('first_name', '')} "
                    f"{auth_user_response.get('last_name', '')}"
                ).strip(),
                'application_name': app.title,
                'sender': os.getenv('DST_EMAIL')
            },
        )
        session.add(email_queue)
