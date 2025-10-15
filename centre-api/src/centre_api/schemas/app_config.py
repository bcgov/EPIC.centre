"""App configuration schema.

This module defines the schema for app configuration responses.
"""

from marshmallow import Schema, fields


class AppConfigSchema(Schema):
    """Schema for app configuration details."""

    name = fields.Str(required=True)
    title = fields.Str(required=True)
    launch_url = fields.Str(required=True)
    app_user_management_url = fields.Str(allow_none=True)
    is_active = fields.Bool(required=True)
