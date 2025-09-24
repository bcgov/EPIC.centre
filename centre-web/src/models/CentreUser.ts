import { KCGroup } from "./KCGroup";

export type CentreUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  apps: {
    name: string;
    role: string;
  }[];
  enabled: boolean;
  groups: KCGroup[];
};
