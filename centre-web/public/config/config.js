// Runtime environment configuration for local development.
//
// In production this file is generated/injected at container start so that a
// single built image can be configured per environment. Locally it does not
// exist by default, which makes the browser request for /config/config.js fall
// back to index.html (returning HTML for a <script> tag -> network/MIME error).
//
// Defining window._env_ here keeps parity with production. Leaving the values
// empty is fine: src/utils/config.ts falls back to import.meta.env (the .env
// file) whenever a window._env_ value is empty.
window._env_ = {
  VITE_API_URL: "",
  VITE_ENV: "",
  VITE_VERSION: "",
  VITE_APP_TITLE: "",
  VITE_APP_URL: "",
  VITE_OIDC_AUTHORITY: "",
  VITE_CLIENT_ID: "",
  VITE_DOCUMENT_SEARCH_URL: "",
  VITE_BASE_PATH: "",
  VITE_AI_SEARCH_URL: "",
  VITE_INTRANET_HUB_URL: "",
};
