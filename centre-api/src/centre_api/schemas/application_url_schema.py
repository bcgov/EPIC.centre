"""Application URL validation schema."""
from marshmallow import Schema, fields, pre_load, validate


# Links open in the browser, so only web URLs
URL_SCHEMES = {'http', 'https'}


def _trim(data, keys):
    """Trim the given string fields."""
    if not isinstance(data, dict):
        return data
    return {key: value.strip() if key in keys and isinstance(value, str) else value for key, value in data.items()}


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

    class Meta:
        """Marshmallow configuration options."""

        unknown = 'exclude'

    @pre_load
    def normalize(self, data, **kwargs):  # pylint: disable=unused-argument
        """Trim input and upper-case the environment, as the web app does."""
        data = _trim(data, ('app_name', 'environment', 'url'))
        if isinstance(data, dict) and isinstance(data.get('environment'), str):
            data['environment'] = data['environment'].upper()
        return data


class ApplicationUrlUpdateSchema(Schema):
    """Only the URL is editable; renewal tracking is on the certificate."""

    url = fields.URL(required=True, schemes=URL_SCHEMES, validate=validate.Length(max=500))

    class Meta:
        """Marshmallow configuration options."""

        unknown = 'exclude'

    @pre_load
    def normalize(self, data, **kwargs):  # pylint: disable=unused-argument
        """Trim the URL."""
        return _trim(data, ('url',))
