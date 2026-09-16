# EPIC.centre Database

Last reviewed: 2026-09-16

EPIC.centre uses PostgreSQL with SQLAlchemy models and Alembic migrations through Flask-Migrate.

## Runtime Databases

| Environment | Database |
| --- | --- |
| Local development | PostgreSQL container from `centre-api/docker-compose.yml`, host port `54332` |
| Local tests | PostgreSQL container from `centre-api/docker-compose.yml`, host port `54333`, or another configured test DB |
| OpenShift | Patroni-backed PostgreSQL from `deployment/charts/centre-patroni/` |

## Active Model-Backed Tables

| Table | Model | Purpose |
| --- | --- | --- |
| `applications` | `Application` | Registry of EPIC applications shown in Centre |
| `user_applications` | `UserApplication` | Per-user app metadata: access level cache, last accessed, sort order, bookmarks |
| `access_requests` | `AccessRequests` | Access request workflow state |
| `user_settings` | `UserSettings` | Per-user UI settings and card positions |
| `login_histories` | `EaoAnalytics` | Last login/launch timestamp per user and app |
| `email_queue` | `EmailQueue` | Queued workflow emails |
| `application_urls` | `ApplicationUrl` | Application/environment URLs and SSL renewal tracking |

Historical migrations create and later remove `bookmarks` and `staff_users`. Do not treat those as current application tables unless a database is behind the latest Alembic revision.

## Relationships

```text
applications
  -> access_requests.app_id
  -> user_applications.app_id
  -> login_histories.app_id

user_applications
  -> unique(user_auth_guid, app_id)
  -> bookmarks stored as JSON on the row

user_settings
  -> unique(username)

application_urls
  -> standalone records grouped in the frontend by app, environment, and certificate host

email_queue
  -> standalone queue records created by access workflow services
```

## Application Seed Data

Application records are inserted by migrations:

| Migration | Adds |
| --- | --- |
| `9d9c97c6acbc_.py` | Condition Repository, EPIC.compliance, Document Search, EPIC.track, EPIC.public, EPIC.submit, EPIC.engage |
| `a1b2c3d4e5f6_add_new_application.py` | Intranet |
| `c3d4e5f6a7b8_add_epic_centre_application.py` | EPIC.centre inactive analytics row |

Launch URLs are returned from environment config, not from the seeded `launch_url` values.

## Access Request Statuses

Defined in `centre-api/src/centre_api/enums/access_request_status.py`:

| Status | Meaning |
| --- | --- |
| `PENDING` | User submitted a request and it awaits admin action |
| `APPROVED` | Admin assigned an access group through user access update |
| `REJECTED` | Admin rejected the request |
| `CANCELLED` | Reserved for withdrawn/cancelled requests |

## Migration Commands

Run from `centre-api/` with the virtual environment active:

```bash
flask db upgrade
flask db downgrade
flask db migrate -m "describe change"
flask db current
flask db history
```

Makefile wrappers:

```bash
make db
make db-downgrade
make db-migrate message="describe change"
```

## OpenShift Migration Behavior

The `centre-api` Helm deployment includes an init container that runs:

```bash
flask db upgrade
```

through `centre-api/pre-hook-update-db.sh` before the API container starts. Manual migrations may still be useful for diagnosis or recovery, but chart-based rollouts are designed to apply pending migrations during pod startup.

Manual command:

```bash
oc exec -it deployment/centre-api -n [PREFIX]-[env] -- flask db current
oc exec -it deployment/centre-api -n [PREFIX]-[env] -- flask db upgrade
```

## Useful Queries

Applications:

```sql
select id, name, title, is_active
from applications
order by id;
```

Pending access requests:

```sql
select ar.id, ar.status, ar.user_auth_guid, a.name as app_name, ar.created_date
from access_requests ar
join applications a on a.id = ar.app_id
where ar.status = 'PENDING'
order by ar.created_date desc;
```

Email queue:

```sql
select id, template_name, status, error_message, created_at, sent_at
from email_queue
order by created_at desc;
```

Application URL/SSL records:

```sql
select app_name, environment, url, ssl_status, ssl_expiry, renewal_status
from application_urls
where is_active = true
order by app_name, environment;
```

## Backup And Restore

Local:

```bash
pg_dump -h localhost -p 54332 -U centre centre > backup.sql
psql -h localhost -p 54332 -U centre centre < backup.sql
```

OpenShift examples:

```bash
oc exec -it centre-patroni-0 -n [PREFIX]-[env] -- pg_dump -U [DB_USER] [DB_NAME] > backup.sql
oc exec -i centre-patroni-0 -n [PREFIX]-[env] -- psql -U [DB_USER] [DB_NAME] < backup.sql
```

Confirm production backup and retention policy with the platform/infrastructure team before relying on Patroni replication as a backup strategy.

## Migration Review Checklist

When adding a schema change:

1. Add or update SQLAlchemy models and Marshmallow schemas.
2. Generate and inspect the Alembic migration.
3. Confirm upgrade and downgrade behavior.
4. Update seed data docs if application rows change.
5. Update [OPERATIONS.md](OPERATIONS.md) if the change affects support workflows.
