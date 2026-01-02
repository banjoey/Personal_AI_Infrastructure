---
description: Complete workflow for deploying an application to k3s with research, prerequisites, and DNS automation.
---

# DeployApp Workflow

**Deploy an application to the k3s cluster following a research-first, fully automated approach.**

## Workflow Phases

### Phase 1: Research (MANDATORY)

**NEVER skip this phase.** Training knowledge about Helm charts goes stale quickly.

```
1. Launch research agent to find:
   - Official Helm repository URL
   - Current chart name (names change!)
   - Latest stable chart version
   - Database/cache requirements (PostgreSQL? Redis? MongoDB deprecated?)
   - Required bootstrap secrets
   - Known issues and gotchas

2. Research sources to check:
   - Official documentation (e.g., infisical.com/docs)
   - GitHub releases page
   - Artifact Hub (artifacthub.io)
   - Helm repository index

3. Return deployment plan with specific versions before proceeding.
```

**Example research prompt:**
```
Research the current (2024-2025) best practices for deploying [APP_NAME] to Kubernetes using Helm.
Find:
1. Official Helm repository URL
2. Correct chart name (may have changed)
3. Current chart version
4. Database requirements
5. Bootstrap secrets needed
6. Common issues
Focus on official documentation. Return specific, actionable information.
```

### Phase 2: Prerequisites

**Before ArgoCD can deploy, prepare the cluster:**

```bash
# 1. Create namespace
kubectl create namespace APP_NAMESPACE

# 2. Create bootstrap secrets (if required)
kubectl create secret generic APP_NAME-secrets -n APP_NAMESPACE \
  --from-literal=KEY1=$(openssl rand -hex 16) \
  --from-literal=KEY2=$(openssl rand -hex 16) \
  --from-literal=SITE_URL=https://APP.op.barkleyfarm.com

# 3. Verify storage class exists
kubectl get storageclass longhorn
```

**Save secrets to Bitwarden immediately!**

### Phase 3: DNS Record (AUTOMATIC)

**DNS is handled automatically by ExternalDNS!**

ExternalDNS is deployed in the cluster with the UniFi webhook. When you create an Ingress with a hostname matching `*.op.barkleyfarm.com`, ExternalDNS automatically:
1. Creates A records in UniFi pointing to the cluster node IPs
2. Creates TXT ownership records for tracking

**No manual DNS action required for local services.**

#### Verification

After deployment, verify DNS was created:

```bash
# Check UniFi DNS records
dig APP.op.barkleyfarm.com @10.0.0.1

# Check ExternalDNS logs
kubectl logs -n external-dns -l app.kubernetes.io/name=external-dns -c external-dns --tail=20
```

#### For *.barkleyfarm.com (Public/Cloudflare)

Public DNS still requires manual action or Cloudflare MCP:

```typescript
// Use Cloudflare MCP to create A record
mcp__cloudflare__cloudflare-dns-mcp_create_dns_record({
  zone_id: "ZONE_ID",
  type: "A",
  name: "app.barkleyfarm.com",
  content: "EXTERNAL_IP",
  proxied: true
})
```

**Note:** Could add Cloudflare provider to ExternalDNS for full automation.

### Phase 4: Create ArgoCD Application

**Create the application manifest:**

```yaml
# k8s/apps/children/APP_NAME.yaml
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
    repoURL: HELM_REPO_URL        # From research
    chart: CHART_NAME              # From research (may differ from app name!)
    targetRevision: CHART_VERSION  # Specific version from research
    helm:
      releaseName: APP_NAME
      valuesObject:
        # Minimal overrides - let chart defaults work
        # Only specify what you NEED to change

        # Common overrides:
        ingress:
          enabled: true
          ingressClassName: traefik
          nginx:
            enabled: false         # ALWAYS disable bundled nginx
          hostName: APP.op.barkleyfarm.com

        ingress-nginx:
          enabled: false           # ALWAYS disable bundled nginx

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

**Key rules:**
- Use specific `targetRevision` (never "latest" or "*")
- Don't override images unless necessary
- Always disable bundled nginx ingress
- Reference secrets created in Phase 2

### Phase 5: Deploy

```bash
# 1. Commit and push
cd /path/to/bfinfrastructure
git add k8s/apps/children/APP_NAME.yaml
git commit -m "Add APP_NAME to k3s cluster

Chart: CHART_NAME CHART_VERSION
Namespace: APP_NAMESPACE
Ingress: APP.op.barkleyfarm.com
"
git push origin main

# 2. Trigger ArgoCD sync
kubectl annotate application root-app -n argocd \
  argocd.argoproj.io/refresh=hard --overwrite

# 3. Wait for sync
sleep 30
kubectl get application APP_NAME -n argocd
```

### Phase 6: Verify

```bash
# 1. Check ArgoCD status
kubectl get application APP_NAME -n argocd

# 2. Check pods
kubectl get pods -n APP_NAMESPACE

# 3. Check logs if issues
kubectl logs -n APP_NAMESPACE -l app.kubernetes.io/name=APP_NAME

# 4. Test ingress
curl -k https://APP.op.barkleyfarm.com

# 5. Verify DNS resolves
dig APP.op.barkleyfarm.com
```

## Checklist Summary

- [ ] **Research** - Found official repo, chart name, version, requirements
- [ ] **Secrets** - Created bootstrap secrets, saved to Bitwarden
- [ ] **DNS** - AUTOMATIC for *.op.barkleyfarm.com (ExternalDNS handles it)
- [ ] **Manifest** - Created ArgoCD Application YAML
- [ ] **Deploy** - Pushed to GitLab, triggered sync
- [ ] **Verify** - App healthy, ingress working, DNS resolving

## Anti-Patterns to Avoid

### ❌ Deploying from memory
**Problem:** Chart versions/names/requirements change
**Solution:** ALWAYS research first

### ❌ Using "latest" image tags
**Problem:** Breaks when images update
**Solution:** Let chart use its pinned defaults

### ❌ Overriding everything in values
**Problem:** Breaks compatibility with chart
**Solution:** Minimal overrides - only what you need

### ❌ Forgetting DNS
**Problem:** Deployment works but nobody can access it
**Solution:** DNS is part of the deployment workflow

### ❌ Skipping secret backup
**Problem:** Lose encryption keys = lose data
**Solution:** Save to Bitwarden IMMEDIATELY after creation
