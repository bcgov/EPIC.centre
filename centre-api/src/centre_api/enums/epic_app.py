"""Enums for the application."""
from enum import Enum


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


class EpicAppClientName(Enum):
    """Enum representing Epic client names."""

    CONDITION_REPOSITORY = 'epic-condition'
    EPIC_COMPLIANCE = 'epic-compliance'
    EPIC_TRACK = 'epictrack-web'
    EPIC_PUBLIC = 'epic-public'
    EPIC_SUBMIT = 'epic-submit'
    EPIC_ENGAGE = 'epic-engage'
    EPIC_CENTRE = 'epic-centre'


CLIENT_NAME_TO_APP_NAME_MAP = {
    EpicAppClientName.CONDITION_REPOSITORY.value: EpicAppName.CONDITION_REPOSITORY.value,
    EpicAppClientName.EPIC_COMPLIANCE.value: EpicAppName.EPIC_COMPLIANCE.value,
    EpicAppClientName.EPIC_TRACK.value: EpicAppName.EPIC_TRACK.value,
    EpicAppClientName.EPIC_PUBLIC.value: EpicAppName.EPIC_PUBLIC.value,
    EpicAppClientName.EPIC_SUBMIT.value: EpicAppName.EPIC_SUBMIT.value,
    EpicAppClientName.EPIC_ENGAGE.value: EpicAppName.EPIC_ENGAGE.value,
    EpicAppClientName.EPIC_CENTRE.value: EpicAppName.EPIC_CENTRE.value,
}

APP_NAME_TO_CLIENT_NAME_MAP = {
    v: k for k, v in CLIENT_NAME_TO_APP_NAME_MAP.items()
}


class EpicGroups(Enum):
    """Enum representing Epic group names."""

    COMPLIANCE = 'COMPLIANCE'
    CONDITION_REPO = 'CONDITION-REPO'
    SUBMIT = 'SUBMIT'
    TRACK = 'TRACK'
    ENGAGE = 'ENGAGE'
    CENTRE = 'CENTRE'
    PUBLIC = 'PUBLIC'


class EpicAdminSubGroups(Enum):
    """Enum representing Epic admin subgroup names."""

    ADMIN = 'ADMIN'
    EAO_MANAGER = 'EAO_MANAGER'
    INSTANCE_ADMIN = 'INSTANCE_ADMIN'
    SUPERUSER = 'SUPERUSER'
    SUPER_USER = 'SUPER_USER',


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
    'TRACK': 'epic_track',
    'SUBMIT': 'epic_submit',
    'COMPLIANCE': 'epic_compliance',
    'CONDITION-REPO': 'condition_repository',
    'ENGAGE': 'epic_engage',
    'CENTRE': 'epic_centre',
    'PUBLIC': 'epic_public',
}

CLIENT_APP_NAME_TO_ADMIN_ROLES_MAP = {
    EpicAppClientName.EPIC_CENTRE.value: ['manage_auth', 'manage_users'],
    EpicAppClientName.EPIC_TRACK.value: ['manage_users'],
    EpicAppClientName.EPIC_ENGAGE.value: ['create_admin_user'],
    EpicAppClientName.EPIC_COMPLIANCE.value: ['super_user'],
    EpicAppClientName.CONDITION_REPOSITORY.value: [''],
    EpicAppClientName.EPIC_SUBMIT.value: ['manage-users'],
}
