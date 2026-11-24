"""Read the certificate each https origin serves and record it.

Only a TLS handshake: no HTTP request is sent, so it works for apps behind a login.
"""
import socket
import ssl
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from cryptography import x509
from cryptography.hazmat.primitives import hashes
from flask import current_app

from centre_api.models import SslCertificate
from centre_api.models.db import db


MAX_PARALLEL_CHECKS = 8


@dataclass
class CertificateReading:
    """What one handshake found. `error` is set when the check failed or the certificate isn't trusted."""

    expires_at: Optional[datetime] = None  # naive UTC
    issuer: Optional[str] = None
    subject: Optional[str] = None
    serial_number: Optional[str] = None
    fingerprint_sha256: Optional[str] = None
    error: Optional[str] = None


def _common_name(name: x509.Name) -> Optional[str]:
    attributes = name.get_attributes_for_oid(x509.NameOID.COMMON_NAME)
    if attributes:
        return str(attributes[0].value)[:255]
    return name.rfc4514_string()[:255] or None


def _handshake(host: str, port: int, timeout: int, verify: bool) -> x509.Certificate:
    context = ssl.create_default_context()
    if not verify:
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
    with socket.create_connection((host, port), timeout=timeout) as sock:
        with context.wrap_socket(sock, server_hostname=host) as tls:
            return x509.load_der_x509_certificate(tls.getpeercert(binary_form=True))


def _connection_error(err: Exception) -> str:
    """Describe a failed connection for the page, without a stack trace."""
    if isinstance(err, socket.gaierror):
        return 'DNS lookup failed'
    if isinstance(err, (socket.timeout, TimeoutError)):
        return 'Timed out connecting'
    if isinstance(err, ConnectionRefusedError):
        return 'Connection refused'
    if isinstance(err, ssl.SSLError):
        return f'TLS handshake failed: {err.reason or err}'
    return f'Could not connect: {getattr(err, "strerror", None) or err}'


class SslCheckService:
    """Check certificates and store what was found."""

    @staticmethod
    def read_certificate(host: str, port: int, timeout: int) -> CertificateReading:
        """Handshake with host:port and read its certificate, even one that fails validation."""
        error = None
        try:
            try:
                cert = _handshake(host, port, timeout, verify=True)
            except ssl.SSLCertVerificationError as err:
                # Still read it, so an expired or untrusted certificate shows its date
                error = f'Not trusted: {err.verify_message or err.reason}'
                cert = _handshake(host, port, timeout, verify=False)
        except (OSError, ValueError) as err:  # Socket and TLS errors are OSErrors; a bad certificate is a ValueError
            return CertificateReading(error=_connection_error(err)[:500])

        return CertificateReading(
            expires_at=cert.not_valid_after_utc.astimezone(timezone.utc).replace(tzinfo=None),
            issuer=_common_name(cert.issuer),
            subject=_common_name(cert.subject),
            serial_number=format(cert.serial_number, 'X')[:100],
            fingerprint_sha256=cert.fingerprint(hashes.SHA256()).hex(),
            error=error[:500] if error else None,
        )

    @staticmethod
    def record(certificate: SslCertificate, reading: CertificateReading, now: datetime):
        """Store a reading. A failed connection keeps the last certificate details it had."""
        if reading.expires_at is not None:
            certificate.expires_at = reading.expires_at
            certificate.issuer = reading.issuer
            certificate.subject = reading.subject
            certificate.serial_number = reading.serial_number
            certificate.fingerprint_sha256 = reading.fingerprint_sha256
        certificate.check_error = reading.error
        certificate.last_checked = now
        certificate.failing_since = (certificate.failing_since or now) if reading.error else None

    @classmethod
    def check(cls, certificate: SslCertificate) -> SslCertificate:
        """Check one certificate now and save the result."""
        reading = cls.read_certificate(
            certificate.host, certificate.port, current_app.config.get('SSL_CHECK_TIMEOUT', 10),
        )
        cls.record(certificate, reading, datetime.utcnow())
        db.session.commit()
        return certificate

    @classmethod
    def check_all(cls) -> list:
        """Check every certificate an active URL uses, in parallel, and save the results."""
        certificates = SslCertificate.find_in_use()
        timeout = current_app.config.get('SSL_CHECK_TIMEOUT', 10)
        # Threads only do network work; the session stays on this thread
        with ThreadPoolExecutor(max_workers=MAX_PARALLEL_CHECKS) as pool:
            readings = list(pool.map(
                lambda target: cls.read_certificate(*target, timeout),
                [(certificate.host, certificate.port) for certificate in certificates],
            ))
        now = datetime.utcnow()
        for certificate, reading in zip(certificates, readings):
            cls.record(certificate, reading, now)
        db.session.commit()
        return certificates
