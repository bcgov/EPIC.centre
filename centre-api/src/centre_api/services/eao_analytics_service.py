"""Service for EAO Analytics management."""

from centre_api.models.applications import Application
from centre_api.models.eao_analytics import EaoAnalytics


class EaoAnalyticsService:
    """EAO Analytics service."""

    @classmethod
    def record_login_by_app_name(cls, user_auth_guid: str, app_name: str):
        """
        Record or update login analytics for a user and application by app name.

        Args:
            user_auth_guid: The user's authentication GUID
            app_name: The name of the application

        Returns:
            EaoAnalytics: The created or updated analytics record

        Raises:
            ValueError: If required fields are missing or application not found
        """
        if not user_auth_guid or not app_name:
            raise ValueError('Missing required fields: user_auth_guid, app_name')

        # Look up app_id from app_name
        application = Application.query.filter_by(name=app_name).first()
        if not application:
            raise ValueError(f'Application with name "{app_name}" not found')

        app_id = application.id

        analytics = EaoAnalytics.record_login(
            user_auth_guid=user_auth_guid,
            app_id=app_id
        )

        return analytics

    @classmethod
    def get_all_analytics(cls, sort_by: str = 'last_login_time', order: str = 'desc', limit: int = None):
        """
        Get all analytics records with optional sorting and pagination.

        Args:
            sort_by: Field to sort by (default: 'last_login_time')
            order: Sort order 'asc' or 'desc' (default: 'desc')
            limit: Maximum number of records to return (optional)

        Returns:
            List[EaoAnalytics]: List of analytics records
        """
        return EaoAnalytics.get_all_analytics(
            sort_by=sort_by,
            order=order,
            limit=limit
        )

    @classmethod
    def get_user_analytics(cls, user_auth_guid: str):
        """
        Get analytics record for a specific user.

        Args:
            user_auth_guid: The user's authentication GUID

        Returns:
            EaoAnalytics or None: The analytics record if found, None otherwise
        """
        return EaoAnalytics.get_user_analytics(user_auth_guid)

    @classmethod
    def get_user_app_login(cls, user_auth_guid: str, app_id: int):
        """
        Get login analytics record for a specific user and app.

        Args:
            user_auth_guid: The user's authentication GUID
            app_id: The application ID

        Returns:
            EaoAnalytics or None: The analytics record if found, None otherwise
        """
        return EaoAnalytics.get_user_app_login(user_auth_guid, app_id)

