# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""EAO Analytics schema."""
from marshmallow import Schema, fields


class EaoAnalyticsSchema(Schema):
    """Schema for EAO Analytics."""

    id = fields.Int()
    user_auth_guid = fields.Str(required=True)
    last_login_time = fields.DateTime(required=True)
    app_id = fields.Int(required=True)
    created_date = fields.DateTime()
    updated_date = fields.DateTime()


class EaoAnalyticsCreateSchema(Schema):
    """Schema for creating EAO Analytics record."""

    user_auth_guid = fields.Str(required=True)
    app_name = fields.Str(required=True)
