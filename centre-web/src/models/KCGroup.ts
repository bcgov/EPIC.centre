import { EpicAppName } from "./EpicApp";

export type KCGroup = {
  id: string;
  name: string;
  path: string;
  level: number;
  display_name: string;
};

export const EPIC_ADMIN_GROUPS = {
  [EpicAppName.CONDITION_REPOSITORY]: "ADMIN",
  [EpicAppName.EPIC_COMPLIANCE]: "SUPERUSER",
  [EpicAppName.EPIC_SUBMIT]: "EAO_MANAGER",
  [EpicAppName.EPIC_TRACK]: "INSTANCE_ADMIN",
};
