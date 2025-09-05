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
"""Datetime object helper."""
from datetime import datetime

import pytz
from flask import current_app


def local_datetime():
    """Get the local (Pacific Timezone) datetime."""
    utcmoment = datetime.utcnow().replace(tzinfo=pytz.utc)
    now = utcmoment.astimezone(pytz.timezone('US/Pacific'))
    return now


def utc_datetime():
    """Get the UTC datetime."""
    utcmoment = datetime.utcnow().replace(tzinfo=pytz.utc)
    now = utcmoment.astimezone(pytz.timezone('UTC'))
    return now


def convert_utc_to_local_str(utc_dt: datetime, dt_format='%Y-%m-%d %I:%M %p %Z', timezone_override=None):
    """
    Convert a  UTC datetime to local timezone and format it.
    """
    utc_dt = pytz.utc.localize(utc_dt)

    tz_name = timezone_override or current_app.config.get('LEGISLATIVE_TIMEZONE', 'US/Pacific')
    local_tz = pytz.timezone(tz_name)
    local_dt = utc_dt.astimezone(local_tz)

    # Step 3: Format
    return local_dt.strftime(dt_format)
