"""Application model class.

Manages the application
"""
from __future__ import annotations

from centre_api.utils.token_info import TokenInfo

from .base_model import BaseModel
from .db import db
from .user_applications import UserApplication


class Application(BaseModel):
    """Definition of the User entity."""

    __tablename__ = 'applications'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    launch_url = db.Column(db.Text, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    @classmethod
    def get_all(cls):
        """Get all user applications."""
        user_auth_id = TokenInfo.get_id()
        apps = (
            db.session.query(Application, UserApplication)
            .outerjoin(UserApplication,
                       (Application.id == UserApplication.app_id) & (UserApplication.user_auth_guid == user_auth_id))
            .all()
        )

        return apps
