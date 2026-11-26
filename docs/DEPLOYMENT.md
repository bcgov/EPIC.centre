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

1. **CronJob:** render only the CronJob, with the same image tag as the environment's API Deployment, and apply it. It reads only the `image`, `database` and `sslCheck` values, and the chart's defaults already point at Centre's image and database, so pass your `values.prod.yaml` with `--values` only if it overrides those.

   ```bash
   helm template centre-api deployment/charts/centre-api --set image.tag=prod \
     --show-only templates/cronjob-ssl-check.yaml | oc apply -n [PREFIX]-prod -f -
   ```

2. **Network:** the job's pods are labelled `app=centre-api-ssl-check`, not `app=centre-api`, so the API Service doesn't route to them. They need the same database access as the API pods, plus outbound HTTPS to every application host.

3. **First run:** start one now rather than waiting for the schedule, and read its log. It should list every certificate and end with "SSL_NOTIFICATION_RECIPIENTS is empty, so no notices are sent here".

   ```bash
   oc create job ssl-check-first-run --from=cronjob/centre-api-ssl-check -n [PREFIX]-prod
   oc logs -f job/ssl-check-first-run -n [PREFIX]-prod
   ```

### Turning on email

Centre sends through Eagle Notify the way EPIC.engage does: `POST /api/messages` at `EAGLE_NOTIFY_EMAIL_ENDPOINT`, as a sender listed in Eagle Notify's `SEND_CLIENTS`. Eagle Notify matches a sender by the token's client (`azp`) and username. Engage signs in as a Keycloak user (`metservice` on `eagle-admin-console`). Centre uses its service account's client-credentials token, whose username is `service-account-<client id>`.

Each Eagle Notify environment accepts tokens only from its own Keycloak: test from `test.loginproxy.gov.bc.ca`, prod from `loginproxy.gov.bc.ca`, and dev from neither.

1. **Service account:** Centre needs its own Keycloak client in each environment that sends (prod, and test for step 3). No environment had one as of November 2026: the `centre-api` Secrets held only empty, unused `KEYCLOAK_ADMIN_*` keys. In that environment's `eao-epic` realm, create a client with Client authentication and Service accounts roles on, and Standard flow and Direct access grants off. It needs no roles for email, since Eagle Notify checks only the client and username.

   Add its id and secret to the `centre-api` Secret. The job loads that Secret whole (`sslCheck.envFromSecrets`), so its next run picks them up. `read -rs` keeps the secret out of shell history.

   ```bash
   read -rs SA_SECRET
   oc set data secret/centre-api -n [PREFIX]-prod \
     KEYCLOAK_SERVICE_ACCOUNT_ID=<client id> KEYCLOAK_SERVICE_ACCOUNT_SECRET="$SA_SECRET"
   ```

   Get a token to check the client works and to read the values step 2 needs. Use `test.loginproxy.gov.bc.ca` for test.

   ```bash
   curl -s https://loginproxy.gov.bc.ca/auth/realms/eao-epic/protocol/openid-connect/token \
     -d grant_type=client_credentials -d client_id=<client id> -d client_secret="$SA_SECRET" \
   | python3 -c "import sys,json,base64; t=json.load(sys.stdin)['access_token'].split('.')[1]; t+='='*(-len(t)%4); p=json.loads(base64.urlsafe_b64decode(t)); print(p.get('azp'), p.get('preferred_username'))"
   ```

   It prints the token's `azp` and `preferred_username`. If `preferred_username` is `None`, the client is missing the `profile` scope, and Eagle Notify would refuse it with `403`.

   The API pod uses the same client to remove a user's EPIC.submit work assignments when their EPIC.track access is revoked. Submit only accepts that call from a token with a Submit staff role, so that also needs a role on the client. To give the live API Deployment the keys (this restarts it):

   ```bash
   oc set env deployment/centre-api -n [PREFIX]-prod --from=secret/centre-api \
     --keys=KEYCLOAK_SERVICE_ACCOUNT_ID,KEYCLOAK_SERVICE_ACCOUNT_SECRET
   ```

2. **Eagle Notify:** in eagle-notify's `azure/main.prod.bicepparam` (and `main.test.bicepparam` for step 3), add Centre's sender to `sendClients` and an app for it to `notifyApps`, next to engage's `engage-mail` and `epic-engage`. Deploy with eagle-notify's "Deploy infrastructure" workflow: a what-if run, then an apply run naming it. Prod deploys only from a tag. Don't set `SEND_CLIENTS` in the Azure portal: each deploy rewrites every app setting.

   ```bicep
   // sendClients: the values the token in step 1 printed
   {
     id: 'centre-mail'
     azp: '<azp>'
     username: '<preferred_username>'
   }

   // notifyApps: an invalid entry, such as a colour that isn't #rrggbb, makes every app's dashboard fail
   {
     id: 'epic-centre'
     name: 'EPIC.centre'
     colour: '#2E8540'
     roles: [
       'notify-admin'
     ]
     callers: [
       'centre-mail'
     ]
     templates: {
       'centre-ssl-renewal': 'SSL renewal reminder'
     }
   }
   ```

   Check `hourlySendBudget` in the same file. Every service sender, engage included, shares what's left of it after a quarter for sign-ups and half for staff: 23 an hour at 90, and 2 at the default of 8. A refused send waits for the next day's run.

3. **Try it on test:** this only works if test's `centre-api` ConfigMap has `KEYCLOAK_BASE_URL=https://test.loginproxy.gov.bc.ca`, and the test API Deployment has the keys from step 1's `oc set env`. Run once from the test API pod, sending to your own address. The settings apply to this one command only, so test's ConfigMap and CronJob still send nothing. `SSL_NOTICE_DAYS=400` makes every certificate due, so the run sends something:

   ```bash
   oc exec deploy/centre-api -n [PREFIX]-test -- env \
     EAGLE_NOTIFY_EMAIL_ENDPOINT=https://<Eagle Notify test host>/api/messages \
     SSL_NOTIFICATION_RECIPIENTS=<your address> \
     SSL_NOTIFICATION_SUBJECT_PREFIX='[TEST] ' \
     SSL_NOTICE_DAYS=400 \
     flask ssl run
   ```

   A failure ends the output with the reason. `401` means Eagle Notify doesn't list the client or trust the token's Keycloak. `403` means the token's username doesn't match `sendClients`. A Keycloak error means the service account itself failed.

4. **Settings:** once Eagle Notify is in prod, add the job's email keys to the live ConfigMap. The job's pods also need outbound HTTPS to Eagle Notify.

   ```bash
   oc set data configmap/centre-api -n [PREFIX]-prod \
     EAGLE_NOTIFY_EMAIL_ENDPOINT=https://<Eagle Notify prod host>/api/messages \
     SSL_NOTIFICATION_RECIPIENTS=<distribution list address>
   ```

   One distribution list sends one email a day, which keeps Centre well inside Eagle Notify's hourly budget.

5. **Run:** start a run as in "Checks only". Each certificate is reminded once, for the threshold it's within now, not once for every threshold it passed while email was off.

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
