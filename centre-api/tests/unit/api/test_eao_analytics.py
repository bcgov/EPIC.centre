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
from http import HTTPStatus

from centre_api.models.applications import Application
from centre_api.models.eao_analytics import EaoAnalytics
from centre_api.services.eao_analytics_service import EaoAnalyticsService


class TestEaoAnalyticsAPI:
    """Test suite for EAO Analytics endpoints."""

    def test_create_analytics_success(self, client, session, auth_header):
        """Test successful creation of analytics record."""
        # Create a test application first. Uses a name not seeded by migrations (unlike
        # 'epic_submit'/'epic_compliance') so EaoAnalyticsService's lookup-by-name can't
        # resolve to a different, pre-existing row with the same name.
        app = Application(
            title='Test App',
            name='test_analytics_create_success',
            description='Test application',
            launch_url='https://test.com',
            is_active=True
        )
        session.add(app)
        session.commit()

        # Test data
        payload = {
            'user_auth_guid': 'test-user-guid-123',
            'app_name': 'test_analytics_create_success'
        }

        # Make request
        response = client.post(
            '/api/eao-analytics',
            json=payload,
            headers=auth_header
        )

        assert response.status_code == HTTPStatus.OK
        data = response.get_json()
        assert data['user_auth_guid'] == 'test-user-guid-123'
        assert data['app_id'] == app.id
        assert 'last_login_time' in data

    def test_create_analytics_missing_fields(self, client, session, auth_header):  # noqa: ARG002
        """Test creation with missing required fields."""
        payload = {
            'user_auth_guid': 'test-user-guid-123'
            # Missing app_name
        }

        response = client.post(
            '/api/eao-analytics',
            json=payload,
            headers=auth_header
        )

        assert response.status_code == HTTPStatus.BAD_REQUEST
        data = response.get_json()
        assert 'message' in data
        # EaoAnalyticsCreateSchema marks app_name as required, so schema-level validation
        # (marshmallow) rejects this before the service's own "Missing required fields"
        # check is ever reached - the response message reflects that validation error.
        assert 'app_name' in str(data['message'])

    def test_create_analytics_app_not_found(self, client, session, auth_header):  # noqa: ARG002
        """Test creation with non-existent app_name."""
        payload = {
            'user_auth_guid': 'test-user-guid-123',
            'app_name': 'non_existent_app'
        }

        response = client.post(
            '/api/eao-analytics',
            json=payload,
            headers=auth_header
        )

        assert response.status_code == HTTPStatus.NOT_FOUND
        data = response.get_json()
        assert 'not found' in data['message'].lower()

    def test_update_existing_analytics(self, client, session, auth_header):
        """Test updating existing analytics record."""
        # Create test application
        app = Application(
            title='Test App',
            name='test_analytics_update_existing',
            description='Test',
            launch_url='https://test.com',
            is_active=True
        )
        session.add(app)
        session.commit()

        user_guid = 'test-user-update'

        # Create initial record
        analytics1 = EaoAnalytics.record_login(
            user_auth_guid=user_guid,
            app_id=app.id
        )
        session.commit()
        initial_time = analytics1.last_login_time

        # Small delay to ensure time difference
        import time
        time.sleep(0.1)

        # Update record
        payload = {
            'user_auth_guid': user_guid,
            'app_name': 'test_analytics_update_existing'
        }
        response = client.post(
            '/api/eao-analytics',
            json=payload,
            headers=auth_header
        )

        assert response.status_code == HTTPStatus.OK
        data = response.get_json()
        # Should have same user_auth_guid
        assert data['user_auth_guid'] == user_guid
        # Should update last_login_time (check that it's different)
        updated_analytics = EaoAnalytics.get_user_analytics(user_guid)
        assert updated_analytics.last_login_time > initial_time

    def test_get_analytics_all(self, session):
        """Test getting all analytics records without filters."""
        # Create test applications
        app1 = Application(
            title='Test App 1',
            name='test_analytics_get_all_1',
            description='Test',
            launch_url='https://test.com',
            is_active=True
        )
        app2 = Application(
            title='Test App 2',
            name='test_analytics_get_all_2',
            description='Test',
            launch_url='https://test.com',
            is_active=True
        )
        session.add(app1)
        session.add(app2)
        session.commit()

        # Create analytics records
        EaoAnalytics.record_login(user_auth_guid='user1', app_id=app1.id)
        EaoAnalytics.record_login(user_auth_guid='user2', app_id=app2.id)
        session.commit()

        # Test service method directly
        analytics = EaoAnalyticsService.get_analytics()

        assert isinstance(analytics, list)
        assert len(analytics) >= 2

    def test_get_analytics_by_user_auth_guid(self, session):
        """Test getting analytics filtered by user_auth_guid."""
        # Create test application
        app = Application(
            title='Test App',
            name='test_analytics_by_user_guid',
            description='Test',
            launch_url='https://test.com',
            is_active=True
        )
        session.add(app)
        session.commit()

        user_guid = 'test-user-filter'
        # Create analytics records for different users
        EaoAnalytics.record_login(user_auth_guid=user_guid, app_id=app.id)
        EaoAnalytics.record_login(user_auth_guid='other-user', app_id=app.id)
        session.commit()

        # Test service method directly
        analytics = EaoAnalyticsService.get_analytics(user_auth_guid=user_guid)

        assert isinstance(analytics, list)
        assert len(analytics) == 1
        assert analytics[0].user_auth_guid == user_guid

    def test_get_analytics_by_app_name(self, session):
        """Test getting analytics filtered by app_name."""
        # Create test applications. Names must be unique (not already seeded by migrations,
        # e.g. 'epic_submit') - EaoAnalyticsService.get_analytics filters by
        # Application.query.filter_by(name=...).first(), which would otherwise resolve to
        # whichever row (seeded or test-created) the DB happens to return first, not
        # necessarily the one this test just created and recorded a login against.
        app1 = Application(
            title='Test App 1',
            name='test_analytics_by_app_name_1',
            description='Test',
            launch_url='https://test.com',
            is_active=True
        )
        app2 = Application(
            title='Test App 2',
            name='test_analytics_by_app_name_2',
            description='Test',
            launch_url='https://test.com',
            is_active=True
        )
        session.add(app1)
        session.add(app2)
        session.commit()

        # Create analytics records for different apps
        EaoAnalytics.record_login(user_auth_guid='user1', app_id=app1.id)
        EaoAnalytics.record_login(user_auth_guid='user2', app_id=app2.id)
        session.commit()

        # Test service method directly
        analytics = EaoAnalyticsService.get_analytics(app_name='test_analytics_by_app_name_1')

        assert isinstance(analytics, list)
        assert len(analytics) == 1
        assert analytics[0].app_id == app1.id

    def test_get_analytics_by_user_and_app(self, session):
        """Test getting analytics filtered by both user_auth_guid and app_name."""
        # Create test applications (unique names - see test_get_analytics_by_app_name).
        app1 = Application(
            title='Test App 1',
            name='test_analytics_combined_1',
            description='Test',
            launch_url='https://test.com',
            is_active=True
        )
        app2 = Application(
            title='Test App 2',
            name='test_analytics_combined_2',
            description='Test',
            launch_url='https://test.com',
            is_active=True
        )
        session.add(app1)
        session.add(app2)
        session.commit()

        user_guid = 'test-user-combined'
        # Create analytics records
        EaoAnalytics.record_login(user_auth_guid=user_guid, app_id=app1.id)
        EaoAnalytics.record_login(user_auth_guid=user_guid, app_id=app2.id)
        EaoAnalytics.record_login(user_auth_guid='other-user', app_id=app1.id)
        session.commit()

        # Test service method directly
        analytics = EaoAnalyticsService.get_analytics(
            user_auth_guid=user_guid,
            app_name='test_analytics_combined_1'
        )

        assert isinstance(analytics, list)
        assert len(analytics) == 1
        assert analytics[0].user_auth_guid == user_guid
        assert analytics[0].app_id == app1.id

    def test_get_analytics_app_name_not_found(self, session):
        """Test getting analytics with non-existent app_name returns empty list."""
        # Test service method directly
        analytics = EaoAnalyticsService.get_analytics(app_name='non_existent_app')

        assert isinstance(analytics, list)
        assert len(analytics) == 0
