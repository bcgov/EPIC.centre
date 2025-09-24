import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { centreRequest } from "@/utils/axiosUtils";
import { AccessRequest } from "@/models/AccessRequest";
import { QueryRequestParams } from "./types";

type GetAccessRequestsParams = {
  params: {
    status?: string;
    user_auth_guid?: string;
  };
};

const getAccessRequests = ({ params }: GetAccessRequestsParams) => {
  return centreRequest<AccessRequest[]>({
    url: `access-requests`,
    params: params ?? {},
  });
};

type UseAccessRequestsParams = GetAccessRequestsParams &
  QueryRequestParams<AccessRequest[]>;
export const useAccessRequests = ({
  params,
  ...rest
}: UseAccessRequestsParams) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCESS_REQUESTS, ...Object.values(params)],
    queryFn: () => getAccessRequests({ params }),
    ...rest,
  });
};

// New hook for /access-requests/users/user_auth_guid
type GetUserAccessRequestsParams = {
  user_auth_guid: string;
};

const getUserAccessRequests = ({
  user_auth_guid,
}: GetUserAccessRequestsParams) => {
  return centreRequest<AccessRequest[]>({
    url: `access-requests/users/${user_auth_guid}`,
  });
};

type UseUserAccessRequestsParams = GetUserAccessRequestsParams &
  QueryRequestParams<AccessRequest[]>;
export const useUserAccessRequests = ({
  user_auth_guid,
  ...rest
}: UseUserAccessRequestsParams) => {
  return useQuery({
    queryKey: [QUERY_KEY.ACCESS_REQUESTS, user_auth_guid],
    queryFn: () => getUserAccessRequests({ user_auth_guid }),
    ...rest,
  });
};
