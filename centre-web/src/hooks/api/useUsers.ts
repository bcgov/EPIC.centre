import { centreRequest } from "@/utils/axiosUtils";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
} from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { CentreUser } from "@/models/CentreUser";
import { QueryRequestParams } from "./types";

type GetUsersParams = {
  search?: string;
  include_groups?: boolean;
} & QueryRequestParams<CentreUser>;
const getUsers = (params: GetUsersParams) => {
  return centreRequest<CentreUser[]>({
    url: `users`,
    params,
  });
};

export const useGetUsers = (params: GetUsersParams = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY.USERS, params.search],
    queryFn: () => getUsers(params),
  });
};

type GetUserParams = {
  username: string;
} & QueryRequestParams<CentreUser>;
const getUser = (params: GetUserParams) => {
  return centreRequest<CentreUser>({
    url: `users/username/${params.username}`,
  });
};

export const useGetUser = (params: GetUserParams) => {
  const { username, ...rest } = params;
  return useQuery({
    queryKey: [QUERY_KEY.USER, username],
    queryFn: () => getUser({ username, ...rest }),
  });
};

type UpdateUserGroupParams = {
  username: string;
  groupName: string;
  appName: string;
  parentGroupName: string;
  accessRequestId?: number;
};
export const updateUserGroup = (params: UpdateUserGroupParams) => {
  const { username, groupName, appName, accessRequestId, parentGroupName } =
    params;
  return centreRequest<unknown>({
    url: `users/${username}/access`,
    method: "PUT",
    data: {
      group_name: groupName,
      app_name: appName,
      access_request_id: accessRequestId,
      parent_group_name: parentGroupName,
    },
  });
};

type UseUpdateUserGroupsOptions = UseMutationOptions<
  unknown,
  unknown,
  UpdateUserGroupParams
>;
export const useUpdateUserGroup = (options?: UseUpdateUserGroupsOptions) => {
  return useMutation({
    mutationFn: (params: UpdateUserGroupParams) => updateUserGroup(params),
    ...options,
  });
};

type RevokeUserAccessParams = {
  username: string;
  appName: string;
};
export const revokeUserAccess = (params: RevokeUserAccessParams) => {
  const { username, appName } = params;
  return centreRequest<unknown>({
    url: `users/${username}/access`,
    method: "DELETE",
    data: {
      app_name: appName,
    },
  });
};

type UseRevokeUserAccessOptions = UseMutationOptions<
  unknown,
  unknown,
  RevokeUserAccessParams
>;
export const useRevokeUserAccess = (options?: UseRevokeUserAccessOptions) => {
  return useMutation({
    mutationFn: (params: RevokeUserAccessParams) => revokeUserAccess(params),
    ...options,
  });
};

type UpdateUserParams = {
  username: string;
  enabled?: boolean;
  firstName?: string;
  lastName?: string;
};

export const updateUser = (params: UpdateUserParams) => {
  const { username, ...data } = params;
  return centreRequest<CentreUser>({
    url: `users/username/${username}`,
    method: "PATCH",
    data,
  });
};

type UseUpdateUserOptions = UseMutationOptions<
  CentreUser,
  unknown,
  UpdateUserParams
>;

export const useUpdateUser = (options?: UseUpdateUserOptions) => {
  return useMutation({
    mutationFn: (params: UpdateUserParams) => updateUser(params),
    ...options,
  });
};
