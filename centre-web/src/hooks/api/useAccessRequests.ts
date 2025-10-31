import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { centreRequest } from "@/utils/axiosUtils";
import { AccessRequest } from "@/models/AccessRequest";
import { QueryRequestParams } from "./types";
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

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
type UpdateAccessRequestParams = {
  access_request_id: number | string;
  status?: string;
};

const updateAccessRequest = ({
  access_request_id,
  status,
}: UpdateAccessRequestParams) => {
  return centreRequest<AccessRequest>({
    url: `access-requests/${access_request_id}`,
    method: "put",
    params: { status },
  });
};

export const useUpdateAccessRequest = (
  options?: UseMutationOptions<
    AccessRequest,
    unknown,
    UpdateAccessRequestParams
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<AccessRequest, unknown, UpdateAccessRequestParams>({
    mutationFn: (vars) => updateAccessRequest(vars),
    onSuccess: (data, vars, ctx) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.ACCESS_REQUESTS],
      });

      if (options?.onSuccess) {
        // call user-provided onSuccess after cache invalidation
        options.onSuccess(data, vars, ctx);
      }
    },
    ...options,
  });
};
