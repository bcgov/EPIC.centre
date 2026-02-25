export type Bookmark = {
  label: string;
  url: string;
};

export type UserEpicAppData = {
  user_auth_guid: string;
  access_level: string | null; // e.g. "Super User", "Viewer", null if no access yet
  last_accessed: string | null; // ISO datetime
  custom_order: number | null; // position in launchpad, null = default
  bookmarks: Bookmark[];
  sort_order: number;
};

export type EpicApp = {
  id: number;
  name: string;
  title: string;
  description: string;
  launch_url: string;
  is_active: boolean;
  user: UserEpicAppData;
  is_public: boolean;
};

export enum EpicAppName {
  CONDITION_REPOSITORY = "condition_repository",
  EPIC_COMPLIANCE = "epic_compliance",
  DOCUMENT_SEARCH = "document_search",
  EPIC_TRACK = "epic_track",
  EPIC_PUBLIC = "epic_public",
  EPIC_SUBMIT = "epic_submit",
  EPIC_ENGAGE = "epic_engage",
  EPIC_CENTRE = "epic_centre",
  INTRANET = "intranet",
}

/** All EPIC app names for use in filters (e.g. All Users application dropdown). */
export const ALL_EPIC_APP_NAMES: string[] = Object.values(EpicAppName);

/** EPIC app names shown in the Centre All Users application filter dropdown. */
export const ALL_USERS_FILTER_APP_NAMES: string[] = [
  EpicAppName.CONDITION_REPOSITORY,
  EpicAppName.EPIC_CENTRE,
  EpicAppName.EPIC_COMPLIANCE,
  EpicAppName.EPIC_ENGAGE,
  EpicAppName.EPIC_PUBLIC,
  EpicAppName.EPIC_SUBMIT,
  EpicAppName.EPIC_TRACK,
];

/** Access level option for filter dropdown (group_path must match user.apps[].group_path from API). */
export type AppAccessLevelOption = { group_path: string; name: string };

/**
 * Static map of app name → access levels for the All Users filter dropdown.
 * Eliminates API delay; group_path values must match Keycloak/API (paths are normalized when comparing).
 * Add or update entries here if new roles are added in Keycloak.
 */
export const APP_ACCESS_LEVELS: Readonly<Record<string, AppAccessLevelOption[]>> = {
  [EpicAppName.CONDITION_REPOSITORY]: [
    { group_path: "CONDITION-REPO/ADMIN", name: "Admin" },
  ],
  [EpicAppName.EPIC_CENTRE]: [
    { group_path: "CENTRE/SUPER_USER", name: "Super User" },
    { group_path: "CENTRE/ADMIN", name: "Admin" },
  ],
  [EpicAppName.EPIC_COMPLIANCE]: [
    { group_path: "COMPLIANCE/SUPERUSER", name: "Super User" },
    { group_path: "COMPLIANCE/VIEWER", name: "Viewer" },
  ],
  [EpicAppName.EPIC_ENGAGE]: [
    { group_path: "ENGAGE/INSTANCE_ADMIN", name: "Super User" },
    { group_path: "ENGAGE/EAO_IT_ADMIN", name: "Admin" },
    { group_path: "ENGAGE/VIEWER", name: "Viewer" },
  ],
  [EpicAppName.EPIC_PUBLIC]: [
    { group_path: "PUBLIC/INSTANCE_ADMIN", name: "Instance Admin" },
    { group_path: "PUBLIC/STAFF", name: "Staff" },
  ],
  [EpicAppName.EPIC_SUBMIT]: [
    { group_path: "SUBMIT/EAO_MANAGER", name: "Manager" },
    { group_path: "SUBMIT/VIEWER", name: "Viewer" },
  ],
  [EpicAppName.EPIC_TRACK]: [
    { group_path: "TRACK/SUPER_USER", name: "Super User" },
    { group_path: "TRACK/INSTANCE_ADMIN", name: "Admin" },
    { group_path: "TRACK/VIEWER", name: "Viewer" },
  ],
};

export enum EpicAppClientName {
  CONDITION_REPOSITORY = "epic-condition",
  EPIC_COMPLIANCE = "epic-compliance",
  EPIC_TRACK = "epictrack-web",
  EPIC_PUBLIC = "epic-public",
  EPIC_SUBMIT = "epic-submit",
  EPIC_ENGAGE = "epic-engage",
  EPIC_CENTRE = "epic-centre",
  DOCUMENT_SEARCH = "",
}

/**
 * Bi-directional mappings between canonical EpicAppName and client-facing EpicAppClientName.
 * Use toClientName / toEpicAppName helpers for safe conversions.
 */
export const EPIC_APP_NAME_TO_CLIENT_NAME: Readonly<
  Record<EpicAppName, EpicAppClientName>
> = {
  [EpicAppName.CONDITION_REPOSITORY]: EpicAppClientName.CONDITION_REPOSITORY,
  [EpicAppName.EPIC_COMPLIANCE]: EpicAppClientName.EPIC_COMPLIANCE,
  [EpicAppName.DOCUMENT_SEARCH]:
    EpicAppClientName.DOCUMENT_SEARCH ?? ("" as any), // preserve shape if missing
  [EpicAppName.EPIC_TRACK]: EpicAppClientName.EPIC_TRACK,
  [EpicAppName.EPIC_PUBLIC]: EpicAppClientName.EPIC_PUBLIC,
  [EpicAppName.EPIC_SUBMIT]: EpicAppClientName.EPIC_SUBMIT,
  [EpicAppName.EPIC_ENGAGE]: EpicAppClientName.EPIC_ENGAGE,
  [EpicAppName.EPIC_CENTRE]: EpicAppClientName.EPIC_CENTRE,
  [EpicAppName.INTRANET]: EpicAppClientName.EPIC_PUBLIC,
};

/**
 * Reverse mapping derived from EPIC_APP_NAME_TO_CLIENT_NAME.
 */
export const EPIC_APP_CLIENT_NAME_TO_NAME: Readonly<
  Record<EpicAppClientName, EpicAppName>
> = Object.freeze(
  Object.keys(EPIC_APP_NAME_TO_CLIENT_NAME).reduce(
    (acc, key) => {
      const name = key as EpicAppName;
      const client = EPIC_APP_NAME_TO_CLIENT_NAME[name];
      if (client) {
        (acc as any)[client] = name;
      }
      return acc;
    },
    {} as Record<EpicAppClientName, EpicAppName>,
  ),
);

/** Convert canonical name -> client name (always defined) */
export const toClientName = (name: EpicAppName): EpicAppClientName =>
  EPIC_APP_NAME_TO_CLIENT_NAME[name];

/** Convert client name -> canonical name (may be undefined if unknown) */
export const toEpicAppName = (
  client: EpicAppClientName,
): EpicAppName | undefined => EPIC_APP_CLIENT_NAME_TO_NAME[client];

export enum RequestAccessStatus {
  ACCESSED = "accessed",
  PENDING = "pending",
  NOT_REQUESTED = "not_requested",
}

export type RequestAccessCatalog = {
  id: number;
  name: string;
  title: string;
  description: string;
  is_active: boolean;
  status: RequestAccessStatus;
  user: Partial<UserEpicAppData>;
};
