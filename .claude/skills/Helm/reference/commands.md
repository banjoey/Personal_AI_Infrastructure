# Helm Quick Command Reference

Fast lookup for common Helm operations.

---

## Repository Commands

```bash
# Add repository
helm repo add <name> <url>

# Update repositories
helm repo update

# List repositories
helm repo list

# Remove repository
helm repo remove <name>

# Search repository
helm search repo <keyword>
helm search repo <keyword> --versions  # Show all versions

# Search Artifact Hub
helm search hub <keyword>
```

---

## Install Commands

```bash
# Basic install
helm install <release> <chart>

# Install with namespace
helm install <release> <chart> -n <namespace> --create-namespace

# Install with values file
helm install <release> <chart> -f values.yaml

# Install with inline values
helm install <release> <chart> --set key=value

# Install specific version
helm install <release> <chart> --version 1.2.3

# Install and wait
helm install <release> <chart> --wait --timeout 5m

# Dry run
helm install <release> <chart> --dry-run --debug
```

---

## Upgrade Commands

```bash
# Basic upgrade
helm upgrade <release> <chart>

# Upgrade with values
helm upgrade <release> <chart> -f values.yaml

# Install or upgrade
helm upgrade --install <release> <chart>

# Upgrade preserving values
helm upgrade <release> <chart> --reuse-values

# Upgrade with atomic rollback
helm upgrade <release> <chart> --atomic

# Force upgrade
helm upgrade <release> <chart> --force
```

---

## Rollback Commands

```bash
# Rollback to previous
helm rollback <release>

# Rollback to specific revision
helm rollback <release> <revision>

# Rollback with wait
helm rollback <release> --wait
```

---

## List & Status

```bash
# List releases
helm list
helm list -A                    # All namespaces
helm list -n <namespace>        # Specific namespace
helm list --deployed            # Only deployed
helm list --failed              # Only failed

# Release status
helm status <release> -n <namespace>

# Release history
helm history <release> -n <namespace>
```

---

## Get Release Info

```bash
# Get deployed values
helm get values <release> -n <namespace>

# Get all values (including defaults)
helm get values <release> --all

# Get manifests
helm get manifest <release> -n <namespace>

# Get hooks
helm get hooks <release> -n <namespace>

# Get all info
helm get all <release> -n <namespace>

# Get from specific revision
helm get values <release> --revision 2
```

---

## Chart Commands

```bash
# Create new chart
helm create <name>

# Lint chart
helm lint <chart-path>

# Package chart
helm package <chart-path>

# Show chart info
helm show chart <chart>
helm show readme <chart>
helm show values <chart>
helm show all <chart>

# Template chart locally
helm template <release> <chart>
helm template <release> <chart> -f values.yaml

# Pull chart to local
helm pull <chart>
helm pull <chart> --untar
```

---

## Uninstall

```bash
# Uninstall release
helm uninstall <release> -n <namespace>

# Keep history
helm uninstall <release> --keep-history

# Dry run
helm uninstall <release> --dry-run
```

---

## Dependencies

```bash
# Update dependencies
helm dependency update <chart-path>

# Build dependencies
helm dependency build <chart-path>

# List dependencies
helm dependency list <chart-path>
```

---

## Plugins

```bash
# List plugins
helm plugin list

# Install plugin
helm plugin install <url>

# Update plugin
helm plugin update <name>

# Uninstall plugin
helm plugin uninstall <name>
```

---

## Common Flags

| Flag | Description |
|------|-------------|
| `-n, --namespace` | Kubernetes namespace |
| `-f, --values` | Values file(s) |
| `--set` | Set value (key=value) |
| `--set-string` | Set string value |
| `--set-file` | Set value from file |
| `--wait` | Wait for resources ready |
| `--timeout` | Timeout duration |
| `--atomic` | Rollback on failure |
| `--dry-run` | Simulate action |
| `--debug` | Verbose output |
| `--force` | Force resource updates |
| `--version` | Chart version |

---

## Environment Variables

```bash
# Default namespace
export HELM_NAMESPACE=default

# Cache directory
export HELM_CACHE_HOME=~/.cache/helm

# Config directory
export HELM_CONFIG_HOME=~/.config/helm

# Data directory
export HELM_DATA_HOME=~/.local/share/helm

# Kubeconfig
export KUBECONFIG=~/.kube/config
```

---

## Common Repos

```bash
# Bitnami
helm repo add bitnami https://charts.bitnami.com/bitnami

# Traefik
helm repo add traefik https://traefik.github.io/charts

# Longhorn
helm repo add longhorn https://charts.longhorn.io

# ArgoCD
helm repo add argo https://argoproj.github.io/argo-helm

# Prometheus
helm repo add prometheus https://prometheus-community.github.io/helm-charts

# Grafana
helm repo add grafana https://grafana.github.io/helm-charts

# Jetstack (cert-manager)
helm repo add jetstack https://charts.jetstack.io
```

---

## Barkley Farm Specific

```bash
# Common infrastructure installs
helm upgrade --install traefik traefik/traefik -n traefik -f traefik-values.yaml
helm upgrade --install longhorn longhorn/longhorn -n longhorn-system -f longhorn-values.yaml
helm upgrade --install argocd argo/argo-cd -n argocd -f argocd-values.yaml

# Quick status check
helm list -A | grep -E "deployed|failed"

# Check all chart versions
helm list -A -o json | jq '.[] | {name: .name, chart: .chart, status: .status}'
```
