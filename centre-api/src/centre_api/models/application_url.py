"""Application URL model class.

Manages the application/environment URLs. Each https URL links to its host's certificate.
"""
from datetime import datetime

from sqlalchemy import func

from .base_model import BaseModel
from .db import db


class ApplicationUrl(BaseModel):
    """Definition of the Application URL entity."""

    __tablename__ = 'application_urls'

    id = db.Column(db.Integer, primary_key=True)
    app_name = db.Column(db.String(100), nullable=False)
    environment = db.Column(db.String(50), nullable=False)  # DEV, TEST, PROD
    url = db.Column(db.String(500), nullable=False)
    # None for http URLs, which have no certificate
    certificate_id = db.Column(db.Integer, db.ForeignKey('ssl_certificates.id'), nullable=True, index=True)
    created_date = db.Column(db.DateTime, default=datetime.utcnow)

    is_active = db.Column(db.Boolean, default=True)

    certificate = db.relationship('SslCertificate', back_populates='urls')

    def to_dict(self):
        """Convert ApplicationUrl ORM object to dictionary."""
        return {
            'id': self.id,
            'app_name': self.app_name,
            'environment': self.environment,
            'url': self.url,
            'certificate_id': self.certificate_id,
            'is_active': self.is_active
        }

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
