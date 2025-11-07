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
}

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
