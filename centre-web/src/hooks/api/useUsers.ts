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

const initializeUser = () => {
  return centreRequest<CentreUser>({
    url: `users/initialize`,
    method: "POST",
  });
};

export const useInitializeUser = () => {
  return useMutation({
    mutationFn: initializeUser,
  });
};

type UpdateUserGroupParams = {
  username: string;
  groupName: string;
  appName: string;
};
export const updateUserGroup = (params: UpdateUserGroupParams) => {
  const { username, groupName, appName } = params;
  return centreRequest<unknown>({
    url: `users/${username}/groups`,
    method: "PUT",
    data: { group_name: groupName, app_name: appName },
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