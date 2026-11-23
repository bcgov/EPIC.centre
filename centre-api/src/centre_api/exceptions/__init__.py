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
"""Errors whose message is sent to the user as {"message": ...}.

Raise them for problems the user can act on; anything else is a logged 500 with no detail.
"""
from werkzeug.exceptions import BadRequest, NotFound


class BadRequestError(BadRequest):
    """A request the user can fix: a 400."""

    def __init__(self, message):
        """Return a 400 with this message."""
        super().__init__(description=message)


class ResourceNotFoundError(NotFound):
    """A record that doesn't exist: a 404."""

    def __init__(self, message):
        """Return a 404 with this message."""
        super().__init__(description=message)
