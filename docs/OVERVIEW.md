# EPIC.centre Documentation Overview

Last reviewed: 2026-09-16

This directory is the maintained documentation set for EPIC.centre. The root README is intentionally short; the documents here hold the detail needed by developers, operators, and maintainers.

## Reading Path

1. [Architecture](ARCHITECTURE.md) - system overview, runtime components, auth flow, admin model, and diagrams.
2. [Development](DEVELOPMENT.md) - local API/web setup, commands, testing, and known local setup caveats.
3. [Database](DATABASE.md) - top-level schema, migrations, and seed data.
4. [Deployment](DEPLOYMENT.md) - GitHub Actions, OpenShift charts, image tags, probes, and release flow.
5. [Diagrams](diagrams/README.md) - PNG diagram assets linked from the architecture page.

## Documentation Ownership

Use these rules when changing documentation:

- The current source of truth for runtime behavior is the code under `centre-api/`, `centre-web/`, `deployment/charts/`, and `.github/workflows/`.
- Keep [ARCHITECTURE.md](ARCHITECTURE.md) as the single architecture narrative. Other documents should link to it instead of duplicating the whole system design.
- Keep service-specific quick commands in [centre-api/README.md](../centre-api/README.md) and [centre-web/README.md](../centre-web/README.md), but put cross-service setup in [DEVELOPMENT.md](DEVELOPMENT.md).
- Update [diagrams/README.md](diagrams/README.md) and the embedded images in [ARCHITECTURE.md](ARCHITECTURE.md) whenever diagram files are renamed, moved, or refreshed.
- Remove date, URL, and version placeholders before committing. If a value is environment-specific or private, describe where to find it.

## Current Application Registry

Application records are seeded by Alembic migrations and launch URLs are resolved from environment variables:

| Canonical name | Display title | Notes |
| --- | --- | --- |
| `condition_repository` | Condition Repository | Requestable application |
| `epic_compliance` | EPIC.compliance | Excluded from self-service request catalog |
| `document_search` | Document Search | Public launchpad entry, not requestable |
| `epic_track` | EPIC.track | Requestable application |
| `epic_public` | EPIC.public | Requestable application |
| `epic_submit` | EPIC.submit | Requestable application; approval also calls Submit API |
| `epic_engage` | EPIC.engage | Requestable application |
| `intranet` | Intranet | Public launchpad entry, not requestable |
| `epic_centre` | EPIC.centre | Inactive application row used for Centre analytics |

## Known Documentation-Sensitive Caveats

- The old root-level `EPIC_CENTRE_ARCHITECTURE.md` is now only a compatibility pointer. Keep active architecture content in [ARCHITECTURE.md](ARCHITECTURE.md).
- Local Keycloak fixture paths need attention before promising a one-command local auth setup. The main API compose file references `centre-api/setup`, while committed test fixtures live under `centre-api/tests/docker/setup`.
