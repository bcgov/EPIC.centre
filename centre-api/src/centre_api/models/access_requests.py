"""Access Requests model class.

Manages the access requests
"""
from __future__ import annotations

from ..enums.access_request_status import AccessRequestsStatusEnum
from .base_model import BaseModel
from .db import db


class AccessRequests(BaseModel):
    """Definition of the User entity."""

    __tablename__ = 'access_requests'

    id = db.Column(db.Integer, primary_key=True)
    app_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    user_auth_guid = db.Column(db.String(), nullable=False)
    status = db.Column(db.Enum(AccessRequestsStatusEnum), default=AccessRequestsStatusEnum.PENDING, nullable=False)
    app = db.relationship('Application', backref='access_requests', lazy=True)

    def to_dict(self):
        """Convert AccessRequests ORM object to dictionary."""
        return {
            'id': self.id,
            'app_id': self.app_id,
            'user_auth_guid': self.user_auth_guid,
            'status': self.status.value,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'updated_date': self.updated_date.isoformat() if self.updated_date else None,
            'created_by': self.created_by,
            'updated_by': self.updated_by,
            'app': self.app.to_dict() if self.app else None
        }

    @classmethod
    def get_all_requests_by_user(cls, user_auth_guid):
        """Get all access requests by user."""
        return cls.query.filter_by(user_auth_guid=user_auth_guid).all()

    @classmethod
    def get_all_by_status(cls, status: str):
        """Return all access requests matching the given status."""
        if status not in {e.value for e in AccessRequestsStatusEnum}:
            raise ValueError(
                f"Invalid status '{status}'"
            )
        return cls.query.filter_by(status=status).all()
