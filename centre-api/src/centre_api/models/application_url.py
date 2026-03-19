"""Application URL model class.

Manages the application/environment URLs and their SSL status.
"""
from datetime import datetime
from .base_model import BaseModel
from .db import db


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
            'ssl_expiry': self.ssl_expiry.isoformat() if self.ssl_expiry else None,
            'ssl_status': self.ssl_status,
            'ssl_error_message': self.ssl_error_message,
            'ticket_reference': self.ticket_reference,
            'renewal_status': self.renewal_status,
            'renewal_comments': self.renewal_comments,
            'last_checked': self.last_checked.isoformat() if self.last_checked else None,
            'is_active': self.is_active
        }

    @classmethod
    def find_all_active(cls):
        """Return all active application URLs."""
        return cls.query.filter_by(is_active=True).all()
