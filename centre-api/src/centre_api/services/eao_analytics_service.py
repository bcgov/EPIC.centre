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
    def get_analytics(cls, user_auth_guid: str = None, app_name: str = None):
        """
        Get analytics records with optional filtering by user_auth_guid and/or app_name.

        Args:
            user_auth_guid: Optional user authentication GUID to filter by
            app_name: Optional application name to filter by

        Returns:
            List[EaoAnalytics]: List of analytics records matching the filters
        """
        from centre_api.models.applications import Application

        query = EaoAnalytics.query

        # Filter by user_auth_guid if provided
        if user_auth_guid:
            query = query.filter(EaoAnalytics.user_auth_guid == user_auth_guid)

        # Filter by app_name if provided
        if app_name:
            application = Application.query.filter_by(name=app_name).first()
            if application:
                query = query.filter(EaoAnalytics.app_id == application.id)
            else:
                # If app_name is provided but not found, return empty list
                return []

        # Order by last_login_time descending
        query = query.order_by(EaoAnalytics.last_login_time.desc())

        return query.all()

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
