import { useGetUser } from "@/hooks/api/useUsers";
import { useAppConfigs } from "@/hooks/api/useAppConfigs";
import { CentreUser } from "@/models/CentreUser";
import { EpicAppName } from "@/models/EpicApp";
import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "react-oidc-context";
import {
  buildAdminConfigFromAppConfigs,
  isAdminOfAnyApp,
  isAdminOfApp as checkIsAdminOfApp,
  getAdminStatusPerApp as computeAdminStatusPerApp,
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
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const auth = useAuth();

  // Get username from JWT token
  const username = auth.user?.profile.preferred_username as string | undefined;

  const { data: appConfigs = [] } = useAppConfigs({
    enabled: auth.isAuthenticated ?? false,
  });
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useGetUser({
    username: username || "",
    enabled: !!username && auth.isAuthenticated,
  });

  const adminConfig = useMemo(
    () => buildAdminConfigFromAppConfigs(appConfigs),
    [appConfigs]
  );

  // Compute admin status from user groups (using backend config)
  const isAdmin = useMemo(
    () => isAdminOfAnyApp(user?.groups, adminConfig),
    [user?.groups, adminConfig]
  );

  const isDstAdmin = useMemo(
    () => checkIsAdminOfApp(user?.groups, EpicAppName.EPIC_CENTRE, adminConfig),
    [user?.groups, adminConfig]
  );

  const isAdminOfApp = useCallback(
    (appName: EpicAppName) =>
      checkIsAdminOfApp(user?.groups, appName, adminConfig),
    [user?.groups, adminConfig]
  );

  const adminStatusPerApp = useMemo(
    () => computeAdminStatusPerApp(user?.groups, adminConfig),
    [user?.groups, adminConfig]
  );

  /**
   * Check if user has the ai search user role
   */
  const token = auth.user?.access_token;
  const parsedRoles = token ? getUserRolesFromToken(token) : [];
  const isAISearchUser = parsedRoles.includes("ai_search_user");

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
