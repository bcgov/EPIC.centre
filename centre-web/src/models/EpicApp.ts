export type Bookmark = {
  label: string;
  url: string;
};

export type UserEpicAppData = {
  access_level: string | null; // e.g. "Super User", "Viewer", null if no access yet
  last_accessed: string | null; // ISO datetime
  custom_order: number | null; // position in launchpad, null = default
  bookmarks: Bookmark[];
};

export type EpicApp = {
  app_id: number;
  name: string;
  description: string;
  launch_url: string;
  is_active: boolean;
  user: UserEpicAppData;
};
