"""Helper for token decoding."""
from flask import g

from centre_api.enums.epic_app import CLIENT_APP_NAME_TO_ADMIN_ROLES_MAP, EpicAppClientName
from centre_api.utils.user_context import UserContext, user_context


class TokenInfo:
    """Token info."""

    @staticmethod
    @user_context
    def get_id(**kwargs):
        """Get the user identifier."""
        try:
            user_from_context: UserContext = kwargs['user_context']
            return user_from_context.sub
        except AttributeError:
            return None

    @staticmethod
    def get_user_data():
        """Get the user data."""
        token_info = g.jwt_oidc_token_info
        user_data = {
            'external_id': token_info.get('sub', None),
            'first_name': token_info.get('given_name', None),
            'last_name': token_info.get('family_name', None),
            'email_address': token_info.get('email', None),
            'username': token_info.get('preferred_username', None),
            'identity_provider': token_info.get('identity_provider', ''),
            'resource_access': token_info.get('resource_access', {}),
        }
        return user_data

    @staticmethod
    def has_admin_roles(client_name):
        """Check if the user has admin roles for the given client."""
        if client_name == EpicAppClientName.EPIC_PUBLIC.value:
            return TokenInfo._check_admin_in_epic_public()
        token_info = g.jwt_oidc_token_info
        resource_access = token_info.get('resource_access', {})
        client_resource_access = resource_access.get(client_name, {})
        roles = client_resource_access.get('roles', [])
        admin_roles = CLIENT_APP_NAME_TO_ADMIN_ROLES_MAP.get(client_name, [])
        return any(role in admin_roles for role in roles)

    @staticmethod
    def _check_admin_in_epic_public():
        """Check if the user has admin roles in epic public."""
        token_info = g.jwt_oidc_token_info
        realm_access = token_info.get('realm_access', {})
        roles = realm_access.get('roles', [])
        return 'inspector' in roles

    @staticmethod
    def get_admin_roles_map():
        """Check if the user has admin roles for the given client."""
        token_info = g.jwt_oidc_token_info
        resource_access = token_info.get('resource_access', {})
        admin_roles_map = {}
        for client, access in resource_access.items():
            roles = access.get('roles', [])
            admin_roles = CLIENT_APP_NAME_TO_ADMIN_ROLES_MAP.get(client, [])
            admin_roles_map[client] = any(role in admin_roles for role in roles)
        admin_roles_map[EpicAppClientName.EPIC_PUBLIC.value] = TokenInfo._check_admin_in_epic_public()
        return admin_roles_map
