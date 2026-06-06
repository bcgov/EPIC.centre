# EPIC.centre — Development Setup

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.12 | Use `pyenv install 3.12` |
| Node.js | 18+ | Use `nvm install 18` |
| Docker + Docker Compose | Latest | Required for local services |
| `make` | Any | Pre-installed on macOS/Linux |
| `oc` CLI | 4.x | Required for OpenShift operations only |

---

## Local Services (Docker Compose)

From `centre-api/`:

```bash
docker-compose up -d
```

Starts three containers:

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `centre-api-db` | `postgres` | `54332` | Main development database |
| `centre-api-db-test` | `postgres` | `54333` | Isolated test database |
| `keycloak` | `keycloak:12.0.2` | `8081` | OIDC provider — realm: `demo`, credentials in `centre-api/setup/` |

Keycloak imports test realm fixtures from `centre-api/setup/` on start. Allow ~30 seconds before proceeding.

---

## Backend Setup

```bash
cd centre-api

cp sample.env .env          # Copy env template — see CONFIGURATION.md
make setup                  # Create venv + pip install -r requirements.txt + pip install -e .
make db                     # flask db upgrade — applies all pending Alembic migrations
make run                    # flask run -p 5000 via Gunicorn
```

- API base URL: `http://localhost:5000/api`
- Swagger UI: `http://localhost:5000/api` (Flask-RESTX auto-generated)

---

## Frontend Setup

```bash
cd centre-web

cp sample.env .env          # Copy env template — see CONFIGURATION.md
npm install
npm run dev                 # Vite dev server with HMR
```

- App URL: `http://localhost:3000`
- Proxies API requests per `vite.config.ts`

---

## Running Tests

### Backend

```bash
cd centre-api
make test        # pytest — uses DATABASE_TEST_* vars, JWT_OIDC_TEST_* for mock tokens
make ci          # pylint + flake8 + pytest (full CI equivalent)
```

Test database runs on port `54333`. JWT validation in tests uses `JWT_OIDC_TEST_*` env vars pointing to the local Keycloak `demo` realm.

### Frontend

```bash
cd centre-web
npm run cy:run      # Cypress headless
npm run cy:open     # Cypress interactive UI
```

---

## Backend CLI Reference

| Command | Description |
|---------|-------------|
| `make setup` | Create virtualenv, install all deps including dev extras |
| `make run` | Start Flask dev server on `:5000` |
| `make db` | `flask db upgrade` — apply all pending Alembic migrations |
| `make db-migrate message="…"` | `flask db migrate` — auto-generate new migration from model diff |
| `make db-downgrade` | `flask db downgrade` — roll back one migration revision |
| `make test` | `pytest` |
| `make lint` | `pylint` + `flake8` |
| `make ci` | `lint` + `test` |
| `make clean` | Remove virtualenv, build artefacts, test cache |

## Frontend CLI Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR on `:3000` |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | ESLint |
| `npm run cy:run` | Cypress headless test run |
| `npm run cy:open` | Cypress interactive runner |

---

## Common Setup Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Keycloak not reachable at `:8081` | Container still starting | Wait 30–60 s; check `docker logs keycloak` |
| `flask db upgrade` fails | DB container not running or wrong port | Verify `DATABASE_PORT=54332` in `.env`; check `docker ps` |
| CORS errors in browser console | Frontend origin not in allowlist | Add `http://localhost:3000` to `CORS_ORIGIN` in `.env` |
| `401 Unauthorized` on all API calls | `JWT_OIDC_ISSUER` mismatch | Must match the local Keycloak issuer URL set in `.env` exactly |
| `make: venv/bin/activate: No such file` | Stale virtualenv state | `make clean && make setup` |
