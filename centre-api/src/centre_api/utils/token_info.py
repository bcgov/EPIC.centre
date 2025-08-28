"""Helper for token decoding."""
from flask import g

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
