import { centreRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";
import { QUERY_KEY } from "./constants";
import { EpicAppClientName } from "@/models/EpicApp";

/**
 * Map of Epic app client name to its admin group path (without leading slash),
 * e.g. { "epic-centre": "CENTRE/SUPER_USER" }.
 */
export type AdminGroupPaths = Partial<Record<EpicAppClientName, string>>;

const getAdminGroupPaths = () => {
  return centreRequest<AdminGroupPaths>({
    url: `admin-config/group-paths`,
  });
};

/**
 * Fetch the admin group paths exposed by the backend. These replace the
 * previously hardcoded frontend values so changes only need to happen in the
 * backend configuration.
 *
 * The query is only enabled once the user is authenticated. The request reads
 * the OIDC token from session storage, which is written by the IDIR callback.
 * Enabling it before authentication completes would race the token write and
 * fail; because the query uses staleTime: Infinity it would not retry, leaving
 * admin paths empty for the whole session. Gating on auth.isAuthenticated lets
 * React Query trigger the fetch automatically once the token is available.
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
