import { centreRequest } from "@/utils/axiosUtils";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { EpicApp } from "@/models/EpicApp";

const getApplications = () => {
  return centreRequest<EpicApp[]>({
    url: `applications`,
  });
};

export const useGetApplications = () => {
  return useQuery({
    queryKey: [QUERY_KEY.APPLICATIONS],
    queryFn: getApplications,
  });
};

const getRequestCatalogApplications = () => {
  return centreRequest<EpicApp[]>({
    url: `applications/request-catalog`,
  });
};

export const useGetRequestCatalogApplications = () => {
  return useQuery({
    queryKey: [QUERY_KEY.REQUEST_CATALOG],
    queryFn: getRequestCatalogApplications,
  });
};
