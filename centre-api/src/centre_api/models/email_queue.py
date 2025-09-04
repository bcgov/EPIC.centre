"""Application model class.

Manages the application
"""
from __future__ import annotations

from datetime import datetime

from .db import db


class EmailQueue(db.Model):
    """Definition of the EmailQueue entity."""

    __tablename__ = 'email_queue'

    id = db.Column(db.Integer, primary_key=True)
    template_name = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='PENDING')
    payload = db.Column(db.JSON, nullable=False)
    error_message = db.Column(db.Text, nullable=True)
    sent_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    @classmethod
    def get_all_pending_emails(cls):
        """Get all pending emails."""
        return EmailQueue.query.filter_by(status='PENDING').all()
