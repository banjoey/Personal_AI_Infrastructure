# PostDeploy Workflow

**Purpose:** Validate deployment success and document the change.

## Activation Triggers

This workflow activates AFTER:
- Deployment command completes
- ArgoCD reports Synced
- Helm reports success

## Execution Steps

### Step 1: Verify Health Criteria

**Check against the health criteria defined in PreDeploy:**

```bash
# Pod status
kubectl get pods -n <namespace> -l <labels>

# Readiness
kubectl get pods -n <namespace> -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.status.containerStatuses[*].ready}{"\n"}{end}'

# Services
kubectl get endpoints -n <namespace>

# Recent events
kubectl get events -n <namespace> --sort-by='.lastTimestamp' | tail -20
```

| Health Check | Expected | Actual | Status |
|--------------|----------|--------|--------|
| Pod count | | | [ ] Pass [ ] Fail |
| All pods Running | | | [ ] Pass [ ] Fail |
| All containers Ready | | | [ ] Pass [ ] Fail |
| Endpoints populated | | | [ ] Pass [ ] Fail |
| No error events | | | [ ] Pass [ ] Fail |

### Step 2: Validate Functionality

**Test that the service actually works:**

| Test | Method | Result |
|------|--------|--------|
| Basic connectivity | | |
| Primary function | | |
| Integration points | | |

### Step 3: Check for Drift

**Verify ArgoCD/Flux state matches intended state:**

```bash
# ArgoCD
argocd app get <app-name> --show-operation

# Or kubectl
kubectl get application <app-name> -n argocd -o jsonpath='{.status.sync.status}'
```

| Check | Expected | Actual |
|-------|----------|--------|
| Sync status | Synced | |
| Health status | Healthy | |
| Resource version | | |

### Step 4: Document the Change

**Create a record of what was done:**

```markdown
## Deployment Record: [Date]

**Component:** [Name]
**Version Change:** [Old] → [New]
**Deployment Method:** [Helm/ArgoCD/kubectl]

**Changes Made:**
- [List of changes]

**Verification:**
- [ ] Pods healthy
- [ ] Functionality tested
- [ ] No drift detected

**Notes:**
[Any observations or issues encountered]
```

### Step 5: Update Version Tracking

If tracking versions in a file or system:

```yaml
# infrastructure-versions.yaml
components:
  longhorn: "1.10.1"  # Updated [date]
  argocd: "2.x.x"
  traefik: "3.x.x"
```

### Step 6: Monitor for Issues

**Set a reminder to check stability:**

```
[ ] Check in 15 minutes
[ ] Check in 1 hour
[ ] Check next day
```

Watch for:
- Increased error rates
- Resource consumption spikes
- Unexpected restarts

## Rollback Decision Tree

If any health check fails:

```
Is the service critical?
├── Yes → Rollback immediately
│   └── Execute rollback plan from PreDeploy
└── No → Investigate
    ├── Can it wait until next session? → Document and defer
    └── Needs immediate fix? → Troubleshoot with UTP skill
```

## Output

- Deployment verified healthy
- Change documented
- Monitoring period initiated
