"""Service for applications management."""
from centre_api.enums.epic_app import APP_NAME_TO_CLIENT_NAME_MAP, EpicAppClientName
from centre_api.models.access_requests import AccessRequests as AccessRequestsModal
from centre_api.services.auth_api_service import AuthApiService
from centre_api.utils.token_info import TokenInfo


class AccessRequestsService:
    """Access requests service."""

    @classmethod
    def get_all(cls, args):
        """Return all access requests by status, enriched with user details."""
        current_user = AuthApiService.get_user_by_username(TokenInfo.get_username())
        administrated_apps = set(AuthApiService.get_administered_apps(current_user))
        access_requests = AccessRequestsModal.get_all(args)
        filtered_requests = [req for req in access_requests if req.app.name in administrated_apps]
        serialized_requests = [req.to_dict() for req in filtered_requests]
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

        current_user = AuthApiService.get_user_by_username(TokenInfo.get_user_data().get('username'))

        is_dst_admin = AuthApiService.is_admin_of_app(current_user, EpicAppClientName.EPIC_CENTRE.value)
        filtered_requests = [
            req for req in access_requests
            if is_dst_admin or AuthApiService.is_admin_of_app(current_user,
                                                              APP_NAME_TO_CLIENT_NAME_MAP.get(req.app.name))
        ]

        user = AuthApiService.get_user_by_id(user_auth_guid)
        serialized_requests = [req.to_dict() for req in filtered_requests]
        for req in serialized_requests:
            req['user'] = user
        return serialized_requests

    @classmethod
    def process_access_request(cls, access_request_id, status):
        """Update an access request for a user."""
        access_request = AccessRequestsModal.query.get(access_request_id)
        if not access_request:
            return None

        app_name = access_request.app.name
        has_admin_access = cls.has_admin_access_on_app(app_name)
        if not has_admin_access:
            raise PermissionError(
                f"User does not have permission to update access requests for app '{app_name}'."
            )

        return cls._do_update_access_request(access_request, status)

    @classmethod
    def has_admin_access_on_app(cls, app_name: str):
        """Check if the user had admin access on the given app."""
        current_user = AuthApiService.get_user_by_username(TokenInfo.get_username())
        had_dst_admin_roles = AuthApiService.is_admin_of_app(current_user, EpicAppClientName.EPIC_CENTRE.value)

        requires_app_admin = [
            EpicAppClientName.EPIC_COMPLIANCE.value,
        ]
        if had_dst_admin_roles and app_name not in requires_app_admin:
            return True

        client_name = APP_NAME_TO_CLIENT_NAME_MAP.get(app_name)
        return AuthApiService.is_admin_of_app(current_user, client_name)

    @classmethod
    def _do_update_access_request(cls, access_request, status):
        """Perform the update of an access request."""
        access_request.status = status
        access_request.save()
        return access_request.to_dict()
