# Install Workflow

Installs Helm CLI on macOS and configures for k3s cluster access.

---

## Step 1: Install Helm CLI

### macOS (Homebrew)

```bash
brew install helm
```

### Verify Installation

```bash
helm version
# Should show version 3.x
```

---

## Step 2: Configure Cluster Access

Helm uses the same kubeconfig as kubectl.

### Verify kubectl Works

```bash
kubectl cluster-info
kubectl get nodes
```

If kubectl works, Helm will work.

### Set Kubeconfig (if needed)

```bash
# Default location
export KUBECONFIG=~/.kube/config

# Or specific cluster config
export KUBECONFIG=~/k3s-config.yaml
```

---

## Step 3: Add Common Repositories

```bash
# Bitnami (common apps)
helm repo add bitnami https://charts.bitnami.com/bitnami

# Traefik
helm repo add traefik https://traefik.github.io/charts

# Longhorn
helm repo add longhorn https://charts.longhorn.io

# ArgoCD
helm repo add argo https://argoproj.github.io/argo-helm

# Prometheus/Grafana
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts

# Update all repos
helm repo update
```

### Verify Repositories

```bash
helm repo list
```

---

## Step 4: Test Helm Works

```bash
# Search for a chart
helm search repo nginx

# Show chart info
helm show chart bitnami/nginx

# Dry run install (doesn't actually install)
helm install test bitnami/nginx --dry-run --debug
```

---

## Step 5: Configure Helm Defaults (Optional)

### Create Helm Config Directory

```bash
mkdir -p ~/.config/helm
```

### Default Namespace

Add to shell profile (~/.zshrc or ~/.bashrc):

```bash
# Default namespace for Helm
export HELM_NAMESPACE=default
```

### Repository Credentials (if needed)

For private repos:

```bash
helm repo add private-repo https://charts.example.com \
  --username <user> \
  --password <password>
```

---

## Helm on k3s Notes

k3s is fully compatible with Helm 3. No special configuration needed.

### k3s Built-in HelmChart CRD

k3s can also deploy Helm charts via its HelmChart CRD (used for bundled Traefik):

```yaml
apiVersion: helm.cattle.io/v1
kind: HelmChart
metadata:
  name: nginx
  namespace: kube-system
spec:
  chart: nginx
  repo: https://charts.bitnami.com/bitnami
  targetNamespace: default
  valuesContent: |-
    replicaCount: 2
```

For GitOps, prefer ArgoCD over HelmChart CRD.

---

## Upgrade Helm

```bash
brew upgrade helm
```

---

## Uninstall Helm

```bash
brew uninstall helm
rm -rf ~/.cache/helm
rm -rf ~/.config/helm
```

This only removes the CLI; deployed releases remain in the cluster.
