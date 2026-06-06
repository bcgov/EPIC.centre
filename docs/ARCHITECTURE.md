# EPIC.centre — Architecture

---

## System Architecture

```
Browser
  │
  ├──▶ centre-web  (React 18 / Nginx)
  │         │
  │         ├──▶ centre-api  (Python / Flask / Gunicorn)
  │         │         ├──▶ PostgreSQL  (Patroni HA)
  │         │         ├──▶ Keycloak    (Admin REST API — user/group management)
  │         │         └──▶ Submit API · EAO Analytics · Eagle Admin
  │         │
  │         └──▶ Keycloak  (OIDC login — Authorization Code Flow)
  │
  └── vault-service injects secrets into centre-api via oc set env
```

---

## Component Details

### centre-web

| Attribute | Value |
|-----------|-------|
| Language | TypeScript 5.2 |
| Framework | React 18.2 |
| UI | Material-UI 5 (epic.theme / BC Design Tokens) |
| Routing | TanStack Router — file-based (`src/routes/`) |
| Server state | TanStack Query (React Query) |
| Local state | Zustand (`launchpad`, `auth` stores) |
| Auth | `react-oidc-context` + `keycloak-js` |
| HTTP client | Axios with JWT Bearer interceptor |
| Build | Vite 5.2 |
| Container | Nginx:alpine — serves compiled static bundle |

### centre-api

| Attribute | Value |
|-----------|-------|
| Language | Python 3.12 |
| Framework | Flask 3.0 + Flask-RESTX (Swagger UI at `/api`) |
| ORM | SQLAlchemy + Marshmallow serialization |
| Migrations | Alembic via Flask-Migrate |
| Auth | `flask-jwt-oidc` — validates RS256 JWT against Keycloak JWKS endpoint |
| Admin Keycloak client | Confidential client `centre-admin` with `view-users`, group-management roles |
| Container | Gunicorn WSGI |
| Rate limiting | Flask-Limiter |
| Audit trail | SQLAlchemy-Continuum |

### Database

See [DATABASE.md](DATABASE.md) for schema, connection details, and migration commands.

---

## OIDC Authentication Flow

```
1. User visits app → centre-web (React SPA) loads in browser
2. centre-web redirects to Keycloak login page (Authorization Code Flow)
3. User authenticates → Keycloak returns RS256 JWT access token
4. Browser attaches JWT as  Authorization: Bearer <token>  on every API call
5. centre-api fetches Keycloak JWKS public keys (cached per JWT_OIDC_JWKS_CACHE_TIMEOUT)
6. centre-api validates signature, iss, aud, exp claims — extracts group membership
7. DB query executes, filtered by the user's role/group — response returned
```

---

## Keycloak Group & Role Structure

All permissions are modelled as Keycloak group membership. Every EPIC application has a top-level group with one or more admin subgroups. Admin subgroup paths are configured via `EPIC_ADMIN_GROUP_PATH_*` environment variables.

```
Keycloak Realm
├── EPIC-TRACK        →  Member,  INSTANCE_ADMIN ★
├── EPIC-SUBMIT       →  Member,  EAO_MANAGER ★
├── EPIC-ENGAGE       →  Member,  INSTANCE_ADMIN ★
├── EPIC-COMPLIANCE   →  Member,  SUPERUSER ★
├── CONDITION-REPO    →  Member,  ADMIN ★
├── EPIC-PUBLIC       →  Member,  ADMIN ★
└── CENTRE            →  Member,  SUPER_USER ★  (DST — full access across all apps)

★ = admin subgroup — full path configured via EPIC_ADMIN_GROUP_PATH_* env vars
```

The `AuthApiService.is_admin_of_app()` helper resolves admin status at runtime by comparing the user's Keycloak group paths against the configured `EPIC_ADMIN_GROUP_PATH_*` values. DST Admins (`CENTRE/SUPER_USER`) bypass per-app checks for all applications except `EPIC_COMPLIANCE`, which requires a Compliance-specific admin.

---

## External Integrations

| Service | Protocol | Auth Method | Purpose |
|---------|---------|-------------|---------|
| Keycloak Admin REST API | HTTPS REST | `client_credentials` (`centre-admin`) | User/group CRUD, token validation |
| Submit API | HTTPS REST | Service account | Sync staff users on access grant (`SubmitApiService`) |
| EAO Analytics | HTTPS REST | API key / token | Log app launch events |
| Eagle Admin | HTTPS REST | Configured via DB app URLs | Admin deep-link tracking |
| Secrets Vault | CLI (vault script) | Service account token | Secret injection via `vault-service` pod |
| S3 Object Storage | HTTPS REST | Access key + secret | File storage |

---

## Repository Structure

```
EPIC.centre/
├── centre-api/
│   ├── src/centre_api/
│   │   ├── resources/       # Flask-RESTX namespaces (endpoint handlers)
│   │   ├── services/        # Business logic (access_requests, user_service, auth_api_service …)
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Marshmallow serialization schemas
│   │   ├── enums/           # EpicAppName, AccessRequestStatus, EmailQueueTemplate
│   │   └── utils/           # token_info, app_config, datetime_util
│   ├── migrations/versions/ # Alembic migration files
│   ├── tests/               # pytest unit tests
│   ├── docker-compose.yml   # Local: PostgreSQL ×2 + Keycloak v12
│   └── Makefile             # Dev / CI / CD targets
│
├── centre-web/
│   └── src/
│       ├── routes/          # TanStack Router pages (_authenticated/*, unauthenticated)
│       ├── components/      # Feature components (LaunchAppTile, AuthManagement …)
│       ├── hooks/           # React Query data hooks
│       ├── store/           # Zustand stores (launchpad, auth)
│       └── utils/           # roleUtils, axiosUtils, adminGroupPaths
│
├── deployment/charts/
│   ├── centre-api/          # Helm: Deployment, Service, Route, ConfigMap
│   ├── centre-api-bc/       # Helm: BuildConfig + ImageStream
│   ├── centre-web/          # Helm: Deployment, Service, Route, Nginx ConfigMap
│   ├── centre-web.bc/       # Helm: BuildConfig + ImageStream
│   └── centre-patroni/      # Helm: Patroni HA StatefulSet, NetworkPolicy
│
└── .github/workflows/
    ├── api-ci.yml           # pylint + flake8 + pytest on PR/push
    ├── api-cd.yml           # docker build + push + deploy to dev
    ├── web-ci.yml           # ESLint + Cypress on PR/push
    ├── web-cd.yml           # docker build + push + deploy to dev
    └── deploy.yml           # Manual promotion: test | prod
```
