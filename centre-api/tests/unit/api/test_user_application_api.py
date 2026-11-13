# Copyright © 2026 Province of British Columbia
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
"""API tests for user application bookmarks."""
from http import HTTPStatus
from unittest.mock import patch

import pytest
from flask import g

from centre_api.auth import jwt
from centre_api.models.applications import Application


CALLER_CLAIMS = {'preferred_username': 'caller@idir', 'sub': 'bookmark-caller-guid'}
EMPTY_SLOT = {'url': '', 'label': ''}


@pytest.fixture
def caller_token():
    """Authenticate requests as CALLER_CLAIMS without a real JWT."""
    def _authenticate(*args, **kwargs):
        g.jwt_oidc_token_info = CALLER_CLAIMS

    with patch.object(jwt, '_require_auth_validation', side_effect=_authenticate):
        yield CALLER_CLAIMS


@pytest.fixture
def app_id(session):
    """Create a test application and return its id."""
    app = Application(title='Bookmark App', name='bookmark_test_app', description='Test',
                      launch_url='https://test.com', is_active=True)
    session.add(app)
    session.commit()
    return app.id


class TestBookmarks:
    """Validation on PATCH /api/user-applications/bookmarks."""

    def test_http_bookmarks_and_empty_slots_are_saved(self, client, caller_token, app_id):
        """The client's three-slot payload with empty slots is accepted."""
        bookmarks = [{'url': 'https://example.gov.bc.ca/page', 'label': 'Page'}, EMPTY_SLOT,
                     {'url': None, 'label': None}]

        response = client.patch('/api/user-applications/bookmarks', json={'app_id': app_id, 'bookmarks': bookmarks})

        assert response.status_code == HTTPStatus.OK
        assert response.get_json()['bookmarks'][0] == {'url': 'https://example.gov.bc.ca/page', 'label': 'Page'}

    @pytest.mark.parametrize('url', [
        'javascript:alert(document.cookie)',
        'data:text/html,<script>alert(1)</script>',
        'ftp://example.com/file',
        '//example.com/path',
        'example.com',
    ])
    def test_non_http_urls_are_rejected(self, client, caller_token, app_id, url):
        """Only absolute http(s) URLs can be stored."""
        bookmarks = [{'url': url, 'label': 'Bad'}, EMPTY_SLOT, EMPTY_SLOT]

        response = client.patch('/api/user-applications/bookmarks', json={'app_id': app_id, 'bookmarks': bookmarks})

        assert response.status_code == HTTPStatus.BAD_REQUEST

    def test_too_many_bookmarks_are_rejected(self, client, caller_token, app_id):
        """The list is capped at the number of slots the UI offers."""
        bookmarks = [{'url': 'https://example.com', 'label': str(i)} for i in range(4)]

        response = client.patch('/api/user-applications/bookmarks', json={'app_id': app_id, 'bookmarks': bookmarks})

        assert response.status_code == HTTPStatus.BAD_REQUEST

    def test_long_label_is_rejected(self, client, caller_token, app_id):
        """Labels are capped at 100 characters."""
        bookmarks = [{'url': 'https://example.com', 'label': 'x' * 101}]

        response = client.patch('/api/user-applications/bookmarks', json={'app_id': app_id, 'bookmarks': bookmarks})

        assert response.status_code == HTTPStatus.BAD_REQUEST
