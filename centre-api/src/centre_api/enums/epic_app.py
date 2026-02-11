"""App configuration - single source of truth for EPIC apps.

Values loaded from env (see config.py, sample.env).
"""
import json
import os
from collections import defaultdict


def _env(key: str) -> str:
    return os.getenv(key) or ''


def _env_list(key: str) -> list:
    """Env value as JSON array. e.g. ["ADMIN","REVIEWER"] -> ['ADMIN','REVIEWER']."""
    val = _env(key)
    if not val:
        return []
    try:
        parsed = json.loads(val)
        return list(parsed) if isinstance(parsed, list) else [str(parsed)]
    except json.JSONDecodeError:
        return [s.strip() for s in val.split(',') if s.strip()]


# -----------------------------------------------------------------------------
# EPIC_APP_CONFIG: dict keyed by constant name. app_name = key.lower()
# Per-app env: {APP}_SUBGROUP_ADMINS, {APP}_SUBGROUP_EMAILS, {APP}_ADMIN_ROLES (JSON array)
# -----------------------------------------------------------------------------

_CFG = {
    'CONDITION_REPOSITORY': {
        'client_name': _env('EPIC_APP_CLIENT_CONDITION_REPOSITORY'),
        'group': _env('EPIC_GROUP_CONDITION_REPO'),
        'admin_groups': _env_list('CONDITION_REPOSITORY_SUBGROUP_ADMINS'),
        'email_groups': _env_list('CONDITION_REPOSITORY_SUBGROUP_EMAILS'),
        'admin_roles': _env_list('CONDITION_REPOSITORY_ADMIN_ROLES'),
        'launch_url': _env('CONDITION_REPOSITORY_LAUNCH_URL'),
        'management_url': _env('CONDITION_REPOSITORY_USER_MANAGEMENT_URL'),
    },
    'EPIC_COMPLIANCE': {
        'client_name': _env('EPIC_APP_CLIENT_EPIC_COMPLIANCE'),
        'group': _env('EPIC_GROUP_COMPLIANCE'),
        'admin_groups': _env_list('EPIC_COMPLIANCE_SUBGROUP_ADMINS'),
        'email_groups': _env_list('EPIC_COMPLIANCE_SUBGROUP_EMAILS'),
        'admin_roles': _env_list('EPIC_COMPLIANCE_ADMIN_ROLES'),
        'launch_url': _env('EPIC_COMPLIANCE_LAUNCH_URL'),
        'management_url': _env('EPIC_COMPLIANCE_USER_MANAGEMENT_URL'),
    },
    'EPIC_TRACK': {
        'client_name': _env('EPIC_APP_CLIENT_EPIC_TRACK'),
        'group': _env('EPIC_GROUP_TRACK'),
        'admin_groups': _env_list('EPIC_TRACK_SUBGROUP_ADMINS'),
        'email_groups': _env_list('EPIC_TRACK_SUBGROUP_EMAILS'),
        'admin_roles': _env_list('EPIC_TRACK_ADMIN_ROLES'),
        'launch_url': _env('EPIC_TRACK_LAUNCH_URL'),
        'management_url': _env('EPIC_TRACK_USER_MANAGEMENT_URL'),
    },
    'EPIC_PUBLIC': {
        'client_name': _env('EPIC_APP_CLIENT_EPIC_PUBLIC'),
        'group': _env('EPIC_GROUP_PUBLIC'),
        'admin_groups': _env_list('EPIC_PUBLIC_SUBGROUP_ADMINS'),
        'email_groups': _env_list('EPIC_PUBLIC_SUBGROUP_EMAILS'),
        'admin_roles': _env_list('EPIC_PUBLIC_ADMIN_ROLES'),  # uses realm role 'inspector' in token_info
        'launch_url': _env('EPIC_PUBLIC_LAUNCH_URL'),
        'management_url': _env('EPIC_PUBLIC_USER_MANAGEMENT_URL'),
    },
    'EPIC_SUBMIT': {
        'client_name': _env('EPIC_APP_CLIENT_EPIC_SUBMIT'),
        'group': _env('EPIC_GROUP_SUBMIT'),
        'admin_groups': _env_list('EPIC_SUBMIT_SUBGROUP_ADMINS'),
        'email_groups': _env_list('EPIC_SUBMIT_SUBGROUP_EMAILS'),
        'admin_roles': _env_list('EPIC_SUBMIT_ADMIN_ROLES'),
        'launch_url': _env('EPIC_SUBMIT_LAUNCH_URL'),
        'management_url': _env('EPIC_SUBMIT_USER_MANAGEMENT_URL'),
    },
    'EPIC_ENGAGE': {
        'client_name': _env('EPIC_APP_CLIENT_EPIC_ENGAGE'),
        'group': _env('EPIC_GROUP_ENGAGE'),
        'admin_groups': _env_list('EPIC_ENGAGE_SUBGROUP_ADMINS'),
        'email_groups': _env_list('EPIC_ENGAGE_SUBGROUP_EMAILS'),
        'admin_roles': _env_list('EPIC_ENGAGE_ADMIN_ROLES'),
        'launch_url': _env('EPIC_ENGAGE_LAUNCH_URL'),
        'management_url': _env('EPIC_ENGAGE_USER_MANAGEMENT_URL'),
    },
    'EPIC_CENTRE': {
        'client_name': _env('EPIC_APP_CLIENT_EPIC_CENTRE'),
        'group': _env('EPIC_GROUP_CENTRE'),
        'admin_groups': _env_list('EPIC_CENTRE_SUBGROUP_ADMINS'),
        'email_groups': _env_list('EPIC_CENTRE_SUBGROUP_EMAILS'),
        'admin_roles': _env_list('EPIC_CENTRE_ADMIN_ROLES'),
        'launch_url': _env('EPIC_CENTRE_LAUNCH_URL'),
        'management_url': _env('EPIC_CENTRE_USER_MANAGEMENT_URL'),
    },
    'DOCUMENT_SEARCH': {
        'client_name': None, 'group': None, 'admin_groups': [], 'email_groups': [], 'admin_roles': [],
        'launch_url': _env('DOCUMENT_SEARCH_LAUNCH_URL'),
        'management_url': _env('DOCUMENT_SEARCH_USER_MANAGEMENT_URL'),
    },
    'INTRANET': {
        'client_name': None, 'group': None, 'admin_groups': [], 'email_groups': [], 'admin_roles': [],
        'launch_url': _env('INTRANET_LAUNCH_URL'),
        'management_url': _env('INTRANET_USER_MANAGEMENT_URL'),
    },
}

# Flatten to list with app_name; filter to apps with group for maps
EPIC_APP_CONFIG = [{**v, 'app_name': k.lower()} for k, v in _CFG.items()]
_WITH_GROUP = [
    c for c in EPIC_APP_CONFIG
    if c.get('group') and c.get('client_name') and c.get('admin_groups')
]

# App name constants (from _CFG keys)
for _k in _CFG:
    globals()[_k] = _k.lower()

# O(1) lookup
APP_NAME_TO_CONFIG = {c['app_name']: c for c in EPIC_APP_CONFIG}

# URL maps (from _CFG)
APP_LAUNCH_URLS = {c['app_name']: c['launch_url'] for c in EPIC_APP_CONFIG}
APP_USER_MANAGEMENT_URLS = {c['app_name']: c['management_url'] for c in EPIC_APP_CONFIG}


def get_email_groups_for_app(app_name: str) -> list:
    """Groups whose members receive access request notifications."""
    cfg = APP_NAME_TO_CONFIG.get(app_name)
    return list(cfg['email_groups']) if cfg else []


# Derived maps
CLIENT_NAME_TO_APP_NAME_MAP = defaultdict(lambda: None, {c['client_name']: c['app_name'] for c in _WITH_GROUP})
APP_NAME_TO_CLIENT_NAME_MAP = {c['app_name']: c['client_name'] for c in _WITH_GROUP}
EPIC_CLIENT_TO__ADMIN_GROUPS_PATHS = {
    c['client_name']: [f"{c['group']}/{sg}" for sg in c['admin_groups']]
    for c in _WITH_GROUP
}
ALL_ADMIN_GROUP_PATHS = {
    path for paths in EPIC_CLIENT_TO__ADMIN_GROUPS_PATHS.values() for path in paths
}
GROUP_MAP = {c['group']: c['admin_groups'] for c in _WITH_GROUP}
APP_NAME_TO_GROUP_MAP = {c['app_name']: c['group'] for c in _WITH_GROUP}
GROUP_TO_APP_NAME_MAP = {c['group']: c['app_name'] for c in _WITH_GROUP}
CLIENT_APP_NAME_TO_ADMIN_ROLES_MAP = {c['client_name']: c['admin_roles'] for c in _WITH_GROUP}

ALL_APP_NAMES = [c['app_name'] for c in EPIC_APP_CONFIG]
EPIC_CENTRE_CLIENT_NAME = APP_NAME_TO_CLIENT_NAME_MAP.get(EPIC_CENTRE)
EPIC_PUBLIC_CLIENT_NAME = APP_NAME_TO_CLIENT_NAME_MAP.get(EPIC_PUBLIC)
