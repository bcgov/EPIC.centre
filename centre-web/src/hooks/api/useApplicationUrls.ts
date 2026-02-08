import { centreRequest } from "@/utils/axiosUtils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { ApplicationUrl } from "@/models/ApplicationUrl";

const getApplicationUrls = () => {
    return centreRequest<ApplicationUrl[]>({
        url: `application-urls`,
    });
};

export const useGetApplicationUrls = () => {
    return useQuery({
        queryKey: [QUERY_KEY.APPLICATION_URLS],
        queryFn: getApplicationUrls,
    });
};

const updateApplicationUrl = (applicationUrl: ApplicationUrl) => {
    return centreRequest<ApplicationUrl>({
        url: `application-urls/${applicationUrl.id}`,
        method: "PUT",
        data: applicationUrl
    });
};

const createApplicationUrl = (applicationUrl: Omit<ApplicationUrl, 'id'>) => {
    return centreRequest<ApplicationUrl>({
        url: `application-urls`,
        method: "POST",
        data: applicationUrl
    });
};

export const useCreateApplicationUrl = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createApplicationUrl,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY.APPLICATION_URLS] });
        }
    });
};

export const useUpdateApplicationUrl = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateApplicationUrl,
        onSuccess: () => {
            return queryClient.invalidateQueries({ queryKey: [QUERY_KEY.APPLICATION_URLS] });
        }
    });
};

const deleteApplicationUrl = (id: number) => {
    return centreRequest<void>({
        url: `application-urls/${id}`,
        method: "DELETE",
    });
};

export const useDeleteApplicationUrl = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteApplicationUrl,
        onSuccess: () => {
            return queryClient.invalidateQueries({ queryKey: [QUERY_KEY.APPLICATION_URLS] });
        }
    });
};
