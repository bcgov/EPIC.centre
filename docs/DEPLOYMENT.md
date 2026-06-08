# EPIC.centre — Deployment

---

## Overview

| Namespace | Purpose | Deploy Trigger |
|-----------|---------|---------------|
| `[PREFIX]-tools` | ImageStream registry, BuildConfigs | — |
| `[PREFIX]-dev` | Continuous deployment | Auto on push to `develop` |
| `[PREFIX]-test` | QA / UAT | Manual `workflow_dispatch` |
| `[PREFIX]-prod` | Production | Manual `workflow_dispatch` |

Images are built once and promoted by re-tagging — no rebuild at promotion time.

---

## CI/CD Pipeline

```
Push to develop
    ├── CI: api-ci.yml  (pylint · flake8 · pytest)
    ├── CI: web-ci.yml  (ESLint · Cypress)
    ├── CD: api-cd.yml  (docker build → ImageStream :latest → tag :dev → rollout dev)
    └── CD: web-cd.yml  (docker build → ImageStream :latest → tag :dev → rollout dev)

dev  ──[workflow_dispatch: test]──▶  test  ──[workflow_dispatch: prod]──▶  prod
```

---

## Workflows

All in `.github/workflows/`.

| Workflow | Trigger | Action |
|----------|---------|--------|
| `api-ci.yml` | Push / PR to `develop`, `main` | pylint · flake8 · pytest |
| `api-cd.yml` | Push to `develop` | Build API image → push → tag `:dev` → rollout restart |
| `web-ci.yml` | Push / PR to `develop`, `main` | ESLint · Cypress |
| `web-cd.yml` | Push to `develop` | Build web image → push → tag `:dev` → rollout restart |
| `deploy.yml` | `workflow_dispatch` (`test` \| `prod`) | Re-tag images → rollout restart both services |

---

## Promoting a Release

```
GitHub → Actions → Deploy → Run workflow → environment: test | prod
```

On production promotion, a dated rollback snapshot is created automatically:
```
centre-api:prod-YYYY-MM-DD
```

---

## Rollback

**Option A — re-tag snapshot** (preferred)

```bash
oc tag centre-api:prod-2025-11-15 centre-api:prod -n [PREFIX]-tools
oc tag centre-web:prod-2025-11-15 centre-web:prod -n [PREFIX]-tools
oc rollout restart deployment/centre-api deployment/centre-web -n [PREFIX]-prod
```

**Option B — rollout undo**

```bash
oc rollout undo deployment/centre-api -n [PREFIX]-prod
oc rollout undo deployment/centre-web -n [PREFIX]-prod
```

---

## Helm Charts

Charts in `deployment/charts/` — applied when provisioning or updating infrastructure, not on every deploy.

| Chart | Provisions |
|-------|-----------|
| `centre-api/` | Deployment, Service, Route, ConfigMap |
| `centre-api-bc/` | BuildConfig, ImageStream |
| `centre-web/` | Deployment, Service, Route, Nginx ConfigMap |
| `centre-web-bc/` | BuildConfig, ImageStream |
| `centre-patroni/` | StatefulSet, Services, NetworkPolicy, RBAC |

```bash
helm upgrade --install centre-api ./deployment/charts/centre-api \
  --values ./deployment/charts/centre-api/values.yaml
```

---

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `OPENSHIFT_LOGIN_REGISTRY` | OpenShift API server URL |
| `OPENSHIFT_SA_TOKEN` | Service account token for CI/CD |
| `OPENSHIFT_SA_NAME` | Service account name (for `docker login`) |
| `OPENSHIFT_IMAGE_REGISTRY` | OpenShift internal image registry host |
| `OPENSHIFT_REPOSITORY` | OpenShift project prefix |

---

## Post-Deploy Checklist

**1. Refresh secrets** (if env vars changed)

```bash
export OPENSHIFT_REPOSITORY=[PREFIX]
export OPS_REPOSITORY=[OPS_PREFIX]
export TAG_NAME=dev   # or test / prod
make update-env
```

**2. Run migrations** (if schema changes included)

```bash
oc exec -it deployment/centre-api -n [PREFIX]-[env] -- flask db upgrade
```
