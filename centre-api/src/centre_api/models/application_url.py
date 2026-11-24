"""Application URL model class.

Manages the application/environment URLs and their SSL status.
"""
from datetime import datetime, timezone

from sqlalchemy import func

from .base_model import BaseModel
from .db import db


def _utc_isoformat(value):
    """Mark the naive UTC timestamps as UTC, or browsers read them as local time."""
    return value.replace(tzinfo=timezone.utc).isoformat() if value else None


class ApplicationUrl(BaseModel):
    """Definition of the Application URL entity."""

    __tablename__ = 'application_urls'

    id = db.Column(db.Integer, primary_key=True)
    app_name = db.Column(db.String(100), nullable=False)
    environment = db.Column(db.String(50), nullable=False)  # DEV, TEST, PROD
    url = db.Column(db.String(500), nullable=False)

    # SSL Status Tracking
    ssl_expiry = db.Column(db.DateTime, nullable=True)
    ssl_status = db.Column(db.String(50), nullable=True)  # 'Valid', 'Expired', 'Soon'
    ssl_error_message = db.Column(db.String(500), nullable=True)  # Store error details for debugging
    ticket_reference = db.Column(db.String(50), nullable=True)  # External ticket ref (e.g. JIRA-123)
    renewal_status = db.Column(db.String(50), default='NONE')  # NONE, TICKET_CREATED, ORDERED, PLANNED
    renewal_comments = db.Column(db.Text, nullable=True)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_checked = db.Column(db.DateTime, nullable=True)

    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        """Convert ApplicationUrl ORM object to dictionary."""
        return {
            'id': self.id,
            'app_name': self.app_name,
            'environment': self.environment,
            'url': self.url,
            'ssl_expiry': _utc_isoformat(self.ssl_expiry),
            'ssl_status': self.ssl_status,
            'ssl_error_message': self.ssl_error_message,
            'ticket_reference': self.ticket_reference,
            'renewal_status': self.renewal_status,
            'renewal_comments': self.renewal_comments,
            'last_checked': _utc_isoformat(self.last_checked),
            'is_active': self.is_active
        }

    def clear_certificate_details(self):
        """Forget the SSL details, e.g. when the URL moves to another host."""
        self.ssl_status = 'Unknown'
        self.ssl_expiry = None
        self.ssl_error_message = None
        self.last_checked = None

    @classmethod
    def find_all_active(cls):
        """Return all active application URLs in a stable order."""
        return cls.query.filter(cls.is_active.is_(True)).order_by(cls.app_name, cls.environment, cls.id).all()

    @classmethod
    def find_active_by_id(cls, url_id):
        """Return the active application URL with this id, if any."""
        return cls.query.filter(cls.id == url_id, cls.is_active.is_(True)).one_or_none()

    @classmethod
    def find_active_by_app_name(cls, app_name):
        """Return an app's active URLs, matching its name case-insensitively."""
        return cls.query.filter(
            func.lower(cls.app_name) == app_name.lower(),
            cls.is_active.is_(True),
        ).order_by(cls.id).all()
