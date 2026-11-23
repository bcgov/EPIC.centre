// App Constants should go here

/** Max lengths from centre-api's schemas; keep them in step. */
export const MAX_LENGTH = Object.freeze({
  BOOKMARK_LABEL: 100,
  BOOKMARK_URL: 2048,
  APP_NAME: 100,
  ENVIRONMENT: 50,
  APP_URL: 500,
  TICKET_REFERENCE: 50,
});

/**
 * Admin roles that grant access to EPIC.auth for each Epic application
 * Maps client names to their respective admin role names
 */
export const EPIC_ADMIN_ROLES: Record<string, string[]> = {
  "epic-centre": ["manage_auth", "manage_users"],
  "epictrack-web": ["manage_users"],
  "epic-engage": ["create_admin_user"],
  "epic-compliance": ["super_user"],
  "epic-condition": [""],
  "epic-submit": ["extended_eao_edit"],
  "epic-public": ["inspector"],
};
