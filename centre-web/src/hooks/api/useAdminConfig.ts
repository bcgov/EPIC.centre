import { centreRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";
import { QUERY_KEY } from "./constants";
import type { AdminGroupPathsMap } from "@/utils/adminGroupPaths";

const getAdminGroupPaths = () => {
  return centreRequest<AdminGroupPathsMap>({
    url: `admin-config/group-paths`,
  });
};

/**
 * Fetch the admin group paths exposed by the backend. These replace the
 * previously hardcoded frontend values so changes only need to happen in the
 * backend configuration.
 *
 * Wait for authentication before calling the IDIR-protected endpoint. The
 * request reads the OIDC token from session storage, populated by the callback.
 */
export const useGetAdminGroupPaths = () => {
  const auth = useAuth();

  return useQuery({
    queryKey: [QUERY_KEY.ADMIN_GROUP_PATHS],
    queryFn: getAdminGroupPaths,
    staleTime: Infinity,
    enabled: auth.isAuthenticated,
  });
};
