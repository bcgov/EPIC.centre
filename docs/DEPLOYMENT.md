# EPIC.centre Deployment

Last reviewed: 2026-09-16

EPIC.centre deploys to OpenShift using Docker images, GitHub Actions, and Helm-managed Kubernetes/OpenShift resources.

## Environments

| Namespace pattern | Purpose |
| --- | --- |
| `[PREFIX]-tools` | Image registry namespace and BuildConfig/ImageStream resources |
| `[PREFIX]-dev` | Development deployment |
| `[PREFIX]-test` | Test/UAT deployment |
| `[PREFIX]-prod` | Production deployment |

The exact namespace prefix comes from the `OPENSHIFT_REPOSITORY` GitHub secret or local operator environment.

## Current GitHub Workflows

| Workflow | Trigger | Current behavior |
| --- | --- | --- |
| `api-ci.yml` | Pull requests to `develop` touching `centre-api/**` | Installs dependencies, runs pylint and flake8, builds Docker image. Pytest job is present but commented out. |
| `web-ci.yml` | Pull requests to `develop` touching `centre-web/**`, pushes to `develop`, manual dispatch | Runs `npm run lint`; runs `npm run build --quiet || true`, so build failures do not currently fail CI. Cypress job is present but commented out. |
| `api-cd.yml` | Pushes to `develop` touching `centre-api/**`, manual dispatch | Builds API image, pushes `latest` and selected env tag, restarts `centre-api` deployment. |
| `web-cd.yml` | Pushes to `develop` touching `centre-web/**`, manual dispatch | Builds web image, pushes `latest` and selected env tag, restarts `centre-web` deployment. |
| `deploy.yml` | Manual dispatch with `test` or `prod` | Retags current `centre-api:latest` and `centre-web:latest` to selected env, then restarts both deployments. |

## Image Flow

```text
push to develop
  -> api-cd.yml or web-cd.yml path filter
  -> docker build
  -> push image-registry/.../[service]:latest
  -> push image-registry/.../[service]:dev by default
  -> oc rollout restart deployment/[service] in [PREFIX]-dev

manual deploy.yml
  -> oc tag [service]:latest [service]:test or [service]:prod
  -> oc rollout restart deployment/[service] in selected namespace
```

Manual workflow dispatch on `api-cd.yml` or `web-cd.yml` can also build and tag for `dev`, `test`, or `prod` depending on the selected input.

## Helm Charts

Charts live in `deployment/charts/`.

| Chart | Purpose |
| --- | --- |
| `centre-api/` | API Deployment, Service, Route, ConfigMap, Secret wiring, probes, migration init container |
| `centre-api-bc/` | API BuildConfig and ImageStream |
| `centre-web/` | Web Deployment, Service, Route, runtime config ConfigMap |
| `centre-web.bc/` | Web BuildConfig and ImageStream |
| `centre-patroni/` | PostgreSQL/Patroni StatefulSet, services, RBAC, network policy |

GitHub CD workflows build and push images and restart existing deployments. They do not run Helm upgrades. Use Helm when chart templates or values change.

Example:

```bash
helm upgrade --install centre-api deployment/charts/centre-api \
  --namespace [PREFIX]-dev \
  --values deployment/charts/centre-api/values.yaml
```

Environment-specific values files such as `values.dev.yaml`, `values.test.yaml`, and `values.prod.yaml` are ignored by git and should be supplied securely by operators.

## API Startup And Probes

`centre-api` deployment behavior:

- Init container runs `/opt/app-root/pre-hook-update-db.sh`.
- The init script runs `flask db upgrade`.
- The app container starts Gunicorn on port `8080`.
- Readiness probe: `/ops/readyz`.
- Liveness probe: `/ops/healthz`.

`centre-web` deployment behavior:

- Nginx serves the built SPA on port `8080`.
- Runtime frontend configuration is mounted as `config.js` from the web ConfigMap.

## Required GitHub Secrets

| Secret | Purpose |
| --- | --- |
| `OPENSHIFT_LOGIN_REGISTRY` | OpenShift API server for `oc login` |
| `OPENSHIFT_SA_TOKEN` | Service account token for OpenShift and image registry operations |
| `OPENSHIFT_SA_NAME` | Registry login username |
| `OPENSHIFT_IMAGE_REGISTRY` | Image registry host |
| `OPENSHIFT_REPOSITORY` | Namespace prefix |

## Promotion

To promote through the current manual workflow:

1. Open GitHub Actions.
2. Run `Deploy`.
3. Select `test` or `prod`.
4. Verify both rollouts complete.

Commands to verify:

```bash
oc rollout status deployment/centre-api -n [PREFIX]-[env]
oc rollout status deployment/centre-web -n [PREFIX]-[env]
oc get pods -n [PREFIX]-[env]
oc get routes -n [PREFIX]-[env]
```

Because the current manual workflow retags `latest`, confirm what commit produced `latest` before promoting.

## Rollback

Preferred rollback depends on what image tags are available.

Rollout undo:

```bash
oc rollout undo deployment/centre-api -n [PREFIX]-[env]
oc rollout undo deployment/centre-web -n [PREFIX]-[env]
```

Retag a known good image:

```bash
oc tag centre-api:[KNOWN_GOOD_TAG] centre-api:[env] -n [PREFIX]-tools
oc tag centre-web:[KNOWN_GOOD_TAG] centre-web:[env] -n [PREFIX]-tools
oc rollout restart deployment/centre-api -n [PREFIX]-[env]
oc rollout restart deployment/centre-web -n [PREFIX]-[env]
```

The current workflows do not create dated production snapshot tags automatically.

## Post-Deploy Checklist

1. Confirm API rollout status.
2. Confirm web rollout status.
3. Check `/ops/healthz` and `/ops/readyz`.
4. Confirm frontend `config.js` values are correct for the environment.
5. Confirm the API pod completed the migration init container.
6. Smoke test login, launchpad, access request catalog, admin request list, and application URL page if relevant.
7. Review logs for startup or integration errors.

## Current Hardening Opportunities

- Re-enable API pytest in `api-ci.yml`.
- Make frontend build failures fail CI by removing `|| true`.
- Add or complete Cypress configuration/scripts before enabling the web Cypress job.
- Promote immutable commit or build tags instead of retagging mutable `latest` for test/prod.
- Keep frontend and backend admin group path definitions aligned with Helm values.
