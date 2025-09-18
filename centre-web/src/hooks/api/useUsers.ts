import { centreRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { CentreUser } from "@/models/CentreUser";

const getUsers = (search?: string) => {
  return centreRequest<CentreUser[]>({
    url: `users`,
    params: search ? { search } : undefined,
  });
};

type UseGetUsersParams = {
  search?: string;
};
export const useGetUsers = ({ search }: UseGetUsersParams = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY.USERS, search],
    queryFn: () => getUsers(search),
  });
};
