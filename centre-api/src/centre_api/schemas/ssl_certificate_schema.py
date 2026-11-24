"""SSL certificate validation schema."""
from marshmallow import Schema, fields, pre_load, validate


RENEWAL_STATUSES = ['NONE', 'TICKET_CREATED', 'ORDERED', 'PLANNED']


class SslCertificateRenewalSchema(Schema):
    """The renewal tracking an editor can change. Check results come only from checks."""

    ticket_reference = fields.Str(validate=validate.Length(max=50), allow_none=True)
    renewal_status = fields.Str(validate=validate.OneOf(RENEWAL_STATUSES))
    renewal_comments = fields.Str(allow_none=True)

    class Meta:
        """Marshmallow configuration options."""

        unknown = 'exclude'

    @pre_load
    def normalize(self, data, **kwargs):  # pylint: disable=unused-argument
        """Trim text, storing blanks as null."""
        if not isinstance(data, dict):
            return data
        data = dict(data)
        for key in ('ticket_reference', 'renewal_comments'):
            if isinstance(data.get(key), str):
                data[key] = data[key].strip() or None
        return data
