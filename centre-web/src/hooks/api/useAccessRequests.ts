import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { centreRequest } from "@/utils/axiosUtils";
import { AccessRequest } from "@/models/AccessRequest";

type GetAccessRequestsParams = {
  status?: string;
  params: {
    search?: string;
  };
};

const getAccessRequests = ({ status, params }: GetAccessRequestsParams) => {
  return centreRequest<AccessRequest[]>({
    url: `access-requests/status/${status}`,
    params,
  });
};

type UseAccessRequestsParams = {
  status: string;
  params: {
    search?: string;
  };
};
export const useAccessRequests = ({
  status,
  params,
}: UseAccessRequestsParams) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCESS_REQUESTS, params.search],
    queryFn: () => getAccessRequests({ status, params }),
  });
};
