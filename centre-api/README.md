# Centre API

Flask API for EPIC.centre. It owns Centre workflow data, validates JWTs, delegates user/group operations to EPIC.auth/Auth API, and exposes endpoints used by `centre-web`.

## Local Setup

```bash
cp sample.env .env
docker compose up -d
make setup
make db
make run
```

API URLs:

- Swagger/API: `http://localhost:5000/api`
- Health: `http://localhost:5000/ops/healthz`
- Readiness: `http://localhost:5000/ops/readyz`

The Makefile currently uses `python3.9` when creating `venv/`.

## Commands

| Command | Purpose |
| --- | --- |
| `make setup` | Recreate `venv/`, install dependencies, install app in editable mode |
| `make run` | Run migrations, then start Flask on port 5000 |
| `make db` | Apply Alembic migrations |
| `make db-migrate message="..."` | Generate a new migration |
| `make db-downgrade` | Roll back one migration |
| `make pylint` | Run pylint |
| `make flake8` | Run flake8 |
| `make lint` | Run pylint and flake8 |
| `make test` | Run pytest |
| `make ci` | Run lint and tests locally |

## Main API Areas

| Namespace | Purpose |
| --- | --- |
| `/api/applications` | Launchpad applications, request catalog, access levels |
| `/api/users` | User search, status updates, access assignment/revocation |
| `/api/access-requests` | Request review and status changes |
| `/api/user-applications` | Bookmarks and launchpad sort order |
| `/api/user-settings` | User UI settings |
| `/api/eao-analytics` | Login/launch history records |
| `/api/application-urls` | Application URL and SSL tracking |
| `/api/app-configs` | Application configuration values |

## Notes

- Local compose exposes PostgreSQL on `54332` and test PostgreSQL on `54333`.
- The main compose file references `./setup` for Keycloak import data, but that folder is not committed. Test fixtures live under `tests/docker/setup`.
- OpenShift deployment runs `flask db upgrade` in an init container through `pre-hook-update-db.sh`.

More detail lives in [../docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md), [../docs/CONFIGURATION.md](../docs/CONFIGURATION.md), and [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).
