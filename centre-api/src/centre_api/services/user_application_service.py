"""Service for applications management."""

from centre_api.models import Application as ApplicationModel, UserApplication
from centre_api.utils.token_info import TokenInfo


class UserApplicationsService:
    """Applications service."""

    @classmethod
    def get_or_create_user_application(cls, user_auth_guid, app_id):
        """Get or create a user application."""
        user_app = UserApplication.get_by_auth_id_and_app_id(user_auth_guid, app_id)
        if not user_app:
            user_app = UserApplication.create_user_application(user_auth_guid, app_id)
        return user_app

    @classmethod
    def update_user_application_bookmarks(cls, app_id, bookmarks: list):
        """Update bookmarks for a user application."""
        user_auth_guid = TokenInfo.get_id()
        user_app = cls.get_or_create_user_application(user_auth_guid, app_id)
        user_app.bookmarks = bookmarks
        user_app.save()
        return user_app
