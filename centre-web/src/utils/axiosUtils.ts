import { AppConfig, OidcConfig } from "@/utils/config";
import axios, { AxiosError, AxiosInstance } from "axios";
import { User } from "oidc-client-ts";

export type OnErrorType = (error: AxiosError) => void;
export type OnSuccessType = (data: any) => void;

const client = axios.create({ baseURL: AppConfig.apiUrl });

function getUser() {
  const oidcStorage = sessionStorage.getItem(
    `oidc.user:${OidcConfig.authority}:${OidcConfig.client_id}`,
  );
  if (!oidcStorage) {
    return null;
  }

  return User.fromStorageString(oidcStorage);
}

const getAuthToken = () => {
  const user = getUser();
  if (user?.access_token) {
    return user.access_token;
  }
  throw new Error("No access token");
};

const setAuthToken = (client: AxiosInstance) => {
  const authToken = getAuthToken();

  client.defaults.headers.common.Authorization = `Bearer ${authToken}`;
};

export const centreRequest = async <T = any>({ ...options }) => {
  setAuthToken(client);

  const response = await client.request<T>(options);
  return response.data;
};
