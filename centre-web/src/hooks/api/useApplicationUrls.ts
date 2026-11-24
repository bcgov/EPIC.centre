import { centreRequest } from "@/utils/axiosUtils";
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import {
    ApplicationUrl,
    CreateApplicationUrlPayload,
    SslCertificate,
    UpdateApplicationUrlPayload,
    UpdateCertificateRenewalPayload,
} from "@/models/ApplicationUrl";

// A URL change can add a certificate or stop using one, so refresh both lists
const refreshUrlsAndCertificates = (queryClient: QueryClient) =>
    Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY.APPLICATION_URLS] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY.SSL_CERTIFICATES] }),
    ]);

const getApplicationUrls = () => {
    return centreRequest<ApplicationUrl[]>({
        url: `application-urls`,
    });
};

export const useGetApplicationUrls = (enabled = true) => {
    return useQuery({
        queryKey: [QUERY_KEY.APPLICATION_URLS],
        queryFn: getApplicationUrls,
        enabled,
    });
};

const getSslCertificates = () => {
    return centreRequest<SslCertificate[]>({
        url: `ssl-certificates`,
    });
};

export const useGetSslCertificates = (enabled = true) => {
    return useQuery({
        queryKey: [QUERY_KEY.SSL_CERTIFICATES],
        queryFn: getSslCertificates,
        enabled,
    });
};

const updateApplicationUrl = ({ id, ...changes }: UpdateApplicationUrlPayload) => {
    return centreRequest<ApplicationUrl>({
        url: `application-urls/${id}`,
        method: "PUT",
        data: changes
    });
};

const createApplicationUrl = (applicationUrl: CreateApplicationUrlPayload) => {
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
        onSuccess: () => refreshUrlsAndCertificates(queryClient),
    });
};

export const useUpdateApplicationUrl = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateApplicationUrl,
        onSuccess: () => refreshUrlsAndCertificates(queryClient),
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
        onSuccess: () => refreshUrlsAndCertificates(queryClient),
    });
};

// Update the cached list in place, so the page needs no refetch
const replaceCertificate = (queryClient: QueryClient, certificate: SslCertificate) =>
    queryClient.setQueryData<SslCertificate[]>([QUERY_KEY.SSL_CERTIFICATES], (certificates) =>
        certificates?.map((cached) => (cached.id === certificate.id ? certificate : cached)),
    );

const updateCertificateRenewal = ({ id, ...renewal }: UpdateCertificateRenewalPayload) => {
    return centreRequest<SslCertificate>({
        url: `ssl-certificates/${id}`,
        method: "PATCH",
        data: renewal,
    });
};

export const useUpdateCertificateRenewal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCertificateRenewal,
        onSuccess: (certificate) => replaceCertificate(queryClient, certificate),
    });
};

const checkCertificate = (id: number) => {
    return centreRequest<SslCertificate>({
        url: `ssl-certificates/${id}/check`,
        method: "POST",
    });
};

export const useCheckCertificate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: checkCertificate,
        onSuccess: (certificate) => replaceCertificate(queryClient, certificate),
    });
};
