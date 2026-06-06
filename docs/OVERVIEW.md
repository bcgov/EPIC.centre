# EPIC.centre

> Last updated: [DATE]

---

## Purpose

EPIC.centre is an authentication and authorization management portal that provides a user-facing abstraction layer over Keycloak. It serves two primary functions:

1. **SSO Launchpad** — Centralized portal for accessing all EPIC applications via a shared Keycloak session. Supports per-app bookmarking and last-accessed tracking.
2. **Access Management UI** — Role-based admin interface for managing Keycloak group membership across EPIC applications, handling access request workflows, and managing user account state — without requiring direct Keycloak Admin Console access.

---

## User Roles

| Role | Keycloak Group | Scope |
|------|---------------|-------|
| **DST Admin** | `CENTRE/SUPER_USER` | Full access — all users, all applications |
| **App Admin** | `{APP}/INSTANCE_ADMIN` (or equivalent) | Scoped to their assigned application only |
| **Staff** | Any application group membership | Launchpad, access requests, bookmarks |

---

## EPIC Application Registry

- EPIC Track
- EPIC Submit
- EPIC Engage
- EPIC Compliance
- Condition Repository
- EPIC Public

---

## Key Resources

| Resource | Location |
|----------|----------|
| GitHub Repository | `https://github.com/bcgov/EPIC.centre` |
| Swagger / OpenAPI Docs | `https://[API_HOST]/api` |
| OpenShift Console | [URL] |
| Keycloak Admin Console | `[KEYCLOAK_URL]/auth/admin` |

---


## Repository State

- **Integration branch**: `develop` — auto-deploys to `dev` on push
- **Production branch**: `develop` — production-aligned
- **Last release**: [VERSION / DATE]
- **Open issues**: [URL]

---

## Documentation Index

| Document | Contents |
|----------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, component interactions, OIDC auth flow, Keycloak group structure |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Local dev setup, Docker Compose services, test execution, CLI reference |
| [CONFIGURATION.md](CONFIGURATION.md) | All environment variables, Keycloak config, secrets management |
| [DEPLOYMENT.md](DEPLOYMENT.md) | CI/CD pipelines, OpenShift image promotion, Helm charts, rollback |
| [DATABASE.md](DATABASE.md) | Schema, ER diagram, SQLAlchemy models, Alembic migrations |
| [OPERATIONS.md](OPERATIONS.md) | Runbook — access approval flow, email notifications, monitoring, troubleshooting |
