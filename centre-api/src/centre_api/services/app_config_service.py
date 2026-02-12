"""Service for app configuration management."""

from centre_api.enums.epic_app import (
    ALL_APP_NAMES,
    APP_NAME_TO_CLIENT_NAME_MAP,
    EPIC_CLIENT_TO__ADMIN_GROUPS_PATHS,
)
from centre_api.models.applications import Application
from centre_api.utils.app_config import get_app_launch_url, get_app_user_management_url


class AppConfigService:
    """Service for handling app configuration operations."""

    @classmethod
    def get_all_app_configs(cls):
        """Get all app configurations for defined apps."""
        app_configs = []
        apps_by_name = {a.name: a for a in Application.query.all()}

        for app_name in ALL_APP_NAMES:
            app = apps_by_name.get(app_name)
            client_name = APP_NAME_TO_CLIENT_NAME_MAP.get(app_name)
            admin_group_paths = (
                list(EPIC_CLIENT_TO__ADMIN_GROUPS_PATHS.get(client_name, []))
                if client_name
                else []
            )
            app_config = {
                'name': app_name,
                'title': app.title if app else app_name.replace('_', ' ').title(),
                'client_name': client_name or '',
                'launch_url': get_app_launch_url(app_name),
                'app_user_management_url': get_app_user_management_url(app_name),
                'admin_group_paths': admin_group_paths,
                'is_active': app.is_active if app else True,
            }
            app_configs.append(app_config)

        return app_configs
