# PreDeploy Workflow

**Purpose:** Enforce research and validation BEFORE any infrastructure change.

## Activation Triggers

This workflow activates BEFORE:
- `helm upgrade`, `helm install`
- `kubectl apply`, `kubectl patch`, `kubectl delete`
- ArgoCD sync operations
- Version upgrades of any component
- New service deployments

## Execution Steps

### Step 1: Identify the Change

| Question | Answer |
|----------|--------|
| What component? | |
| Current version? | |
| Target version? | |
| Change type? | [ ] New deploy [ ] Upgrade [ ] Config change [ ] Removal |

### Step 2: Research Official Documentation

**MANDATORY before proceeding.**

```bash
# Use research skill or WebFetch to gather:
# 1. Installation/upgrade guide for target version
# 2. Release notes between current and target versions
# 3. Known issues with target version
```

| Research Item | URL | Key Findings |
|---------------|-----|--------------|
| Installation Guide | | |
| Upgrade Path | | |
| Release Notes | | |
| Known Issues | | |

### Step 3: Validate Upgrade Path

**For version upgrades, verify the path is supported:**

```
Current Version: ____
Target Version: ____
Supported Path: [ ] Direct [ ] Sequential [ ] Not Supported
```

If sequential upgrades required, list intermediate versions:
1. Current → ____
2. ____ → ____
3. ____ → Target

**STOP if skipping versions is not supported.**

### Step 4: Compare Configurations

**Document what changes between versions:**

| Configuration | Old Value | New Value | Impact |
|---------------|-----------|-----------|--------|
| Ports | | | |
| Probes | | | |
| Resources | | | |
| CRDs | | | |
| API versions | | | |

### Step 5: Verify Prerequisites

| Prerequisite | Status | Notes |
|--------------|--------|-------|
| Dependencies running? | [ ] Yes [ ] No | |
| CRDs migrated? | [ ] Yes [ ] No [ ] N/A | |
| Storage available? | [ ] Yes [ ] No | |
| Network accessible? | [ ] Yes [ ] No | |
| Secrets configured? | [ ] Yes [ ] No | |

### Step 6: Define Health Criteria

**What does "healthy" look like after this change?**

```yaml
Expected State:
  Pods: X/X Running
  Services: All endpoints populated
  Readiness: All probes passing
  Logs: No errors containing "..."
  Metrics: [if applicable]
```

### Step 7: Document Rollback Plan

**Before making changes, know how to undo them:**

```yaml
Rollback Method: [ ] helm rollback [ ] kubectl apply -f backup [ ] Manual
Rollback Command: |
  # Commands to revert
Previous Version: ____
Backup Location: ____
```

### Step 8: Pre-Deploy Checklist

**ALL boxes must be checked before proceeding:**

```
[ ] Official docs consulted for target version
[ ] Upgrade path validated (no version skipping)
[ ] Configuration changes documented
[ ] Prerequisites verified
[ ] Health criteria defined
[ ] Rollback plan documented
[ ] Breaking changes understood
```

**If any box is unchecked: STOP and complete the research.**

## Output

Proceed to deployment only when all checklist items are complete.

After deployment completes, transition to PostDeploy workflow.
