"""Access request schema.

This module defines the schema for the access request entity.
"""

from marshmallow import Schema, fields

from centre_api.enums.access_request_status import AccessRequestsStatusEnum
from centre_api.schemas.user_application import UserApplicationSchema


class AccessRequestSchema(Schema):
    """Schema for application and user application details."""

    id = fields.Int(required=True)
    app_id = fields.Int(required=True)
    user_auth_guid = fields.Str(required=True)
    status = fields.Enum(AccessRequestsStatusEnum, by_value=True, required=True)


class AccessRequestCatalogSchema(Schema):
    """Schema for access request catalog details."""

    id = fields.Int(required=True)
    name = fields.Str(required=True)
    title = fields.Str(required=True)
    description = fields.Str(allow_none=True)
    is_active = fields.Bool(required=True)
    status = fields.Str(required=True)
    user = fields.Nested(
        UserApplicationSchema(),
        allow_none=True,
        description="Details about the user's application access"
    )
