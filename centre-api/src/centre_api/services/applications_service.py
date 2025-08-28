"""Service for applications management."""
from centre_api.enums.epic_app import CLIENT_NAME_TO_APP_NAME_MAP, EpicAppName
from centre_api.models import Application as ApplicationModel
from centre_api.utils.token_info import TokenInfo


class ApplicationsService:
    """Applications service."""

    @classmethod
    def get_all(cls):
        """Get all users."""
        user_data = TokenInfo.get_user_data()
        resource_access = user_data.get('resource_access', {})
        accessed_clients = list(resource_access.keys())

        accessed_apps = {CLIENT_NAME_TO_APP_NAME_MAP[client] for client in accessed_clients
                         if client in CLIENT_NAME_TO_APP_NAME_MAP}
        public_apps = [EpicAppName.DOCUMENT_SEARCH.value]
        accessed_apps.update(public_apps)

        apps = ApplicationModel.get_all()
        if not accessed_apps:
            return []
        apps = [(app, user_app) for app, user_app in apps if app.name in accessed_apps]
        return [
            {
                'id': app.id,
                'name': app.name,
                'title': app.title,
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
