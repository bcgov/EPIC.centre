import { EpicAppName } from "@/models/EpicApp";
import { KCGroup } from "@/models/KCGroup";

/** Map app_name -> admin group paths. From backend app-configs API. */
export type AdminGroupPathsConfig = Record<string, string[]>;

/** App config item with at least name and admin_group_paths */
type AppConfigItem = { name: string; admin_group_paths?: string[] };

/**
 * Build admin group paths config from app configs API response.
 * Single source of truth from backend.
 */
export const buildAdminConfigFromAppConfigs = (
  appConfigs: AppConfigItem[]
): AdminGroupPathsConfig => {
  const config: AdminGroupPathsConfig = {};
  for (const app of appConfigs) {
    config[app.name] = app.admin_group_paths ?? [];
  }
  return config;
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
 * Check if user has any of the given admin groups
 * @param groups - User's KCGroup array
 * @param adminGroupPaths - Admin group paths to check (without leading slash)
 * @returns boolean indicating membership
 */
export const hasAnyAdminGroup = (
  groups: KCGroup[] | undefined,
  adminGroupPaths: string[]
): boolean => {
  if (!groups || !adminGroupPaths.length) return false;

  return groups.some((group) =>
    adminGroupPaths.includes(normalizeGroupPath(group.path))
  );
};

/**
 * Check if user is admin of any Epic application
 * @param groups - User's KCGroup array
 * @param adminConfig - Map of app_name -> admin_group_paths (from app-configs API)
 * @returns boolean indicating if user has any admin privileges
 */
export const isAdminOfAnyApp = (
  groups: KCGroup[] | undefined,
  adminConfig: AdminGroupPathsConfig
): boolean => {
  if (!groups) return false;

  const allPaths = new Set(Object.values(adminConfig).flat());
  return groups.some((group) =>
    allPaths.has(normalizeGroupPath(group.path))
  );
};

/**
 * Check if user is admin of a specific app
 * @param groups - User's KCGroup array
 * @param appName - The EpicAppName to check
 * @param adminConfig - Map of app_name -> admin_group_paths (from app-configs API)
 * @returns boolean indicating if user is admin of the app
 */
export const isAdminOfApp = (
  groups: KCGroup[] | undefined,
  appName: EpicAppName,
  adminConfig: AdminGroupPathsConfig
): boolean => {
  if (!groups) return false;

  const adminGroupPaths = adminConfig[appName] ?? [];
  return hasAnyAdminGroup(groups, adminGroupPaths);
};

/**
 * Get admin status for all Epic applications
 * @param groups - User's KCGroup array
 * @param adminConfig - Map of app_name -> admin_group_paths (from app-configs API)
 * @returns Record mapping each app to admin status
 */
export const getAdminStatusPerApp = (
  groups: KCGroup[] | undefined,
  adminConfig: AdminGroupPathsConfig
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
    result[appName] = isAdminOfApp(groups, appName, adminConfig);
  });

  return result;
};
