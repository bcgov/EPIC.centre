# EPIC.centre Configuration

Last reviewed: 2026-09-16

Configuration is split between backend Flask config, frontend runtime config, Helm values, and OpenShift Secrets/ConfigMaps.

## Sources Of Truth

| Area | Local source | Deployment source |
| --- | --- | --- |
| Backend env vars | `centre-api/sample.env`, `centre-api/src/centre_api/config.py` | `deployment/charts/centre-api/templates/configmap.yaml`, `deployment/charts/centre-api/templates/deployment.yaml`, Secrets |
| Frontend env vars | `centre-web/sample.env`, `centre-web/src/utils/config.ts` | `deployment/charts/centre-web/templates/configmap.yaml` mounted as runtime `config.js` |
| Admin group and client mappings | `centre-api/src/centre_api/enums/epic_app.py`, `centre-web/src/utils/adminGroupPaths.ts` | `deployment/charts/centre-api/values.yaml` plus environment-specific values |
| CI/CD settings | `.github/workflows/*.yml` | GitHub repository/environment secrets |

## Backend Configuration

Backend config is loaded by `centre-api/src/centre_api/config.py` through `python-dotenv` and Flask `app.config.from_object(...)`.

### Database

| Variable | Purpose |
| --- | --- |
| `DATABASE_USERNAME` | PostgreSQL username |
| `DATABASE_PASSWORD` | PostgreSQL password |
| `DATABASE_NAME` | PostgreSQL database name |
| `DATABASE_HOST` | PostgreSQL host or service name |
| `DATABASE_PORT` | PostgreSQL port |
| `DATABASE_TEST_USERNAME` | Test DB username |
| `DATABASE_TEST_PASSWORD` | Test DB password |
| `DATABASE_TEST_NAME` | Test DB name |
| `DATABASE_TEST_HOST` | Test DB host |
| `DATABASE_TEST_PORT` | Test DB port |

The local compose main database is exposed on `54332`; the test database is exposed on `54333`.

### JWT / OIDC

Used by `flask-jwt-oidc` to validate incoming bearer tokens.

| Variable | Purpose |
| --- | --- |
| `JWT_OIDC_WELL_KNOWN_CONFIG` | OIDC discovery URL |
| `JWT_OIDC_ALGORITHMS` | Accepted signing algorithm, normally `RS256` |
| `JWT_OIDC_JWKS_URI` | JWKS URI, optional when discovery config provides it |
| `JWT_OIDC_ISSUER` | Expected token issuer |
| `JWT_OIDC_AUDIENCE` | Expected token audience/client |
| `JWT_OIDC_CACHING_ENABLED` | Enables JWKS caching |
| `JWT_OIDC_JWKS_CACHE_TIMEOUT` | JWKS cache timeout used by the JWT library |
| `JWT_OIDC_TEST_*` | Test-mode JWT settings |

### Auth And External APIs

| Variable | Purpose |
| --- | --- |
| `AUTH_API` | Base URL for EPIC.auth/Auth API. Centre delegates user and group operations here. |
| `SUBMIT_API_URL` | Base URL for EPIC Submit API. Used when Submit access is granted. |
| `KEYCLOAK_BASE_URL` | Keycloak/loginproxy base URL. Present in config and chart values. |
| `KEYCLOAK_REALM_NAME` | Keycloak realm name. Present in config and chart values. |
| `KEYCLOAK_ADMIN_CLIENT` | Secret-backed admin client value. Present in deployment template. |
| `KEYCLOAK_ADMIN_SECRET` | Secret-backed admin secret value. Present in deployment template. |
| `CONNECT_TIMEOUT` | Intended outbound HTTP timeout. The chart injects it; current Flask config does not define it, so service code falls back to `30` unless config loading is updated. |

### Application URLs

These values control launchpad URLs returned by the API through `get_app_launch_url()`.

| Variable | App |
| --- | --- |
| `CONDITION_REPOSITORY_LAUNCH_URL` | Condition Repository |
| `EPIC_COMPLIANCE_LAUNCH_URL` | EPIC.compliance |
| `DOCUMENT_SEARCH_LAUNCH_URL` | Document Search |
| `EPIC_TRACK_LAUNCH_URL` | EPIC.track |
| `EPIC_PUBLIC_LAUNCH_URL` | EPIC.public |
| `EPIC_SUBMIT_LAUNCH_URL` | EPIC.submit |
| `EPIC_ENGAGE_LAUNCH_URL` | EPIC.engage |
| `INTRANET_LAUNCH_URL` | Intranet |

The API chart currently injects most launch URL values but not `DOCUMENT_SEARCH_LAUNCH_URL`; the frontend separately uses `VITE_DOCUMENT_SEARCH_URL`.

### User Management URLs

These values are returned by the app config endpoint for admin deep links.

| Variable | App |
| --- | --- |
| `DOCUMENT_SEARCH_USER_MANAGEMENT_URL` | Document Search |
| `CONDITION_REPOSITORY_USER_MANAGEMENT_URL` | Condition Repository |
| `EPIC_COMPLIANCE_USER_MANAGEMENT_URL` | EPIC.compliance |
| `EPIC_TRACK_USER_MANAGEMENT_URL` | EPIC.track |
| `EPIC_ENGAGE_USER_MANAGEMENT_URL` | EPIC.engage |
| `EPIC_PUBLIC_USER_MANAGEMENT_URL` | EPIC.public |
| `EPIC_SUBMIT_USER_MANAGEMENT_URL` | EPIC.submit |

The API chart currently injects EPIC Public, Engage, Submit, Track, and Compliance management URLs. Add chart values/templates if another URL must be available in deployed environments.

### Application Groups, Admin Groups, And Clients

| Variable group | Purpose |
| --- | --- |
| `EPIC_GROUP_*` | Top-level Keycloak group names, such as `TRACK`, `SUBMIT`, `CENTRE` |
| `EPIC_ADMIN_SUBGROUP_*` | Admin subgroup names, such as `INSTANCE_ADMIN`, `EAO_MANAGER`, `SUPER_USER` |
| `EPIC_ADMIN_GROUP_PATH_*` | Full admin group paths used for authorization checks |
| `EPIC_APP_CLIENT_*` | Keycloak client IDs used to map app names to clients |

Keep backend enum defaults, Helm values, and frontend `adminGroupPaths.ts` aligned. Backend checks are enforced in the API; frontend checks control navigation and display.

### Other Backend Variables

| Variable | Purpose |
| --- | --- |
| `FLASK_ENV` | Selects Flask config: `development`, `testing`, `production`, `staging`, `docker` |
| `FLASK_APP` | Flask entry point, normally `wsgi.py` |
| `APP_NAME` | Application display/logging name |
| `DST_EMAIL` | Sender and DST notification recipient for access workflow emails |
| `EPIC_CENTRE_WEB_URL` | Public web URL used in email links |
| `CORS_ORIGIN` | Comma-separated exact allowed browser origins |
| `PYTHONBUFFERED` | Python stdout/stderr buffering flag for OpenShift logs |
| `S3_*` | Present in `sample.env`; not used by current service code found in this review |

## Frontend Configuration

Frontend config is loaded by `centre-web/src/utils/config.ts`. In OpenShift, `config.js` is mounted into `/usr/share/nginx/html/config/` and populates `window._env_`. In local development, Vite `import.meta.env` is used.

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL without `/api`; the app appends `/api` internally |
| `VITE_ENV` | Display/runtime environment |
| `VITE_VERSION` | Display version |
| `VITE_APP_TITLE` | Browser title/application title |
| `VITE_APP_URL` | Public frontend URL, used for OIDC callback/logout redirects |
| `VITE_OIDC_AUTHORITY` | OIDC authority URL |
| `VITE_CLIENT_ID` | OIDC public client ID |
| `VITE_DOCUMENT_SEARCH_URL` | Document Search URL used by launchpad/document search components |
| `VITE_AI_SEARCH_URL` | AI document search URL |
| `VITE_INTRANET_HUB_URL` | Intranet hub URL displayed on launchpad |
| `VITE_BASE_PATH` | Local/sample config supports it; current Helm `config.js` does not emit it |

## GitHub Secrets

The workflows reference these repository or environment secrets:

| Secret | Used by |
| --- | --- |
| `OPENSHIFT_LOGIN_REGISTRY` | `oc login` in CD/deploy workflows |
| `OPENSHIFT_SA_TOKEN` | OpenShift and Docker registry login |
| `OPENSHIFT_SA_NAME` | Docker registry login username |
| `OPENSHIFT_IMAGE_REGISTRY` | Image push target |
| `OPENSHIFT_REPOSITORY` | OpenShift namespace prefix |

## Configuration Review Checklist

When adding or changing a variable:

1. Add or update local sample env files.
2. Load the value in `centre-api/src/centre_api/config.py` or `centre-web/src/utils/config.ts`.
3. Add Helm `values.yaml` entries and ConfigMap/Deployment template wiring.
4. Update this document.
5. Verify the value is available in the running pod with `oc set env --list` or by inspecting the mounted frontend `config.js`.
