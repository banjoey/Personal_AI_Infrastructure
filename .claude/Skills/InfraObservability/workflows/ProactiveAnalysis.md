# ProactiveAnalysis Workflow

Automatically check cluster health at session start when working on infrastructure projects.

## When to Run

This workflow should be invoked proactively when:
1. Session starts in `bfinfrastructure` directory
2. User hasn't checked cluster status recently
3. Before making infrastructure changes

## Quick Checks (Silent if Healthy)

### 1. Firing Alerts
```bash
kubectl get pods -l app.kubernetes.io/name=alertmanager -n monitoring -o jsonpath='{.items[0].metadata.name}' | xargs -I{} kubectl exec {} -n monitoring -- wget -qO- http://localhost:9093/api/v2/alerts 2>/dev/null
```

### 2. Unhealthy Pods
```bash
kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded --no-headers 2>/dev/null | wc -l
```

### 3. Resource Pressure
Check if any node has:
- CPU > 80%
- Memory > 85%
- Disk > 85%

### 4. Recent Pod Restarts
```bash
kubectl get pods -A -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.name}{"\t"}{range .status.containerStatuses[*]}{.restartCount}{"\n"}{end}{end}' | awk '$3 > 3 {print}'
```

## Behavior

### If Everything is Healthy
Do NOT report anything unless user asks. Silent success.

### If Issues Found
Proactively inform user with:

```
**Cluster Status Check** (proactive)

Found X issue(s) that may need attention:

1. [Issue description]
   - Impact: [what this affects]
   - Suggested action: [what to do]

2. [Additional issues...]

Would you like me to investigate further?
```

## Issue Severity

| Condition | Severity | Action |
|-----------|----------|--------|
| Firing critical alert | Critical | Immediately notify |
| Pod in CrashLoopBackOff | High | Notify with logs |
| Resource > 90% | High | Warn about capacity |
| Resource > 80% | Medium | Mention if relevant |
| Pod restarts > 5/hour | Medium | Mention if relevant |
| Pending pods > 5 min | Medium | Mention |

## Example Output

```
**Cluster Status Check** (proactive)

Found 2 issue(s):

1. **alertmanager-monitoring-alertmanager-0** in CrashLoopBackOff
   - Namespace: monitoring
   - Restarts: 7 in last hour
   - Suggested: Check logs with `kubectl logs -n monitoring alertmanager-monitoring-alertmanager-0`

2. **Node ai2 memory at 87%**
   - Current usage: 14.2Gi / 16Gi
   - Suggested: Review pod resource requests or consider node upgrade

Would you like me to investigate either issue?
```
