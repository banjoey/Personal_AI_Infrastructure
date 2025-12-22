---
name: Sre
description: Site Reliability Engineering for infrastructure operations. USE WHEN setting up monitoring, configuring alerts, responding to incidents, analyzing system health, OR implementing observability. Covers Prometheus, AlertManager, Grafana, Loki, and incident response procedures.
---

# Sre

Site Reliability Engineering skill for keeping infrastructure running reliably. Covers the observe-detect-respond-learn cycle.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Sre
```

| Workflow | Trigger | File |
|----------|---------|------|
| **DeployMonitoring** | "deploy prometheus", "setup monitoring", "add metrics" | `workflows/DeployMonitoring.md` |
| **ConfigureAlerts** | "create alert", "configure alerting", "alert rule" | `workflows/ConfigureAlerts.md` |
| **RespondToIncident** | "service down", "alert firing", "incident" | `workflows/RespondToIncident.md` |
| **AnalyzeHealth** | "health check", "system status", "capacity check" | `workflows/AnalyzeHealth.md` |
| **PostMortem** | "root cause analysis", "incident review", "post-mortem" | `workflows/PostMortem.md` |
| **SetupDashboard** | "create dashboard", "grafana dashboard", "visualize metrics" | `workflows/SetupDashboard.md` |
| **ConfigureLogging** | "setup logging", "loki", "log aggregation" | `workflows/ConfigureLogging.md` |

## Examples

**Example 1: Respond to alert**
```
User: "Prometheus alert: HostHighMemory firing on ai2"
→ Invokes RespondToIncident workflow
→ Checks current memory usage
→ Identifies top memory consumers
→ Determines if action needed (restart, scale, investigate)
→ Documents incident
```

**Example 2: Setup monitoring for new service**
```
User: "Add monitoring for the new reporting service"
→ Invokes DeployMonitoring workflow
→ Adds ServiceMonitor for Prometheus scraping
→ Creates alert rules (error rate, latency, availability)
→ Adds Grafana dashboard
```

**Example 3: Analyze system health**
```
User: "How's the cluster looking?"
→ Invokes AnalyzeHealth workflow
→ Checks node resources (CPU, memory, disk)
→ Checks pod health across namespaces
→ Identifies any anomalies or trends
→ Reports status with recommendations
```

## Core Principles

### 1. Four Golden Signals
Monitor these for every service:
- **Latency** - How long requests take
- **Traffic** - How much demand
- **Errors** - Rate of failures
- **Saturation** - How full the system is

### 2. Alert on Symptoms, Not Causes
- **Good**: "Error rate > 1%" (symptom users experience)
- **Bad**: "CPU > 80%" (cause, may not affect users)

### 3. Every Alert Must Be Actionable
- If alert fires, there MUST be a runbook
- If no action possible, it's not an alert (it's a metric)

### 4. Blameless Post-Mortems
- Focus on systems, not people
- What failed? How do we prevent it?
- Document and share learnings

### 5. SLOs Before SLAs
- Define Service Level Objectives internally
- Error budget = 100% - SLO
- Spend error budget on feature velocity

## Incident Response Framework

### Severity Levels

| Level | Criteria | Response Time | Escalation |
|-------|----------|---------------|------------|
| **P1** | Service down, data loss risk | Immediate | All hands |
| **P2** | Degraded performance, partial outage | < 1 hour | On-call |
| **P3** | Minor issue, workaround exists | < 4 hours | Normal |
| **P4** | Cosmetic, no user impact | Next business day | Backlog |

### Incident Lifecycle

```
DETECT → TRIAGE → MITIGATE → RESOLVE → LEARN
   │        │         │          │        │
   │        │         │          │        └─ Post-mortem, improve
   │        │         │          └─ Root cause fix
   │        │         └─ Stop the bleeding
   │        └─ Assess severity, assign
   └─ Alert fires or user reports
```

## Monitoring Stack

### Current State (Target)
```
┌─────────────────────────────────────────────────────┐
│                   METRICS                            │
├─────────────────────────────────────────────────────┤
│  Prometheus ──► AlertManager ──► Notifications      │
│       │              │                               │
│       │              └─► Discord, Email             │
│       │                                              │
│       └─────► Grafana (dashboards)                  │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│                    LOGS                              │
├─────────────────────────────────────────────────────┤
│  Apps ──► stdout ──► Loki ──► Grafana               │
└─────────────────────────────────────────────────────┘
```

### Node Exporters
- ai1, ai2, nas1 - node_exporter for system metrics
- k3s built-in metrics for cluster health

## Alert Rules Template

```yaml
groups:
  - name: {service}-alerts
    rules:
      - alert: {Service}HighErrorRate
        expr: |
          sum(rate(http_requests_total{service="{service}", status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total{service="{service}"}[5m]))
          > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {service}"
          description: "Error rate is {{ $value | humanizePercentage }}"
          runbook: "https://wiki/runbooks/{service}-high-errors"

      - alert: {Service}HighLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket{service="{service}"}[5m])) by (le)
          ) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency on {service}"
          description: "P95 latency is {{ $value }}s"
```

## Related Skills

- **Platform** - For container/k8s operations
- **Network** - For network-level troubleshooting
- **Security** - For security incident response

## Success Metrics

- **MTTR** (Mean Time To Recovery) - Target: < 30 minutes for P1
- **MTTD** (Mean Time To Detect) - Target: < 5 minutes
- **Availability** - Target: 99.9% (8.76 hours downtime/year)
- **Error Budget** - Track and protect
