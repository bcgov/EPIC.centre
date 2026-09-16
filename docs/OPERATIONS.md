# EPIC.centre Operations Runbook

Last reviewed: 2026-09-16

Use this runbook for day-to-day support, access workflow triage, and deployment checks.

## Health Checks

| Check | Endpoint | What it does |
| --- | --- | --- |
| Liveness | `/ops/healthz` | Runs `select 1` against the configured database |
| Readiness | `/ops/readyz` | Returns API readiness message |
| API docs | `/api` | Flask-RESTX Swagger/OpenAPI UI |

OpenShift probes in the API Helm chart use `/ops/healthz` and `/ops/readyz` on port `8080`.

## Common OpenShift Commands

```bash
oc get pods -n [PREFIX]-[env]
oc get routes -n [PREFIX]-[env]
oc rollout status deployment/centre-api -n [PREFIX]-[env]
oc rollout status deployment/centre-web -n [PREFIX]-[env]
oc logs deployment/centre-api -n [PREFIX]-[env] --follow
oc logs deployment/centre-web -n [PREFIX]-[env] --follow
```

Restart services:

```bash
oc rollout restart deployment/centre-api -n [PREFIX]-[env]
oc rollout restart deployment/centre-web -n [PREFIX]-[env]
```

Inspect API env:

```bash
oc set env deployment/centre-api --list -n [PREFIX]-[env]
```

## Access Request Workflow

### Submit

```text
User -> POST /api/applications/{id}/access_request
     -> access_requests.status = PENDING
     -> email_queue rows:
        - access_request_submitted_confirmation.html to requester
        - access_request_received_notification.html to DST
        - access_request_received_notification.html to app admins, when app admins are found
```

Duplicate pending requests for the same user/app return the existing request.

### Approve

```text
Admin -> PUT /api/users/{username}/access
      -> Centre API verifies admin permission
      -> Centre API delegates group assignment to Auth API
      -> access_requests.status = APPROVED when access_request_id is provided
      -> email_queue row: access_granted_notification.html
      -> if app is epic_submit, Centre API calls Submit API staff-user sync
```

### Reject

```text
Admin -> PUT /api/access-requests/{id}?status=REJECTED
      -> Centre API verifies admin permission
      -> access_requests.status = REJECTED
      -> email_queue row: access_denied_notification.html
```

### Revoke

```text
Admin -> DELETE /api/users/{username}/access
      -> Centre API verifies admin permission
      -> Centre API delegates group removal to Auth API
```

## Admin Permission Rules

| Actor | Current behavior |
| --- | --- |
| DST admin | Member of Centre admin group path; can administer most apps |
| Compliance admin | Required for Compliance request processing; DST admin alone is not enough in access-request processing |
| App admin | Can administer users/requests for apps where they have the configured admin group path |
| URL/SSL viewer | Needs `view_ssl_info` or `edit_app_url` client role |
| URL/SSL editor | Needs `edit_app_url` client role |

Group path configuration must stay aligned across backend env values, Helm values, and frontend constants. See [CONFIGURATION.md](CONFIGURATION.md).

## Email Queue

Centre creates rows in `email_queue`; delivery depends on the configured downstream process. No committed mail-sending worker was found in this repo during this review.

Templates referenced by code:

| Template | Queued when |
| --- | --- |
| `access_request_submitted_confirmation.html` | User submits request |
| `access_request_received_notification.html` | Request notification to DST/app admins |
| `access_granted_notification.html` | Admin approves by assigning access |
| `access_denied_notification.html` | Admin rejects request |
| `ssl_digest_notification.html` | Enum exists; no queueing implementation found in this repo review |

Useful queries:

```sql
select id, template_name, status, error_message, created_at, sent_at
from email_queue
order by created_at desc;
```

```sql
select id, template_name, payload
from email_queue
where status = 'PENDING'
order by created_at asc;
```

## Application URL And SSL Operations

The `/application-urls` page is controlled by token roles on the `epic-centre` client:

- `view_ssl_info` allows read access.
- `edit_app_url` allows create, update, and delete.

Records are stored in `application_urls`. The UI groups records by application and certificate host, highlights expiry/attention states, and distinguishes platform-managed OpenShift hosts.

Current code stores SSL fields (`ssl_expiry`, `ssl_status`, `last_checked`, renewal fields), but this review did not find an automated certificate scanner in the repo. Treat the records as maintained by user workflow or an external process unless such a scanner is added.

## Troubleshooting

### User Cannot Sign In

| Check | Action |
| --- | --- |
| OIDC authority | Verify `VITE_OIDC_AUTHORITY` and backend `JWT_OIDC_ISSUER` point to the expected realm |
| Client/audience | Verify `VITE_CLIENT_ID` and `JWT_OIDC_AUDIENCE` match the Keycloak client setup |
| Redirect URI | Verify `VITE_APP_URL` matches registered callback URL |
| Browser session | Ask user to log out/in or try a private window |

### API Returns 401

| Check | Action |
| --- | --- |
| Token issuer/audience | Decode token and compare `iss` and `aud` to backend `JWT_OIDC_*` |
| JWKS/discovery | Verify `JWT_OIDC_WELL_KNOWN_CONFIG` is reachable from the pod |
| Expired token | Ask user to refresh/sign in again |

### API Returns 403

| Check | Action |
| --- | --- |
| Missing app admin group | Verify user group path in Auth API/Keycloak |
| Frontend/backend group mismatch | Compare `adminGroupPaths.ts`, backend env, and Helm values |
| URL/SSL role missing | Verify `view_ssl_info` or `edit_app_url` in token client roles |

### User Search Fails Or Returns Empty

| Check | Action |
| --- | --- |
| Auth API URL | Verify `AUTH_API` in API pod env |
| Auth API token forwarding | Confirm request includes bearer token and API logs do not show downstream 401/403 |
| Auth API availability | Call the Auth API route from within the pod/network if access allows |
| Group representation | User detail calls request `group_brief_representation=false`; verify Auth API supports that parameter |

### Launchpad Missing Applications

| Check | Action |
| --- | --- |
| App registry | Query `applications` for active rows |
| Keycloak groups | Confirm user belongs to expected app groups |
| Public apps | `document_search` and `intranet` should be added by service logic |
| Launch URLs | Confirm corresponding `*_LAUNCH_URL` env values |

### Access Request Approval Fails

| Check | Action |
| --- | --- |
| Admin permission | Confirm current admin has the app admin group path |
| Compliance special case | Use a Compliance admin for Compliance requests |
| Auth API mutation | Check API logs for `update_user_group` errors |
| Submit sync | For Submit approvals, check Submit API errors; Centre catches and logs Submit sync failures after group assignment |

### Application URL Page Is Blank Or Forbidden

| Check | Action |
| --- | --- |
| Token roles | Confirm `view_ssl_info` or `edit_app_url` is present |
| API response | Check `/api/application-urls` for 403 or data errors |
| Data | Query `application_urls where is_active = true` |

### Deployment Looks Healthy But Frontend Calls Wrong API

| Check | Action |
| --- | --- |
| Runtime config | Inspect mounted web `config.js` |
| API URL shape | `VITE_API_URL` should not include `/api` |
| Browser cache | Hard refresh or private window |

## Support Data Queries

Pending requests:

```sql
select ar.id, ar.status, ar.user_auth_guid, a.name, ar.created_date
from access_requests ar
join applications a on a.id = ar.app_id
where ar.status = 'PENDING'
order by ar.created_date desc;
```

Recent login history:

```sql
select lh.user_auth_guid, a.name, lh.last_login_time
from login_histories lh
join applications a on a.id = lh.app_id
order by lh.last_login_time desc;
```

URL/SSL records needing attention:

```sql
select app_name, environment, url, ssl_status, ssl_expiry, renewal_status
from application_urls
where is_active = true
  and (ssl_status in ('Expired', 'Error', 'Expiring Soon') or ssl_expiry is null)
order by app_name, environment;
```

## Known Operational Gaps

- API CI does not currently run pytest in GitHub Actions.
- Web CI build failures do not currently fail the workflow because the build command ends with `|| true`.
- Cypress scaffolding exists, but scripts/config are not fully wired in this repo.
- Manual promotion retags mutable `latest`; verify the source image before promoting.
- Email delivery and SSL scanning are not implemented in the reviewed API code, only the queue/table fields and enum values are present.
