"""Project schema.

This module defines the schema for the project entity.
"""

from marshmallow import EXCLUDE, Schema, fields, validate


MAX_BOOKMARKS = 3

_http_url = validate.URL(schemes={'http', 'https'}, relative=False, require_tld=False)


def _validate_bookmark_url(value):
    """Allow an empty slot or an absolute http(s) URL."""
    if value:
        _http_url(value)


class BookmarkSchema(Schema):
    """Schema for bookmark details."""

    class Meta:
        """Marshmallow configuration options."""

        unknown = EXCLUDE

    # The client always sends every slot, so empty and null values are allowed
    label = fields.Str(required=True, allow_none=True, validate=validate.Length(max=100))
    url = fields.Str(required=True, allow_none=True, validate=[validate.Length(max=2048), _validate_bookmark_url])


class UserApplicationSchema(Schema):
    """Schema for user-specific application details."""

    access_level = fields.Str(allow_none=True)
    last_accessed = fields.DateTime(allow_none=True)
    sort_order = fields.Int(allow_none=True)
    bookmarks = fields.List(fields.Nested(BookmarkSchema()), default=[])
    user_auth_guid = fields.Str(required=True)
