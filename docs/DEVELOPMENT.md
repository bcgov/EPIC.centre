# EPIC.centre Development Setup

Last reviewed: 2026-09-16

Use this page for local development across `centre-api` and `centre-web`. For service-specific quick commands, see [../centre-api/README.md](../centre-api/README.md) and [../centre-web/README.md](../centre-web/README.md).

## Prerequisites

| Tool | Version used by repo | Evidence |
| --- | --- | --- |
| Python | 3.9 | `centre-api/Dockerfile`, `centre-api/Makefile`, `.github/workflows/api-ci.yml` |
| Node.js | 18 | `centre-web/Dockerfile`, `.github/workflows/web-ci.yml` |
| Docker / Docker Compose | Current local version | API compose services and optional test Keycloak |
| `make` | Any recent version | API command wrapper |
| `oc` CLI | 4.x | OpenShift deploy/support work only |
| Helm | 3.x | Chart install/upgrade work only |

## Backend Local Setup

```bash
cd centre-api
cp sample.env .env
docker compose up -d
make setup
make db
make run
```

The API is available at:

- Swagger/API root: `http://localhost:5000/api`
- Health: `http://localhost:5000/ops/healthz`
- Readiness: `http://localhost:5000/ops/readyz`

`make setup` creates `venv/`, installs `requirements.txt`, installs dev requirements, and installs the package in editable mode. The Makefile currently invokes `python3.9`, so install Python 3.9 locally or adjust the Makefile intentionally.

## Backend Docker Compose

`centre-api/docker-compose.yml` defines:

| Service | Host port | Purpose |
| --- | --- | --- |
| `centre-api-db` | `54332` | Main local PostgreSQL database |
| `centre-api-db-test` | `54333` | Test PostgreSQL database |
| `keycloak` | `8081` | Keycloak 12.0.2 local identity provider |

Important local auth caveat: the main compose file mounts `./setup` into the Keycloak container, but `centre-api/setup` is not committed. A committed test realm exists under `centre-api/tests/docker/setup/demo-realm.json`. Either provide the expected local setup folder, use the test compose directory intentionally, or point `.env` at a reachable shared auth environment.

Also check `DATABASE_TEST_PORT` before running pytest. The compose test database is exposed on host port `54333`; `sample.env` currently uses `5432`.

## Frontend Local Setup

```bash
cd centre-web
cp sample.env .env
npm install
npm run dev
```

Vite uses its default dev port, usually `http://localhost:5173`.

Set `VITE_API_URL` to the API base URL without `/api`, for example:

```text
VITE_API_URL=http://localhost:5000
```

The frontend code appends `/api` internally through `AppConfig.apiUrl`.

## Test And Quality Commands

Backend:

```bash
cd centre-api
make pylint
make flake8
make lint
make test
make ci
```

`make ci` runs linting and pytest locally. The GitHub API CI workflow currently runs linting and a Docker build; its pytest job exists but is commented out.

Frontend:

```bash
cd centre-web
npm run lint
npm run build
npm run preview
```

The repo has Cypress dependencies and support files, but `package.json` does not currently define `cy:run` or `cy:open` scripts, and no Cypress config file is committed at the project root. The GitHub web CI workflow has a Cypress job scaffold, but it is commented out.

## API Command Reference

| Command | Description |
| --- | --- |
| `make setup` | Recreate local virtualenv, install runtime and dev dependencies |
| `make run` | Run migrations, then start Flask on port 5000 |
| `make db` | Run `flask db upgrade` |
| `make db-migrate message="..."` | Run `flask db migrate -m "..."` |
| `make db-downgrade` | Roll back one migration revision |
| `make test` | Run pytest |
| `make lint` | Run pylint and flake8 |
| `make clean` | Remove virtualenv, build artifacts, Python cache, and test cache |

## Frontend Command Reference

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Run TypeScript build and Vite production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the built app locally |

## Common Setup Issues

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `python3.9: command not found` | Local Python 3.9 is missing | Install Python 3.9 or intentionally update the Makefile/runtime together |
| API cannot connect to DB | Compose database is not running or `.env` port mismatch | Start compose and verify `DATABASE_PORT=54332` |
| Tests cannot connect to DB | `DATABASE_TEST_PORT` does not match test database exposure | Use `54333` for the compose test DB or run tests against a dedicated local DB |
| Keycloak import fails | Missing `centre-api/setup` folder | Provide local realm import files or use `centre-api/tests/docker` intentionally |
| Frontend calls `/api/api/...` | `VITE_API_URL` includes `/api` | Set `VITE_API_URL` to the API host only |
| `401 Unauthorized` | OIDC issuer/audience/config mismatch | Align frontend `VITE_OIDC_AUTHORITY`, backend `JWT_OIDC_*`, and Keycloak client config |
| `403 Access denied` on URL/SSL page | Missing `view_ssl_info` or `edit_app_url` client role | Add the role in Keycloak/Auth API for the `epic-centre` client |
