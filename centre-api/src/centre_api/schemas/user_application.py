"""Project schema.

This module defines the schema for the project entity.
"""

from marshmallow import Schema, fields


class BookmarkSchema(Schema):
    """Schema for bookmark details."""

    label = fields.Str(required=True)
    url = fields.Str(required=True)


class UserApplicationSchema(Schema):
    """Schema for user-specific application details."""

    access_level = fields.Str(allow_none=True)
    last_accessed = fields.DateTime(allow_none=True)
    sort_order = fields.Int(allow_none=True)
    bookmarks = fields.List(fields.Nested(BookmarkSchema()), default=[])
    user_auth_guid = fields.Str(required=True)
