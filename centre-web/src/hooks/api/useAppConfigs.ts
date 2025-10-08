import { centreRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { QueryRequestParams } from "./types";

export type AppConfig = {
  name: string;
  title: string;
  launch_url: string;
  app_user_management_url?: string;
  is_active: boolean;
};

const getAppConfigs = () => {
  return centreRequest<AppConfig[]>({
    url: `app-configs`,
  });
};

type UseAppConfigsParams = QueryRequestParams<AppConfig[]>;

export const useAppConfigs = (params: UseAppConfigsParams = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY.APP_CONFIGS],
    queryFn: () => getAppConfigs(),
    ...params,
  });
};
