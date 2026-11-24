"""SSL notification model: a log of the renewal notices sent, so none is sent twice."""
from datetime import datetime

from .db import db


class SslNotification(db.Model):
    """One notice about one certificate, accepted for delivery to one recipient."""

    __tablename__ = 'ssl_notifications'
    __table_args__ = (
        db.UniqueConstraint('certificate_id', 'notice', 'occurrence', 'recipient', name='uq_ssl_notifications_once'),
    )

    id = db.Column(db.Integer, primary_key=True)
    certificate_id = db.Column(db.Integer, db.ForeignKey('ssl_certificates.id', ondelete='CASCADE'), nullable=False)
    notice = db.Column(db.String(30), nullable=False)  # e.g. expires_within_30, expired, check_failing
    # The expiry date or failure start the notice was about, so a renewal starts afresh
    occurrence = db.Column(db.String(40), nullable=False)
    recipient = db.Column(db.String(255), nullable=False)
    message_id = db.Column(db.String(100), nullable=True)  # Eagle Notify's id for the email
    sent_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    @classmethod
    def already_sent(cls, certificate_id, notice, occurrence, recipient):
        """Return whether this notice was already accepted for this recipient."""
        return db.session.query(cls.id).filter_by(
            certificate_id=certificate_id, notice=notice, occurrence=occurrence, recipient=recipient,
        ).first() is not None
