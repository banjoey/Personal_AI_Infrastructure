---
name: ArgoCD
description: GitOps continuous deployment for Kubernetes. USE WHEN user mentions ArgoCD, GitOps, continuous deployment, CD, sync, application deployment from git, OR wants automated kubernetes deployments from GitLab repos.
---

# ArgoCD

GitOps continuous deployment skill for k3s cluster. Deploys and syncs applications from GitLab repositories automatically.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName ArgoCD
```

| Workflow | Trigger | File |
|----------|---------|------|
| **Install** | "install argocd", "set up gitops" | `workflows/Install.md` |
| **CreateApp** | "add application", "deploy from git" | `workflows/CreateApp.md` |
| **SyncApp** | "sync app", "deploy changes" | `workflows/SyncApp.md` |
| **ManageApps** | "list apps", "app status", "delete app" | `workflows/ManageApps.md` |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GitOps Flow                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐ │
│  │   GitLab     │  watch  │   ArgoCD     │  deploy │   k3s        │ │
│  │   Repos      │ ──────► │   Server     │ ──────► │   Cluster    │ │
│  │              │         │              │         │              │ │
│  │ apps/        │         │ Detect diff  │         │ Namespaces   │ │
│  │ └─ my-app/   │         │ Auto-sync    │         │ Deployments  │ │
│  │    └─ ...    │         │              │         │ Services     │ │
│  └──────────────┘         └──────────────┘         └──────────────┘ │
│                                                                      │
│  Push to main ─► ArgoCD detects ─► Syncs to cluster ─► App updated  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Application** | ArgoCD resource defining source repo and target cluster |
| **Project** | Logical grouping of applications with RBAC |
| **Sync** | Process of applying Git state to cluster |
| **Refresh** | Check Git repo for changes |
| **Health** | Status of deployed resources |
| **Diff** | Difference between Git and live state |

## GitOps Benefits

1. **Git as Single Source of Truth**: All config in version control
2. **Audit Trail**: Git history shows who changed what, when
3. **Easy Rollback**: Revert Git commit = rollback deployment
4. **Self-Healing**: ArgoCD auto-corrects drift from desired state
5. **No kubectl/helm on CI**: ArgoCD handles cluster access

## Examples

### Example 1: Deploy from GitLab

```
User: "Deploy my-api from GitLab"

ArgoCD skill activates:
1. Create Application manifest
2. Point to GitLab repo path
3. Configure auto-sync
4. ArgoCD deploys and monitors
```

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-api
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://gitlab.com/myuser/apps.git
    path: my-api
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: my-api
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### Example 2: Sync after code change

```
User: "Sync the API to pick up new changes"

ArgoCD skill activates:
1. Trigger refresh from Git
2. Sync application
3. Monitor rollout status
```

```bash
argocd app sync my-api
argocd app wait my-api --health
```

### Example 3: View deployment status

```
User: "Is everything deployed correctly?"

ArgoCD skill activates:
1. List all applications
2. Check sync and health status
3. Report any issues
```

```bash
argocd app list
argocd app get my-api
```

## Repository Structure

### App of Apps Pattern (Recommended)

```
gitlab.com/myuser/infrastructure/
├── apps/                    # Individual applications
│   ├── my-api/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── ingress.yaml
│   ├── postgres/
│   │   ├── Chart.yaml       # Helm chart reference
│   │   └── values.yaml
│   └── redis/
│       └── values.yaml
└── argocd/                  # ArgoCD app definitions
    ├── root-app.yaml        # Points to all apps
    ├── my-api.yaml
    ├── postgres.yaml
    └── redis.yaml
```

### Helm Chart Reference

```yaml
# apps/postgres/Chart.yaml
apiVersion: v2
name: postgres
version: 0.1.0

dependencies:
  - name: postgresql
    version: "12.x.x"
    repository: https://charts.bitnami.com/bitnami
```

```yaml
# apps/postgres/values.yaml
postgresql:
  auth:
    postgresPassword: "${POSTGRES_PASSWORD}"
    database: myapp
```

## Application Types

### Kustomize

```yaml
source:
  repoURL: https://gitlab.com/myuser/apps.git
  path: my-app/overlays/production
```

### Helm Chart from Repo

```yaml
source:
  repoURL: https://gitlab.com/myuser/apps.git
  path: my-app
  helm:
    valueFiles:
      - values.yaml
      - values-prod.yaml
```

### Helm Chart from Registry

```yaml
source:
  repoURL: https://charts.bitnami.com/bitnami
  chart: postgresql
  targetRevision: 12.5.8
  helm:
    values: |
      auth:
        database: myapp
```

### Plain Manifests

```yaml
source:
  repoURL: https://gitlab.com/myuser/apps.git
  path: my-app/manifests
  directory:
    recurse: true
```

## Sync Policies

### Manual Sync

```yaml
syncPolicy: {}
# Requires manual argocd app sync
```

### Auto-Sync

```yaml
syncPolicy:
  automated:
    prune: true      # Delete resources removed from Git
    selfHeal: true   # Revert manual cluster changes
    allowEmpty: false
```

### Sync Options

```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: true
  syncOptions:
    - CreateNamespace=true
    - PruneLast=true
    - ApplyOutOfSyncOnly=true
```

## Access Methods

### Web UI

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Open https://localhost:8080
```

### CLI

```bash
# Login
argocd login localhost:8080

# Or via port-forward
argocd login localhost:8080 --insecure
```

### API

```bash
# Get token
argocd account generate-token

# Use with API
curl -k -H "Authorization: Bearer $TOKEN" \
  https://argocd.barkleyfarm.com/api/v1/applications
```

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| **k3s** | ArgoCD deploys to k3s cluster |
| **Helm** | ArgoCD supports Helm charts natively |
| **Traefik** | ArgoCD can manage Traefik config |
| **Longhorn** | ArgoCD can manage Longhorn settings |
| **GitLab** | ArgoCD pulls from GitLab repos |
| **Infra** | ArgoCD automates infrastructure updates |

## Security

### GitLab Repository Access

```bash
# Add private repo
argocd repo add https://gitlab.com/myuser/apps.git \
  --username <username> \
  --password <token>
```

### RBAC

```yaml
# argocd-cm ConfigMap
data:
  policy.csv: |
    p, role:developer, applications, get, */*, allow
    p, role:developer, applications, sync, */*, allow
    g, myuser@gmail.com, role:developer
```

### Secrets Management

ArgoCD doesn't store secrets - use:
- External Secrets Operator
- Sealed Secrets
- Vault
- Infisical (planned for Barkley Farm)

## Quick Reference

```bash
# List all apps
argocd app list

# Get app details
argocd app get <app-name>

# Sync app
argocd app sync <app-name>

# Diff (preview changes)
argocd app diff <app-name>

# Wait for healthy
argocd app wait <app-name> --health

# Delete app
argocd app delete <app-name>

# Refresh (check for new commits)
argocd app get <app-name> --refresh

# Hard refresh (clear cache)
argocd app get <app-name> --hard-refresh
```

## Troubleshooting

### App Not Syncing

```bash
# Check app status
argocd app get <app-name>

# Check events
kubectl describe application <app-name> -n argocd

# Check repo access
argocd repo list
```

### Sync Failed

```bash
# View sync errors
argocd app get <app-name>

# Force sync
argocd app sync <app-name> --force

# Retry sync
argocd app sync <app-name> --retry-limit 3
```

### Drift Detected

```bash
# View diff
argocd app diff <app-name>

# Sync to fix drift
argocd app sync <app-name>
```

---

**ArgoCD skill provides GitOps deployment automation for all k3s applications.**
