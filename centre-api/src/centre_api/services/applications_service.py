"""Service for applications management."""

from centre_api.models import Application as ApplicationModel


class ApplicationsService:
    """Applications service."""

    @classmethod
    def get_all(cls):
        """Get all users."""
        apps = ApplicationModel.get_all()
        return [
            {
                'id': app.id,
                'name': app.name,
                'description': app.description,
                'launch_url': app.launch_url,
                'is_active': app.is_active,
                'user': {
                    'user_auth_guid': user_app.user_auth_guid if user_app else None,
                    'access_level': user_app.access_level if user_app else None,
                    'last_accessed': user_app.last_accessed.isoformat() if (
                        user_app and user_app.last_accessed) else None,
                    'sort_order': user_app.sort_order if user_app else None,
                    'bookmarks': user_app.bookmarks if user_app else []
                }
            }
            for app, user_app in apps
        ]
