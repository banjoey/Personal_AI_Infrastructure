# HealthCheck Workflow

Comprehensive cluster health assessment.

## Steps

### 1. Check Node Status
```bash
kubectl get nodes -o wide
kubectl describe nodes | grep -A5 "Conditions:"
```

### 2. Check Pod Health
```bash
kubectl get pods -A | grep -v Running | grep -v Completed
kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded
```

### 3. Check Recent Events (Warnings)
```bash
kubectl get events -A --sort-by='.lastTimestamp' --field-selector type=Warning | tail -20
```

### 4. Check Firing Alerts
Use Prometheus MCP:
```
prometheus_alerts
```

Or via kubectl:
```bash
kubectl get prometheusrules.monitoring.coreos.com -A
```

### 5. Check Resource Usage
Use Prometheus MCP to query:
```promql
# Node CPU
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Node Memory
100 * (1 - ((node_memory_MemAvailable_bytes) / (node_memory_MemTotal_bytes)))
```

### 6. Check Longhorn Status
```bash
kubectl get volumes.longhorn.io -n longhorn-system
kubectl get replicas.longhorn.io -n longhorn-system
kubectl get instancemanagers.longhorn.io -n longhorn-system
```

### 7. Report Summary

Provide a summary in this format:

```
## Cluster Health Summary

**Nodes:** X/Y Ready
**Pods:** X Running, Y Not Running
**Alerts:** X firing, Y pending
**Resources:**
- CPU: ai2 XX%, nas1 XX%
- Memory: ai2 XX%, nas1 XX%
- Disk: ai2 XX%

**Issues Found:**
- (list any problems)

**Recommendations:**
- (maintenance suggestions if any)
```

## Output

Return a structured health report with:
1. Overall status (Healthy/Degraded/Critical)
2. Node status
3. Pod status across namespaces
4. Active alerts
5. Resource utilization
6. Recommendations
