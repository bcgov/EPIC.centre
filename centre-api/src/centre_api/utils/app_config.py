"""Application configuration utilities."""

from flask import current_app


def get_app_launch_url(app_name: str) -> str:
    """Get the launch URL for an application by name."""
    app_launch_urls = current_app.config.get('APP_LAUNCH_URLS', {})
    return app_launch_urls.get(app_name, '')


def get_all_app_launch_urls() -> dict:
    """Get all configured application launch URLs."""
    return current_app.config.get('APP_LAUNCH_URLS', {})
