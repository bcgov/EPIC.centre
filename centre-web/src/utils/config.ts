declare global {
  interface Window {
    _env_: {
      VITE_API_URL: string;
      VITE_ENV: string;
      VITE_VERSION: string;
      VITE_APP_TITLE: string;
      VITE_APP_URL: string;
      VITE_OIDC_AUTHORITY: string;
      VITE_CLIENT_ID: string;
    };
  }
}
const API_URL =
  window._env_?.VITE_API_URL || import.meta.env.VITE_API_URL || "";
const APP_ENVIRONMENT =
  window._env_?.VITE_ENV || import.meta.env.VITE_ENV || "";
const APP_VERSION =
  window._env_?.VITE_VERSION || import.meta.env.VITE_VERSION || "";
const APP_TITLE =
  window._env_?.VITE_APP_TITLE || import.meta.env.VITE_APP_TITLE || "";
const APP_URL = window._env_?.VITE_APP_URL || import.meta.env.VITE_APP_URL;
const OIDC_AUTHORITY = window._env_?.VITE_OIDC_AUTHORITY || import.meta.env.VITE_OIDC_AUTHORITY;
const CLIENT_ID = window._env_?.VITE_CLIENT_ID || import.meta.env.VITE_CLIENT_ID;

export const AppConfig = {
  apiUrl: `${API_URL}`,
  environment: APP_ENVIRONMENT,
  version: APP_VERSION,
  appTitle: APP_TITLE,
};

export const OidcConfig = {
  authority: OIDC_AUTHORITY,
  client_id: CLIENT_ID,
  redirect_uri: `${APP_URL}/oidc-callback`,
  post_logout_redirect_uri: `${APP_URL}/`,
  scope: "openid profile email",
  revokeTokensOnSignout: true,
};
