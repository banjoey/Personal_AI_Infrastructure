# DeployChart Workflow

Deploys a Helm chart to the k3s cluster.

---

## Quick Deploy

### From Public Repository

```bash
# 1. Add repository (if not already added)
helm repo add <repo-name> <repo-url>
helm repo update

# 2. Install chart
helm install <release-name> <repo-name>/<chart-name> \
  --namespace <namespace> \
  --create-namespace \
  -f values.yaml
```

### From Local Chart

```bash
helm install <release-name> ./my-chart \
  --namespace <namespace> \
  --create-namespace \
  -f values.yaml
```

---

## Detailed Workflow

### Step 1: Find the Chart

```bash
# Search public repos
helm search hub <keyword>         # Search Artifact Hub
helm search repo <keyword>        # Search added repos

# Show chart info
helm show chart <repo>/<chart>
helm show readme <repo>/<chart>   # Read documentation
helm show values <repo>/<chart>   # Show default values
```

### Step 2: Create Values File

```bash
# Get default values as starting point
helm show values <repo>/<chart> > values.yaml
```

Edit values.yaml to customize:

```yaml
# Example customizations
replicaCount: 2

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi

persistence:
  enabled: true
  storageClass: longhorn
  size: 5Gi

ingress:
  enabled: true
  className: traefik
  hosts:
    - host: myapp.barkleyfarm.com
```

### Step 3: Preview Deployment

```bash
# Render templates locally (see what will be created)
helm template <release-name> <repo>/<chart> -f values.yaml

# Dry run with cluster validation
helm install <release-name> <repo>/<chart> \
  --namespace <namespace> \
  -f values.yaml \
  --dry-run --debug
```

### Step 4: Deploy

```bash
helm install <release-name> <repo>/<chart> \
  --namespace <namespace> \
  --create-namespace \
  -f values.yaml \
  --wait
```

Flags:
- `--create-namespace`: Create namespace if it doesn't exist
- `--wait`: Wait for pods to be ready
- `--timeout 5m`: Custom timeout (default 5m)

### Step 5: Verify Deployment

```bash
# Check release status
helm status <release-name> -n <namespace>

# List all releases
helm list -n <namespace>

# Check pods
kubectl get pods -n <namespace>

# Check services
kubectl get svc -n <namespace>
```

---

## Common Charts

### PostgreSQL

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami

cat <<EOF > postgres-values.yaml
auth:
  postgresPassword: "secure-password"
  database: myapp
primary:
  persistence:
    storageClass: longhorn
    size: 10Gi
  resources:
    requests:
      memory: 256Mi
      cpu: 100m
EOF

helm install postgres bitnami/postgresql \
  -n databases --create-namespace \
  -f postgres-values.yaml
```

### Redis

```bash
cat <<EOF > redis-values.yaml
architecture: standalone
auth:
  enabled: true
  password: "redis-password"
master:
  persistence:
    storageClass: longhorn
    size: 2Gi
EOF

helm install redis bitnami/redis \
  -n cache --create-namespace \
  -f redis-values.yaml
```

### MongoDB

```bash
cat <<EOF > mongodb-values.yaml
auth:
  rootPassword: "root-password"
  database: myapp
  username: myuser
  password: "user-password"
persistence:
  storageClass: longhorn
  size: 10Gi
EOF

helm install mongodb bitnami/mongodb \
  -n databases --create-namespace \
  -f mongodb-values.yaml
```

---

## Install with Secrets

### Using --set for Sensitive Values

```bash
helm install myapp ./my-chart \
  -f values.yaml \
  --set database.password=$DB_PASSWORD \
  --set api.key=$API_KEY
```

### Using Existing Kubernetes Secret

```yaml
# In values.yaml
existingSecret: my-app-secrets
```

```bash
# Create secret first
kubectl create secret generic my-app-secrets \
  --from-literal=password=secret123 \
  -n myapp

# Then install chart
helm install myapp ./my-chart -f values.yaml -n myapp
```

---

## Install with Dependencies

### Chart.yaml with Dependencies

```yaml
dependencies:
  - name: postgresql
    version: "12.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
```

### Build Dependencies

```bash
helm dependency build ./my-chart
# or
helm dependency update ./my-chart
```

---

## Install Specific Version

```bash
# List available versions
helm search repo <repo>/<chart> --versions

# Install specific version
helm install <release> <repo>/<chart> --version 1.2.3
```

---

## Troubleshooting Installation

### Install Failed

```bash
# Check release status
helm status <release> -n <namespace>

# Get detailed info
helm get all <release> -n <namespace>

# Check events
kubectl get events -n <namespace> --sort-by='.lastTimestamp'

# Check pod logs
kubectl logs -n <namespace> -l app.kubernetes.io/name=<chart>
```

### Delete Failed Release

```bash
helm uninstall <release> -n <namespace>
```

### Reinstall from Scratch

```bash
helm uninstall <release> -n <namespace>
kubectl delete pvc -n <namespace> --all  # If needed
helm install <release> <chart> -n <namespace> -f values.yaml
```
