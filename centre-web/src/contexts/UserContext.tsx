import { CentreUser } from "@/models/CentreUser";
import { EpicAppClientName, EpicAppName } from "@/models/EpicApp";
import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "react-oidc-context";
import { useGetUser } from "@/hooks/api/useUsers";
import { useGetAdminGroupPaths } from "@/hooks/api/useAdminConfig";
import {
  isAdminOfAnyApp,
  isAdminOfApp as checkIsAdminOfApp,
  getAdminStatusPerApp as computeAdminStatusPerApp,
  hasAdminGroup,
  type AdminGroupPathsMap,
} from "@/utils/adminGroupPaths";
import { getUserRolesFromToken } from "@/utils/axiosUtils";
import { getResourceAccessFromToken } from "@/utils/roleUtils";

interface UserContextValue {
  user: CentreUser | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  // Admin checks based on fresh user groups
  isAdmin: boolean;
  isDstAdmin: boolean;
  isAdminOfApp: (appName: EpicAppName) => boolean;
  adminStatusPerApp: Record<EpicAppName, boolean>;
  isAISearchUser: boolean;
  canViewApplicationUrls: boolean;
  canManageApplicationUrls: boolean;
  canViewMap: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const auth = useAuth();

  // Get username from JWT token
  const username = auth.user?.profile.preferred_username as string | undefined;

  const {
    data: user,
    isLoading,
    isLoadingError: userLoadingError,
    refetch,
  } = useGetUser({
    username: username || "",
    enabled: !!username && auth.isAuthenticated,
  });

  // Admin group paths are sourced from the backend so changes only need to
  // happen there. Until the fetch resolves we use an empty map, which makes the
  // admin checks report no privileges rather than relying on hardcoded values
  // that could be stale and grant incorrect admin access.
  const {
    data: fetchedAdminGroupPaths,
    isLoading: adminGroupPathsLoading,
    isLoadingError: adminGroupPathsError,
    refetch: refetchAdminGroupPaths,
  } = useGetAdminGroupPaths();
  const adminGroupPaths = useMemo<AdminGroupPathsMap>(
    () => fetchedAdminGroupPaths ?? {},
    [fetchedAdminGroupPaths],
  );

  // Compute admin status from user groups
  const isAdmin = useMemo(() => {
    return isAdminOfAnyApp(user?.groups, adminGroupPaths);
  }, [user?.groups, adminGroupPaths]);

  const isDstAdmin = useMemo(() => {
    const dstAdminPath = adminGroupPaths[EpicAppClientName.EPIC_CENTRE];
    if (!dstAdminPath) return false;
    return hasAdminGroup(user?.groups, dstAdminPath);
  }, [user?.groups, adminGroupPaths]);

  // Memoized function to check admin status for a specific app
  const isAdminOfApp = useCallback(
    (appName: EpicAppName) => {
      return checkIsAdminOfApp(user?.groups, appName, adminGroupPaths);
    },
    [user?.groups, adminGroupPaths],
  );

  // Compute admin status for all apps
  const adminStatusPerApp = useMemo(() => {
    return computeAdminStatusPerApp(user?.groups, adminGroupPaths);
  }, [user?.groups, adminGroupPaths]);

  /**
   * Check if user has the ai search user role
   */
  const token = auth.user?.access_token;
  const parsedRoles = token ? getUserRolesFromToken(token) : [];
  const isAISearchUser = parsedRoles.includes("ai_search_user");
  const canManageApplicationUrls = parsedRoles.includes("edit_app_url");
  const canViewApplicationUrls =
    canManageApplicationUrls || parsedRoles.includes("view_ssl_info");

  // The map is for EPIC.track users who have the `view` client role.
  const trackRoles =
    getResourceAccessFromToken(token)[EpicAppClientName.EPIC_TRACK]?.roles ||
    [];
  const canViewMap = trackRoles.includes("view");

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading: isLoading || adminGroupPathsLoading,
        isError: userLoadingError || adminGroupPathsError,
        refetch: () => {
          void refetch();
          void refetchAdminGroupPaths();
        },
        isAdmin,
        isDstAdmin,
        isAdminOfApp,
        adminStatusPerApp,
        isAISearchUser,
        canViewApplicationUrls,
        canManageApplicationUrls,
        canViewMap,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

/**
 * Hook to access the current authenticated user's data
 * @throws Error if used outside of UserProvider
 * @returns UserContextValue containing user data and loading states
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useCurrentUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useCurrentUser must be used within a UserProvider");
  }
  return context;
};
