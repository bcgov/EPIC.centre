"""Service for applications management."""

from centre_api.models.access_requests import AccessRequests as AccessRequestsModal
from centre_api.services.auth_api_service import AuthApiService


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
