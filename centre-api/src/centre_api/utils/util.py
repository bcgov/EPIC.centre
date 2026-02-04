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

"""Utility functions for the Centre API."""

import os
import re
from functools import lru_cache


@lru_cache(maxsize=1)
def allowedorigins():
    """
    Get the list of allowed CORS origins from the environment.

    If you set CORS_ORIGIN to something like "*.eao.gov.bc.ca", this will
    match any subdomain (e.g. centre.eao.gov.bc.ca, submit.eao.gov.bc.ca).
    """
    raw = os.getenv('CORS_ORIGIN', '')
    if not raw:
        return []

    def to_pattern(origin):
        """Turn a wildcard origin like *.example.com into a regex pattern."""
        # No wildcard? Just return the origin as-is
        if '*' not in origin:
            return origin

        # Build a regex: *.example.com -> matches sub.example.com, app.example.com, etc.
        regex = re.escape(origin).replace(r'\*', r'[^/:]+')
        if not origin.startswith(('http://', 'https://')):
            regex = r'https?://' + regex
        return re.compile(regex + r'(:\d+)?$')

    return [to_pattern(o.strip()) for o in raw.split(',') if o.strip()]
