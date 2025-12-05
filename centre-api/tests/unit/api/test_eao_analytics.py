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
from unittest.mock import patch

from centre_api.models.applications import Application
from centre_api.models.eao_analytics import EaoAnalytics


class TestEaoAnalyticsAPI:
    """Test suite for EAO Analytics endpoints."""

    @patch('centre_api.resources.eao_analytics.auth.require')
    def test_create_analytics_success(self, mock_auth, client, session):
        """Test successful creation of analytics record."""
        # Create a test application first
        app = Application(
            title='Test App',
            name='epic_submit',
            description='Test application',
            launch_url='https://test.com',
            is_active=True
        )
        session.add(app)
        session.commit()

        # Test data
        payload = {
            'user_auth_guid': 'test-user-guid-123',
            'app_name': 'epic_submit'
        }

        # Make request
        response = client.post(
            '/api/eao-analytics',
            json=payload,
            headers={'Authorization': 'Bearer test-token'}
        )

        assert response.status_code == HTTPStatus.OK
        data = response.get_json()
        assert data['user_auth_guid'] == 'test-user-guid-123'
        assert data['app_id'] == app.id
        assert 'last_login_time' in data

    @patch('centre_api.resources.eao_analytics.auth.require')
    def test_create_analytics_missing_fields(self, mock_auth, client):
        """Test creation with missing required fields."""
        payload = {
            'user_auth_guid': 'test-user-guid-123'
            # Missing app_name
        }

        response = client.post(
            '/api/eao-analytics',
            json=payload,
            headers={'Authorization': 'Bearer test-token'}
        )

        assert response.status_code == HTTPStatus.BAD_REQUEST
        data = response.get_json()
        assert 'message' in data
        assert 'Missing required fields' in data['message']

    @patch('centre_api.resources.eao_analytics.auth.require')
    def test_create_analytics_app_not_found(self, mock_auth, client):
        """Test creation with non-existent app_name."""
        payload = {
            'user_auth_guid': 'test-user-guid-123',
            'app_name': 'non_existent_app'
        }

        response = client.post(
            '/api/eao-analytics',
            json=payload,
            headers={'Authorization': 'Bearer test-token'}
        )

        assert response.status_code == HTTPStatus.NOT_FOUND
        data = response.get_json()
        assert 'not found' in data['message'].lower()

    @patch('centre_api.resources.eao_analytics.auth.require')
    def test_get_all_analytics(self, mock_auth, client, session):
        """Test getting all analytics records."""
        # Create test data
        app = Application(
            title='Test App',
            name='epic_submit',
            description='Test',
            launch_url='https://test.com',
            is_active=True
        )
        session.add(app)
        session.commit()

        # Create analytics record
        EaoAnalytics.record_login(
            user_auth_guid='test-user-1',
            app_id=app.id
        )
        session.commit()

        response = client.get(
            '/api/eao-analytics',
            headers={'Authorization': 'Bearer test-token'}
        )

        assert response.status_code == HTTPStatus.OK
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @patch('centre_api.resources.eao_analytics.auth.require')
    def test_get_user_analytics(self, mock_auth, client, session):
        """Test getting analytics for specific user."""
        # Create test data
        app = Application(
            title='Test App',
            name='epic_submit',
            description='Test',
            launch_url='https://test.com',
            is_active=True
        )
        session.add(app)
        session.commit()

        user_guid = 'test-user-specific'
        EaoAnalytics.record_login(
            user_auth_guid=user_guid,
            app_id=app.id
        )
        session.commit()

        response = client.get(
            f'/api/eao-analytics/{user_guid}',
            headers={'Authorization': 'Bearer test-token'}
        )

        assert response.status_code == HTTPStatus.OK
        data = response.get_json()
        assert data['user_auth_guid'] == user_guid

    @patch('centre_api.resources.eao_analytics.auth.require')
    def test_get_user_analytics_not_found(self, mock_auth, client):
        """Test getting analytics for non-existent user."""
        response = client.get(
            '/api/eao-analytics/non-existent-user',
            headers={'Authorization': 'Bearer test-token'}
        )

        assert response.status_code == HTTPStatus.NOT_FOUND

    @patch('centre_api.resources.eao_analytics.auth.require')
    def test_update_existing_analytics(self, mock_auth, client, session):
        """Test updating existing analytics record."""
        # Create test application
        app = Application(
            title='Test App',
            name='epic_submit',
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
            'app_name': 'epic_submit'
        }
        response = client.post(
            '/api/eao-analytics',
            json=payload,
            headers={'Authorization': 'Bearer test-token'}
        )

        assert response.status_code == HTTPStatus.OK
        data = response.get_json()
        # Should have same user_auth_guid
        assert data['user_auth_guid'] == user_guid
        # Should update last_login_time (check that it's different)
        updated_analytics = EaoAnalytics.get_user_analytics(user_guid)
        assert updated_analytics.last_login_time > initial_time
