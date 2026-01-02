# Diagnose Workflow

**Purpose:** Systematic diagnosis of a broken system using the 10-step UTP.

## Prerequisites

- Access to the failing system
- Ability to read logs and run diagnostic commands

## Execution Steps

### Phase 1: Prepare (Steps 1-2)

```bash
# Verify access
kubectl cluster-info
kubectl config current-context
```

**Create Damage Control Plan:**
- What could break if I make changes?
- How do I roll back?
- What's the blast radius?

### Phase 2: Understand (Steps 3-4)

**MANDATORY: Read logs FIRST**
```bash
# Find unhealthy pods
kubectl get pods -A | grep -v Running | grep -v Completed

# Read the logs
kubectl logs <unhealthy-pod> --tail=100

# Get events
kubectl get events -A --sort-by='.lastTimestamp' | tail -30
```

**Document the symptom:**
- Exact behavior observed
- When it last worked
- What changed since then

**Reproduce the symptom:**
- Can you trigger the failure on demand?
- Is it constant or intermittent?

### Phase 3: Narrow Down (Steps 5-6)

**Quick maintenance checks:**
```bash
kubectl top nodes
kubectl get pvc -A | grep -v Bound
kubectl get events -A --field-selector type=Warning | tail -20
```

**Divide-and-conquer:**
1. List all components in the failure path
2. Test the MIDDLE component
3. Eliminate half the problem space
4. Repeat until ONE component is identified

**DO NOT proceed to repair until ONE component is identified.**

### Phase 4: Fix and Verify (Steps 7-8)

**Only after Step 6 is complete:**
1. Fix the ONE identified component
2. Use GitOps (git commit → ArgoCD sync)
3. Test the original symptom is gone
4. Verify no regression

### Phase 5: Document (Steps 9-10)

**Capture:**
- Root cause
- How it was found
- Fix applied
- Prevention measures

**Prevent recurrence:**
- Add monitoring/alerting
- Update runbooks
- Consider automation

## Output

Document the diagnosis in the session with:
- Root cause identified
- Fix applied
- Verification results
- Prevention measures implemented
