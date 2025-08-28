"""Project schema.

This module defines the schema for the project entity.
"""

from marshmallow import Schema, fields

from centre_api.schemas.user_application import UserApplicationSchema


class ApplicationSchema(Schema):
    """Schema for application and user application details."""

    id = fields.Int(required=True)
    name = fields.Str(required=True)
    title = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    launch_url = fields.Str(required=True)
    is_active = fields.Bool(required=True)
    user = fields.Nested(
        UserApplicationSchema(),
        allow_none=True,
        description="Details about the user's application access"
    )
