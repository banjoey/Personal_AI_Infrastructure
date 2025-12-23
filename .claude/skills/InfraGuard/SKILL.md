---
name: InfraGuard
description: Pre-deployment guardrail that enforces research-before-action. USE WHEN deploying infrastructure, upgrading versions, modifying helm charts, syncing ArgoCD apps, OR making any kubernetes changes. MANDATORY activation before infrastructure modifications.
---

# InfraGuard - Infrastructure Guardrail

**Prevents infrastructure failures by enforcing research and validation BEFORE changes.**

This skill is a GUARDRAIL, not a troubleshooting tool. It activates BEFORE you make changes, not after things break.

## Activation Gate

**STOP. Before ANY infrastructure change, this skill MUST be invoked.**

Triggers:
- `helm upgrade`, `helm install`
- `kubectl apply`, `kubectl patch`, `kubectl delete`
- ArgoCD sync operations
- Version upgrades of any component
- New service deployments

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **PreDeploy** | Before any deployment/upgrade | `workflows/PreDeploy.md` |
| **PostDeploy** | After deployment completes | `workflows/PostDeploy.md` |
| **DriftCheck** | Periodic or on-demand validation | `workflows/DriftCheck.md` |

---

## The Longhorn Lesson

This skill exists because of this failure:

```
Problem: Longhorn manager stuck at 1/2 Ready for hours
Root Cause: Readiness probe checked port 9501 (deprecated in v1.10)
Why It Happened: Jumped from v1.7.2 to v1.10.1 without reading docs
Time Wasted: 45+ minutes of guessing before researching
Fix: 2 minutes once docs were consulted
```

**The pattern:**
1. Version upgrade attempted without reading upgrade docs
2. Mixed configuration left behind (old probes, old labels)
3. Hours spent "fixing" symptoms instead of understanding the system
4. Solution was in the official documentation the entire time

---

## Core Principle: Research Before Repair

> "The internet is smarter than you." - Steve Litt, UTP

Before making ANY infrastructure change:

1. **Read the official docs** for the target version
2. **Check upgrade paths** - are you skipping versions?
3. **Compare configurations** - what changes between versions?
4. **Validate prerequisites** - what must be true before upgrading?

---

## Pre-Deployment Checklist

### For Version Upgrades

| Check | Action | Example |
|-------|--------|---------|
| Upgrade path valid? | Read docs for supported paths | Longhorn: 1.7→1.8→1.9→1.10, NOT 1.7→1.10 |
| Breaking changes? | Read release notes | v1.10 removed conversion webhook |
| Configuration changes? | Compare helm values/manifests | Readiness probe port changed |
| Prerequisites met? | Check requirements docs | CRD migration required before v1.10 |
| Rollback plan? | Document how to revert | Keep previous version noted |

### For New Deployments

| Check | Action |
|-------|--------|
| Official docs consulted? | Read installation guide for target version |
| Helm values reviewed? | Understand every non-default value |
| Resource requirements? | CPU, memory, storage verified |
| Dependencies identified? | What else must be running first? |
| Health checks defined? | Know what "healthy" looks like |

---

## Version Compatibility Matrix

Before upgrading, verify the path is supported:

```
Component         Upgrade Rule
---------         ------------
Longhorn          One minor version at a time (1.7→1.8→1.9→1.10)
ArgoCD            Check compatibility matrix in docs
Traefik           Major versions may have breaking changes
Prometheus        CRD changes between versions
Kubernetes        One minor version at a time
```

**If skipping versions:** STOP. This is not supported. Plan incremental upgrades.

---

## Anti-Patterns This Skill Prevents

### 1. Blind Upgrade
```
BAD:  helm upgrade longhorn longhorn/longhorn --version 1.10.1
GOOD: First read https://longhorn.io/docs/1.10.1/deploy/upgrade/
      Then verify upgrade path from current version
      Then upgrade
```

### 2. Fix Without Understanding
```
BAD:  kubectl delete pod <crashing-pod>  # Maybe it'll work this time?
GOOD: kubectl logs <crashing-pod>        # What does it say?
      # Then research the specific error
```

### 3. Trust ArgoCD "Synced" Status
```
BAD:  "ArgoCD says Synced, must be fine"
GOOD: Verify actual resource state matches expected state
      Check pod readiness, not just sync status
```

### 4. Guess at Configuration
```
BAD:  "I think the readiness probe should be on port 9501"
GOOD: "The v1.10.1 chart shows readiness probe on port 9502"
      (Cite your source)
```

---

## Mandatory Research Sources

Before infrastructure changes, consult IN THIS ORDER:

1. **Official Documentation** - The vendor's docs for your target version
2. **Release Notes** - What changed between versions
3. **Upgrade Guide** - Specific steps for your upgrade path
4. **GitHub Issues** - Known problems with this version
5. **Your Own History** - Have you done this before? What happened?

---

## Integration with Other Skills

| Skill | How InfraGuard Interacts |
|-------|-------------------------|
| UTP | InfraGuard prevents; UTP diagnoses when prevention fails |
| Lean | InfraGuard validates before change; Lean optimizes after |
| Deployment | InfraGuard gates all deployment operations |
| Infra | InfraGuard is the guardrail for all Infra operations |

---

## Enforcement Mechanism

This skill should be invoked by:

1. **Hooks** - Pre-commit hooks that check for infrastructure changes
2. **CI/CD** - Pipeline stages that require validation
3. **Self-discipline** - Until automation exists, STOP and invoke manually

### Example Self-Check

Before running any `kubectl`, `helm`, or ArgoCD command:

```
INFRAGUARD CHECKPOINT:
[ ] Have I read the docs for this version?
[ ] Do I know what "healthy" looks like after this change?
[ ] Do I have a rollback plan?
[ ] Am I making a change I understand, or guessing?

If any box is unchecked: STOP and research first.
```

---

## Key Takeaway

> "An ounce of prevention is worth a pound of cure."

The 2 minutes spent reading docs saves the 45 minutes spent guessing at fixes.

**InfraGuard is not optional.** It's the difference between professional infrastructure management and hoping things work.
