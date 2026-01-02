# PostMortem Workflow

**Purpose:** Analyze a past incident to understand root cause and prevent recurrence.

## Prerequisites

- Incident is resolved
- Access to logs, metrics, and change history
- Timeline of events available

## Execution Steps

### Step 1: Timeline Reconstruction

Gather chronological events:
```bash
# Git changes around the incident time
git log --since="2025-12-20" --until="2025-12-23" --oneline

# ArgoCD sync history
argocd app history <app>

# Kubernetes events (if still available)
kubectl get events -A --sort-by='.lastTimestamp'
```

**Document:**
| Time | Event | Source |
|------|-------|--------|
| T-1h | Last known good state | Monitoring |
| T-30m | Change deployed | Git commit |
| T-0 | Incident detected | Alert/User report |
| T+Xm | Resolution | Fix deployed |

### Step 2: 5 Whys Analysis

Ask "Why?" until you reach the root cause:

```
Problem: Grafana showed no data

Why? → Prometheus couldn't scrape targets
Why? → PVCs weren't mounting
Why? → Longhorn was crashing
Why? → Version mismatch (1.7.2 in Git, 1.10.1 in cluster)
Why? → Git wasn't updated after manual helm install

Root Cause: GitOps drift - manual change not committed
```

### Step 3: Contributing Factors

Identify factors that allowed/prolonged the incident:

| Factor | Impact | Category |
|--------|--------|----------|
| No drift detection | Allowed mismatch to exist | Process |
| Trusted ArgoCD "Synced" | Delayed diagnosis | Human |
| Guessed at fixes | Extended resolution time | Process |

### Step 4: Prevention Measures

For each contributing factor, define prevention:

| Factor | Prevention | Owner | Deadline |
|--------|------------|-------|----------|
| No drift detection | Add CI job comparing helm list to git | PAI | This week |
| Trusted status over logs | Add to UTP training | PAI | Done |
| Guessing at fixes | Enforce UTP skill | PAI | Done |

### Step 5: Document and Share

Create incident report:
```markdown
## Incident Report: [Title]

**Date:** YYYY-MM-DD
**Duration:** X hours
**Impact:** [Services affected, users impacted]

### Timeline
[From Step 1]

### Root Cause
[From Step 2]

### Contributing Factors
[From Step 3]

### Resolution
[What fixed it]

### Prevention Measures
[From Step 4]

### Lessons Learned
- [Key takeaway 1]
- [Key takeaway 2]
```

## Output

Save incident report to `${PAI_DIR}/history/incidents/YYYY-MM-DD-<title>.md`
