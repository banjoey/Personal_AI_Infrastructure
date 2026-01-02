# AlertReview Workflow

Review current and recent alerts from Prometheus/AlertManager.

## Steps

### 1. Check Firing Alerts
Use Prometheus MCP:
```
prometheus_alerts
```

Or via AlertManager API:
```bash
kubectl exec -n monitoring alertmanager-monitoring-alertmanager-0 -- wget -qO- http://localhost:9093/api/v2/alerts
```

### 2. Check Pending Alerts
Alerts that are about to fire (in evaluation period):
```promql
ALERTS{alertstate="pending"}
```

### 3. List Configured Alert Rules
```bash
kubectl get prometheusrules.monitoring.coreos.com -A
```

### 4. Review Alert History
```bash
kubectl logs -n monitoring alertmanager-monitoring-alertmanager-0 --since=1h | grep -i "notify"
```

## Common Alerts in kube-prometheus-stack

| Alert | Meaning | Action |
|-------|---------|--------|
| Watchdog | Always firing (dead man's switch) | Ignore - this is expected |
| InfoInhibitor | Inhibits info-level alerts | Ignore - normal |
| KubePodCrashLooping | Pod restarting repeatedly | Check pod logs |
| KubePodNotReady | Pod not reaching Ready state | Check pod events |
| KubeDeploymentReplicasMismatch | Desired != actual replicas | Check deployment |
| NodeNotReady | Node is not Ready | Check node conditions |
| NodeMemoryHighUtilization | Memory usage high | Consider scaling |
| NodeCPUHighUtilization | CPU usage high | Check workloads |
| TargetDown | Prometheus can't scrape target | Check target service |

## Report Format

```
## Alert Status

### Currently Firing
| Alert | Severity | Namespace | Since | Labels |
|-------|----------|-----------|-------|--------|
| AlertName | critical | namespace | 10m | key=val |

### Pending (May Fire Soon)
| Alert | Severity | For | Labels |
|-------|----------|-----|--------|
| AlertName | warning | 5m | key=val |

### Summary
- Firing: X (X critical, X warning)
- Pending: X
- Last 1 hour: X alerts resolved

### Recommended Actions
1. [Specific action for each non-Watchdog firing alert]
```

## Silenced Alerts

If alerts are being silenced, show:
```bash
kubectl exec -n monitoring alertmanager-monitoring-alertmanager-0 -- wget -qO- http://localhost:9093/api/v2/silences
```

## Alert Configuration

Current AlertManager config location:
- In-cluster: `monitoring.yaml` ArgoCD application
- Git: `k8s/apps/children/monitoring.yaml`

Discord integration status: **Not configured** (see Linear backlog for setup)
