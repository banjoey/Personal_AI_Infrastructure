---
name: InfraObservability
description: K8s cluster health monitoring and proactive issue detection. USE WHEN user asks about cluster health, pod status, resource usage, metrics, Prometheus queries, OR when you need to proactively inform about infrastructure issues, maintenance needs, hardware limits, or potential outages.
---

# InfraObservability

Cluster infrastructure monitoring, proactive alerting, and health assessment using Prometheus and Grafana.

## Workflow Routing

**When executing a workflow, do BOTH of these:**

1. **Call the notification script** (for observability tracking):
   ```bash
   ~/.claude/Tools/SkillWorkflowNotification WORKFLOWNAME InfraObservability
   ```

2. **Output the text notification** (for user visibility):
   ```
   Running the **WorkflowName** workflow from the **InfraObservability** skill...
   ```

| Workflow | Trigger | File |
|----------|---------|------|
| **HealthCheck** | "cluster health", "how's my cluster", "status check" | `workflows/HealthCheck.md` |
| **ProactiveAnalysis** | proactive offering of insights at session start | `workflows/ProactiveAnalysis.md` |
| **ResourceAnalysis** | "resource usage", "capacity", "memory usage", "CPU" | `workflows/ResourceAnalysis.md` |
| **AlertReview** | "any alerts", "what's firing", "alert status" | `workflows/AlertReview.md` |

## Examples

**Example 1: User asks about cluster health**
```
User: "How's my cluster doing?"
-> Invokes HealthCheck workflow
-> Queries Prometheus for node health, pod status, resource usage
-> Reports any issues or degraded services
-> Suggests maintenance if needed
```

**Example 2: Proactive notification about issues**
```
(Session starts in bfinfrastructure directory)
-> InfraObservability skill activates proactively
-> Runs ProactiveAnalysis workflow
-> Checks for firing alerts, resource pressure, unhealthy pods
-> Reports: "Heads up: 2 pods are in CrashLoopBackOff in the monitoring namespace"
```

**Example 3: User asks about resources**
```
User: "Is my cluster running out of resources?"
-> Invokes ResourceAnalysis workflow
-> Queries CPU, memory, disk usage across nodes
-> Reports current usage vs capacity
-> Warns if approaching limits (e.g., "ai2 is at 85% memory")
```

## Access Points

| System | Internal URL | External URL |
|--------|--------------|--------------|
| Prometheus | http://monitoring-prometheus.monitoring.svc.cluster.local:9090 | N/A |
| Grafana | http://monitoring-grafana.monitoring.svc.cluster.local:80 | https://grafana.op.barkleyfarm.com |
| AlertManager | http://monitoring-alertmanager.monitoring.svc.cluster.local:9093 | N/A |
| Prometheus MCP | https://mcp-prometheus.op.barkleyfarm.com/mcp | Via mcp-proxy |

## Available Tools

### Prometheus MCP (via mcp-proxy)
The `prometheus` MCP server provides:
- `prometheus_query` - Execute instant PromQL queries
- `prometheus_query_range` - Execute range queries with time intervals
- `prometheus_series` - List time series matching selectors
- `prometheus_labels` - Get label names/values
- `prometheus_targets` - View scrape target status
- `prometheus_alerts` - Get current alerts
- `prometheus_rules` - Get alerting/recording rules

### kubectl Commands
Direct cluster access for:
- Pod/deployment status
- Events and logs
- Node conditions
- Resource quotas

## Common PromQL Queries

### Cluster Health
```promql
# Node availability
up{job="node-exporter"}

# Pod restart count (last hour)
sum(increase(kube_pod_container_status_restarts_total[1h])) by (namespace, pod) > 0

# Pods not running
kube_pod_status_phase{phase!~"Running|Succeeded"} == 1
```

### Resource Usage
```promql
# Node CPU usage percent
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Node memory usage percent
100 * (1 - ((node_memory_MemAvailable_bytes) / (node_memory_MemTotal_bytes)))

# Node disk usage percent
100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)
```

### Alerts
```promql
# Currently firing alerts
ALERTS{alertstate="firing"}

# Pending alerts (about to fire)
ALERTS{alertstate="pending"}
```

## Proactive Monitoring Checklist

When working in infrastructure projects, proactively check:

1. **Firing Alerts** - Any alerts currently active?
2. **Pod Health** - Any pods not Running?
3. **Resource Pressure** - CPU/Memory above 80%?
4. **Storage Usage** - Disk usage above 85%?
5. **Recent Restarts** - Pods restarting frequently?
6. **Node Conditions** - Any node conditions besides Ready?

## Thresholds for Warnings

| Metric | Warning | Critical |
|--------|---------|----------|
| CPU Usage | 70% | 85% |
| Memory Usage | 75% | 90% |
| Disk Usage | 80% | 90% |
| Pod Restarts (1h) | 3+ | 10+ |
| Pending Pods | 1+ (>5min) | Any |

## Integration with Other Skills

- **Infra**: For deployment and configuration changes
- **Platform**: For k8s-specific operations
- **HardwareDiag**: For hardware-level diagnostics
- **Sre**: For incident response procedures

## Grafana Access

Grafana admin password is stored in:
- macOS Keychain: `grafana.op.barkleyfarm.com`
- Future: Infisical (pending setup)

Default dashboards available:
- Kubernetes / Views / Pods
- Kubernetes / Views / Nodes
- Node Exporter / Nodes
- CoreDNS
- AlertManager Overview
