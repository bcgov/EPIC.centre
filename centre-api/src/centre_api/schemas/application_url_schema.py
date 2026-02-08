"""Application URL validation schema."""
from marshmallow import Schema, fields, validate


class ApplicationUrlSchema(Schema):
    """Schema for validating application URL data."""
    
    app_name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=100),
        error_messages={'required': 'Application name is required'}
    )
    environment = fields.String(
        required=True,
        validate=validate.OneOf(['PROD', 'TEST', 'DEV', 'Other']),
        error_messages={'required': 'Environment is required'}
    )
    url = fields.URL(
        required=True,
        validate=validate.Length(max=500),
        error_messages={'required': 'URL is required'}
    )


class ApplicationUrlUpdateSchema(Schema):
    """Schema for updating application URL data."""
    
    url = fields.URL(validate=validate.Length(max=500))
    ssl_status = fields.String(
        validate=validate.OneOf(['Valid', 'Expiring Soon', 'Expired', 'Error', 'Managed', 'Unknown'])
    )
    ssl_expiry = fields.DateTime()
    ssl_error_message = fields.String(validate=validate.Length(max=500))
