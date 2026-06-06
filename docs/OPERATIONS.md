# EPIC.centre — Operations Runbook

---

## Access Request & Approval Flow

**Submit**
```
User → POST /api/applications/{id}/access-requests
     → status = PENDING
     → email → user:        access_request_submitted_confirmation.html
     → email → DST + admins: access_request_received_notification.html
```

**Approve** (via User Management)
```
Admin → PUT /api/users/{username}/access  { app_name, group_name, access_request_id }
      → Keycloak group assigned
      → status = APPROVED
      → email → user: access_granted_notification.html
```

**Reject** (via Access Requests)
```
Admin → PATCH /api/access-requests/{id}  { status: REJECTED }
      → status = REJECTED
      → email → user: access_denied_notification.html
```

### Request Status FSM

| Status | Set By | Transition |
|--------|--------|-----------|
| `PENDING` | `create_access_request()` | Initial state |
| `APPROVED` | `update_user_access()` | Admin assigns role |
| `REJECTED` | `process_access_request(REJECTED)` | Admin declines |
| `CANCELLED` | — | Request withdrawn |

### Approval Permissions

| Role | Can Approve |
|------|------------|
| DST Admin (`CENTRE/SUPER_USER`) | All apps **except** `EPIC_COMPLIANCE` |
| App Admin (`{APP}/INSTANCE_ADMIN`) | Their assigned app only |
| Compliance Admin (`COMPLIANCE/SUPERUSER`) | `EPIC_COMPLIANCE` only — DST Admin cannot override |

---

## Email Notifications

All emails are sent from `DST_EMAIL`. Templates live in the backend email template directory.

| Template | Event | Recipients |
|----------|-------|-----------|
| `access_request_submitted_confirmation.html` | User submits request | Requesting user |
| `access_request_received_notification.html` | User submits request | DST Admin + App Admins |
| `access_granted_notification.html` | Role assigned via User Management | Requesting user |
| `access_denied_notification.html` | Request rejected | Requesting user |
| `ssl_digest_notification.html` | SSL cert approaching expiry | DST Admin |

---

## Admin Tasks

### Approve / Reject an Access Request

1. **Access Management** → **Pending Requests**
2. Select request → **Approve** (opens role assignment) or **Reject**
3. On approval: select role → save → triggers `access_granted_notification.html`
4. On rejection: confirm → triggers `access_denied_notification.html`

### Assign Role Directly (bypassing request workflow)

1. **User Management** → search by username or email
2. Select application → update group assignment
3. `UserService.update_user_access()` calls Keycloak Admin API immediately; no pod restart required

### Enable / Disable User Account

1. **User Management** → search → toggle **Enabled**
2. Calls `AuthApiService.patch_user(username, {"enabled": True/False})`
3. Disabling a user blocks all EPIC application logins via Keycloak

### Register a New Application

Requires a developer:

1. Create Alembic migration inserting row into `applications` with correct `keycloak_group_name` and `keycloak_client_id`
2. Add `EPIC_GROUP_*`, `EPIC_ADMIN_GROUP_PATH_*`, `EPIC_APP_CLIENT_*` env vars
3. Apply migration (`make db` locally; `flask db upgrade` in OpenShift)
4. Update `EpicAppName` and `EpicAppClientName` enums in `centre-api/src/centre_api/enums/epic_app.py`

---

## Health & Monitoring

### Health Check Endpoint

```
GET /api/ops/healthz
→ 200 OK  (liveness probe — checked every 30 s by OpenShift)
```

### Pod Status

```bash
oc get pods -n [PREFIX]-[env]
oc describe pod [POD_NAME] -n [PREFIX]-[env]
```

### Live Logs

```bash
oc logs deployment/centre-api  -n [PREFIX]-[env] --follow
oc logs deployment/centre-web  -n [PREFIX]-[env] --follow
oc logs centre-patroni-0       -n [PREFIX]-[env] --follow
```

### Rollout Status

```bash
oc rollout status deployment/centre-api -n [PREFIX]-[env]
oc rollout status deployment/centre-web -n [PREFIX]-[env]
```

### Restart Services

```bash
oc rollout restart deployment/centre-api -n [PREFIX]-[env]
oc rollout restart deployment/centre-web -n [PREFIX]-[env]
```

### Exposed Routes

```bash
oc get routes -n [PREFIX]-[env]
```

---

## Troubleshooting

### HTTP 401 Unauthorized

| Check | Command / Action |
|-------|-----------------|
| Token expired | Ask user to re-authenticate |
| `JWT_OIDC_ISSUER` mismatch | Must match `iss` claim in token exactly |
| Keycloak unreachable from pod | `oc exec -it deployment/centre-api -- curl [KEYCLOAK_URL]/auth/realms/centre/.well-known/openid-configuration` |

### HTTP 403 Forbidden

| Check | Command / Action |
|-------|-----------------|
| User missing required Keycloak group | Verify in Keycloak Admin Console → Users → Groups |
| `EPIC_ADMIN_GROUP_PATH_*` mismatch | Env var must match exact Keycloak group path string |

### User Search Returns Empty

| Check | Action |
|-------|--------|
| `CENTRE_ADMIN_CLIENT_SECRET` incorrect | Verify against secrets vault; refresh via `make update-env` |
| `centre-admin` client missing Keycloak roles | Verify `view-users` + group management roles in Keycloak Admin |
| API logs | `oc logs deployment/centre-api -n [PREFIX]-[env] | grep -i keycloak` |

### Launchpad Shows No Applications

| Check | Action |
|-------|--------|
| `applications` table empty or all inactive | `SELECT id, name, is_active FROM applications;` |
| `EPIC_GROUP_*` env vars not set | Verify env vars match Keycloak group names exactly |

### Emails Not Sending

| Check | Action |
|-------|--------|
| Unsent items in queue | `SELECT * FROM email_queue WHERE status = 'PENDING';` |
| SMTP configuration | Check `MAIL_*` vars in secrets vault |
| Error messages | `SELECT error_message FROM email_queue WHERE status != 'PENDING';` |

### Blank Page After Deploy

| Check | Action |
|-------|--------|
| `VITE_API_URL` incorrect | Must point to the API route for that environment |
| `VITE_OIDC_AUTHORITY` incorrect | Must match Keycloak realm URL for that environment |
| Stale browser cache | Hard refresh (`Cmd+Shift+R`) or incognito window |
| Nginx logs | `oc logs deployment/centre-web -n [PREFIX]-[env]` |

---

## Known Limitations

| Issue | Detail |
|-------|--------|
| **Migrations not auto-applied** | Alembic migrations must be run manually via `flask db upgrade` after each deployment that includes schema changes |
| **CORS allowlist is exact-match** | `CORS_ORIGIN` does not support wildcards — all allowed origins must be listed explicitly |
| **SSL expiry is manually tracked** | The `application_url.ssl_expiry` field is not auto-populated — it must be updated manually when certs are renewed |
| **Local Keycloak is v12** | Docker Compose uses Keycloak 12.0.2 for test fixture compatibility; minor token claim differences may appear vs. production |
