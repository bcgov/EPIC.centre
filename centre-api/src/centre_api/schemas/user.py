"""User schema.

This module defines the schema for the user entity.
"""

from marshmallow import Schema, fields, post_dump


class UserSchema(Schema):
    """Schema for serializing user data without exposing internal fields like 'groups'."""
    id = fields.UUID()
    first_name = fields.Str()
    last_name = fields.Str()
    email = fields.Email(attribute='email_address')
    username = fields.Str()
    apps = fields.List(fields.Str())

    @post_dump
    def sort_apps(self, data, **kwargs):  # pylint: disable=unused-argument
        data["apps"] = sorted(data.get("apps", []))
        return data
