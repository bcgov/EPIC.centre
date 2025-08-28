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
