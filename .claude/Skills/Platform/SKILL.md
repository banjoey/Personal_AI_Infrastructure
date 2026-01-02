---
name: Platform
description: Kubernetes and container platform engineering for k3s infrastructure. USE WHEN deploying containers, managing k8s resources, configuring ArgoCD, building CI/CD pipelines, OR troubleshooting pod/deployment issues. Enforces GitOps patterns and standardized deployment workflows.
---

# Platform

Platform engineering skill for k3s container infrastructure. Covers the full lifecycle from container builds through GitOps deployment to operational management.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Platform
```

| Workflow | Trigger | File |
|----------|---------|------|
| **DeployContainer** | "deploy container", "deploy to k3s", "new deployment" | `workflows/DeployContainer.md` |
| **DeployMcp** | "deploy MCP", "add MCP server", "MCP to k3s" | `workflows/DeployMcp.md` |
| **DeployHelmChart** | "deploy helm chart", "install chart", "add helm release" | `workflows/DeployHelmChart.md` |
| **TroubleshootPod** | "pod not starting", "crashloop", "pod issues" | `workflows/TroubleshootPod.md` |
| **TroubleshootService** | "service unreachable", "can't connect", "endpoint down" | `workflows/TroubleshootService.md` |
| **TroubleshootIngress** | "ingress not working", "404 errors", "TLS issues" | `workflows/TroubleshootIngress.md` |
| **ConfigureArgocd** | "argocd app", "gitops setup", "sync application" | `workflows/ConfigureArgocd.md` |
| **BuildImage** | "build docker image", "create dockerfile", "CI pipeline" | `workflows/BuildImage.md` |
| **EvaluateChart** | "evaluate helm chart", "should we use this chart" | `workflows/EvaluateChart.md` |

## Examples

**Example 1: Deploy new container to k3s**
```
User: "Deploy the new reporting service to k3s"
→ Invokes DeployContainer workflow
→ Creates namespace, deployment, service, ingress
→ Configures ArgoCD application
→ Verifies pod running and healthy
→ Updates documentation
```

**Example 2: Troubleshoot failing pod**
```
User: "The gitlab-mcp pod keeps crashing"
→ Invokes TroubleshootPod workflow
→ Checks: ImagePull? CrashLoop? OOMKilled? Resources?
→ Examines logs, events, describe output
→ Identifies root cause and applies fix
```

**Example 3: Add new MCP server**
```
User: "Deploy unifi-mcp to k3s"
→ Invokes DeployMcp workflow
→ Follows MCP deployment pattern (supergateway, HTTP transport)
→ Creates secrets from Infisical
→ Configures Traefik ingress with TLS
→ Tests MCP connectivity
```

## MANDATORY Pre-Deployment Checklist

**STOP. Before ANY infrastructure change, complete this checklist:**

### 1. Research First (NOT from training data)
- [ ] **Fetch current documentation** for the tool/chart being used
  - Use WebFetch on official docs
  - Check for version-specific requirements
  - Don't assume training data is correct
- [ ] **Find a WORKING example** in this cluster
  - What similar service is already working?
  - How is it configured? (Ingress vs IngressRoute? Which annotations?)
  - Use `kubectl get <resource> -o yaml` to examine working configs

### 2. Understand Before Applying
- [ ] **Compare configurations** between working example and what you're creating
  - What's different? Why?
  - If you can't explain the difference, research it
- [ ] **Identify required annotations** for this cluster's setup
  - external-dns: needs `external-dns.alpha.kubernetes.io/target` for Traefik sources
  - Traefik: check if Ingress or IngressRoute is the working pattern
  - TLS: check TLSStore default vs certResolver

### 3. Define Verification Steps BEFORE Deploying
- [ ] How will you verify the deployment worked?
- [ ] What's the expected HTTP response code?
- [ ] What should DNS resolve to?
- [ ] What should ArgoCD status show AND what should actual resource state be?

### 4. After Applying - Verify Actual State
- [ ] **Check actual resource state**, not just ArgoCD status
  ```bash
  # Don't trust "Synced" - verify the actual resource
  kubectl get <resource> -o yaml | grep <changed-field>
  ```
- [ ] **Test the endpoint** - curl the actual URL
- [ ] **If it doesn't work** - Research WHY before trying alternatives
  - Don't blame tools
  - Check your configuration against working examples
  - Fetch documentation

---

## Core Principles

### 1. GitOps Only
- **ALL deployments via ArgoCD** - No direct `kubectl apply` for production
- **Git is source of truth** - Changes committed, then synced
- **No manual drift** - ArgoCD self-heals
- **Verify sync actually applied** - "Synced" status is not enough; check actual resource state

### 2. Standardized Patterns
All deployments follow the same structure:
```
bfinfrastructure/
├── docker/{name}/
│   └── Dockerfile
├── k8s/{name}/
│   └── deployment.yaml    # All k8s resources
├── k8s/argocd/applications/
│   └── {name}.yaml        # ArgoCD application
└── .gitlab-ci.yml         # CI job
```

### 3. Secrets via Infisical
- **NEVER** hardcode secrets in manifests
- **NEVER** commit secrets to git
- Create in Infisical → Create k8s Secret → Reference in deployment
- Future: External Secrets Operator for auto-sync

### 4. Health Checks Required
Every deployment MUST have:
- `livenessProbe` - Is the container alive?
- `readinessProbe` - Is it ready to serve traffic?
- Resource limits and requests

### 5. Logging to stdout/stderr
- No file-based logging in containers
- All logs to stdout/stderr
- Aggregated via Loki (future)

## Decision Trees

### Pod Not Starting
```
Pod not starting?
├── ImagePullBackOff?
│   ├── Check imagePullSecrets exists in namespace
│   ├── Check image name/tag correct
│   └── Check registry accessible
├── CrashLoopBackOff?
│   ├── Check logs: kubectl logs <pod>
│   ├── Check previous logs: kubectl logs <pod> --previous
│   └── Check startup command/args
├── Pending?
│   ├── Check resources: kubectl describe pod
│   ├── Check node capacity
│   └── Check nodeSelector/affinity
└── ContainerCreating (stuck)?
    ├── Check secrets/configmaps exist
    ├── Check PVC bound
    └── Check events: kubectl describe pod
```

### Service Unreachable
```
Service unreachable?
├── Pod running?
│   └── No → Fix pod first (see above)
├── Service selector matches pod labels?
│   ├── kubectl get svc <name> -o yaml
│   └── kubectl get pods --show-labels
├── Endpoints populated?
│   └── kubectl get endpoints <name>
├── Port mapping correct?
│   └── Service port → targetPort → Container port
└── NetworkPolicy blocking?
    └── kubectl get networkpolicy
```

## Known Working Patterns (This Cluster)

**These are TESTED patterns for the barkleyfarm k3s cluster. Use these, don't improvise.**

### Exposing Internal Services (*.op.barkleyfarm.com)

**USE: Standard Kubernetes Ingress (NOT Traefik IngressRoute)**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {service}-ingress
  namespace: {namespace}
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
spec:
  ingressClassName: traefik
  rules:
    - host: {service}.op.barkleyfarm.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: {service}
                port:
                  number: {port}
```

**Why not IngressRoute?** IngressRoutes have routing issues in this cluster. Standard Ingress works reliably. All MCPs use this pattern.

### TLS for Internal Services

**USE: Default TLSStore (wildcard cert)**
- The cluster has a wildcard cert: `wildcard-op-barkleyfarm-com-tls`
- TLSStore `default` in traefik namespace references it
- Just set `traefik.ingress.kubernetes.io/router.tls: "true"` - no secretName needed

**DON'T USE: certResolver: letsencrypt** for internal domains (Let's Encrypt can't verify internal domains)

### External-DNS for Internal Services

**Required annotation for Traefik sources:**
```yaml
annotations:
  external-dns.alpha.kubernetes.io/target: "10.0.20.15"  # Traefik LB IP
```

Without this annotation, external-dns can generate DNS records for Ingress but NOT for IngressRoutes.

### ArgoCD Sync Verification

**Don't trust "Synced" status alone:**
```bash
# Check what revision ArgoCD is using
kubectl get application {app} -n argocd -o jsonpath='{.status.sync.revision}'

# Compare with latest git commit
cd ~/proj/bfinfrastructure && git log --oneline -1

# Verify actual resource state
kubectl get {resource} -o yaml | grep {changed-field}
```

---

## Related Skills

- **SRE** - For monitoring, alerting, incident response
- **Network** - For ingress, DNS, firewall issues
- **Security** - For secrets management, hardening
- **GitLab** - For CI/CD pipeline configuration

## MCP Dependencies

- **gitlab-mcp** - Repository access, CI triggers
- **infisical-mcp** - Secrets management
- **joplin-mcp** - Documentation storage

## Reference Documentation

- `k8s/README.md` - Infrastructure conventions
- ADR-001: Container Deployment Pattern
- ADR-002: MCP Deployment Pattern
- ADR-003: Secrets Management
