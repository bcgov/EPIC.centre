# EPIC.centre Database

Last reviewed: 2026-09-17

EPIC.centre uses PostgreSQL with SQLAlchemy models and Alembic migrations through Flask-Migrate. In OpenShift, the database is provided by the Patroni chart under `deployment/charts/centre-patroni/`.

## Runtime Databases

| Environment | Database |
| --- | --- |
| Local development | PostgreSQL from `centre-api/docker-compose.yml`, exposed on host port `54332` |
| Local tests | PostgreSQL from `centre-api/docker-compose.yml`, exposed on host port `54333`, or another configured test DB |
| OpenShift | Patroni-backed PostgreSQL service consumed by `centre-api` |

## Main Tables

| Table | Model | Purpose |
| --- | --- | --- |
| `applications` | `Application` | EPIC application registry |
| `user_applications` | `UserApplication` | Per-user application metadata, sort order, and bookmarks |
| `access_requests` | `AccessRequests` | User access request status |
| `user_settings` | `UserSettings` | Per-user UI preferences |
| `login_histories` | `EaoAnalytics` | Last login/launch timestamp by user and application |
| `email_queue` | `EmailQueue` | Queued notification payloads |
| `application_urls` | `ApplicationUrl` | Application/environment URLs and SSL metadata |

## Seeded Applications

Application rows are seeded by migrations:

| Application name | Display title |
| --- | --- |
| `condition_repository` | Condition Repository |
| `epic_compliance` | EPIC.compliance |
| `document_search` | Document Search |
| `epic_track` | EPIC.track |
| `epic_public` | EPIC.public |
| `epic_submit` | EPIC.submit |
| `epic_engage` | EPIC.engage |
| `intranet` | Intranet |
| `epic_centre` | EPIC.centre, inactive row used for Centre analytics |

## Migration Note

Migrations live in `centre-api/migrations/versions/`. The `centre-api` OpenShift deployment runs `flask db upgrade` in an init container through `centre-api/pre-hook-update-db.sh` before the API container starts.
