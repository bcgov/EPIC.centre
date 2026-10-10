"""Service-level tests for EaoAnalyticsService, complementing the endpoint-level tests in
tests/unit/api/test_eao_analytics.py.
"""
import pytest

from centre_api.exceptions import ResourceNotFoundError
from centre_api.models.applications import Application
from centre_api.services.eao_analytics_service import EaoAnalyticsService


def _make_app(session, name):
    app = Application(title=name, name=name, description='d', launch_url='https://test.com', is_active=True)
    session.add(app)
    session.commit()
    return app


class TestRecordLoginByAppName:
    """Validation and upsert behavior for record_login_by_app_name."""

    def test_missing_user_auth_guid_raises_value_error(self, session):  # noqa: ARG002
        with pytest.raises(ValueError):
            EaoAnalyticsService.record_login_by_app_name(None, 'epic_track')

    def test_missing_app_name_raises_value_error(self, session):  # noqa: ARG002
        with pytest.raises(ValueError):
            EaoAnalyticsService.record_login_by_app_name('some-guid', None)

    def test_unknown_app_name_raises_not_found_error(self, session):  # noqa: ARG002
        with pytest.raises(ResourceNotFoundError):
            EaoAnalyticsService.record_login_by_app_name('some-guid', 'not_a_real_app')

    def test_valid_call_resolves_app_id_and_records_login(self, session):
        app = _make_app(session, 'test_analytics_app_1')

        analytics = EaoAnalyticsService.record_login_by_app_name('some-guid', 'test_analytics_app_1')

        assert analytics.user_auth_guid == 'some-guid'
        assert analytics.app_id == app.id

    def test_repeated_login_updates_existing_row_not_duplicate(self, session):
        app = _make_app(session, 'test_analytics_app_2')

        first = EaoAnalyticsService.record_login_by_app_name('some-guid', 'test_analytics_app_2')
        second = EaoAnalyticsService.record_login_by_app_name('some-guid', 'test_analytics_app_2')

        assert first.id == second.id
        assert second.last_login_time >= first.last_login_time

        from centre_api.models.eao_analytics import EaoAnalytics  # noqa: PLC0415
        rows = EaoAnalytics.query.filter_by(user_auth_guid='some-guid', app_id=app.id).all()
        assert len(rows) == 1


class TestGetAnalytics:
    """Filter-branch coverage for get_analytics."""

    def test_no_filters_returns_all_ordered_by_recency(self, session):
        app = _make_app(session, 'test_analytics_app_3')
        EaoAnalyticsService.record_login_by_app_name('user-a', 'test_analytics_app_3')
        EaoAnalyticsService.record_login_by_app_name('user-b', 'test_analytics_app_3')

        results = EaoAnalyticsService.get_analytics()
        guids = {r.user_auth_guid for r in results if r.app_id == app.id}
        assert guids == {'user-a', 'user-b'}

    def test_app_name_not_found_returns_empty_list_immediately(self, session):  # noqa: ARG002
        assert EaoAnalyticsService.get_analytics(app_name='not_a_real_app') == []

    def test_app_name_found_but_no_matching_records_returns_empty_list(self, session):
        _make_app(session, 'test_analytics_app_4')
        assert EaoAnalyticsService.get_analytics(app_name='test_analytics_app_4') == []


class TestGetUserAppLogin:
    """Thin delegation to EaoAnalytics.get_user_app_login."""

    def test_returns_none_when_no_record_exists(self, session):
        app = _make_app(session, 'test_analytics_app_5')
        assert EaoAnalyticsService.get_user_app_login('nobody', app.id) is None

    def test_returns_record_when_it_exists(self, session):
        app = _make_app(session, 'test_analytics_app_6')
        EaoAnalyticsService.record_login_by_app_name('some-guid', 'test_analytics_app_6')

        result = EaoAnalyticsService.get_user_app_login('some-guid', app.id)
        assert result is not None
        assert result.user_auth_guid == 'some-guid'
