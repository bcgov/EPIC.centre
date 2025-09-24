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
    apps = fields.List(fields.Dict())
    enabled = fields.Bool()
    groups = fields.List(fields.Dict())
