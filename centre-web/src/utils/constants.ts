// App Constants should go here

/**
 * Admin roles that grant access to EPIC.auth for each Epic application
 * Maps client names to their respective admin role names
 */
export const EPIC_ADMIN_ROLES: Record<string, string[]> = {
  "epic-centre": ["manage_auth", "manage_users"],
  "epictrack-web": ["manage_users"],
  "epic-engage": ["manage_users"],
  "epic-compliance": ["super_user"],
  "epic-condition": [""],
  "epic-submit": ["extended_eao_edit"],
};
