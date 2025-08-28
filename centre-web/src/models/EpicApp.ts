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
}
