"""Service for applications management."""

from centre_api.exceptions import BadRequestError
from centre_api.models import Application as ApplicationModel
from centre_api.models import UserApplication as UserApplicationModel
from centre_api.utils.token_info import TokenInfo


class UserApplicationsService:
    """Applications service."""

    @staticmethod
    def _check_apps_exist(app_ids):
        """Raise BadRequestError unless every id is an existing application."""
        unique_ids = set(app_ids)
        found = ApplicationModel.query.filter(ApplicationModel.id.in_(unique_ids)).count()
        if found != len(unique_ids):
            raise BadRequestError('Unknown application id')

    @classmethod
    def get_or_create_user_application(cls, user_auth_guid, app_id):
        """Get or create a user application."""
        user_app = UserApplicationModel.get_by_auth_id_and_app_id(user_auth_guid, app_id)
        if not user_app:
            user_app = UserApplicationModel.create_user_application(user_auth_guid, app_id)
        return user_app

    @classmethod
    def update_user_application_bookmarks(cls, app_id, bookmarks: list):
        """Update bookmarks for a user application."""
        cls._check_apps_exist([app_id])
        user_auth_guid = TokenInfo.get_id()
        user_app = cls.get_or_create_user_application(user_auth_guid, app_id)
        user_app.bookmarks = bookmarks
        user_app.save()
        return user_app

    @classmethod
    def update_sort_order(cls, app_id_list: list[int]):
        """Update sort order based on a list of app_ids (in order)."""
        cls._check_apps_exist(app_id_list)
        user_auth_guid = TokenInfo.get_id()
        sort_order_list = [
            {'app_id': app_id, 'sort_order': index}
            for index, app_id in enumerate(app_id_list)
        ]
        UserApplicationModel.bulk_upsert_sort_order(user_auth_guid, sort_order_list)
