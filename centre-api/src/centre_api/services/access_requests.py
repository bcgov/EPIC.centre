"""Service for applications management."""
from centre_api.enums.access_request_status import AccessRequestsStatusEnum
from centre_api.enums.epic_app import EpicAppClientName, CLIENT_APP_NAME_TO_ADMIN_ROLES_MAP, APP_NAME_TO_CLIENT_NAME_MAP
from centre_api.models.access_requests import AccessRequests as AccessRequestsModal
from centre_api.services.auth_api_service import AuthApiService
from centre_api.utils.token_info import TokenInfo


class AccessRequestsService:
    """Access requests service."""

    @classmethod
    def get_all(cls, args):
        """Return all access requests by status, enriched with user details."""
        access_requests = AccessRequestsModal.get_all(args)
        serialized_requests = [req.to_dict() for req in access_requests]
        enriched_requests = cls._enrich_with_user_details(serialized_requests)
        return enriched_requests

    @classmethod
    def _enrich_with_user_details(cls, requests):
        """Enrich access requests with user details from Auth API."""
        users = AuthApiService.get_users(include_groups=False)
        user_map = {user['id']: user for user in users}
        for req in requests:
            user = user_map.get(req['user_auth_guid'])
            if user:
                req['user'] = user
        return requests

    @classmethod
    def get_user_access_requests(cls, user_auth_guid, args):
        """Return all access requests for a specific user, enriched with user details."""
        access_requests = AccessRequestsModal.get_all({
            **args,
            'user_auth_guid': user_auth_guid
        })
        user = AuthApiService.get_user_by_id(user_auth_guid)
        serialized_requests = [req.to_dict() for req in access_requests]
        for req in serialized_requests:
            req['user'] = user
        return serialized_requests

    @classmethod
    def process_access_request(cls, access_request_id, status):
        """Update an access request for a user."""
        access_request = AccessRequestsModal.query.get(access_request_id)
        if not access_request:
            return None

        user_data = TokenInfo.get_user_data()
        resource_access = user_data.get('resource_access', {})

        # Check for Centre admin roles
        if cls._has_admin_roles(
            resource_access, EpicAppClientName.EPIC_CENTRE.value
        ):
            return cls._do_update_access_request(access_request, status)

        # Check for app-specific admin roles
        app_name = access_request.app.name
        client_name = APP_NAME_TO_CLIENT_NAME_MAP.get(app_name)
        if cls._has_admin_roles(resource_access, client_name):
            return cls._do_update_access_request(access_request, status)

        raise PermissionError(
            f"User does not have permission to update access requests for app '{app_name}'."
        )

    @staticmethod
    def _has_admin_roles(resource_access, client_name):
        """Check if the user has admin roles for the given client."""
        if not client_name:
            return False
        roles = resource_access.get(client_name, {}).get('roles', [])
        admin_roles = CLIENT_APP_NAME_TO_ADMIN_ROLES_MAP.get(client_name, [])
        return any(role in admin_roles for role in roles)

    @classmethod
    def _do_update_access_request(cls, access_request, status):
        """Perform the update of an access request."""
        access_request.status = status
        access_request.save()
        return access_request.to_dict()
