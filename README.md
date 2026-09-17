# EPIC.centre

EPIC.centre is the front door for EPIC staff access. It gives users one launchpad for EPIC applications and gives authorized administrators one place to review access requests, manage application group membership, and maintain application URL/SSL information.

This repository contains two deployable services:

| Service | Path | Purpose |
| --- | --- | --- |
| `centre-web` | `centre-web/` | React/Vite single-page application served by Nginx |
| `centre-api` | `centre-api/` | Flask REST API for application registry, access management, user management proxying, settings, analytics, and URL/SSL records |

## What EPIC.centre Does

- Shows staff the EPIC applications they can access.
- Lets staff request access to supported applications.
- Lets DST and app administrators approve or reject access requests.
- Delegates user and group operations to EPIC.auth/Auth API and Keycloak.
- Tracks app ordering, bookmarks, last-accessed timestamps, access requests, email notifications, and application URL/SSL metadata.
- Syncs EPIC Submit staff users when Submit access is granted.

## Documentation

Start with the documentation map:

- [Documentation overview](docs/OVERVIEW.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Development setup](docs/DEVELOPMENT.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Database](docs/DATABASE.md)
- [Architecture diagrams](docs/diagrams/README.md)

The canonical architecture document is [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The older root-level [EPIC_CENTRE_ARCHITECTURE.md](EPIC_CENTRE_ARCHITECTURE.md) is kept only as a pointer for existing links.

## Quick Start

Prerequisites:

- Python 3.9, matching the API Dockerfile, Makefile, and CI workflow.
- Node.js 18, matching the web Dockerfile and CI workflow.
- Docker with Compose support.
- Optional: `oc` and Helm for OpenShift work.

Backend:

```bash
cd centre-api
cp sample.env .env
docker compose up -d
make setup
make run
```

The API runs at `http://localhost:5000/api`. Operational probes are mounted outside the API prefix at `http://localhost:5000/ops/healthz` and `http://localhost:5000/ops/readyz`.

Frontend:

```bash
cd centre-web
cp sample.env .env
npm install
npm run dev
```

The Vite dev server runs at `http://localhost:5173` unless Vite selects another port.

Local authentication needs a Keycloak realm or a reachable shared auth environment. The committed API `docker-compose.yml` references a `centre-api/setup` import folder that is not present in the repo; test Keycloak fixtures live under `centre-api/tests/docker/setup`.

## Repository Layout

```text
EPIC.centre/
|-- centre-api/          # Flask API, migrations, tests, Dockerfile
|-- centre-web/          # React/Vite app, Nginx container, Cypress support files
|-- deployment/charts/   # Helm charts for API, web, Patroni, and BuildConfigs
|-- docs/                # Maintained project documentation
`-- .github/workflows/   # CI/CD workflows
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the current CI/CD flow, promotion behavior, rollback options, and recommended hardening items.
