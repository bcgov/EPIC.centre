"""Tests for AccessRequestsService authorization and workflow logic."""
from unittest.mock import patch

from centre_api.enums.access_request_status import AccessRequestsStatusEnum
from centre_api.enums.emai_queue_templates import EmailQueueTemplate
from centre_api.models.access_requests import AccessRequests
from centre_api.models.applications import Application
from centre_api.models.email_queue import EmailQueue
from centre_api.services.access_requests import AccessRequestsService
from centre_api.services.auth_api_service import AuthApiService
from centre_api.utils.token_info import TokenInfo


def _user(paths):
    return {'groups': [{'path': path} for path in paths]}


class TestHasAdminAccessOnApp:
    """Tests for the DST-admin-except-compliance special rule."""

    @patch.object(TokenInfo, 'get_username', return_value='dst_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_dst_admin_can_approve_any_app_except_compliance(self, mock_get_user, _mock_username):
        mock_get_user.return_value = _user(['CENTRE/SUPER_USER'])
        assert AccessRequestsService.has_admin_access_on_app('epic_track') is True

    @patch.object(TokenInfo, 'get_username', return_value='dst_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_dst_admin_without_compliance_admin_currently_can_approve_compliance(self, mock_get_user, _mock_username):
        """Pins a real bug, not the intended rule: `requires_app_admin` in
        AccessRequestsService.has_admin_access_on_app compares the app_name argument
        ('epic_compliance', underscore) against EpicAppClientName.EPIC_COMPLIANCE.value
        ('epic-compliance', hyphen), so the two never match and the compliance-exception
        branch is dead code. A DST admin with no compliance-specific admin role is
        therefore currently able to approve/reject epic_compliance access requests, which
        looks like the opposite of the intended rule. If this is fixed (e.g. by comparing
        against APP_NAME_TO_CLIENT_NAME_MAP.get(app_name) instead), this test should be
        updated to assert False.
        """
        mock_get_user.return_value = _user(['CENTRE/SUPER_USER'])
        assert AccessRequestsService.has_admin_access_on_app('epic_compliance') is True

    @patch.object(TokenInfo, 'get_username', return_value='dst_and_compliance_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_dst_admin_who_is_also_compliance_admin_can_approve_compliance(self, mock_get_user, _mock_username):
        mock_get_user.return_value = _user(['CENTRE/SUPER_USER', 'COMPLIANCE/SUPERUSER'])
        assert AccessRequestsService.has_admin_access_on_app('epic_compliance') is True

    @patch.object(TokenInfo, 'get_username', return_value='track_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_app_specific_admin_without_dst_can_approve_own_app(self, mock_get_user, _mock_username):
        mock_get_user.return_value = _user(['TRACK/INSTANCE_ADMIN'])
        assert AccessRequestsService.has_admin_access_on_app('epic_track') is True

    @patch.object(TokenInfo, 'get_username', return_value='nobody')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_neither_dst_nor_app_admin_cannot_approve(self, mock_get_user, _mock_username):
        mock_get_user.return_value = _user([])
        assert AccessRequestsService.has_admin_access_on_app('epic_track') is False

    @patch.object(TokenInfo, 'get_username', return_value='dst_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_unmapped_app_name_does_not_raise(self, mock_get_user, _mock_username):
        mock_get_user.return_value = _user([])
        assert AccessRequestsService.has_admin_access_on_app('not_a_real_app') is False


class TestProcessAccessRequest:
    """Tests for the pending -> approved/rejected state transition."""

    def _make_app_and_request(self, session, app_name='epic_track'):
        app = Application(
            title='Test App', name=app_name, description='d', launch_url='https://test.com', is_active=True
        )
        session.add(app)
        session.commit()
        access_request = AccessRequests(app_id=app.id, user_auth_guid='requesting-user-guid')
        session.add(access_request)
        session.commit()
        return app, access_request

    def test_not_found_returns_none(self, session):
        assert AccessRequestsService.process_access_request(999999999, AccessRequestsStatusEnum.APPROVED.value) is None

    @patch.object(TokenInfo, 'get_username', return_value='nobody')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_unauthorized_raises_permission_error(self, mock_get_user, _mock_username, session):
        mock_get_user.return_value = _user([])
        _app, access_request = self._make_app_and_request(session)

        try:
            AccessRequestsService.process_access_request(access_request.id, AccessRequestsStatusEnum.APPROVED.value)
            assert False, 'expected PermissionError'
        except PermissionError:
            pass

        unchanged = AccessRequests.query.get(access_request.id)
        assert unchanged.status == AccessRequestsStatusEnum.PENDING

    @patch.object(AuthApiService, 'get_user_by_id')
    @patch.object(TokenInfo, 'get_username', return_value='dst_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_approve_transitions_status_without_email(
        self, mock_get_user, _mock_username, mock_get_user_by_id, session
    ):
        mock_get_user.return_value = _user(['CENTRE/SUPER_USER'])
        mock_get_user_by_id.return_value = {
            'email_address': 'user@example.com', 'first_name': 'A', 'last_name': 'B'
        }
        _app, access_request = self._make_app_and_request(session)

        before_email_count = EmailQueue.query.count()
        result = AccessRequestsService.process_access_request(
            access_request.id, AccessRequestsStatusEnum.APPROVED.value
        )

        assert result['status'] == AccessRequestsStatusEnum.APPROVED.value
        updated = AccessRequests.query.get(access_request.id)
        assert updated.status == AccessRequestsStatusEnum.APPROVED
        assert EmailQueue.query.count() == before_email_count

    @patch.object(AuthApiService, 'get_user_by_id')
    @patch.object(TokenInfo, 'get_username', return_value='dst_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_reject_transitions_status_and_queues_denial_email(
        self, mock_get_user, _mock_username, mock_get_user_by_id, session
    ):
        mock_get_user.return_value = _user(['CENTRE/SUPER_USER'])
        mock_get_user_by_id.return_value = {
            'email_address': 'user@example.com', 'first_name': 'Jane', 'last_name': 'Doe'
        }
        app, access_request = self._make_app_and_request(session)

        result = AccessRequestsService.process_access_request(
            access_request.id, AccessRequestsStatusEnum.REJECTED.value
        )

        assert result['status'] == AccessRequestsStatusEnum.REJECTED.value
        updated = AccessRequests.query.get(access_request.id)
        assert updated.status == AccessRequestsStatusEnum.REJECTED

        queued = EmailQueue.query.filter_by(
            template_name=EmailQueueTemplate.ACCESS_DENIED_NOTIFICATION.value
        ).all()
        assert len(queued) == 1
        assert queued[0].payload['recipients'] == ['user@example.com']
        assert queued[0].payload['user_name'] == 'Jane Doe'
        assert queued[0].payload['application_name'] == app.title
