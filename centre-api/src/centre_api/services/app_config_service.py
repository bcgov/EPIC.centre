"""Service for app configuration management."""

from centre_api.enums.epic_app import EpicAppName
from centre_api.utils.app_config import get_app_launch_url, get_app_user_management_url


class AppConfigService:
    """Service for handling app configuration operations."""

    @classmethod
    def get_all_app_configs(cls):
        """Get all app configurations for apps defined in EpicAppName enum."""
        app_configs = []

        for app_name in EpicAppName:
            app_config = {
                'name': app_name.value,
                'launch_url': get_app_launch_url(app_name.value),
                'app_user_management_url': get_app_user_management_url(app_name.value),
                'is_active': True,  # All apps in EpicAppName are considered active
            }
            app_configs.append(app_config)

        return app_configs
