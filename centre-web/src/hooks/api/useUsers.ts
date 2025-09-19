import { centreRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { CentreUser } from "@/models/CentreUser";

type GetUsersParams = {
  search?: string;
};
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
