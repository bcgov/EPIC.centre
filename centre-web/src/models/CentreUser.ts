import { KCGroup } from "./KCGroup";

export type CentreUserApp = {
  name: string;
  role: string | null;
  group_name: string | null;
  supportsGranularRoleManagement?: boolean;
  group_path: string | null;
};
// apps and group_paths only come with include_groups
export type CentreUserListItem = {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  apps?: { name: string; group_path: string }[];
  group_paths?: string[];
};
export type CentreUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  apps: CentreUserApp[];
  enabled: boolean;
  groups: KCGroup[];
  attributes?: {
    idir_username?: string[];
  };
};
