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
  [EpicAppName.EPIC_PUBLIC]: "INSTANCE_ADMIN",
  [EpicAppName.EPIC_ENGAGE]: "INSTANCE_ADMIN",
  [EpicAppName.EPIC_CENTRE]: "INSTANCE_ADMIN",
};

export const enum EpicGroups {
  COMPLIANCE = "COMPLIANCE",
  CONDITION_REPO = "CONDITION-REPO",
  SUBMIT = "SUBMIT",
  TRACK = "TRACK",
  ENGAGE = "ENGAGE",
}

export const EPIC_APP_TO_GROUP = {
  [EpicAppName.EPIC_COMPLIANCE]: EpicGroups.COMPLIANCE,
  [EpicAppName.CONDITION_REPOSITORY]: EpicGroups.CONDITION_REPO,
  [EpicAppName.EPIC_SUBMIT]: EpicGroups.SUBMIT,
  [EpicAppName.EPIC_TRACK]: EpicGroups.TRACK,
  [EpicAppName.EPIC_ENGAGE]: EpicGroups.ENGAGE,
};
