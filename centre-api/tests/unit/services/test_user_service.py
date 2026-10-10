"""Tests for UserService authorization, access-management, and role-resolution logic."""
from unittest.mock import patch

import pytest
import requests

from centre_api.enums.access_request_status import AccessRequestsStatusEnum
from centre_api.enums.emai_queue_templates import EmailQueueTemplate
from centre_api.models.access_requests import AccessRequests
from centre_api.models.applications import Application
from centre_api.models.email_queue import EmailQueue
from centre_api.services.auth_api_service import AuthApiService
from centre_api.services.submit_api_service import SubmitApiService
from centre_api.services.user_service import UserService
from centre_api.utils.token_info import TokenInfo


def _user(paths):
    return {'groups': [{'path': path} for path in paths]}


def _group(path, level, display_name, name=None):
    return {'path': path, 'level': level, 'display_name': display_name, 'name': name or display_name}


class TestHasAdminAccessOnApp:
    """Unlike AccessRequestsService, UserService has no per-app exception for DST admins."""

    @patch.object(TokenInfo, 'get_username', return_value='dst_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_dst_admin_can_manage_any_app_including_compliance(self, mock_get_user, _mock_username):
        mock_get_user.return_value = _user(['CENTRE/SUPER_USER'])
        assert UserService.has_admin_access_on_app('epic_compliance') is True

    @patch.object(TokenInfo, 'get_username', return_value='track_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_app_specific_admin_without_dst_can_manage_own_app(self, mock_get_user, _mock_username):
        mock_get_user.return_value = _user(['TRACK/INSTANCE_ADMIN'])
        assert UserService.has_admin_access_on_app('epic_track') is True

    @patch.object(TokenInfo, 'get_username', return_value='nobody')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_neither_dst_nor_app_admin_cannot_manage(self, mock_get_user, _mock_username):
        mock_get_user.return_value = _user([])
        assert UserService.has_admin_access_on_app('epic_track') is False


class TestRevokeUserAccess:
    """Tests for UserService.revoke_user_access."""

    @patch.object(TokenInfo, 'get_username', return_value='nobody')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_unauthorized_raises_permission_error(self, mock_get_user, _mock_username):
        mock_get_user.return_value = _user([])
        with pytest.raises(PermissionError):
            UserService.revoke_user_access('target_user', {'app_name': 'epic_track'})

    @patch.object(TokenInfo, 'get_username', return_value='dst_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_unknown_app_name_raises_value_error(self, mock_get_user, _mock_username):
        mock_get_user.return_value = _user(['CENTRE/SUPER_USER'])
        with pytest.raises(ValueError):
            UserService.revoke_user_access('target_user', {'app_name': 'not_a_real_app'})

    @patch.object(AuthApiService, 'delete_user_group')
    @patch.object(TokenInfo, 'get_username', return_value='dst_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_valid_authorized_revoke_calls_delete_user_group(
        self, mock_get_user, _mock_username, mock_delete_group
    ):
        mock_get_user.return_value = _user(['CENTRE/SUPER_USER'])
        mock_delete_group.return_value = {'ok': True}

        result = UserService.revoke_user_access('target_user', {'app_name': 'epic_track'})

        mock_delete_group.assert_called_once_with('target_user', 'TRACK', del_sub_group_mappings=True)
        assert result == {'ok': True}


class TestUpdateUserAccess:
    """Tests for UserService.update_user_access, including its epic_submit side effect."""

    @patch.object(TokenInfo, 'get_username', return_value='nobody')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_unauthorized_raises_permission_error(self, mock_get_user, _mock_username):
        mock_get_user.return_value = _user([])
        with pytest.raises(PermissionError):
            UserService.update_user_access('target_user', {'app_name': 'epic_track'})

    @patch.object(SubmitApiService, 'create_staff_user')
    @patch.object(AuthApiService, 'update_user_group', return_value={'ok': True})
    @patch.object(TokenInfo, 'get_username', return_value='dst_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_epic_submit_grant_provisions_staff_user(
        self, mock_get_user, _mock_username, _mock_update_group, mock_create_staff_user
    ):
        # get_user_by_username is called twice: once for the caller's own admin check, and
        # once inside update_user_access to fetch the *target* user's email for provisioning.
        mock_get_user.side_effect = [
            _user(['CENTRE/SUPER_USER']),
            {'email_address': 'staff@example.com'},
        ]

        UserService.update_user_access('target_user', {
            'app_name': 'epic_submit',
            'parent_group_name': 'SUBMIT',
            'group_name': 'EAO_MANAGER',
        })

        mock_create_staff_user.assert_called_once_with('staff@example.com', 'SUBMIT/EAO_MANAGER')

    @patch.object(SubmitApiService, 'create_staff_user')
    @patch.object(AuthApiService, 'update_user_group', return_value={'ok': True})
    @patch.object(TokenInfo, 'get_username', return_value='dst_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_epic_submit_provisioning_error_is_swallowed(
        self, mock_get_user, _mock_username, _mock_update_group, mock_create_staff_user
    ):
        mock_get_user.side_effect = [
            _user(['CENTRE/SUPER_USER']),
            {'email_address': 'staff@example.com'},
        ]
        mock_create_staff_user.side_effect = requests.RequestException('boom')

        # Should not raise even though staff provisioning failed.
        result = UserService.update_user_access('target_user', {
            'app_name': 'epic_submit',
            'parent_group_name': 'SUBMIT',
            'group_name': 'EAO_MANAGER',
        })
        assert result == {'ok': True}

    @patch.object(SubmitApiService, 'create_staff_user')
    @patch.object(AuthApiService, 'update_user_group', return_value={'ok': True})
    @patch.object(TokenInfo, 'get_username', return_value='dst_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_non_submit_app_does_not_provision_staff_user(
        self, mock_get_user, _mock_username, _mock_update_group, mock_create_staff_user
    ):
        mock_get_user.return_value = _user(['CENTRE/SUPER_USER'])

        UserService.update_user_access('target_user', {
            'app_name': 'epic_track',
            'parent_group_name': 'TRACK',
            'group_name': 'INSTANCE_ADMIN',
        })

        mock_create_staff_user.assert_not_called()

    @patch.object(AuthApiService, 'get_group')
    @patch.object(AuthApiService, 'get_user_by_id')
    @patch.object(AuthApiService, 'update_user_group', return_value={'ok': True})
    @patch.object(TokenInfo, 'get_username', return_value='dst_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_access_request_id_present_approves_request_and_queues_email(
        self, mock_get_user, _mock_username, _mock_update_group, mock_get_user_by_id, mock_get_group, session
    ):
        mock_get_user.return_value = _user(['CENTRE/SUPER_USER'])
        mock_get_user_by_id.return_value = {
            'email_address': 'requester@example.com', 'first_name': 'Jane', 'last_name': 'Doe'
        }
        mock_get_group.return_value = {
            'subGroups': [
                {'name': 'INSTANCE_ADMIN', 'attributes': {'display_name': ['Track Admin']}},
            ]
        }

        app = Application(title='Track', name='epic_track', description='d', launch_url='https://t.com',
                          is_active=True)
        session.add(app)
        session.commit()
        access_request = AccessRequests(app_id=app.id, user_auth_guid='requester-guid')
        session.add(access_request)
        session.commit()

        UserService.update_user_access('target_user', {
            'app_name': 'epic_track',
            'parent_group_name': 'TRACK',
            'group_name': 'INSTANCE_ADMIN',
            'access_request_id': access_request.id,
        })

        updated = AccessRequests.query.get(access_request.id)
        assert updated.status == AccessRequestsStatusEnum.APPROVED

        queued = EmailQueue.query.filter_by(
            template_name=EmailQueueTemplate.ACCESS_GRANTED_NOTIFICATION.value
        ).all()
        assert len(queued) == 1
        assert queued[0].payload['recipients'] == ['requester@example.com']
        assert queued[0].payload['access_level'] == 'Track Admin'

    @patch.object(AuthApiService, 'update_user_group', return_value={'ok': True})
    @patch.object(TokenInfo, 'get_username', return_value='dst_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_access_request_id_not_found_is_ignored(
        self, mock_get_user, _mock_username, _mock_update_group, session
    ):
        mock_get_user.return_value = _user(['CENTRE/SUPER_USER'])

        # Should not raise even though the access_request_id doesn't exist.
        result = UserService.update_user_access('target_user', {
            'app_name': 'epic_track',
            'parent_group_name': 'TRACK',
            'group_name': 'INSTANCE_ADMIN',
            'access_request_id': 999999999,
        })
        assert result == {'ok': True}
        assert EmailQueue.query.count() == 0

    @patch.object(AuthApiService, 'update_user_group', return_value={'ok': True})
    @patch.object(TokenInfo, 'get_username', return_value='dst_admin')
    @patch.object(AuthApiService, 'get_user_by_username')
    def test_no_access_request_id_skips_approval_block(
        self, mock_get_user, _mock_username, _mock_update_group, session
    ):
        mock_get_user.return_value = _user(['CENTRE/SUPER_USER'])

        result = UserService.update_user_access('target_user', {
            'app_name': 'epic_track',
            'parent_group_name': 'TRACK',
            'group_name': 'INSTANCE_ADMIN',
        })
        assert result == {'ok': True}
        assert EmailQueue.query.count() == 0


class TestEnrichUserWithApps:
    """Tests for the CENTR-141 role-resolution algorithm."""

    @patch.object(AuthApiService, 'is_admin_of_app', return_value=True)
    def test_higher_level_group_wins_for_same_app(self, _mock_is_admin):
        user = {
            'groups': [
                _group('TRACK/REGULAR_USER', level=1, display_name='Regular User'),
                _group('TRACK/INSTANCE_ADMIN', level=5, display_name='Instance Admin'),
            ]
        }
        result = UserService._enrich_user_with_apps(user, current_user={'groups': []})  # noqa: SLF001

        track_app = next(a for a in result['apps'] if a['name'] == 'epic_track')
        assert track_app['role'] == 'Instance Admin'

    @patch.object(AuthApiService, 'is_admin_of_app', return_value=True)
    def test_one_group_per_app_independent(self, _mock_is_admin):
        user = {
            'groups': [
                _group('TRACK/INSTANCE_ADMIN', level=5, display_name='Track Admin'),
                _group('SUBMIT/EAO_MANAGER', level=5, display_name='Submit Manager'),
            ]
        }
        result = UserService._enrich_user_with_apps(user, current_user={'groups': []})  # noqa: SLF001

        roles_by_app = {a['name']: a['role'] for a in result['apps']}
        assert roles_by_app['epic_track'] == 'Track Admin'
        assert roles_by_app['epic_submit'] == 'Submit Manager'

    @patch.object(AuthApiService, 'is_admin_of_app', return_value=True)
    def test_unrecognized_group_is_ignored(self, _mock_is_admin):
        user = {'groups': [_group('SOME_EXTERNAL_GROUP/ROLE', level=5, display_name='External')]}
        result = UserService._enrich_user_with_apps(user, current_user={'groups': []})  # noqa: SLF001

        assert all(a['role'] is None for a in result['apps'])

    @patch.object(AuthApiService, 'is_admin_of_app', return_value=True)
    def test_apps_with_no_group_are_backfilled_as_none(self, _mock_is_admin):
        user = {'groups': []}
        result = UserService._enrich_user_with_apps(user, current_user={'groups': []})  # noqa: SLF001

        assert len(result['apps']) > 0
        assert all(a['role'] is None and a['group_name'] is None and a['group_path'] is None
                   for a in result['apps'])

    def test_dst_admin_bypasses_per_app_filter(self):
        user = {'groups': [_group('TRACK/INSTANCE_ADMIN', level=5, display_name='Track Admin')]}

        def fake_is_admin_of_app(current_user, client_name):  # noqa: ARG001
            from centre_api.enums.epic_app import EpicAppClientName  # noqa: PLC0415
            # DST-admin (CENTRE) check returns True; every per-app check returns False,
            # so the app should only appear if the DST bypass actually short-circuits the filter.
            return client_name == EpicAppClientName.EPIC_CENTRE.value

        with patch.object(AuthApiService, 'is_admin_of_app', side_effect=fake_is_admin_of_app):
            result = UserService._enrich_user_with_apps(  # noqa: SLF001
                user, current_user={'groups': [{'path': 'CENTRE/SUPER_USER'}]}
            )

        app_names = {a['name'] for a in result['apps']}
        assert 'epic_track' in app_names

    def test_non_dst_admin_filters_to_administered_apps_only(self):
        user = {'groups': [
            _group('TRACK/INSTANCE_ADMIN', level=5, display_name='Track Admin'),
            _group('SUBMIT/EAO_MANAGER', level=5, display_name='Submit Manager'),
        ]}

        def fake_is_admin_of_app(current_user, client_name):  # noqa: ARG001
            from centre_api.enums.epic_app import EpicAppClientName  # noqa: PLC0415
            return client_name == EpicAppClientName.EPIC_TRACK.value

        with patch.object(AuthApiService, 'is_admin_of_app', side_effect=fake_is_admin_of_app):
            result = UserService._enrich_user_with_apps(user, current_user={'groups': []})  # noqa: SLF001

        app_names = {a['name'] for a in result['apps']}
        assert 'epic_track' in app_names
        assert 'epic_submit' not in app_names
