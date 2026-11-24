"""Application URL validation schema."""
from marshmallow import Schema, fields, pre_load, validate


RENEWAL_STATUSES = ['NONE', 'TICKET_CREATED', 'ORDERED', 'PLANNED']
# Links open in the browser, so only web URLs
URL_SCHEMES = {'http', 'https'}


def _normalize(data, trimmed):
    """Trim the given string fields and store a blank ticket reference as null."""
    if not isinstance(data, dict):
        return data
    data = {key: value.strip() if key in trimmed and isinstance(value, str) else value
            for key, value in data.items()}
    if data.get('ticket_reference') == '':
        data['ticket_reference'] = None
    return data


class ApplicationUrlSchema(Schema):
    """Schema for validating application URL data."""

    app_name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=100),
        error_messages={'required': 'Application name is required'}
    )
    environment = fields.String(
        required=True,
        validate=validate.Length(min=1, max=50),
        error_messages={'required': 'Environment is required'}
    )
    url = fields.URL(
        required=True,
        schemes=URL_SCHEMES,
        validate=validate.Length(max=500),
        error_messages={'required': 'URL is required'}
    )
    ticket_reference = fields.Str(validate=validate.Length(max=50), allow_none=True)
    renewal_status = fields.Str(validate=validate.OneOf(RENEWAL_STATUSES), allow_none=True)
    renewal_comments = fields.Str(allow_none=True)

    class Meta:
        """Marshmallow configuration options."""

        unknown = 'exclude'

    @pre_load
    def normalize(self, data, **kwargs):  # pylint: disable=unused-argument
        """Trim input and upper-case the environment, as the web app does."""
        data = _normalize(data, ('app_name', 'environment', 'url', 'ticket_reference'))
        if isinstance(data, dict) and isinstance(data.get('environment'), str):
            data['environment'] = data['environment'].upper()
        return data


class ApplicationUrlUpdateSchema(Schema):
    """The fields an editor can change. SSL details come only from certificate checks."""

    url = fields.URL(schemes=URL_SCHEMES, validate=validate.Length(max=500))
    ticket_reference = fields.Str(validate=validate.Length(max=50), allow_none=True)
    renewal_status = fields.Str(validate=validate.OneOf(RENEWAL_STATUSES), allow_none=True)
    renewal_comments = fields.Str(allow_none=True)

    class Meta:
        """Marshmallow configuration options."""

        unknown = 'exclude'

    @pre_load
    def normalize(self, data, **kwargs):  # pylint: disable=unused-argument
        """Trim the URL and ticket reference."""
        return _normalize(data, ('url', 'ticket_reference'))
