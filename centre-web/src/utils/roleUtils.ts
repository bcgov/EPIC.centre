import { getUserRolesFromToken } from "@/components/Shared/PermissionGate/utils";
import { jwtDecode } from "jwt-decode";
import { EPIC_ADMIN_ROLES } from "./constants";
import {
  EPIC_APP_NAME_TO_CLIENT_NAME,
  EpicAppClientName,
  EpicAppName,
  toEpicAppName,
} from "@/models/EpicApp";

/**
 * Get user groups from JWT token
 * @param accessToken - The user's access token
 * @returns Array of group paths the user belongs to
 */
export const getUserGroupsFromToken = (accessToken?: string): string[] => {
  if (!accessToken) return [];

  try {
    const tokenData: any = jwtDecode(accessToken);
    return tokenData?.groups || [];
  } catch (error) {
    return [];
  }
};

/**
 * Get resource_access from JWT token
 * @param accessToken - The user's access token
 * @returns resource_access object containing roles for each client
 */
export const getResourceAccessFromToken = (
  accessToken?: string,
): Record<string, { roles: string[] }> => {
  if (!accessToken) return {};

  try {
    const tokenData: any = jwtDecode(accessToken);
    return tokenData?.resource_access || {};
  } catch (error) {
    return {};
  }
};

/**
 * Get admin status per Epic application
 * Returns an object with app name keys and boolean values indicating admin status
 * @param accessToken - The user's access token
 * @returns Record<EpicAppName, boolean> mapping each app to whether the user is an admin
 */
export const getAdminStatusPerApp = (
  accessToken?: string,
): Record<EpicAppName, boolean> => {
  // initialize result with canonical app names
  const result: Record<EpicAppName, boolean> = Object.keys(
    EPIC_APP_NAME_TO_CLIENT_NAME,
  ).reduce(
    (acc, name) => {
      acc[name as EpicAppName] = false;
      return acc;
    },
    {} as Record<EpicAppName, boolean>,
  );

  if (!accessToken) return result;

  const resourceAccess = getResourceAccessFromToken(accessToken);

  for (const [clientName, adminRoles] of Object.entries(EPIC_ADMIN_ROLES)) {
    const appName = toEpicAppName(clientName as EpicAppClientName);
    if (!appName) continue;

    const clientRoles = resourceAccess[clientName]?.roles || [];
    result[appName] = adminRoles.some((adminRole) =>
      clientRoles.includes(adminRole),
    );
  }

  return result;
};

/**
 * Check if a user has administrator access to EPIC.auth
 * This checks if the user has admin role in any Epic application
 * @param accessToken - The user's access token
 * @returns boolean indicating if user can access EPIC.auth pages
 */
export const isAdministrator = (accessToken?: string): boolean => {
  return Object.values(getAdminStatusPerApp(accessToken)).some(
    (isAdmin) => isAdmin,
  );
};

/**
 * Check if a user has any of the specified roles
 * @param accessToken - The user's access token
 * @param requiredRoles - Array of required roles
 * @returns boolean indicating if user has at least one of the roles
 */
export const hasAnyRole = (
  requiredRoles: string[],
  accessToken?: string,
): boolean => {
  if (!accessToken || !requiredRoles.length) return false;

  const roles = getUserRolesFromToken(accessToken);
  return requiredRoles.some((role) => roles.includes(role));
};

export const isDSTUser = (accessToken?: string): boolean => {
  const adminStatus = getAdminStatusPerApp(accessToken);
  return adminStatus[EpicAppName.EPIC_CENTRE] || false;
};
