"""SSL certificate model: one row per https origin, shared by every URL on it."""
from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit

from flask import current_app

from .base_model import BaseModel
from .db import db


EXPIRING_SOON_DAYS = 30


def _utc_isoformat(value):
    """Mark the naive UTC timestamps as UTC, or browsers read them as local time."""
    return value.replace(tzinfo=timezone.utc).isoformat() if value else None


class SslCertificateStatus:  # pylint: disable=too-few-public-methods
    """Certificate states, worked out from the last check whenever they're read."""

    UNKNOWN = 'Unknown'  # Not checked yet
    VALID = 'Valid'
    EXPIRING_SOON = 'Expiring Soon'
    EXPIRED = 'Expired'
    ERROR = 'Error'  # The last check failed, or the certificate isn't trusted


class SslCertificate(BaseModel):
    """The certificate an https origin serves, as of its last check."""

    __tablename__ = 'ssl_certificates'

    id = db.Column(db.Integer, primary_key=True)
    origin = db.Column(db.String(300), nullable=False, unique=True)  # https://host:port
    host = db.Column(db.String(255), nullable=False)
    port = db.Column(db.Integer, nullable=False)

    # From the last check that could read the certificate
    expires_at = db.Column(db.DateTime, nullable=True)
    issuer = db.Column(db.String(255), nullable=True)
    subject = db.Column(db.String(255), nullable=True)
    serial_number = db.Column(db.String(100), nullable=True)
    fingerprint_sha256 = db.Column(db.String(64), nullable=True)

    # From the last check
    check_error = db.Column(db.String(500), nullable=True)
    last_checked = db.Column(db.DateTime, nullable=True)
    failing_since = db.Column(db.DateTime, nullable=True)

    ticket_reference = db.Column(db.String(50), nullable=True)
    renewal_status = db.Column(db.String(50), nullable=False, default='NONE')  # NONE, TICKET_CREATED, ...
    renewal_comments = db.Column(db.Text, nullable=True)

    urls = db.relationship('ApplicationUrl', back_populates='certificate')

    @staticmethod
    def origin_of(url):
        """Return (origin, host, port) for an https URL, or None for anything else."""
        try:
            parts = urlsplit((url or '').strip())
            port = parts.port or 443
        except ValueError:
            return None
        if parts.scheme.lower() != 'https' or not parts.hostname:
            return None
        host = parts.hostname.lower()
        return f'https://{host}:{port}', host, port

    @classmethod
    def find_or_create_for_url(cls, url):
        """Return the certificate for an https URL's origin, adding it if new; None for http."""
        parsed = cls.origin_of(url)
        if not parsed:
            return None
        origin, host, port = parsed
        certificate = cls.query.filter_by(origin=origin).one_or_none()
        if certificate is None:
            certificate = cls(origin=origin, host=host, port=port, renewal_status='NONE')
            db.session.add(certificate)
        return certificate

    @classmethod
    def find_in_use(cls):
        """Return the certificates that at least one active URL uses."""
        from .application_url import ApplicationUrl  # pylint: disable=import-outside-toplevel
        return cls.query.filter(
            cls.urls.any(ApplicationUrl.is_active.is_(True))
        ).order_by(cls.host, cls.port).all()

    @property
    def is_platform_managed(self):
        """True for hosts whose certificates the OpenShift platform renews."""
        domains = current_app.config.get('SSL_PLATFORM_DOMAINS', [])
        return any(self.host == domain or self.host.endswith(f'.{domain}') for domain in domains)

    def status(self, now=None):
        """Return the certificate's state at `now` (UTC, naive)."""
        now = now or datetime.utcnow()
        if self.last_checked is None:
            return SslCertificateStatus.UNKNOWN
        if self.expires_at is not None and self.expires_at <= now:
            return SslCertificateStatus.EXPIRED
        if self.check_error or self.expires_at is None:
            return SslCertificateStatus.ERROR
        if self.expires_at - now <= timedelta(days=EXPIRING_SOON_DAYS):
            return SslCertificateStatus.EXPIRING_SOON
        return SslCertificateStatus.VALID

    def to_dict(self):
        """Convert to the API's JSON shape."""
        return {
            'id': self.id,
            'origin': self.origin,
            'host': self.host,
            'port': self.port,
            'status': self.status(),
            'expires_at': _utc_isoformat(self.expires_at),
            'issuer': self.issuer,
            'check_error': self.check_error,
            'last_checked': _utc_isoformat(self.last_checked),
            'is_platform_managed': self.is_platform_managed,
            'ticket_reference': self.ticket_reference,
            'renewal_status': self.renewal_status,
            'renewal_comments': self.renewal_comments,
        }
