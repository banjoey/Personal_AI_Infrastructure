# ResourceAnalysis Workflow

Detailed resource usage analysis across the cluster.

## Steps

### 1. Node Resource Summary
```bash
kubectl top nodes
```

### 2. Detailed Node Metrics
Use Prometheus MCP to query:

```promql
# CPU usage per node
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage per node
100 * (1 - ((node_memory_MemAvailable_bytes) / (node_memory_MemTotal_bytes)))

# Disk usage per node
100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)
```

### 3. Pod Resource Usage
```bash
kubectl top pods -A --sort-by=memory | head -20
kubectl top pods -A --sort-by=cpu | head -20
```

### 4. Resource Requests vs Limits
```bash
kubectl get pods -A -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.name}{"\t"}{range .spec.containers[*]}{.resources.requests.memory}{"\t"}{.resources.limits.memory}{"\n"}{end}{end}' | column -t
```

### 5. Namespace Resource Summary
```bash
kubectl get pods -A -o json | jq -r '
  .items |
  group_by(.metadata.namespace) |
  map({
    namespace: .[0].metadata.namespace,
    pods: length
  }) |
  sort_by(.pods) |
  reverse |
  .[] |
  "\(.namespace): \(.pods) pods"
'
```

### 6. Longhorn Storage
```bash
kubectl get volumes.longhorn.io -n longhorn-system -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.actualSize}{"\t"}{.spec.size}{"\n"}{end}'
```

## Report Format

```
## Resource Analysis Report

### Node Summary
| Node | CPU | Memory | Disk | Status |
|------|-----|--------|------|--------|
| ai2  | XX% | XX%    | XX%  | Ready  |
| nas1 | XX% | XX%    | XX%  | Ready  |

### Top Resource Consumers
**By Memory:**
1. pod-name (namespace): XXMi
2. ...

**By CPU:**
1. pod-name (namespace): XXm
2. ...

### Storage
- Longhorn total: XXGi used / XXGi capacity
- Volumes: X healthy, Y degraded

### Capacity Assessment
- **Current headroom:** X% CPU, Y% Memory available
- **Growth projection:** At current rate, will reach 90% memory in X days
- **Recommendation:** [specific advice]
```

## Thresholds

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| CPU | <60% | 60-80% | >80% |
| Memory | <70% | 70-85% | >85% |
| Disk | <75% | 75-85% | >85% |
