import { centreRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
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
 */
export const useGetAdminGroupPaths = () => {
  return useQuery({
    queryKey: [QUERY_KEY.ADMIN_GROUP_PATHS],
    queryFn: getAdminGroupPaths,
    staleTime: Infinity,
  });
};
