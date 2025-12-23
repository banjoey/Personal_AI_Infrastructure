# CreateApp Workflow

Creates an ArgoCD Application to deploy from a Git repository.

---

## Quick Create (CLI)

```bash
argocd app create <app-name> \
  --repo https://gitlab.com/myuser/apps.git \
  --path <path-in-repo> \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace <namespace> \
  --sync-policy automated \
  --auto-prune \
  --self-heal
```

---

## Create via Manifest (Recommended)

### Step 1: Create Application Manifest

```yaml
# apps/my-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default

  source:
    repoURL: https://gitlab.com/myuser/infrastructure.git
    targetRevision: main
    path: apps/my-app

  destination:
    server: https://kubernetes.default.svc
    namespace: my-app

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### Step 2: Apply Manifest

```bash
kubectl apply -f apps/my-app.yaml
```

---

## Application Types

### Plain Kubernetes Manifests

```yaml
source:
  repoURL: https://gitlab.com/myuser/apps.git
  path: my-app/manifests
  directory:
    recurse: true
```

### Kustomize

```yaml
source:
  repoURL: https://gitlab.com/myuser/apps.git
  path: my-app/overlays/production
  kustomize:
    namePrefix: prod-
    commonLabels:
      env: production
```

### Helm Chart from Git

```yaml
source:
  repoURL: https://gitlab.com/myuser/apps.git
  path: my-app
  helm:
    valueFiles:
      - values.yaml
      - values-prod.yaml
    parameters:
      - name: replicaCount
        value: "3"
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
        username: myuser
      primary:
        persistence:
          storageClass: longhorn
          size: 10Gi
```

### OCI Helm Chart

```yaml
source:
  repoURL: oci://registry.gitlab.com/myuser/helm-charts
  chart: my-app
  targetRevision: 1.0.0
```

---

## App of Apps Pattern

Create a root application that manages other applications.

### Root Application

```yaml
# argocd/root-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://gitlab.com/myuser/infrastructure.git
    targetRevision: main
    path: argocd/apps
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### Child Applications

```
infrastructure/
├── argocd/
│   ├── root-app.yaml          # Apply this manually
│   └── apps/                   # ArgoCD watches this
│       ├── postgres.yaml
│       ├── redis.yaml
│       ├── my-api.yaml
│       └── my-frontend.yaml
└── apps/                       # Actual manifests
    ├── postgres/
    ├── redis/
    ├── my-api/
    └── my-frontend/
```

---

## Projects

Use projects to group applications and apply RBAC.

### Create Project

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: production
  namespace: argocd
spec:
  description: Production applications

  sourceRepos:
    - 'https://gitlab.com/myuser/*'
    - 'https://charts.bitnami.com/bitnami'

  destinations:
    - namespace: '*'
      server: https://kubernetes.default.svc

  clusterResourceWhitelist:
    - group: ''
      kind: Namespace
    - group: 'rbac.authorization.k8s.io'
      kind: ClusterRole
    - group: 'rbac.authorization.k8s.io'
      kind: ClusterRoleBinding

  namespaceResourceBlacklist:
    - group: ''
      kind: ResourceQuota
    - group: ''
      kind: LimitRange

  roles:
    - name: developer
      policies:
        - p, proj:production:developer, applications, get, production/*, allow
        - p, proj:production:developer, applications, sync, production/*, allow
      groups:
        - developers
```

### Use Project in Application

```yaml
spec:
  project: production  # Instead of 'default'
```

---

## Sync Options Reference

```yaml
syncOptions:
  - CreateNamespace=true      # Create namespace if missing
  - PruneLast=true            # Prune after sync (safer)
  - ApplyOutOfSyncOnly=true   # Only apply changed resources
  - Validate=false            # Skip validation (use carefully)
  - SkipDryRunOnMissingResource=true  # For CRDs
  - PrunePropagationPolicy=foreground # Wait for deletion
  - Replace=true              # Replace instead of patch
```

---

## Ignore Differences

Ignore fields that change outside of Git.

```yaml
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas    # Ignore if HPA manages replicas
    - group: ""
      kind: Service
      jqPathExpressions:
        - .spec.clusterIP   # Assigned by cluster
```

---

## Health Checks

Custom health checks for CRDs.

```yaml
# In argocd-cm ConfigMap
data:
  resource.customizations.health.mycrd.example.com_MyResource: |
    hs = {}
    if obj.status ~= nil then
      if obj.status.phase == "Ready" then
        hs.status = "Healthy"
        hs.message = "Resource is ready"
      else
        hs.status = "Progressing"
        hs.message = "Resource is not ready"
      end
    end
    return hs
```

---

## Verify Application

```bash
# Check app status
argocd app get my-app

# View resources
argocd app resources my-app

# View manifests
argocd app manifests my-app

# View diff
argocd app diff my-app
```
