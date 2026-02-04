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

"""CORS pre-flight decorator.

A simple decorator to add the options method to a Request Class.
"""

import base64
import os
import re
import urllib

from flask import request
from humps.main import camelize, decamelize


def _is_origin_allowed(origin: str) -> bool:
    """Return True if origin is in the allowed CORS list (exact or regex match)."""
    if not origin:
        return False
    for entry in allowedorigins():
        if hasattr(entry, 'match'):
            if entry.match(origin):
                return True
        elif entry == origin:
            return True
    return False


def cors_preflight(methods):
    """Render an option method on the class."""

    def wrapper(f):
        def options(self, *args, **kwargs):  # pylint: disable=unused-argument
            origin = request.environ.get('HTTP_ORIGIN', '')
            allow_origin = origin if _is_origin_allowed(origin) else None
            headers = {
                'Access-Control-Allow-Methods': methods,
                'Access-Control-Allow-Headers': 'Authorization, Content-Type, registries-trace-id, '
                                                'invitation_token',
                'Access-Control-Allow-Credentials': 'true',
            }
            if allow_origin:
                headers['Access-Control-Allow-Origin'] = allow_origin
            return {'Allow': 'GET, DELETE, PUT, POST'}, 200, headers

        setattr(f, 'options', options)
        return f

    return wrapper


def camelback2snake(camel_dict: dict):
    """Convert the passed dictionary's keys from camelBack case to snake_case."""
    return decamelize(camel_dict)


def snake2camelback(snake_dict: dict):
    """Convert the passed dictionary's keys from snake_case to camelBack case."""
    return camelize(snake_dict)


def allowedorigins():
    """Return allowed origin."""
    _allowedcors = os.getenv('CORS_ORIGIN')
    if not _allowedcors:
        return []
    entries = [entry.strip() for entry in re.split(r',\s*', _allowedcors) if entry.strip()]
    return [_wildcard_origin_to_regex(entry) if '*' in entry else entry for entry in entries]


def _wildcard_origin_to_regex(entry: str):
    """Convert wildcard origin entry to a regex Flask-CORS accepts."""
    if entry == '*':
        return re.compile(r'.*')

    scheme_part = r'https?://'
    host_port = entry
    if entry.startswith(('http://', 'https://')):
        scheme, host_port = entry.split('://', 1)
        scheme_part = re.escape(f'{scheme}://')

    if '/' in host_port:
        host_port = host_port.split('/', 1)[0]

    host = host_port
    port_part = r'(?::\d+)?'
    if ':' in host_port and ']' not in host_port:
        host, port = host_port.rsplit(':', 1)
        if port:
            port_part = f':{re.escape(port)}'

    host_regex = re.escape(host).replace(r'\*', r'[^/]*')
    return re.compile(rf'^{scheme_part}{host_regex}{port_part}$')


class Singleton(type):
    """Singleton meta."""

    _instances = {}

    def __call__(cls, *args, **kwargs):
        """Call for meta."""
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]


def digitify(payload: str) -> int:
    """Return the digits from the string."""
    return int(re.sub(r'\D', '', payload))


def escape_wam_friendly_url(param):
    """Return encoded/escaped url."""
    base64_org_name = base64.b64encode(bytes(param, encoding='utf-8')).decode('utf-8')
    encode_org_name = urllib.parse.quote(base64_org_name, safe='')
    return encode_org_name
