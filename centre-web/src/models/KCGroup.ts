import { deepFreeze } from "@/utils/objectUtils";
import { EpicAppName } from "./EpicApp";

export type KCGroup = {
  id: string;
  name: string;
  path: string;
  level: number;
  display_name: string;
};

export const enum EpicGroups {
  COMPLIANCE = "COMPLIANCE",
  CONDITION_REPO = "CONDITION-REPO",
  SUBMIT = "SUBMIT",
  TRACK = "TRACK",
  ENGAGE = "ENGAGE",
  PUBLIC = "PUBLIC",
  CENTRE = "CENTRE",
}

export const EPIC_APP_TO_GROUP = {
  [EpicAppName.EPIC_COMPLIANCE]: EpicGroups.COMPLIANCE,
  [EpicAppName.CONDITION_REPOSITORY]: EpicGroups.CONDITION_REPO,
  [EpicAppName.EPIC_SUBMIT]: EpicGroups.SUBMIT,
  [EpicAppName.EPIC_TRACK]: EpicGroups.TRACK,
  [EpicAppName.EPIC_ENGAGE]: EpicGroups.ENGAGE,
  [EpicAppName.EPIC_PUBLIC]: EpicGroups.PUBLIC,
  [EpicAppName.EPIC_CENTRE]: EpicGroups.CENTRE,
};

const RAW_EPIC_GROUPS = {
  CENTRE: {
    SUPER_USER: {
      name: "SUPER_USER",
      path: "/CENTRE/SUPER_USER",
    },
  },
  COMPLIANCE: {
    ADMIN: {
      name: "ADMIN",
      path: "/COMPLIANCE/ADMIN",
    },
    SUPERUSER: {
      name: "SUPERUSER",
      path: "/COMPLIANCE/SUPERUSER",
    },
    USER: {
      name: "USER",
      path: "/COMPLIANCE/USER",
    },
    VIEWER: {
      name: "VIEWER",
      path: "/COMPLIANCE/VIEWER",
    },
  },
  CONDITION_REPO: {
    INSTANCE_ADMIN: {
      name: "INSTANCE_ADMIN",
      path: "/CONDITION-REPO/INSTANCE_ADMIN",
    },
    SUPER_USER: {
      name: "SUPER_USER",
      path: "/CONDITION-REPO/SUPER_USER",
    },
    STAFF: {
      name: "STAFF",
      path: "/CONDITION-REPO/STAFF",
    },
    DEVELOPER: {
      name: "DEVELOPER",
      path: "/CONDITION-REPO/DEVELOPER",
    },
    VIEWER: {
      name: "VIEWER",
      path: "/CONDITION-REPO/VIEWER",
    },
  },
  ENGAGE: {
    EAO_IT_ADMIN: {
      name: "EAO_IT_ADMIN",
      path: "/ENGAGE/EAO_IT_ADMIN",
    },
    EAO_IT_VIEWER: {
      name: "EAO_IT_VIEWER",
      path: "/ENGAGE/EAO_IT_VIEWER",
    },
    EAO_REVIEWER: {
      name: "EAO_REVIEWER",
      path: "/ENGAGE/EAO_REVIEWER",
    },
    EAO_TEAM_MEMBER: {
      name: "EAO_TEAM_MEMBER",
      path: "/ENGAGE/EAO_TEAM_MEMBER",
    },
    INSTANCE_ADMIN: {
      name: "INSTANCE_ADMIN",
      path: "/ENGAGE/INSTANCE_ADMIN",
    },
  },
  SUBMIT: {
    EAO_MANAGER: {
      name: "EAO_MANAGER",
      path: "/SUBMIT/EAO_MANAGER",
    },
    EAO_STAFF: {
      name: "EAO_STAFF",
      path: "/SUBMIT/EAO_STAFF",
    },
    SYSTEM_ADMIN: {
      name: "SYSTEM_ADMIN",
      path: "/SUBMIT/SYSTEM_ADMIN",
    },
  },
  TRACK: {
    INSTANCE_ADMIN: {
      name: "INSTANCE_ADMIN",
      path: "/TRACK/INSTANCE_ADMIN",
    },
    NO_ROLE: {
      name: "NO_ROLE",
      path: "/TRACK/NO_ROLE",
    },
    SUPER_USER: {
      name: "SUPER_USER",
      path: "/TRACK/SUPER_USER",
    },
    VIEWER: {
      name: "VIEWER",
      path: "/TRACK/VIEWER",
    },
  },
} as const;

export const EPIC_GROUPS = deepFreeze(RAW_EPIC_GROUPS);
