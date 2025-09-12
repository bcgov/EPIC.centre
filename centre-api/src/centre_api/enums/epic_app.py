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


class EpicAppClientName(Enum):
    """Enum representing Epic client names."""

    CONDITION_REPOSITORY = 'epic-condition'
    EPIC_COMPLIANCE = 'epic-compliance'
    EPIC_TRACK = 'epictrack-web'
    EPIC_PUBLIC = 'epic-public'
    EPIC_SUBMIT = 'epic-submit'
    EPIC_ENGAGE = 'epic-engage'


CLIENT_NAME_TO_APP_NAME_MAP = {
    EpicAppClientName.CONDITION_REPOSITORY.value: EpicAppName.CONDITION_REPOSITORY.value,
    EpicAppClientName.EPIC_COMPLIANCE.value: EpicAppName.EPIC_COMPLIANCE.value,
    EpicAppClientName.EPIC_TRACK.value: EpicAppName.EPIC_TRACK.value,
    EpicAppClientName.EPIC_PUBLIC.value: EpicAppName.EPIC_PUBLIC.value,
    EpicAppClientName.EPIC_SUBMIT.value: EpicAppName.EPIC_SUBMIT.value,
    EpicAppClientName.EPIC_ENGAGE.value: EpicAppName.EPIC_ENGAGE.value,
}


class EpicGroups(Enum):
    """Enum representing Epic group names."""
    COMPLIANCE = 'COMPLIANCE'
    CONDITION_REPO = 'CONDITION-REPO'
    SUBMIT = 'SUBMIT'
    TRACK = 'TRACK'


class EpicAdminSubGroups(Enum):
    """Enum representing Epic admin subgroup names."""
    ADMIN = 'ADMIN'
    EAO_MANAGER = 'EAO_MANAGER'
    INSTANCE_ADMIN = 'INSTANCE_ADMIN'


GROUP_MAP = {
    EpicGroups.COMPLIANCE.value: EpicAdminSubGroups.ADMIN.value,
    EpicGroups.CONDITION_REPO.value: EpicAdminSubGroups.ADMIN.value,
    EpicGroups.SUBMIT.value: EpicAdminSubGroups.EAO_MANAGER.value,
    EpicGroups.TRACK.value: EpicAdminSubGroups.INSTANCE_ADMIN.value,
}

APP_NAME_TO_GROUP_MAP = {
    EpicAppName.EPIC_COMPLIANCE.value: EpicGroups.COMPLIANCE.value,
    EpicAppName.CONDITION_REPOSITORY.value: EpicGroups.CONDITION_REPO.value,
    EpicAppName.EPIC_SUBMIT.value: EpicGroups.SUBMIT.value,
    EpicAppName.EPIC_TRACK.value: EpicGroups.TRACK.value,
}
