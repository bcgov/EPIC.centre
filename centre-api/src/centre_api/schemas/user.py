"""User schema.

This module defines the schema for the user entity.
"""

from marshmallow import Schema, fields


class UserListAppSchema(Schema):
    """An app a listed user has a role in."""

    name = fields.Str()
    group_path = fields.Str()


class UserListItemSchema(Schema):
    """A user list row; apps and group_paths only come with groups."""

    id = fields.Str()
    first_name = fields.Str(allow_none=True)
    last_name = fields.Str(allow_none=True)
    username = fields.Str()
    apps = fields.List(fields.Nested(UserListAppSchema))
    group_paths = fields.List(fields.Str())


class UserSchema(Schema):
    """Schema for serializing user data."""

    id = fields.UUID()
    first_name = fields.Str()
    last_name = fields.Str()
    email = fields.Email(attribute='email_address')
    username = fields.Str()
    apps = fields.List(fields.Dict())
    enabled = fields.Bool()
    groups = fields.List(fields.Dict())
    attributes = fields.Dict()
