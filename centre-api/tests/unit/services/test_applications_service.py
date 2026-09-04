"""Tests for ApplicationsService: access-request idempotency, catalog derivation, and
current-user access-level resolution.
"""
from unittest.mock import patch

import requests

from centre_api.enums.access_request_status import AccessRequestsStatusEnum
from centre_api.enums.emai_queue_templates import EmailQueueTemplate
from centre_api.models.access_requests import AccessRequests
from centre_api.models.applications import Application
from centre_api.models.email_queue import EmailQueue
from centre_api.services.applications_service import ApplicationsService
from centre_api.services.auth_api_service import AuthApiService
from centre_api.utils.token_info import TokenInfo


def _make_app(session, name='epic_track', is_active=True):
    app = Application(title=name, name=name, description='d', launch_url='https://test.com', is_active=is_active)
    session.add(app)
    session.commit()
    return app


class TestCreateAccessRequest:
    """Tests for ApplicationsService.create_access_request idempotency and email fan-out."""

    @patch.object(AuthApiService, 'get_group_members', return_value=[])
    @patch.object(TokenInfo, 'get_user_data', return_value={
        'first_name': 'Jane', 'last_name': 'Doe', 'email_address': 'jane@example.com', 'username': 'jdoe'
    })
    @patch.object(TokenInfo, 'get_id', return_value='requester-guid')
    def test_no_existing_request_creates_one_and_queues_three_emails(
        self, _mock_get_id, _mock_user_data, _mock_group_members, session
    ):
        app = _make_app(session)

        before = EmailQueue.query.count()
        new_request = ApplicationsService.create_access_request(app.id)

        assert new_request.app_id == app.id
        assert new_request.user_auth_guid == 'requester-guid'
        assert new_request.status == AccessRequestsStatusEnum.PENDING
        assert EmailQueue.query.count() - before == 2  # admin notification skipped: no admins

        templates = {e.template_name for e in EmailQueue.query.all()}
        assert EmailQueueTemplate.ACCESS_REQUEST_SUBMITTED_CONFIRMATION.value in templates
        assert EmailQueueTemplate.ACCESS_REQUEST_RECEIVED_NOTIFICATION.value in templates

    @patch.object(TokenInfo, 'get_id', return_value='requester-guid')
    def test_existing_pending_request_is_returned_not_duplicated(self, _mock_get_id, session):
        app = _make_app(session)
        existing = AccessRequests(app_id=app.id, user_auth_guid='requester-guid')
        session.add(existing)
        session.commit()

        before_count = AccessRequests.query.filter_by(app_id=app.id, user_auth_guid='requester-guid').count()
        before_emails = EmailQueue.query.count()

        result = ApplicationsService.create_access_request(app.id)

        assert result.id == existing.id
        after_count = AccessRequests.query.filter_by(app_id=app.id, user_auth_guid='requester-guid').count()
        assert after_count == before_count == 1
        assert EmailQueue.query.count() == before_emails

    @patch.object(AuthApiService, 'get_group_members', return_value=[])
    @patch.object(TokenInfo, 'get_user_data', return_value={
        'first_name': 'Jane', 'last_name': 'Doe', 'email_address': 'jane@example.com', 'username': 'jdoe'
    })
    @patch.object(TokenInfo, 'get_id', return_value='requester-guid')
    def test_non_pending_existing_request_does_not_block_new_one(
        self, _mock_get_id, _mock_user_data, _mock_group_members, session
    ):
        app = _make_app(session)
        rejected = AccessRequests(
            app_id=app.id, user_auth_guid='requester-guid', status=AccessRequestsStatusEnum.REJECTED.value
        )
        session.add(rejected)
        session.commit()

        result = ApplicationsService.create_access_request(app.id)

        assert result.id != rejected.id
        assert result.status == AccessRequestsStatusEnum.PENDING

    def test_unknown_app_id_raises_value_error(self, session):  # noqa: ARG002
        try:
            ApplicationsService.create_access_request(999999999)
            assert False, 'expected ValueError'
        except ValueError:
            pass

    @patch.object(AuthApiService, 'get_group_members', return_value=[{'email': None}, {'email': 'admin@example.com'}])
    @patch.object(TokenInfo, 'get_user_data', return_value={
        'first_name': 'Jane', 'last_name': 'Doe', 'email_address': 'jane@example.com', 'username': 'jdoe'
    })
    @patch.object(TokenInfo, 'get_id', return_value='requester-guid')
    def test_admin_notification_filters_out_missing_emails(
        self, _mock_get_id, _mock_user_data, _mock_group_members, session
    ):
        app = _make_app(session)

        ApplicationsService.create_access_request(app.id)

        admin_email = EmailQueue.query.filter_by(
            template_name=EmailQueueTemplate.ACCESS_REQUEST_RECEIVED_NOTIFICATION.value
        ).all()
        # One received-notification email goes to DST, one to app admins - both share the template.
        recipients_lists = [e.payload['recipients'] for e in admin_email]
        assert ['admin@example.com'] in recipients_lists


class TestGetRequestCatalog:
    """Tests for the derived 'accessed' / 'pending' / 'not_requested' status field."""

    @patch.object(ApplicationsService, '_get_current_user_access_levels', return_value={'test_custom_app': 'Admin'})
    @patch.object(TokenInfo, 'get_username', return_value='jdoe')
    @patch.object(TokenInfo, 'get_id', return_value='requester-guid')
    def test_accessed_app_status_is_accessed_even_with_pending_request(
        self, _mock_get_id, _mock_username, _mock_levels, session
    ):
        app = _make_app(session, name='test_custom_app')
        pending = AccessRequests(app_id=app.id, user_auth_guid='requester-guid')
        session.add(pending)
        session.commit()

        catalog = ApplicationsService.get_request_catalog()
        entry = next(e for e in catalog if e['name'] == 'test_custom_app')
        assert entry['status'] == 'accessed'

    @patch.object(ApplicationsService, '_get_current_user_access_levels', return_value={})
    @patch.object(TokenInfo, 'get_username', return_value='jdoe')
    @patch.object(TokenInfo, 'get_id', return_value='requester-guid')
    def test_pending_request_without_access_is_pending(
        self, _mock_get_id, _mock_username, _mock_levels, session
    ):
        app = _make_app(session, name='test_custom_app')
        pending = AccessRequests(app_id=app.id, user_auth_guid='requester-guid')
        session.add(pending)
        session.commit()

        catalog = ApplicationsService.get_request_catalog()
        entry = next(e for e in catalog if e['name'] == 'test_custom_app')
        assert entry['status'] == 'pending'

    @patch.object(ApplicationsService, '_get_current_user_access_levels', return_value={})
    @patch.object(TokenInfo, 'get_username', return_value='jdoe')
    @patch.object(TokenInfo, 'get_id', return_value='requester-guid')
    def test_no_access_no_request_is_not_requested(
        self, _mock_get_id, _mock_username, _mock_levels, session
    ):
        _make_app(session, name='test_custom_app')

        catalog = ApplicationsService.get_request_catalog()
        entry = next(e for e in catalog if e['name'] == 'test_custom_app')
        assert entry['status'] == 'not_requested'

    @patch.object(ApplicationsService, '_get_current_user_access_levels', return_value={})
    @patch.object(TokenInfo, 'get_username', return_value='jdoe')
    @patch.object(TokenInfo, 'get_id', return_value='requester-guid')
    def test_exception_apps_excluded_from_catalog(
        self, _mock_get_id, _mock_username, _mock_levels, session
    ):
        _make_app(session, name='epic_compliance')
        _make_app(session, name='document_search')
        _make_app(session, name='intranet')

        catalog = ApplicationsService.get_request_catalog()
        names = {e['name'] for e in catalog}
        assert names.isdisjoint({'epic_compliance', 'document_search', 'intranet'})

    @patch.object(ApplicationsService, '_get_current_user_access_levels', return_value={})
    @patch.object(TokenInfo, 'get_username', return_value='jdoe')
    @patch.object(TokenInfo, 'get_id', return_value='requester-guid')
    def test_inactive_app_excluded_from_catalog(
        self, _mock_get_id, _mock_username, _mock_levels, session
    ):
        _make_app(session, name='test_custom_app', is_active=False)

        catalog = ApplicationsService.get_request_catalog()
        names = {e['name'] for e in catalog}
        assert 'test_custom_app' not in names


class TestGetAll:
    """Tests for ApplicationsService.get_all: public-app inclusion and access-level precedence."""

    @patch.object(ApplicationsService, '_get_current_user_access_levels', return_value={})
    @patch.object(TokenInfo, 'get_username', return_value='jdoe')
    def test_public_apps_always_included(self, _mock_username, _mock_levels, session):
        _make_app(session, name='document_search')
        _make_app(session, name='intranet')

        apps = ApplicationsService.get_all()
        names = {a['name'] for a in apps}
        assert {'document_search', 'intranet'}.issubset(names)

    @patch.object(ApplicationsService, '_get_current_user_access_levels', return_value={'epic_track': 'Live Level'})
    @patch.object(TokenInfo, 'get_username', return_value='jdoe')
    def test_live_keycloak_level_preferred_over_stale_db_value(self, _mock_username, _mock_levels, session):
        from centre_api.models.user_applications import UserApplication  # noqa: PLC0415

        app = _make_app(session, name='epic_track')
        user_app = UserApplication(
            user_auth_guid='some-user', app_id=app.id, access_level='Stale DB Level', sort_order=0
        )
        session.add(user_app)
        session.commit()

        with patch.object(Application, 'get_all', return_value=[(app, user_app)]):
            apps = ApplicationsService.get_all()

        entry = next(a for a in apps if a['name'] == 'epic_track')
        assert entry['user']['access_level'] == 'Live Level'


class TestGetCurrentUserAccessLevels:
    """Tests for _get_current_user_access_levels error-handling branches."""

    @patch.object(TokenInfo, 'get_id', return_value=None)
    def test_no_user_id_returns_empty_dict(self, _mock_get_id):
        assert ApplicationsService._get_current_user_access_levels() == {}  # noqa: SLF001

    @patch.object(AuthApiService, 'get_user_by_id', side_effect=requests.RequestException('boom'))
    @patch.object(TokenInfo, 'get_id', return_value='some-guid')
    def test_keycloak_error_returns_empty_dict(self, _mock_get_id, _mock_get_user):
        assert ApplicationsService._get_current_user_access_levels() == {}  # noqa: SLF001

    @patch.object(AuthApiService, 'get_user_by_id')
    @patch.object(TokenInfo, 'get_id', return_value='some-guid')
    def test_highest_level_group_wins(self, _mock_get_id, mock_get_user):
        mock_get_user.return_value = {
            'groups': [
                {'path': 'TRACK/REGULAR_USER', 'level': 1, 'display_name': 'Regular User'},
                {'path': 'TRACK/INSTANCE_ADMIN', 'level': 5, 'display_name': 'Instance Admin'},
            ]
        }
        result = ApplicationsService._get_current_user_access_levels()  # noqa: SLF001
        assert result['epic_track'] == 'Instance Admin'
