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
  description: string;
  launch_url: string;
  is_active: boolean;
  user: UserEpicAppData;
};
