"""Service for applications management."""
from flask import jsonify

from centre_api.models import Application as ApplicationModel


class ApplicationsService:
    """Applications service."""

    @classmethod
    def get_all(cls):
        """Get all users."""
        apps = ApplicationModel.get_all()

        response = []
        for app, user_app in apps:
            response.append({
                "id": app.id,
                "name": app.name,
                "description": app.description,
                "launch_url": app.launch_url,
                "is_active": app.is_active,
                "user": {
                    "access_level": user_app.access_level if user_app else None,
                    "last_accessed": user_app.last_accessed.isoformat() if (
                            user_app and user_app.last_accessed) else None,
                    "sort_order": user_app.sort_order if user_app else None,
                    "bookmarks": [
                        {"label": b.label, "url": b.url}
                        for b in (user_app.bookmarks if user_app else [])
                    ]
                }
            })
        return response
