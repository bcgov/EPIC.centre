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
      VITE_DOCUMENT_SEARCH_URL: string;
      VITE_BASE_PATH: string;
      VITE_AI_SEARCH_URL: string;
      VITE_INTRANET_HUB_URL: string;
      VITE_MAP_WIDGET_URL: string;
      VITE_MAP_API_URL: string;
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
const OIDC_AUTHORITY =
  window._env_?.VITE_OIDC_AUTHORITY || import.meta.env.VITE_OIDC_AUTHORITY;
const CLIENT_ID =
  window._env_?.VITE_CLIENT_ID || import.meta.env.VITE_CLIENT_ID;
const DOCUMENT_SEARCH_URL =
  window._env_?.VITE_DOCUMENT_SEARCH_URL ||
  import.meta.env.VITE_DOCUMENT_SEARCH_URL;
const BASE_PATH =
  window._env_?.VITE_BASE_PATH || import.meta.env.VITE_BASE_PATH;
const AI_SEARCH_URL =
  window._env_?.VITE_AI_SEARCH_URL || import.meta.env.VITE_AI_SEARCH_URL;
const INTRANET_HUB_URL =
  window._env_?.VITE_INTRANET_HUB_URL ||
  import.meta.env.VITE_INTRANET_HUB_URL ||
  "";
// Origin of the EPIC map's federated remote.
const MAP_WIDGET_URL =
  window._env_?.VITE_MAP_WIDGET_URL || import.meta.env.VITE_MAP_WIDGET_URL || "";
// map-api base URL, including /api.
const MAP_API_URL =
  window._env_?.VITE_MAP_API_URL || import.meta.env.VITE_MAP_API_URL || "";

export const AppConfig = {
  apiUrl: `${API_URL}/api`,
  /** Base URL of the centre API (no /api suffix). Used by @epic/centre-analytics. */
  apiBaseUrl: API_URL,
  environment: APP_ENVIRONMENT,
  version: APP_VERSION,
  appTitle: APP_TITLE,
  documentSearchUrl: DOCUMENT_SEARCH_URL,
  clientId: CLIENT_ID,
  basepath: BASE_PATH,
  aiSearchURL: AI_SEARCH_URL,
  intranetHubUrl: INTRANET_HUB_URL,
  // Unset (e.g. in prod) hides the Map tab and route.
  mapEnabled: Boolean(MAP_WIDGET_URL && MAP_API_URL),
  mapWidgetEntry: `${MAP_WIDGET_URL.replace(/\/$/, "")}/remoteEntry.js`,
  mapApiUrl: MAP_API_URL,
};

export const OidcConfig = {
  authority: OIDC_AUTHORITY,
  client_id: CLIENT_ID,
  redirect_uri: `${APP_URL}/oidc-callback`,
  post_logout_redirect_uri: `${APP_URL}/`,
  scope: "openid profile email",
  // Don't renew by hand: signinSilent sets isLoading, which remounted the page
  // on every renewal (MAP-87).
  automaticSilentRenew: true,
  revokeTokensOnSignout: true,
  extraQueryParams: { kc_idp_hint: "idir" },
};
