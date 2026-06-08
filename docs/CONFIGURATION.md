# EPIC.centre — Configuration

---

## Overview

- **Local**: `.env` files per service, copied from `sample.env`.
- **OpenShift**: Secrets injected at deploy time by `vault-service`. No `.env` files exist in deployed environments. Config defined in `centre-api/devops/vaults.json`.

---

## Backend — `centre-api`

Variables below are sourced from the OpenShift ConfigMap for the `centre-api` deployment. Sensitive values (DB credentials, client secrets, SMTP, S3) are stored in the secrets vault and injected as Secrets — see [Secrets Management](#secrets-management-openshift) below.

### JWT / OIDC

Used by `flask-jwt-oidc` to validate incoming Bearer tokens.

| Variable | Description |
|----------|-------------|
| `JWT_OIDC_ISSUER` | Keycloak realm issuer URL — must match the `iss` claim in all tokens |
| `JWT_OIDC_WELL_KNOWN_CONFIG` | OIDC discovery document URL |
| `JWT_OIDC_ALGORITHMS` | Signing algorithm (e.g. `RS256`) |
| `JWT_OIDC_AUDIENCE` | Expected `aud` claim value |
| `JWT_OIDC_CACHING_ENABLED` | Enable JWKS public key caching |
| `JWT_OIDC_JWKS_CACHE_TIMEOUT` | JWKS cache TTL in milliseconds |

### Keycloak Admin Integration

`KEYCLOAK_BASE_URL` and `KEYCLOAK_REALM_NAME` are used alongside the `centre-admin` client credentials (stored in Secrets) to call the Keycloak Admin REST API via `client_credentials` grant.

| Variable | Description |
|----------|-------------|
| `KEYCLOAK_BASE_URL` | Keycloak base URL |
| `KEYCLOAK_REALM_NAME` | Realm name — must match the configured Keycloak realm |

### Application

| Variable | Description |
|----------|-------------|
| `APP_NAME` | Application name — used in email templates and logging |
| `CORS_ORIGIN` | Comma-separated exact origins — no wildcards in production |
| `EPIC_CENTRE_WEB_URL` | Frontend public URL — used for constructing deep links in email payloads |
| `CONNECT_TIMEOUT` | HTTP client connection timeout (seconds) for outbound API calls |
| `PYTHONBUFFERED` | Disables Python output buffering — ensures logs appear in real time in OpenShift |

### Email

| Variable | Description |
|----------|-------------|
| `DST_EMAIL` | Sender address and DST notification recipient for all email templates |

SMTP credentials (`MAIL_*`) are stored in the secrets vault and injected as Secrets.

### External API Integrations

| Variable | Description |
|----------|-------------|
| `AUTH_API` | Base URL for the Auth API service (Keycloak user/group management proxy) |
| `SUBMIT_API_URL` | Base URL for the EPIC Submit API |

### Application Launch URLs

Populate the launchpad tile URLs returned by `get_app_launch_url()`.

| Variable | Application |
|----------|------------|
| `EPIC_TRACK_LAUNCH_URL` | EPIC Track |
| `EPIC_SUBMIT_LAUNCH_URL` | EPIC Submit |
| `EPIC_ENGAGE_LAUNCH_URL` | EPIC Engage |
| `EPIC_COMPLIANCE_LAUNCH_URL` | EPIC Compliance |
| `CONDITION_REPOSITORY_LAUNCH_URL` | Condition Repository |
| `EPIC_PUBLIC_LAUNCH_URL` | EPIC Public |
| `INTRANET_LAUNCH_URL` | Intranet |

### User Management URLs

Deep links into each application's user management UI, used in admin workflows.

| Variable | Application |
|----------|------------|
| `EPIC_TRACK_USER_MANAGEMENT_URL` | EPIC Track |
| `EPIC_SUBMIT_USER_MANAGEMENT_URL` | EPIC Submit |
| `EPIC_ENGAGE_USER_MANAGEMENT_URL` | EPIC Engage |
| `EPIC_COMPLIANCE_USER_MANAGEMENT_URL` | EPIC Compliance |
| `EPIC_PUBLIC_USER_MANAGEMENT_URL` | EPIC Public |

### Keycloak Group Names

Top-level Keycloak group names per application. Must match Keycloak exactly — used by `AuthApiService` to resolve group membership.

| Variable | Application |
|----------|------------|
| `EPIC_GROUP_TRACK` | EPIC Track |
| `EPIC_GROUP_SUBMIT` | EPIC Submit |
| `EPIC_GROUP_ENGAGE` | EPIC Engage |
| `EPIC_GROUP_COMPLIANCE` | EPIC Compliance |
| `EPIC_GROUP_CONDITION_REPO` | Condition Repository |
| `EPIC_GROUP_CENTRE` | EPIC.centre |
| `EPIC_GROUP_PUBLIC` | EPIC Public |

### Keycloak Admin Group Paths

Full Keycloak group paths (e.g. `/APP/ADMIN_SUBGROUP`) used to locate admin subgroups for each application.

| Variable | Application |
|----------|------------|
| `EPIC_ADMIN_GROUP_PATH_TRACK` | EPIC Track |
| `EPIC_ADMIN_GROUP_PATH_SUBMIT` | EPIC Submit |
| `EPIC_ADMIN_GROUP_PATH_ENGAGE` | EPIC Engage |
| `EPIC_ADMIN_GROUP_PATH_COMPLIANCE` | EPIC Compliance |
| `EPIC_ADMIN_GROUP_PATH_CONDITION_REPO` | Condition Repository |
| `EPIC_ADMIN_GROUP_PATH_CENTRE` | EPIC.centre |
| `EPIC_ADMIN_GROUP_PATH_PUBLIC` | EPIC Public |

### Keycloak Admin Subgroup Names

Subgroup name strings used to identify admin roles within each application group.

| Variable | Description |
|----------|-------------|
| `EPIC_ADMIN_SUBGROUP_SUPER_USER` | DST super-user subgroup name |
| `EPIC_ADMIN_SUBGROUP_SUPERUSER` | Alias / variant of super-user subgroup name |
| `EPIC_ADMIN_SUBGROUP_EAO_MANAGER` | EAO manager subgroup name |
| `EPIC_ADMIN_SUBGROUP_ADMIN` | Admin subgroup name |
| `EPIC_ADMIN_SUBGROUP_INSTANCE_ADMIN` | Instance admin subgroup name |

### Keycloak Client IDs

Used to identify Keycloak clients when checking resource-level roles via the Admin API.

| Variable | Application |
|----------|------------|
| `EPIC_APP_CLIENT_EPIC_TRACK` | EPIC Track |
| `EPIC_APP_CLIENT_EPIC_SUBMIT` | EPIC Submit |
| `EPIC_APP_CLIENT_EPIC_ENGAGE` | EPIC Engage |
| `EPIC_APP_CLIENT_EPIC_COMPLIANCE` | EPIC Compliance |
| `EPIC_APP_CLIENT_CONDITION_REPOSITORY` | Condition Repository |
| `EPIC_APP_CLIENT_EPIC_PUBLIC` | EPIC Public |
| `EPIC_APP_CLIENT_EPIC_CENTRE` | EPIC.centre |

### Local Development Only

The following variables are used locally via `centre-api/.env` and are not present in the OpenShift ConfigMap.

| Variable | Description |
|----------|-------------|
| `FLASK_ENV` | `development` — enables Flask debug mode |
| `FLASK_APP` | `wsgi.py` — WSGI entry point |
| `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_NAME` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` | Local PostgreSQL connection (Docker Compose, port `54332`) |
| `DATABASE_TEST_*` | Isolated test database (Docker Compose, port `54333`) |
| `JWT_OIDC_TEST_*` | Mock token config for pytest — points to local Keycloak `demo` realm |

---

## Frontend — `centre-web/.env`

All variables are prefixed `VITE_` and bundled at build time (not runtime).

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:5000/api`) |
| `VITE_OIDC_AUTHORITY` | Keycloak realm URL — passed to `react-oidc-context` |
| `VITE_CLIENT_ID` | Keycloak public client ID for the SPA |
| `VITE_APP_URL` | Frontend public URL |
| `VITE_ENV` | `development` \| `test` \| `production` |
| `VITE_VERSION` | Displayed version string |
| `VITE_APP_TITLE` | Browser `<title>` |
| `VITE_DOCUMENT_SEARCH_URL` | Document Search service base URL |
| `VITE_AI_SEARCH_URL` | AI document search service URL |
| `VITE_INTRANET_HUB_URL` | Intranet hub URL |
| `VITE_BASE_PATH` | Base path if app is not served at `/` |

---

## Secrets Management (OpenShift)

Secrets are injected via a `vault-service` pod running in each namespace:

```
Secrets Vault
    └── vault script (via vault-service pod)
            └── oc set env / OpenShift Secret
                    └── centre-api Deployment (env vars)
```

The vault configuration — which secrets to pull per environment — is defined in `centre-api/devops/vaults.json` (not committed; obtain from the infrastructure team).

To refresh secrets in a running environment:

```bash
# Requires active oc session with appropriate permissions
export OPENSHIFT_REPOSITORY=[PREFIX]
export OPS_REPOSITORY=[OPS_PREFIX]
make update-env TAG_NAME=dev   # or test / prod
```
