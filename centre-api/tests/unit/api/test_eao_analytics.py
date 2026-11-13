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
"""Tests for EAO Analytics API endpoints."""
import time
from http import HTTPStatus

import pytest

from centre_api.models.applications import Application
from centre_api.models.eao_analytics import EaoAnalytics
from centre_api.services.eao_analytics_service import EaoAnalyticsService


# Not the names the migrations seed, so a lookup by name finds the app the test created
TEST_APP_NAME = 'analytics_test_app'
OTHER_TEST_APP_NAME = 'analytics_test_app_other'


def _create_app(session, name=TEST_APP_NAME):
    """Create and return a test application."""
    app = Application(
        title=f'Test App {name}',
        name=name,
        description='Test application',
        launch_url='https://test.com',
        is_active=True
    )
    session.add(app)
    session.commit()
    return app


def _caller(user_auth_guid):
    """Return token claims for a caller whose sub is user_auth_guid."""
    return {'sub': user_auth_guid, 'preferred_username': 'analytics-test@idir', 'loginSource': 'idir'}


class TestEaoAnalyticsAPI:
    """Test suite for EAO Analytics endpoints."""

    def test_create_analytics_success(self, client, session, auth_header):
        """Test successful creation of analytics record."""
        app = _create_app(session)

        response = client.post(
            '/api/eao-analytics',
            json={'user_auth_guid': 'test-user-guid-123', 'app_name': TEST_APP_NAME},
            headers=auth_header(_caller('test-user-guid-123'))
        )

        assert response.status_code == HTTPStatus.OK
        data = response.get_json()
        assert data['user_auth_guid'] == 'test-user-guid-123'
        assert data['app_id'] == app.id
        assert 'last_login_time' in data

    def test_create_analytics_missing_fields(self, client, auth_header):
        """Test creation with missing required fields."""
        response = client.post(
            '/api/eao-analytics',
            json={'user_auth_guid': 'test-user-guid-123'},
            headers=auth_header(_caller('test-user-guid-123'))
        )

        assert response.status_code == HTTPStatus.BAD_REQUEST
        assert 'app_name' in response.get_json()['message']

    @pytest.mark.usefixtures('session')
    def test_create_analytics_app_not_found(self, client, auth_header):
        """Test creation with non-existent app_name."""
        response = client.post(
            '/api/eao-analytics',
            json={'user_auth_guid': 'test-user-guid-123', 'app_name': 'non_existent_app'},
            headers=auth_header(_caller('test-user-guid-123'))
        )

        assert response.status_code == HTTPStatus.BAD_REQUEST
        assert 'not found' in response.get_json()['message'].lower()

    def test_create_analytics_requires_token(self, client):
        """Test creation without a token is rejected."""
        response = client.post(
            '/api/eao-analytics',
            json={'user_auth_guid': 'test-user-guid-123', 'app_name': TEST_APP_NAME}
        )

        assert response.status_code == HTTPStatus.UNAUTHORIZED

    def test_update_existing_analytics(self, client, session, auth_header):
        """Test updating existing analytics record."""
        app = _create_app(session)
        user_guid = 'test-user-update'

        analytics1 = EaoAnalytics.record_login(user_auth_guid=user_guid, app_id=app.id)
        session.commit()
        initial_time = analytics1.last_login_time

        # Small delay to ensure time difference
        time.sleep(0.1)

        response = client.post(
            '/api/eao-analytics',
            json={'user_auth_guid': user_guid, 'app_name': TEST_APP_NAME},
            headers=auth_header(_caller(user_guid))
        )

        assert response.status_code == HTTPStatus.OK
        data = response.get_json()
        assert data['user_auth_guid'] == user_guid
        updated_analytics = EaoAnalytics.get_user_analytics(user_guid)
        assert updated_analytics.last_login_time > initial_time

    def test_get_analytics_all(self, session):
        """Test getting all analytics records without filters."""
        app1 = _create_app(session)
        app2 = _create_app(session, OTHER_TEST_APP_NAME)

        EaoAnalytics.record_login(user_auth_guid='user1', app_id=app1.id)
        EaoAnalytics.record_login(user_auth_guid='user2', app_id=app2.id)
        session.commit()

        analytics = EaoAnalyticsService.get_analytics()

        assert isinstance(analytics, list)
        assert len(analytics) >= 2

    def test_get_analytics_by_user_auth_guid(self, session):
        """Test getting analytics filtered by user_auth_guid."""
        app = _create_app(session)

        user_guid = 'test-user-filter'
        EaoAnalytics.record_login(user_auth_guid=user_guid, app_id=app.id)
        EaoAnalytics.record_login(user_auth_guid='other-user', app_id=app.id)
        session.commit()

        analytics = EaoAnalyticsService.get_analytics(user_auth_guid=user_guid)

        assert isinstance(analytics, list)
        assert len(analytics) == 1
        assert analytics[0].user_auth_guid == user_guid

    def test_get_analytics_by_app_name(self, session):
        """Test getting analytics filtered by app_name."""
        app1 = _create_app(session)
        app2 = _create_app(session, OTHER_TEST_APP_NAME)

        EaoAnalytics.record_login(user_auth_guid='user1', app_id=app1.id)
        EaoAnalytics.record_login(user_auth_guid='user2', app_id=app2.id)
        session.commit()

        analytics = EaoAnalyticsService.get_analytics(app_name=TEST_APP_NAME)

        assert isinstance(analytics, list)
        assert len(analytics) == 1
        assert analytics[0].app_id == app1.id

    def test_get_analytics_by_user_and_app(self, session):
        """Test getting analytics filtered by both user_auth_guid and app_name."""
        app1 = _create_app(session)
        app2 = _create_app(session, OTHER_TEST_APP_NAME)

        user_guid = 'test-user-combined'
        EaoAnalytics.record_login(user_auth_guid=user_guid, app_id=app1.id)
        EaoAnalytics.record_login(user_auth_guid=user_guid, app_id=app2.id)
        EaoAnalytics.record_login(user_auth_guid='other-user', app_id=app1.id)
        session.commit()

        analytics = EaoAnalyticsService.get_analytics(user_auth_guid=user_guid, app_name=TEST_APP_NAME)

        assert isinstance(analytics, list)
        assert len(analytics) == 1
        assert analytics[0].user_auth_guid == user_guid
        assert analytics[0].app_id == app1.id

    def test_get_analytics_app_name_not_found(self, session):
        """Test getting analytics with non-existent app_name returns empty list."""
        analytics = EaoAnalyticsService.get_analytics(app_name='non_existent_app')

        assert isinstance(analytics, list)
        assert len(analytics) == 0
