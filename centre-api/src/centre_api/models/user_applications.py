"""User Applications Model."""
from __future__ import annotations

from .base_model import BaseModel
from .db import db


class UserApplication(BaseModel):
    """Definition of the User Applications."""

    __tablename__ = 'user_applications'

    id = db.Column(db.Integer, primary_key=True)
    user_auth_guid = db.Column(db.String(), nullable=False)
    app_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    access_level = db.Column(db.String(50))
    last_accessed = db.Column(db.DateTime)
    sort_order = db.Column(db.Integer, default=0, nullable=False)
    bookmarks = db.Column(db.JSON, nullable=True, default=[])

    __table_args__ = (db.UniqueConstraint('user_auth_guid', 'app_id', name='uq_user_auth_guid_app_id'),)

    app = db.relationship('Application', backref='user_applications')

    @classmethod
    def get_by_auth_id_and_app_id(cls, user_auth_guid, app_id):
        """Retrieve a user application by user_auth_guid and app_id."""
        return UserApplication.query.filter_by(user_auth_guid=user_auth_guid, app_id=app_id).first()

    @classmethod
    def create_user_application(cls, user_auth_guid, app_id):
        """Create a new user application."""
        user_app = UserApplication(user_auth_guid=user_auth_guid, app_id=app_id)
        db.session.add(user_app)
        db.session.commit()
        return user_app
