"""Engagement model class.

Manages the engagement
"""

from marshmallow import EXCLUDE, Schema, fields
from scaffold_api.models import User


class UserSchema(Schema):
    """User schema."""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE

    id = fields.Int(data_key='id')
    first_name = fields.Str(data_key='first_name')
    middle_name = fields.Str(data_key='description')
    last_name = fields.Str(data_key='last_name')
    email_address = fields.Str(data_key='email_address')
    contact_number = fields.Str(data_key='contact_number')
    username = fields.Str(data_key='username')


class UserRequestSchema(Schema):
    """User Request Schema"""

    class Meta:  # pylint: disable=too-few-public-methods
        """Exclude unknown fields in the deserialized output."""

        unknown = EXCLUDE
    
    first_name = fields.Str(data_key='first_name')
    middle_name = fields.Str(data_key='description')
    last_name = fields.Str(data_key='last_name')
    email_address = fields.Str(data_key='email_address')
    contact_number = fields.Str(data_key='contact_number')
    username = fields.Str(data_key='username')
