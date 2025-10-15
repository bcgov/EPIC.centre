"""Application configuration utilities."""

from flask import current_app


def get_app_launch_url(app_name: str) -> str:
    """Get the launch URL for an application by name."""
    app_launch_urls = current_app.config.get('APP_LAUNCH_URLS', {})
    return app_launch_urls.get(app_name, '')


def get_all_app_launch_urls() -> dict:
    """Get all configured application launch URLs."""
    return current_app.config.get('APP_LAUNCH_URLS', {})


def get_app_user_management_url(app_name: str) -> str:
    """Get the user management URL for an application by name."""
    app_user_management_urls = current_app.config.get('APP_USER_MANAGEMENT_URLS', {})
    return app_user_management_urls.get(app_name, '')


def get_all_app_user_management_urls() -> dict:
    """Get all configured application user management URLs."""
    return current_app.config.get('APP_USER_MANAGEMENT_URLS', {})
