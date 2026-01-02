---
name: K3sDeployment
description: Deploy applications to k3s cluster via ArgoCD GitOps. USE WHEN user wants to deploy an app to k3s, add a helm chart, create ArgoCD application, OR mentions kubernetes deployment. Enforces research-first workflow to prevent stale knowledge issues.
---

# K3sDeployment

Deploy applications to the k3s cluster using ArgoCD GitOps pattern with **mandatory research phase**.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName K3sDeployment
```

| Workflow | Trigger | File |
|----------|---------|------|
| **DeployApp** | "deploy X to k3s", "add X to cluster" | `workflows/DeployApp.md` |
| **ResearchChart** | "research helm chart for X" | `workflows/ResearchChart.md` |
| **DebugApp** | "fix k3s deployment", "app not working" | `workflows/DebugApp.md` |

## Examples

**Example 1: Deploy a new application**
```
User: "Deploy Infisical to k3s"
→ Invokes DeployApp workflow
→ PHASE 1: Research current chart versions, database requirements, prerequisites
→ PHASE 2: Create bootstrap secrets if needed
→ PHASE 3: Create ArgoCD Application manifest
→ PHASE 4: Push to GitLab, trigger sync
→ PHASE 5: Verify deployment healthy
```

**Example 2: Research before deployment**
```
User: "I want to add Grafana to the cluster"
→ Invokes ResearchChart workflow
→ Searches for official helm repo
→ Finds latest chart version
→ Identifies required values and prerequisites
→ Returns deployment plan for review
```

**Example 3: Debug failing deployment**
```
User: "The Infisical pods are crashing"
→ Invokes DebugApp workflow
→ Checks pod logs and events
→ Identifies root cause
→ Suggests fixes
```

## Core Principle: Research First

**NEVER deploy from training knowledge alone.** Helm charts change frequently:
- Chart names change (e.g., `infisical` → `infisical-standalone`)
- Database backends change (e.g., MongoDB → PostgreSQL)
- Image tags become unavailable
- Configuration schemas evolve

**ALWAYS:**
1. Research current official documentation
2. Find the correct helm repository URL
3. Get the latest chart version
4. Understand prerequisites before deployment

## BF Infrastructure Context

### Cluster Details
- **Primary node:** ai2 (10.0.20.22)
- **Control-plane only:** nas1 (10.0.20.15, tainted)
- **GitOps repo:** gitlab.com/barkleyfarm2/bfinfrastructure

### Storage Classes
| Class | Use Case |
|-------|----------|
| longhorn (default) | High-IOPS, replicated |
| nfs-nas1 | Bulk storage (11TB) |

### DNS Convention
- `*.op.barkleyfarm.com` → Local DNS (on-prem services)
- `*.barkleyfarm.com` → Cloudflare (public services)

### ArgoCD App-of-Apps Pattern
```
k8s/apps/
├── root.yaml          # Root application
└── children/
    ├── app-name.yaml  # Child applications
    └── ...
```

## ArgoCD Application Template

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: APP_NAME
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: HELM_REPO_URL
    chart: CHART_NAME
    targetRevision: CHART_VERSION  # Use specific version, NOT latest
    helm:
      releaseName: APP_NAME
      valuesObject:
        # Let charts use their default images when possible
        # Only override when necessary
  destination:
    server: https://kubernetes.default.svc
    namespace: APP_NAMESPACE
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

## Deployment Checklist

Before any deployment:

- [ ] **Research** - Find official helm repo, latest version, database requirements
- [ ] **Prerequisites** - Create namespace, bootstrap secrets, DNS records
- [ ] **Storage** - Verify storage class exists for any PVCs
- [ ] **Values** - Use chart defaults; only override what's necessary
- [ ] **Ingress** - Configure for Traefik (set nginx.enabled: false)
- [ ] **Push** - Commit to GitLab, let ArgoCD sync
- [ ] **Verify** - Check app status, pod health, logs

## Common Issues

### Image Pull Errors
- **Cause:** Overriding with `latest` or outdated specific tags
- **Fix:** Remove image overrides, let chart use its tested defaults

### Database Connection Errors
- **Cause:** Chart changed database backend (MongoDB → PostgreSQL)
- **Fix:** Research current requirements, use correct chart

### Missing Secrets
- **Cause:** Bootstrap secrets not created before deployment
- **Fix:** Create required secrets in namespace first

### Ingress Not Working
- **Cause:** Chart bundles nginx, conflicts with Traefik
- **Fix:** Set `ingress-nginx.enabled: false` and `ingress.nginx.enabled: false`
