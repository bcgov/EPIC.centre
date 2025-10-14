import { getUserRolesFromToken } from "@/components/Shared/PermissionGate/utils";
import { jwtDecode } from "jwt-decode";
import { EPIC_ADMIN_ROLES } from "./constants";

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
    console.error("Error decoding token for groups:", error);
    return [];
  }
};

/**
 * Get resource_access from JWT token
 * @param accessToken - The user's access token
 * @returns resource_access object containing roles for each client
 */
export const getResourceAccessFromToken = (accessToken?: string): Record<string, { roles: string[] }> => {
  if (!accessToken) return {};
  
  try {
    const tokenData: any = jwtDecode(accessToken);
    return tokenData?.resource_access || {};
  } catch (error) {
    console.error("Error decoding token for resource_access:", error);
    return {};
  }
};

/**
 * Check if a user has admin role in any Epic application
 * Checks resource_access for each client to see if user has admin roles
 * @param accessToken - The user's access token
 * @returns boolean indicating if user has admin role in any Epic app
 */
export const hasAdminRoleInAnyApp = (accessToken?: string): boolean => {
  if (!accessToken) return false;
  
  const resourceAccess = getResourceAccessFromToken(accessToken);
  
  // Check each Epic client for admin roles
  for (const [clientName, adminRoles] of Object.entries(EPIC_ADMIN_ROLES)) {
    const clientRoles = resourceAccess[clientName]?.roles || [];
    
    // If user has any admin role for this client, grant access
    if (adminRoles.some(adminRole => clientRoles.includes(adminRole))) {
      return true;
    }
  }
  
  return false;
};

/**
 * Check if a user has administrator access to EPIC.auth
 * This checks if the user has admin role in any Epic application
 * @param accessToken - The user's access token
 * @returns boolean indicating if user can access EPIC.auth pages
 */
export const isAdministrator = (accessToken?: string): boolean => {
  return hasAdminRoleInAnyApp(accessToken);
};

/**
 * Check if a user has any of the specified roles
 * @param accessToken - The user's access token
 * @param requiredRoles - Array of required roles
 * @returns boolean indicating if user has at least one of the roles
 */
export const hasAnyRole = (requiredRoles: string[], accessToken?: string): boolean => {
  if (!accessToken || !requiredRoles.length) return false;
  
  const roles = getUserRolesFromToken(accessToken);
  return requiredRoles.some(role => roles.includes(role));
};

