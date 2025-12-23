# ManageReleases Workflow

Upgrade, rollback, and manage deployed Helm releases.

---

## List Releases

```bash
# All releases in current namespace
helm list

# All releases in all namespaces
helm list -A

# Filter by status
helm list --deployed      # Only deployed
helm list --failed        # Only failed
helm list --pending       # Only pending
helm list --uninstalled   # Only uninstalled (if kept)
```

---

## Upgrade Release

### Basic Upgrade

```bash
helm upgrade <release> <chart> -n <namespace> -f values.yaml
```

### Install or Upgrade (Idempotent)

```bash
helm upgrade --install <release> <chart> -n <namespace> -f values.yaml
```

### Upgrade with Changes

```bash
# From updated values file
helm upgrade my-app ./my-chart -f values.yaml

# With inline value changes
helm upgrade my-app ./my-chart -f values.yaml \
  --set replicaCount=3 \
  --set image.tag=v2.0.0

# Reuse previous values + apply changes
helm upgrade my-app ./my-chart --reuse-values \
  --set image.tag=v2.0.0
```

### Upgrade Options

```bash
helm upgrade my-app ./my-chart -f values.yaml \
  --wait                    # Wait for readiness
  --timeout 10m             # Custom timeout
  --atomic                  # Rollback on failure
  --force                   # Force resource updates
  --cleanup-on-fail         # Delete new resources if upgrade fails
```

---

## Check Release History

```bash
helm history <release> -n <namespace>

# Output:
# REVISION  STATUS      DESCRIPTION
# 1         superseded  Install complete
# 2         superseded  Upgrade complete
# 3         deployed    Upgrade complete
```

---

## Rollback Release

### Rollback to Previous Revision

```bash
helm rollback <release> -n <namespace>
# Rolls back to revision (current - 1)
```

### Rollback to Specific Revision

```bash
helm rollback <release> <revision> -n <namespace>

# Example: rollback to revision 1
helm rollback my-app 1 -n default
```

### Rollback Options

```bash
helm rollback my-app 2 -n default \
  --wait              # Wait for rollback to complete
  --timeout 5m        # Custom timeout
  --force             # Force resource updates
```

---

## Get Release Details

```bash
# Status and notes
helm status <release> -n <namespace>

# Deployed values
helm get values <release> -n <namespace>

# All values (including defaults)
helm get values <release> -n <namespace> --all

# Deployed manifests
helm get manifest <release> -n <namespace>

# Hooks
helm get hooks <release> -n <namespace>

# All info
helm get all <release> -n <namespace>
```

---

## Compare Releases

### Compare Values Between Revisions

```bash
# Get values from specific revision
helm get values <release> -n <namespace> --revision 1 > rev1.yaml
helm get values <release> -n <namespace> --revision 2 > rev2.yaml

diff rev1.yaml rev2.yaml
```

### Compare to New Values

```bash
# See what would change
helm diff upgrade <release> <chart> -f new-values.yaml
# Requires helm-diff plugin
```

---

## Uninstall Release

```bash
# Uninstall release
helm uninstall <release> -n <namespace>

# Keep history (allows rollback)
helm uninstall <release> -n <namespace> --keep-history

# Dry run
helm uninstall <release> -n <namespace> --dry-run
```

---

## Useful Plugins

### helm-diff

Shows differences between upgrades.

```bash
# Install
helm plugin install https://github.com/databus23/helm-diff

# Usage
helm diff upgrade my-app ./my-chart -f values.yaml
```

### helm-secrets

Manage secrets with SOPS.

```bash
# Install
helm plugin install https://github.com/jkroepke/helm-secrets

# Usage
helm secrets upgrade my-app ./my-chart -f secrets.yaml
```

---

## Release Lifecycle Management

### Scheduled Upgrade Pattern

For GitOps, prefer ArgoCD. For manual:

```bash
#!/bin/bash
# upgrade.sh

RELEASE="my-app"
NAMESPACE="production"
CHART="./my-chart"
VALUES="values-prod.yaml"

# Create backup
helm get values $RELEASE -n $NAMESPACE > backup-$(date +%Y%m%d).yaml

# Upgrade
helm upgrade $RELEASE $CHART -n $NAMESPACE -f $VALUES --wait --atomic

# Verify
kubectl rollout status deployment/$RELEASE -n $NAMESPACE
```

### Canary Deployment Pattern

```bash
# Deploy canary (separate release)
helm install my-app-canary ./my-chart \
  -n production \
  -f values-canary.yaml \
  --set replicaCount=1

# Test canary
# ...

# If successful, upgrade main
helm upgrade my-app ./my-chart -n production -f values.yaml

# Remove canary
helm uninstall my-app-canary -n production
```

---

## Troubleshooting Upgrades

### Upgrade Failed

```bash
# Check status
helm status <release> -n <namespace>

# View recent history
helm history <release> -n <namespace>

# Check pod status
kubectl get pods -n <namespace>

# Check events
kubectl get events -n <namespace> --sort-by='.lastTimestamp'
```

### Stuck in Pending-Upgrade

```bash
# Force rollback
helm rollback <release> -n <namespace> --force

# If still stuck, delete secret and reinstall
kubectl delete secret -n <namespace> sh.helm.release.v1.<release>.v<revision>
```

### Resource Conflict

```bash
# Add annotation to existing resource
kubectl annotate <resource> <name> \
  meta.helm.sh/release-name=<release> \
  meta.helm.sh/release-namespace=<namespace>

kubectl label <resource> <name> \
  app.kubernetes.io/managed-by=Helm
```
