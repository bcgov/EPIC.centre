import { EpicAppClientName, EpicAppName } from "@/models/EpicApp";
import { KCGroup } from "@/models/KCGroup";

/**
 * Partial map of Epic app client name to admin group path. Values are fetched
 * from the backend so group configuration has one source of truth.
 */
export type AdminGroupPathsMap = Partial<Record<EpicAppClientName, string>>;

/**
 * Map app names to client names for admin group lookups
 */
const EPIC_APP_NAME_TO_CLIENT_NAME: Record<EpicAppName, EpicAppClientName> = {
  [EpicAppName.EPIC_CENTRE]: EpicAppClientName.EPIC_CENTRE,
  [EpicAppName.EPIC_TRACK]: EpicAppClientName.EPIC_TRACK,
  [EpicAppName.EPIC_COMPLIANCE]: EpicAppClientName.EPIC_COMPLIANCE,
  [EpicAppName.EPIC_ENGAGE]: EpicAppClientName.EPIC_ENGAGE,
  [EpicAppName.EPIC_SUBMIT]: EpicAppClientName.EPIC_SUBMIT,
  [EpicAppName.CONDITION_REPOSITORY]: EpicAppClientName.CONDITION_REPOSITORY,
  [EpicAppName.EPIC_PUBLIC]: EpicAppClientName.EPIC_PUBLIC,
  [EpicAppName.DOCUMENT_SEARCH]: EpicAppClientName.DOCUMENT_SEARCH,
  [EpicAppName.INTRANET]: EpicAppClientName.EPIC_PUBLIC, // Map to public for now
};

/**
 * Normalize a group path by removing leading slash
 * @param path - Group path potentially with leading slash (e.g., "/CENTRE/SUPER_USER")
 * @returns Normalized path without leading slash (e.g., "CENTRE/SUPER_USER")
 */
export const normalizeGroupPath = (path: string): string => {
  return path.startsWith("/") ? path.substring(1) : path;
};

/**
 * Check if user has a specific admin group
 * @param groups - User's KCGroup array
 * @param adminGroupPath - The admin group path to check (without leading slash)
 * @returns boolean indicating membership
 */
export const hasAdminGroup = (
  groups: KCGroup[] | undefined,
  adminGroupPath: string
): boolean => {
  if (!groups || !adminGroupPath) return false;

  return groups.some(
    (group) => normalizeGroupPath(group.path) === adminGroupPath
  );
};

/**
 * Check if user is admin of any Epic application
 * @param groups - User's KCGroup array
 * @param adminGroupPaths - Backend-provided map of client names to group paths
 * @returns boolean indicating if user has any admin privileges
 */
export const isAdminOfAnyApp = (
  groups: KCGroup[] | undefined,
  adminGroupPaths: AdminGroupPathsMap,
): boolean => {
  if (!groups) return false;

  const adminPaths = Object.values(adminGroupPaths).filter(
    (path): path is string => !!path,
  );

  return groups.some((group) =>
    adminPaths.includes(normalizeGroupPath(group.path))
  );
};

/**
 * Check if user is admin of a specific app
 * @param groups - User's KCGroup array
 * @param appName - The EpicAppName to check
 * @param adminGroupPaths - Backend-provided map of client names to group paths
 * @returns boolean indicating if user is admin of the app
 */
export const isAdminOfApp = (
  groups: KCGroup[] | undefined,
  appName: EpicAppName,
  adminGroupPaths: AdminGroupPathsMap,
): boolean => {
  if (!groups) return false;

  const clientName = EPIC_APP_NAME_TO_CLIENT_NAME[appName];
  const adminGroupPath = adminGroupPaths[clientName];

  if (!adminGroupPath) return false;

  return hasAdminGroup(groups, adminGroupPath);
};

/**
 * Get admin status for all Epic applications
 * @param groups - User's KCGroup array
 * @param adminGroupPaths - Backend-provided map of client names to group paths
 * @returns Record mapping each app to admin status
 */
export const getAdminStatusPerApp = (
  groups: KCGroup[] | undefined,
  adminGroupPaths: AdminGroupPathsMap,
): Record<EpicAppName, boolean> => {
  const result: Record<EpicAppName, boolean> = {
    [EpicAppName.EPIC_CENTRE]: false,
    [EpicAppName.EPIC_TRACK]: false,
    [EpicAppName.EPIC_COMPLIANCE]: false,
    [EpicAppName.EPIC_ENGAGE]: false,
    [EpicAppName.EPIC_SUBMIT]: false,
    [EpicAppName.CONDITION_REPOSITORY]: false,
    [EpicAppName.EPIC_PUBLIC]: false,
    [EpicAppName.DOCUMENT_SEARCH]: false,
    [EpicAppName.INTRANET]: false,
  };

  if (!groups) return result;

  (Object.keys(result) as EpicAppName[]).forEach((appName) => {
    result[appName] = isAdminOfApp(groups, appName, adminGroupPaths);
  });

  return result;
};
