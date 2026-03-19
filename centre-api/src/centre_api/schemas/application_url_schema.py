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
        validate=validate.Length(min=1, max=50),
        error_messages={'required': 'Environment is required'}
    )
    url = fields.URL(
        required=True,
        validate=validate.Length(max=500),
        error_messages={'required': 'URL is required'}
    )
    ticket_reference = fields.Str(validate=validate.Length(max=50), allow_none=True)
    renewal_status = fields.Str(
        validate=validate.OneOf(['NONE', 'TICKET_CREATED', 'ORDERED', 'PLANNED']),
        allow_none=True
    )
    renewal_comments = fields.Str(allow_none=True)

    class Meta:
        unknown = "exclude"


class ApplicationUrlUpdateSchema(Schema):
    """Schema for updating application URL data."""
    
    url = fields.URL(validate=validate.Length(max=500))
    ssl_status = fields.Str(
        validate=validate.OneOf(['Valid', 'Expiring Soon', 'Expired', 'Error', 'Managed', 'Unknown']),
        dump_only=True
    )
    ssl_expiry = fields.DateTime()
    ssl_error_message = fields.Str(dump_only=True)
    ticket_reference = fields.Str(allow_none=True)
    renewal_status = fields.Str(
        validate=validate.OneOf(['NONE', 'TICKET_CREATED', 'ORDERED', 'PLANNED']),
        allow_none=True
    )
    renewal_comments = fields.Str(allow_none=True)
    created_date = fields.DateTime(dump_only=True)

    class Meta:
        unknown = "exclude"
