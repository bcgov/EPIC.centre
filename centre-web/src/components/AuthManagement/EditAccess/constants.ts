export const GROUP_PATHS = {
  ENGAGE_TEAM_MEMBER: "/ENGAGE/EAO_TEAM_MEMBER",
  TRACK_VIEWER: "/TRACK/VIEWER",
} as const;

export const ACTION_TYPES = {
  REVOKE: "revoke",
  DENY: "deny",
} as const;

export const ACCESS_LEVEL_WARNINGS = {
  [GROUP_PATHS.ENGAGE_TEAM_MEMBER]: {
    title: "Please Note:",
    mainMessage:
      "When you click the \"Confirm\" button, this user will be added as a Team Member in EPIC.engage.",
    additionalInfo:
      "To assign this user to some engagements, please go to the User Management section in EPIC.engage by clicking the \"App User Management\" link.",
  },
  [GROUP_PATHS.TRACK_VIEWER]: {
    title: "Please Note:",
    mainMessage:
      "When you click the \"Confirm\" button, this user will be added as a Viewer in EPIC.track.",
    additionalInfo:
      "To assign this user as Team Member in specific Works, please go to the User Management section in EPIC.track by clicking the \"App User Management\" link.",
  },
} as const;

export const MODAL_OPTIONS = {
  REVOKE: {
    label: "Revoke Access",
    value: ACTION_TYPES.REVOKE,
  },
  DENY: {
    label: "Deny Access Request",
    value: ACTION_TYPES.DENY,
  },
} as const;
