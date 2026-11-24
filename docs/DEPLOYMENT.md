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
| `api-ci.yml` | Pull requests to `develop` touching `centre-api/**` | Installs dependencies, runs pylint and flake8, runs pytest against PostgreSQL 16 and uploads coverage to Codecov (`centre-api` flag), builds Docker image. |
| `web-ci.yml` | Pull requests to `develop` touching `centre-web/**`, pushes to `develop`, manual dispatch | Runs `npm run lint`; runs Cypress component tests and uploads coverage to Codecov (`centre-web` flag); runs `npm run build --quiet || true`, so build failures do not currently fail CI. |
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
| `CODECOV_TOKEN` | Codecov upload token for the repository, from the bcgov Codecov account |

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

## SSL Certificate Check Job

`centre-api-ssl-check` is a CronJob in the `centre-api` chart that runs `flask ssl run` daily at 15:00 UTC (7am PST, 8am PDT), using the same image as the API. See [ARCHITECTURE.md](ARCHITECTURE.md#ssl-certificate-checks) for what it does.

The API chart isn't applied with `helm upgrade`, because its live ConfigMap and Deployment have been edited by hand. The job runs in two stages: checks only, then email once Eagle Notify is available.

### Checks only

With `SSL_NOTIFICATION_RECIPIENTS` empty, the job checks every certificate and keeps the page up to date, sends no email and doesn't contact Eagle Notify. Dev and test stay this way: every environment's database holds the same DEV, TEST and PROD URLs, so only prod should ever email.

1. **CronJob:** render only the CronJob, with the same image tag as the environment's API Deployment, and apply it:

   ```bash
   helm template centre-api deployment/charts/centre-api \
     --values deployment/charts/centre-api/values.prod.yaml --set image.tag=prod \
     --show-only templates/cronjob-ssl-check.yaml | oc apply -n [PREFIX]-prod -f -
   ```

2. **Network:** the job's pods are labelled `app=centre-api-ssl-check`, not `app=centre-api`, so the API Service doesn't route to them. They need the same database access as the API pods, plus outbound HTTPS to every application host.

3. **First run:** start one now rather than waiting for the schedule, and read its log. It should list every certificate and end with "SSL_NOTIFICATION_RECIPIENTS is empty, so no notices are sent here".

   ```bash
   oc create job ssl-check-first-run --from=cronjob/centre-api-ssl-check -n [PREFIX]-prod
   oc logs -f job/ssl-check-first-run -n [PREFIX]-prod
   ```

### Turning on email

Once Eagle Notify is in prod:

1. **Eagle Notify:** add Centre's Keycloak service account (`KEYCLOAK_SERVICE_ACCOUNT_ID`) to `sendClients` in eagle-notify's `azure/main.prod.bicepparam`, and deploy it with Eagle Notify's Bicep. Don't set `SEND_CLIENTS` in the Azure portal: each Bicep deploy rewrites every app setting. Optionally add `centre-ssl` to an app's `callers` in `notifyApps` so the sends show on its dashboard.

   ```bicep
   {
     id: 'centre-ssl'
     azp: '<KEYCLOAK_SERVICE_ACCOUNT_ID>'
     username: 'service-account-<KEYCLOAK_SERVICE_ACCOUNT_ID>'
   }
   ```

2. **Service account:** the job loads the API's ConfigMap and the Secrets in `sslCheck.envFromSecrets` (default `centre-api`) whole. Check that `KEYCLOAK_SERVICE_ACCOUNT_ID` and `KEYCLOAK_SERVICE_ACCOUNT_SECRET` come from one of them, and add their Secret to the list if not. The job's pods also need outbound HTTPS to Eagle Notify.

3. **Settings:** add the job's email keys to the live ConfigMap:

   ```bash
   oc set data configmap/centre-api -n [PREFIX]-prod \
     EAGLE_NOTIFY_EMAIL_ENDPOINT=https://<eagle-notify host>/api/messages \
     SSL_NOTIFICATION_RECIPIENTS=<distribution list address>
   ```

4. **Run:** start a run as above. Each certificate is reminded once, for the threshold it's within now, not once for every threshold it passed while email was off.

The `CHECK_SSL` job in `bcgov/EPIC.common` (`jobs/epic-cron/tasks/ssl_checker.py`) is replaced by this one. It was never scheduled, and the `application_urls` columns it wrote no longer exist.

## Post-Deploy Checklist

1. Confirm API rollout status.
2. Confirm web rollout status.
3. Check `/ops/healthz` and `/ops/readyz`.
4. Confirm frontend `config.js` values are correct for the environment.
5. Confirm the API pod completed the migration init container.
6. Smoke test login, launchpad, access request catalog, admin request list, and application URL page if relevant.
7. Review logs for startup or integration errors.
8. If the SSL check job changed, confirm its last run succeeded: `oc get jobs -l app=centre-api-ssl-check`.

## Current Hardening Opportunities

- Make frontend build failures fail CI by removing `|| true`.
- Promote immutable commit or build tags instead of retagging mutable `latest` for test/prod.
- Keep frontend and backend admin group path definitions aligned with Helm values.
