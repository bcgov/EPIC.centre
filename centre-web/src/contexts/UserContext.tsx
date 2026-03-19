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
import {
  isAdminOfAnyApp,
  isAdminOfApp as checkIsAdminOfApp,
  getAdminStatusPerApp as computeAdminStatusPerApp,
  EPIC_CLIENT_TO_ADMIN_GROUP_PATHS,
  hasAdminGroup,
} from "@/utils/adminGroupPaths";
import { getUserRolesFromToken } from "@/utils/axiosUtils";

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
    isError,
    refetch,
  } = useGetUser({
    username: username || "",
    enabled: !!username && auth.isAuthenticated,
  });

  // Compute admin status from user groups
  const isAdmin = useMemo(() => {
    return isAdminOfAnyApp(user?.groups);
  }, [user?.groups]);

  const isDstAdmin = useMemo(() => {
    const dstAdminPath =
      EPIC_CLIENT_TO_ADMIN_GROUP_PATHS[EpicAppClientName.EPIC_CENTRE];
    return hasAdminGroup(user?.groups, dstAdminPath);
  }, [user?.groups]);

  // Memoized function to check admin status for a specific app
  const isAdminOfApp = useCallback(
    (appName: EpicAppName) => {
      return checkIsAdminOfApp(user?.groups, appName);
    },
    [user?.groups],
  );

  // Compute admin status for all apps
  const adminStatusPerApp = useMemo(() => {
    return computeAdminStatusPerApp(user?.groups);
  }, [user?.groups]);

  /**
   * Check if user has the ai search user role
   */
  const token = auth.user?.access_token;
  const parsedRoles = token ? getUserRolesFromToken(token) : [];
  const isAISearchUser = parsedRoles.includes("ai_search_user");
  const canManageApplicationUrls = parsedRoles.includes("edit_app_url");
  const canViewApplicationUrls =
    canManageApplicationUrls || parsedRoles.includes("view_ssl_info");

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isError,
        refetch,
        isAdmin,
        isDstAdmin,
        isAdminOfApp,
        adminStatusPerApp,
        isAISearchUser,
        canViewApplicationUrls,
        canManageApplicationUrls,
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
