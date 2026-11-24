# Copyright © 2026 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Tests for reading and recording certificates, against local TLS servers."""
import socket
import ssl
import threading
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.x509.oid import NameOID

from centre_api.models import SslCertificate, SslCertificateStatus
from centre_api.services import ssl_check_service
from centre_api.services.ssl_check_service import CertificateReading, SslCheckService


def _name(common_name):
    return x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, common_name)])


def _certificate(subject, key, issuer, issuer_key, not_after, ca=False):
    now = datetime.now(timezone.utc)
    builder = (x509.CertificateBuilder()
               .subject_name(_name(subject)).issuer_name(_name(issuer))
               .public_key(key.public_key()).serial_number(x509.random_serial_number())
               .not_valid_before(min(now - timedelta(days=1), not_after - timedelta(days=1)))
               .not_valid_after(not_after)
               .add_extension(x509.BasicConstraints(ca=ca, path_length=None), critical=True))
    if not ca:
        builder = builder.add_extension(x509.SubjectAlternativeName([x509.DNSName('localhost')]), critical=False)
    return builder.sign(issuer_key, hashes.SHA256())


def _pem(path, *items):
    path.write_bytes(b''.join(items))
    return str(path)


class _TlsServer:
    """Serves a certificate on localhost until stopped, answering any number of handshakes."""

    def __init__(self, cert_file, key_file):
        self.context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        self.context.load_cert_chain(cert_file, key_file)
        self.sock = socket.create_server(('localhost', 0))
        self.sock.settimeout(0.2)
        self.port = self.sock.getsockname()[1]
        self.running = True
        self.thread = threading.Thread(target=self._serve, daemon=True)
        self.thread.start()

    def _serve(self):
        while self.running:
            try:
                conn, _ = self.sock.accept()
            except socket.timeout:
                continue
            try:
                with self.context.wrap_socket(conn, server_side=True):
                    pass
            except (ssl.SSLError, OSError):
                pass  # The client refused our certificate, as the verified attempt does

    def stop(self):
        self.running = False
        self.thread.join()
        self.sock.close()


@pytest.fixture
def tls(tmp_path):
    """Return a function that starts a local TLS server and returns its port; checks trust the test CA."""
    servers = []
    ca_key = ec.generate_private_key(ec.SECP256R1())
    ca_cert = _certificate('Test CA', ca_key, 'Test CA', ca_key, datetime.now(timezone.utc) + timedelta(days=3650),
                           ca=True)
    ca_file = _pem(tmp_path / 'ca.pem', ca_cert.public_bytes(serialization.Encoding.PEM))

    def _start(not_after, trusted=True):
        key = ec.generate_private_key(ec.SECP256R1())
        issuer, issuer_key = ('Test CA', ca_key) if trusted else ('localhost', key)
        cert = _certificate('localhost', key, issuer, issuer_key, not_after)
        server = _TlsServer(
            _pem(tmp_path / f'cert{len(servers)}.pem', cert.public_bytes(serialization.Encoding.PEM)),
            _pem(tmp_path / f'key{len(servers)}.pem', key.private_bytes(
                serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())),
        )
        servers.append(server)
        return server.port

    real_context = ssl.create_default_context
    # Trust the test CA, as the system store trusts real ones
    with patch.object(ssl_check_service.ssl, 'create_default_context', lambda: real_context(cafile=ca_file)):
        yield _start
    for server in servers:
        server.stop()


def _in_days(days):
    return datetime.now(timezone.utc) + timedelta(days=days)


class TestReadCertificate:
    """SslCheckService.read_certificate."""

    def test_trusted_certificate(self, tls):
        """A valid certificate reads with no error."""
        not_after = _in_days(90).replace(microsecond=0)
        port = tls(not_after)

        reading = SslCheckService.read_certificate('localhost', port, timeout=5)

        assert reading.error is None
        assert reading.expires_at == not_after.replace(tzinfo=None)
        assert reading.issuer == 'Test CA'
        assert reading.subject == 'localhost'
        assert len(reading.fingerprint_sha256) == 64

    def test_untrusted_certificate_still_reads_its_expiry(self, tls):
        """A self-signed certificate is an error, but its date is still shown."""
        port = tls(_in_days(90), trusted=False)

        reading = SslCheckService.read_certificate('localhost', port, timeout=5)

        assert reading.error.startswith('Not trusted: ')
        assert 'self-signed' in reading.error or 'self signed' in reading.error
        assert reading.expires_at is not None

    def test_expired_certificate_reads_its_expiry(self, tls):
        """An expired certificate fails validation but still shows when it expired."""
        port = tls(_in_days(-3))

        reading = SslCheckService.read_certificate('localhost', port, timeout=5)

        assert 'expired' in reading.error
        assert reading.expires_at < datetime.utcnow()

    def test_nothing_listening(self):
        """A closed port is a connection error, not an exception."""
        with socket.create_server(('localhost', 0)) as sock:
            port = sock.getsockname()[1]

        reading = SslCheckService.read_certificate('localhost', port, timeout=5)

        assert reading == CertificateReading(error='Connection refused')


class TestRecordAndStatus:
    """SslCheckService.record and SslCertificate.status."""

    NOW = datetime(2026, 11, 24, 12, 0)

    def _certificate(self, app):  # pylint: disable=unused-argument
        return SslCertificate(origin='https://a.example.com:443', host='a.example.com', port=443)

    def test_never_checked_is_unknown(self, app):
        """No check yet, nothing to say."""
        assert self._certificate(app).status(self.NOW) == SslCertificateStatus.UNKNOWN

    @pytest.mark.parametrize('days, status', [
        (31, SslCertificateStatus.VALID),
        (30, SslCertificateStatus.EXPIRING_SOON),
        (0, SslCertificateStatus.EXPIRED),
        (-1, SslCertificateStatus.EXPIRED),
    ])
    def test_status_follows_the_expiry(self, app, days, status):
        """Worked out when read, so it can't go stale between checks."""
        certificate = self._certificate(app)
        SslCheckService.record(certificate, CertificateReading(expires_at=self.NOW + timedelta(days=days)), self.NOW)

        assert certificate.status(self.NOW) == status

    def test_failure_keeps_the_last_expiry_and_when_failing_began(self, app):
        """A host that stops answering still shows its certificate's date, and how long it's been failing."""
        certificate = self._certificate(app)
        expiry = self.NOW + timedelta(days=90)
        SslCheckService.record(certificate, CertificateReading(expires_at=expiry), self.NOW)
        SslCheckService.record(certificate, CertificateReading(error='Timed out connecting'), self.NOW)
        SslCheckService.record(certificate, CertificateReading(error='Timed out connecting'),
                               self.NOW + timedelta(days=1))

        assert certificate.expires_at == expiry
        assert certificate.failing_since == self.NOW
        assert certificate.status(self.NOW + timedelta(days=1)) == SslCertificateStatus.ERROR

        SslCheckService.record(certificate, CertificateReading(expires_at=expiry), self.NOW + timedelta(days=2))
        assert certificate.failing_since is None
        assert certificate.check_error is None

    def test_platform_hosts(self, app):
        """Subdomains of the platform domain only, not look-alikes."""
        assert SslCertificate(host='eao-dev.apps.gold.devops.gov.bc.ca').is_platform_managed
        assert not SslCertificate(host='devops.gov.bc.ca.example.com').is_platform_managed
        assert not SslCertificate(host='notdevops.gov.bc.ca').is_platform_managed


class TestCheckAll:
    """SslCheckService.check_all."""

    def test_checks_only_certificates_in_use(self, session):
        """A certificate no active URL uses isn't checked."""
        readings = []

        def _read(host, port, timeout):
            readings.append(host)
            return CertificateReading(expires_at=datetime.utcnow() + timedelta(days=90))

        with patch.object(SslCheckService, 'read_certificate', side_effect=_read):
            certificates = SslCheckService.check_all()

        # The seeded URLs use 12 hosts
        assert len(readings) == len(certificates) == 12
        assert all(certificate.last_checked for certificate in certificates)
