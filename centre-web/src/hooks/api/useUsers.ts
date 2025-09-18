import { centreRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { CentreUser } from "@/models/CentreUser";

const getUsers = () => {
  return centreRequest<CentreUser[]>({
    url: `users`,
  });
};

export const useGetUsers = () => {
  return useQuery({
    queryKey: [QUERY_KEY.USERS],
    queryFn: getUsers,
  });
};
