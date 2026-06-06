# EPIC.centre — Database

---

## Overview

- **Engine**: PostgreSQL 13+
- **ORM**: SQLAlchemy with `psycopg2` driver
- **Migrations**: Alembic via Flask-Migrate
- **HA**: Patroni StatefulSet in OpenShift (`centre-patroni` Helm chart)

Migrations are version-controlled in `centre-api/migrations/versions/` and must be applied manually in OpenShift environments after deployment.

---

## Connection Details

### Local Development

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `54332` |
| Database | `[DB_NAME]` |
| Username | `[DB_USER]` |
| Password | `[DB_PASSWORD]` |
| Test DB port | `54333` |

### OpenShift

Credentials are injected from the secrets vault at deploy time. To inspect:

```bash
oc get secret centre-api-[env]-secret -n [PREFIX]-[env] -o yaml
```

---

## Table Relationships

```
applications  ──< user_applications   (application_id)   user-to-app assignments
applications  ──< access_requests     (app_id)           access request workflow
applications  ──< user_settings       (application_id)   per-user bookmarks / last accessed
applications  ──< application_url     (application_id)   URL + SSL expiry tracking
applications  ──< eao_analytics       (application_id)   launch event log

email_queue   — standalone, no FK (queued by services, processed by email worker)
```

---

## Table Reference

| Table | SQLAlchemy Model | Description |
|-------|-----------------|-------------|
| `applications` | `Application` | Registry of EPIC apps. `keycloak_group_name` and `keycloak_client_id` must match Keycloak exactly. |
| `user_applications` | `UserApplication` | Maps Keycloak user GUIDs to app assignments with role and bookmark data. |
| `access_requests` | `AccessRequests` | Access request workflow. Status: `PENDING` → `APPROVED` / `REJECTED` / `CANCELLED`. |
| `user_settings` | `UserSettings` | Per-user, per-app settings (bookmarks, last accessed). |
| `application_url` | `ApplicationUrl` | URLs per application with optional SSL expiry tracking. |
| `eao_analytics` | `EaoAnalytics` | Tracks last login time per user per app (used for launchpad "last accessed" display). |
| `email_queue` | `EmailQueue` | Outbound email queue. Status: `PENDING` → sent (set `sent_at`). |

See [OPERATIONS.md](OPERATIONS.md) for `access_requests.status` transitions and `email_queue` template details.

---

## Migration Commands

```bash
cd centre-api
. venv/bin/activate

flask db upgrade              # Apply all pending migrations
flask db downgrade            # Roll back one revision
flask db migrate -m "msg"     # Auto-generate migration from model diff
flask db current              # Show current applied revision
flask db history              # Show full revision chain
flask db stamp <rev>          # Force-mark a revision without running SQL (use carefully)
```

### Via Makefile

```bash
make db                              # flask db upgrade
make db-downgrade                    # flask db downgrade
make db-migrate message="add col"    # flask db migrate
```

### In OpenShift (post-deploy)

```bash
oc exec -it deployment/centre-api -n [PREFIX]-[env] -- flask db upgrade
```

> Always run migrations before restarting the new image if schema changes are included.

---

## Migration File History

| File | Description |
|------|-------------|
| `0414ffaa643a_.py` | Initial schema |
| `e55517dc0fd8_add_application_urls_table.py` | `application_url` table |
| `f9a8b7c6d5e4_add_user_settings_table.py` | `user_settings` table |
| `b2c3d4e5f6a7_add_eao_analytics_table.py` | `eao_analytics` table |
| `a1b2c3d4e5f6_add_new_application.py` | Seed new application row |
| `c3d4e5f6a7b8_add_epic_centre_application.py` | Seed EPIC.centre application row |
| *(others)* | Incremental schema changes |

---

## Backup & Restore

### Local

```bash
pg_dump -h localhost -p 54332 -U [DB_USER] [DB_NAME] > backup.sql
psql  -h localhost -p 54332 -U [DB_USER] [DB_NAME] < backup.sql
```

### OpenShift (Patroni)

```bash
# Exec into primary Patroni pod
oc exec -it centre-patroni-0 -n [PREFIX]-[env] -- pg_dump -U [DB_USER] [DB_NAME] > backup.sql
```

Verify scheduled backup policies with the infrastructure team — Patroni provides streaming replication but not automated point-in-time snapshots by default.
