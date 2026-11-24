"""SSL certificate resources: the certificates application URLs use, and their renewal tracking."""
from flask import request
from flask_restx import Namespace, Resource
from marshmallow import ValidationError

from centre_api.auth import auth
from centre_api.extensions import WRITE_LIMIT, limiter
from centre_api.models import SslCertificate
from centre_api.models.db import db
from centre_api.resources.application_urls import (
    EDIT_APP_URL_ROLE, EPIC_CENTRE_CLIENT, VIEW_SSL_INFO_ROLE, current_username)
from centre_api.schemas.ssl_certificate_schema import SslCertificateRenewalSchema
from centre_api.services.ssl_check_service import SslCheckService


API = Namespace('ssl-certificates', description='Endpoints for SSL certificates')
# Each check opens a connection to the host, so fewer than other writes
CHECK_LIMIT = '10/minute'

renewal_schema = SslCertificateRenewalSchema()


def _find_in_use(certificate_id):
    """Return the certificate if an active URL uses it, else None."""
    certificate = db.session.get(SslCertificate, certificate_id)
    if certificate is None or not any(url.is_active for url in certificate.urls):
        return None
    return certificate


@API.route('')
class SslCertificates(Resource):
    """Resource for listing certificates."""

    @staticmethod
    @auth.require_any_role([VIEW_SSL_INFO_ROLE, EDIT_APP_URL_ROLE], client_names=[EPIC_CENTRE_CLIENT])
    def get():
        """Fetch the certificates that active application URLs use."""
        return [certificate.to_dict() for certificate in SslCertificate.find_in_use()], 200


@API.route('/<int:certificate_id>')
class SslCertificateResource(Resource):
    """Resource for a certificate's renewal tracking."""

    @staticmethod
    @auth.require_any_role([EDIT_APP_URL_ROLE], client_names=[EPIC_CENTRE_CLIENT])
    @limiter.limit(WRITE_LIMIT)
    def patch(certificate_id):
        """Update the ticket, renewal status or comments."""
        certificate = _find_in_use(certificate_id)
        if not certificate:
            return {'message': 'Certificate not found'}, 404

        try:
            data = renewal_schema.load(request.get_json())
        except ValidationError as err:
            return {'message': 'Validation failed', 'errors': err.messages}, 400

        for key, value in data.items():
            setattr(certificate, key, value)
        certificate.updated_by = current_username()
        certificate.save()
        return certificate.to_dict(), 200


@API.route('/<int:certificate_id>/check')
class SslCertificateCheck(Resource):
    """Resource for checking a certificate now, e.g. right after a renewal."""

    @staticmethod
    @auth.require_any_role([EDIT_APP_URL_ROLE], client_names=[EPIC_CENTRE_CLIENT])
    @limiter.limit(CHECK_LIMIT)
    def post(certificate_id):
        """Check the certificate now and return the result. Sends no notices."""
        certificate = _find_in_use(certificate_id)
        if not certificate:
            return {'message': 'Certificate not found'}, 404
        return SslCheckService.check(certificate).to_dict(), 200
