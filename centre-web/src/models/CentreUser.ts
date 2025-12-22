import { KCGroup } from "./KCGroup";

export type CentreUserApp = {
  name: string;
  role: string | null;
  group_name: string | null;
  supportsGranularRoleManagement?: boolean;
  group_path: string | null;
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
