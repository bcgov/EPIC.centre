# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Meta information about the service.

to support swagger on http
"""
from functools import wraps
from flask import url_for
from flask_restx import Api as BaseApi, fields
from flask_restx.apidoc import apidoc
from marshmallow import fields as ma_fields


class Api(BaseApi):
    """Monkey patch Swagger API to return HTTPS URLs."""

    @property
    def specs_url(self):
        """Return URL for endpoint."""
        scheme = "http" if "3200" in self.base_url else "https"
        return url_for(self.endpoint("specs"), _external=True, _scheme=scheme)

    @classmethod
    def swagger_decorators(cls, api, endpoint_description):
        """Common decorators for the resources"""

        def decorator(func):
            @wraps(func)
            @api.doc(description=endpoint_description)
            @api.response(401, "Unauthorized")
            @api.response(500, "Internal Server Error")
            def wrapper(*args, **kwargs):
                return func(*args, **kwargs)

            return wrapper

        return decorator

    @classmethod
    def convert_ma_schema_to_restx_model(cls, api, schema, name):
        """
        Converts a Marshmallow schema to a Flask-RESTX model.

        :param api: The Flask-RESTX API instance
        :param schema: The Marshmallow schema instance
        :param name: The name of the Flask-RESTX model
        :return: A Flask-RESTX model
        """
        type_mapping = {
            ma_fields.Integer: fields.Integer,
            ma_fields.String: fields.String,
            ma_fields.Float: fields.Float,
            ma_fields.Boolean: fields.Boolean,
            ma_fields.DateTime: fields.DateTime,
            # Add more field types as needed
        }
        model_fields = {}
        for field_name, field in schema.fields.items():
            field_type = type(field)
            restx_field = type_mapping.get(field_type)
            if restx_field:
                model_fields[field_name] = restx_field(
                    required=field.required,
                    description=field.metadata.get("description", ""),
                )
            # Add more field types as needed

        return api.model(name, model_fields)

# Make a global change setting the URL prefix for the swaggerui at the module level
# This solves the issue where the swaggerui does not pick up the url prefix
apidoc.url_prefix = "/api/"
