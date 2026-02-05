"""Enums for the application.

EpicGroups, EpicAppClientName, EpicAdminSubGroups, and EpicAdminGroupsPath values
are loaded from environment variables (see config.py and sample.env).
"""
import os
from collections import defaultdict
from enum import Enum


def _env(key: str, default: str) -> str:
    """Read string from environment with default."""
    return os.getenv(key, default)


class EpicAppName(Enum):
    """Enum representing Epic application names."""

    CONDITION_REPOSITORY = 'condition_repository'
    EPIC_COMPLIANCE = 'epic_compliance'
    DOCUMENT_SEARCH = 'document_search'
    EPIC_TRACK = 'epic_track'
    EPIC_PUBLIC = 'epic_public'
    EPIC_SUBMIT = 'epic_submit'
    EPIC_ENGAGE = 'epic_engage'
    EPIC_CENTRE = 'epic_centre'
    INTRANET = 'intranet'


class EpicAppClientName(Enum):
    """Enum representing Epic client names (from env)."""

    CONDITION_REPOSITORY = _env('EPIC_APP_CLIENT_CONDITION_REPOSITORY', 'epic-condition')
    EPIC_COMPLIANCE = _env('EPIC_APP_CLIENT_EPIC_COMPLIANCE', 'epic-compliance')
    EPIC_TRACK = _env('EPIC_APP_CLIENT_EPIC_TRACK', 'epictrack-web')
    EPIC_PUBLIC = _env('EPIC_APP_CLIENT_EPIC_PUBLIC', 'epic-public')
    EPIC_SUBMIT = _env('EPIC_APP_CLIENT_EPIC_SUBMIT', 'epic-submit')
    EPIC_ENGAGE = _env('EPIC_APP_CLIENT_EPIC_ENGAGE', 'epic-engage')
    EPIC_CENTRE = _env('EPIC_APP_CLIENT_EPIC_CENTRE', 'epic-centre')


CLIENT_NAME_TO_APP_NAME_MAP = defaultdict(lambda: None, {
    EpicAppClientName.CONDITION_REPOSITORY.value: EpicAppName.CONDITION_REPOSITORY.value,
    EpicAppClientName.EPIC_COMPLIANCE.value: EpicAppName.EPIC_COMPLIANCE.value,
    EpicAppClientName.EPIC_TRACK.value: EpicAppName.EPIC_TRACK.value,
    EpicAppClientName.EPIC_PUBLIC.value: EpicAppName.EPIC_PUBLIC.value,
    EpicAppClientName.EPIC_SUBMIT.value: EpicAppName.EPIC_SUBMIT.value,
    EpicAppClientName.EPIC_ENGAGE.value: EpicAppName.EPIC_ENGAGE.value,
    EpicAppClientName.EPIC_CENTRE.value: EpicAppName.EPIC_CENTRE.value,
})

APP_NAME_TO_CLIENT_NAME_MAP = {
    v: k for k, v in CLIENT_NAME_TO_APP_NAME_MAP.items()
}


class EpicGroups(Enum):
    """Enum representing Epic group names (from env)."""

    COMPLIANCE = _env('EPIC_GROUP_COMPLIANCE', 'COMPLIANCE')
    CONDITION_REPO = _env('EPIC_GROUP_CONDITION_REPO', 'CONDITION-REPO')
    SUBMIT = _env('EPIC_GROUP_SUBMIT', 'SUBMIT')
    TRACK = _env('EPIC_GROUP_TRACK', 'TRACK')
    ENGAGE = _env('EPIC_GROUP_ENGAGE', 'ENGAGE')
    CENTRE = _env('EPIC_GROUP_CENTRE', 'CENTRE')
    PUBLIC = _env('EPIC_GROUP_PUBLIC', 'PUBLIC')


class EpicAdminSubGroups(Enum):
    """Enum representing Epic admin subgroup names (from env)."""

    ADMIN = _env('EPIC_ADMIN_SUBGROUP_ADMIN', 'ADMIN')
    EAO_MANAGER = _env('EPIC_ADMIN_SUBGROUP_EAO_MANAGER', 'EAO_MANAGER')
    INSTANCE_ADMIN = _env('EPIC_ADMIN_SUBGROUP_INSTANCE_ADMIN', 'INSTANCE_ADMIN')
    SUPERUSER = _env('EPIC_ADMIN_SUBGROUP_SUPERUSER', 'SUPERUSER')
    SUPER_USER = _env('EPIC_ADMIN_SUBGROUP_SUPER_USER', 'SUPER_USER')


class EpicAdminGroupsPath(Enum):
    """Enum representing Epic admin group paths (from env)."""

    COMPLIANCE = _env('EPIC_ADMIN_GROUP_PATH_COMPLIANCE', 'COMPLIANCE/SUPERUSER')
    CONDITION_REPO = _env('EPIC_ADMIN_GROUP_PATH_CONDITION_REPO', 'CONDITION-REPO/ADMIN')
    SUBMIT = _env('EPIC_ADMIN_GROUP_PATH_SUBMIT', 'SUBMIT/EAO_MANAGER')
    TRACK = _env('EPIC_ADMIN_GROUP_PATH_TRACK', 'TRACK/INSTANCE_ADMIN')
    ENGAGE = _env('EPIC_ADMIN_GROUP_PATH_ENGAGE', 'ENGAGE/INSTANCE_ADMIN')
    CENTRE = _env('EPIC_ADMIN_GROUP_PATH_CENTRE', 'CENTRE/SUPER_USER')
    PUBLIC = _env('EPIC_ADMIN_GROUP_PATH_PUBLIC', 'PUBLIC/ADMIN')


EPIC_CLIENT_TO__ADMIN_GROUPS_PATHS = {
    EpicAppClientName.EPIC_COMPLIANCE.value: EpicAdminGroupsPath.COMPLIANCE.value,
    EpicAppClientName.CONDITION_REPOSITORY.value: EpicAdminGroupsPath.CONDITION_REPO.value,
    EpicAppClientName.EPIC_SUBMIT.value: EpicAdminGroupsPath.SUBMIT.value,
    EpicAppClientName.EPIC_TRACK.value: EpicAdminGroupsPath.TRACK.value,
    EpicAppClientName.EPIC_ENGAGE.value: EpicAdminGroupsPath.ENGAGE.value,
    EpicAppClientName.EPIC_CENTRE.value: EpicAdminGroupsPath.CENTRE.value,
    EpicAppClientName.EPIC_PUBLIC.value: EpicAdminGroupsPath.PUBLIC.value,
}

EPIC_ADMIN_GROUPS_PATHS_TO_CLIENT = defaultdict(lambda: None, {
    v: k for k, v in EPIC_CLIENT_TO__ADMIN_GROUPS_PATHS.items()
})


GROUP_MAP = {
    EpicGroups.COMPLIANCE.value: EpicAdminSubGroups.SUPERUSER.value,
    EpicGroups.CONDITION_REPO.value: EpicAdminSubGroups.ADMIN.value,
    EpicGroups.SUBMIT.value: EpicAdminSubGroups.EAO_MANAGER.value,
    EpicGroups.TRACK.value: EpicAdminSubGroups.INSTANCE_ADMIN.value,
    EpicGroups.ENGAGE.value: EpicAdminSubGroups.INSTANCE_ADMIN.value,
    EpicGroups.CENTRE.value: EpicAdminSubGroups.SUPER_USER.value,
    EpicGroups.PUBLIC.value: EpicAdminSubGroups.ADMIN.value,
}

APP_NAME_TO_GROUP_MAP = {
    EpicAppName.EPIC_COMPLIANCE.value: EpicGroups.COMPLIANCE.value,
    EpicAppName.CONDITION_REPOSITORY.value: EpicGroups.CONDITION_REPO.value,
    EpicAppName.EPIC_SUBMIT.value: EpicGroups.SUBMIT.value,
    EpicAppName.EPIC_TRACK.value: EpicGroups.TRACK.value,
    EpicAppName.EPIC_ENGAGE.value: EpicGroups.ENGAGE.value,
    EpicAppName.EPIC_CENTRE.value: EpicGroups.CENTRE.value,
    EpicAppName.EPIC_PUBLIC.value: EpicGroups.PUBLIC.value,
}

CONDITION_REPOSITORY = 'condition_repository'
EPIC_COMPLIANCE = 'epic_compliance'
DOCUMENT_SEARCH = 'document_search'
EPIC_TRACK = 'epic_track'
EPIC_PUBLIC = 'epic_public'
EPIC_SUBMIT = 'epic_submit'
EPIC_ENGAGE = 'epic_engage'

GROUP_TO_APP_NAME_MAP = {
    EpicGroups.TRACK.value: 'epic_track',
    EpicGroups.SUBMIT.value: 'epic_submit',
    EpicGroups.COMPLIANCE.value: 'epic_compliance',
    EpicGroups.CONDITION_REPO.value: 'condition_repository',
    EpicGroups.ENGAGE.value: 'epic_engage',
    EpicGroups.CENTRE.value: 'epic_centre',
    EpicGroups.PUBLIC.value: 'epic_public',
}

CLIENT_APP_NAME_TO_ADMIN_ROLES_MAP = {
    EpicAppClientName.EPIC_CENTRE.value: ['manage_auth', 'manage_users'],
    EpicAppClientName.EPIC_TRACK.value: ['manage_users'],
    EpicAppClientName.EPIC_ENGAGE.value: ['create_admin_user'],
    EpicAppClientName.EPIC_COMPLIANCE.value: ['super_user'],
    EpicAppClientName.CONDITION_REPOSITORY.value: [''],
    EpicAppClientName.EPIC_SUBMIT.value: ['manage-users'],
}
