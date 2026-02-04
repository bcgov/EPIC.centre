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
    Parse CORS_ORIGIN env var into Flask-CORS compatible origins.

    Supports wildcards: *.eao.gov.bc.ca matches any subdomain.
    Cached since env vars don't change at runtime.
    """
    raw = os.getenv('CORS_ORIGIN', '')
    if not raw:
        return []

    def to_pattern(origin):
        """Convert wildcard origin to regex, or return as-is."""
        if '*' not in origin:
            return origin
        # *.domain.com -> regex matching any subdomain
        regex = re.escape(origin).replace(r'\*', r'[^/:]+')
        if not origin.startswith(('http://', 'https://')):
            regex = r'https?://' + regex
        return re.compile(regex + r'(:\d+)?$')

    return [to_pattern(o.strip()) for o in raw.split(',') if o.strip()]
