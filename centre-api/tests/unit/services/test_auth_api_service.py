"""Tests for AuthApiService authorization logic."""
from centre_api.services.auth_api_service import AuthApiService


def _user(paths):
    """Build a minimal Keycloak-shaped user dict with the given group paths."""
    return {'groups': [{'path': path} for path in paths]}


class TestIsAdminOfApp:
    """Tests for AuthApiService.is_admin_of_app."""

    def test_exact_group_path_match_is_admin(self):
        """User in the exact admin group path for the client is an admin."""
        user = _user(['CENTRE/SUPER_USER'])
        assert AuthApiService.is_admin_of_app(user, 'epic-centre') is True

    def test_no_matching_group_is_not_admin(self):
        """User with unrelated groups is not an admin."""
        user = _user(['SOME_OTHER/GROUP'])
        assert AuthApiService.is_admin_of_app(user, 'epic-centre') is False

    def test_unknown_client_name_returns_false(self):
        """A client_name with no configured admin group path returns False."""
        user = _user(['CENTRE/SUPER_USER'])
        assert AuthApiService.is_admin_of_app(user, 'not-a-real-client') is False

    def test_missing_groups_key_returns_false(self):
        """A user dict with no 'groups' key at all is treated as having none."""
        assert AuthApiService.is_admin_of_app({}, 'epic-centre') is False

    def test_admin_of_different_app_is_not_admin_of_this_one(self):
        """Being admin of one app's group does not make you admin of another."""
        user = _user(['TRACK/INSTANCE_ADMIN'])
        assert AuthApiService.is_admin_of_app(user, 'epic-centre') is False

    def test_path_match_is_exact_not_prefix(self):
        """A group path that merely starts with the admin path does not count."""
        user = _user(['CENTRE/SUPER_USER/EXTRA'])
        assert AuthApiService.is_admin_of_app(user, 'epic-centre') is False


class TestIsAdmin:
    """Tests for AuthApiService.is_admin."""

    def test_admin_of_any_configured_app_is_admin(self):
        """Belonging to any app's admin group path makes is_admin True."""
        user = _user(['TRACK/INSTANCE_ADMIN'])
        assert AuthApiService.is_admin(user) is True

    def test_no_admin_groups_is_not_admin(self):
        """Groups that don't match any admin path return False."""
        user = _user(['TRACK/REGULAR_USER'])
        assert AuthApiService.is_admin(user) is False

    def test_empty_groups_is_not_admin(self):
        """No groups at all is never admin."""
        user = _user([])
        assert AuthApiService.is_admin(user) is False


class TestGetAdministeredApps:
    """Tests for AuthApiService.get_administered_apps."""

    def test_single_admin_group_returns_single_app(self):
        """User admin of exactly one app's group gets a single-app list."""
        user = _user(['CENTRE/SUPER_USER'])
        assert AuthApiService.get_administered_apps(user) == ['epic_centre']

    def test_multiple_admin_groups_returns_multiple_apps(self):
        """User admin of multiple apps' groups gets all of them."""
        user = _user(['CENTRE/SUPER_USER', 'TRACK/INSTANCE_ADMIN'])
        result = AuthApiService.get_administered_apps(user)
        assert set(result) == {'epic_centre', 'epic_track'}

    def test_no_admin_groups_returns_empty_list(self):
        """User with no admin groups administers nothing."""
        user = _user(['TRACK/REGULAR_USER'])
        assert AuthApiService.get_administered_apps(user) == []
