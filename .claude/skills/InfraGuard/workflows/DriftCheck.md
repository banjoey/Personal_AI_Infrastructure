# DriftCheck Workflow

**Purpose:** Detect and resolve configuration drift before it causes problems.

## Activation Triggers

- Periodic checks (weekly/daily)
- Before major changes
- After investigating issues
- When "something seems wrong"

## What is Drift?

Drift occurs when:
- Actual state differs from declared state (Git/Helm)
- Manual patches accumulate
- Configs diverge from documentation
- Versions mismatch between components

## Execution Steps

### Step 1: ArgoCD Application Drift

```bash
# List all applications and their sync status
argocd app list

# For each app, check for drift
argocd app diff <app-name>
```

| Application | Sync Status | Drift Detected | Action Needed |
|-------------|-------------|----------------|---------------|
| | | | |

### Step 2: Helm Release Drift

```bash
# List releases
helm list -A

# For each release, compare values
helm get values <release> -n <namespace> > /tmp/current-values.yaml
diff /tmp/current-values.yaml <expected-values-file>
```

| Release | Chart Version | Values Match? | Action Needed |
|---------|---------------|---------------|---------------|
| | | | |

### Step 3: Manual Patch Detection

Look for resources that were patched outside of Git:

```bash
# Check for kubectl patches in history
history | grep "kubectl patch"
history | grep "kubectl edit"

# Check for annotations indicating manual changes
kubectl get <resource> -o yaml | grep -A 5 "annotations:"
```

| Resource | Manual Changes Found | Reason | Remediation |
|----------|---------------------|--------|-------------|
| | | | |

### Step 4: Version Mismatch Check

Compare running versions against declared versions:

```bash
# Get image versions from running pods
kubectl get pods -n <namespace> -o jsonpath='{range .items[*]}{.metadata.name}{": "}{.spec.containers[*].image}{"\n"}{end}'

# Compare against Helm chart / ArgoCD app
```

| Component | Declared Version | Running Version | Match? |
|-----------|------------------|-----------------|--------|
| | | | |

### Step 5: CRD Version Check

CRDs can drift separately from applications:

```bash
# List CRD versions
kubectl get crd | grep <component>
kubectl get crd <crd-name> -o jsonpath='{.spec.versions[*].name}'
```

| CRD | Expected Version | Actual Version | Deprecated? |
|-----|------------------|----------------|-------------|
| | | | |

### Step 6: Drift Resolution

For each drift found, decide:

```
Drift Type:
├── Intentional (documented exception)
│   └── Add to exceptions list with justification
├── Configuration debt (patch was necessary)
│   └── Backport to Git/Helm and sync
├── Unknown origin (mystery drift)
│   └── Investigate before resolving
└── Dangerous (security/stability risk)
    └── Resolve immediately
```

### Step 7: Update GitOps Source

For drift that should be permanent:

```bash
# Update Helm values
vim charts/<app>/values.yaml

# Commit
git add . && git commit -m "Backport runtime configuration to Git"

# Sync
argocd app sync <app>
```

### Step 8: Document Exceptions

Some drift is acceptable if documented:

```yaml
# drift-exceptions.yaml
exceptions:
  - resource: "longhorn-manager DaemonSet"
    field: "spec.template.spec.containers[0].resources"
    reason: "Temporary increase during migration"
    expires: "2025-01-15"

  - resource: "prometheus StatefulSet"
    field: "spec.replicas"
    reason: "Scaled up for load testing"
    expires: "2025-12-30"
```

## Drift Prevention

### Best Practices

1. **Never use `kubectl edit` in production** - Always modify source and sync
2. **Document emergency patches** - If you must patch, create a ticket to backport
3. **Regular drift checks** - Schedule weekly reviews
4. **Alert on sync failures** - ArgoCD can notify on drift

### Automation Opportunities

```yaml
# GitLab CI job for drift detection
drift-check:
  stage: validate
  script:
    - argocd app list -o json | jq '.[] | select(.status.sync.status != "Synced")'
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
```

## Output

- List of drift detected
- Resolution plan for each item
- Updated exceptions list if needed
- Backported changes committed to Git
