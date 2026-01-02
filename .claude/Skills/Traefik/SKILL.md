---
name: Traefik
description: Kubernetes ingress controller and reverse proxy. USE WHEN user mentions Traefik, ingress, reverse proxy, routing, TLS, certificates, load balancing, OR wants to expose services. Replaces SWAG for k3s cluster.
---

# Traefik

Ingress controller skill for the k3s cluster. Handles HTTP/HTTPS routing, TLS termination, middleware (auth, rate limiting), and service exposure.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Traefik
```

| Workflow | Trigger | File |
|----------|---------|------|
| **Install** | "install traefik", "set up ingress" | `workflows/Install.md` |
| **ExposeService** | "expose service", "create ingress", "add route" | `workflows/ExposeService.md` |
| **ConfigureTLS** | "add certificate", "enable HTTPS", "TLS" | `workflows/ConfigureTLS.md` |
| **AddMiddleware** | "add auth", "rate limit", "headers" | `workflows/AddMiddleware.md` |
| **Troubleshoot** | "ingress not working", "routing issues" | `workflows/Troubleshoot.md` |

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                         Barkley Farm                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Tailscale (Remote)     │     Local Network (10.0.30.x)          │
│        ↓                │            ↓                            │
│  ai2:443/80             │      ai2:443/80                         │
│        ↓                │            ↓                            │
│  ┌─────────────────────────────────────────┐                     │
│  │              Traefik                     │                     │
│  │         (LoadBalancer)                   │                     │
│  │   Ports: 80, 443                         │                     │
│  │   Entrypoints: web, websecure            │                     │
│  └─────────────────────────────────────────┘                     │
│              │                                                    │
│    ┌─────────┴──────────┬──────────┬─────────┐                   │
│    ↓                    ↓          ↓         ↓                   │
│ ┌──────┐         ┌──────────┐ ┌────────┐ ┌────────┐             │
│ │ArgoCD│         │ Longhorn │ │Jellyfin│ │ n8n    │             │
│ │:8080 │         │   UI     │ │ :8096  │ │ :5678  │             │
│ └──────┘         └──────────┘ └────────┘ └────────┘             │
│                                                                   │
│ Routes:                                                           │
│   argocd.barkleyfarm.com  → ArgoCD                               │
│   longhorn.barkleyfarm.com → Longhorn UI                         │
│   jellyfin.barkleyfarm.com → Jellyfin                            │
│   n8n.barkleyfarm.com      → n8n                                 │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Why Traefik (replacing SWAG)

| Feature | SWAG | Traefik |
|---------|------|---------|
| Native k8s integration | No | Yes (IngressRoute CRD) |
| Auto-discovery | Docker labels | k8s annotations + CRDs |
| Configuration | File-based | Kubernetes native |
| TLS certs | Certbot | Built-in ACME |
| HA | Manual | Kubernetes native |
| Dashboard | No | Yes |

## Deployment Model

- **Namespace**: `traefik`
- **Installation**: Helm chart
- **Service Type**: LoadBalancer (uses k3s servicelb)
- **Ports**: 80 (web), 443 (websecure), 8080 (dashboard - internal only)

## Quick Reference

### Core Concepts

| Concept | Purpose | Example |
|---------|---------|---------|
| **Entrypoint** | Incoming port | `web` (80), `websecure` (443) |
| **IngressRoute** | Route rules | Host + path → service |
| **Middleware** | Processing | Auth, rate limit, headers |
| **Service** | Backend | k8s service reference |
| **TLSOption** | TLS config | Min version, ciphers |
| **Certificate** | TLS cert | Let's Encrypt or self-signed |

### CRDs (Custom Resource Definitions)

Traefik uses CRDs for configuration:

```bash
kubectl get ingressroutes -A        # HTTP routes
kubectl get ingressroutetcps -A     # TCP routes
kubectl get ingressrouteudps -A     # UDP routes
kubectl get middlewares -A          # Middleware configs
kubectl get tlsoptions -A           # TLS configurations
kubectl get traefikservices -A      # Weighted/mirrored services
```

## Examples

### Example 1: Simple HTTP service exposure

```
User: "Expose my nginx deployment"

Traefik skill activates:
1. Create IngressRoute
2. Configure Host rule
3. Apply to cluster

Output: nginx.barkleyfarm.com → nginx service
```

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: nginx
  namespace: default
spec:
  entryPoints:
    - web
  routes:
    - match: Host(`nginx.barkleyfarm.com`)
      kind: Rule
      services:
        - name: nginx
          port: 80
```

### Example 2: HTTPS with Let's Encrypt

```
User: "Add HTTPS to my app"

Traefik skill activates:
1. Verify ACME resolver configured
2. Add tls section to IngressRoute
3. Redirect HTTP → HTTPS

Output: HTTPS enabled with auto-renewed certificate
```

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp-secure
  namespace: default
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`myapp.barkleyfarm.com`)
      kind: Rule
      services:
        - name: myapp
          port: 8080
  tls:
    certResolver: letsencrypt
```

### Example 3: Basic auth middleware

```
User: "Add password protection to admin page"

Traefik skill activates:
1. Create htpasswd secret
2. Create basicAuth middleware
3. Apply middleware to IngressRoute
```

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: admin-auth
  namespace: default
spec:
  basicAuth:
    secret: admin-credentials
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: admin-panel
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`admin.barkleyfarm.com`)
      kind: Rule
      services:
        - name: admin-app
          port: 80
      middlewares:
        - name: admin-auth
  tls:
    certResolver: letsencrypt
```

## Common Middleware Configurations

### Redirect HTTP to HTTPS

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: redirect-https
spec:
  redirectScheme:
    scheme: https
    permanent: true
```

### Strip Path Prefix

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: strip-api
spec:
  stripPrefix:
    prefixes:
      - /api
```

### Rate Limiting

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: rate-limit
spec:
  rateLimit:
    average: 100
    burst: 50
```

### Security Headers

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: security-headers
spec:
  headers:
    stsSeconds: 31536000
    stsIncludeSubdomains: true
    stsPreload: true
    forceSTSHeader: true
    contentTypeNosniff: true
    browserXssFilter: true
    frameDeny: true
```

## Dashboard Access

The Traefik dashboard is exposed internally only:

```bash
# Port forward to access dashboard
kubectl port-forward -n traefik svc/traefik 9000:9000

# Then open http://localhost:9000/dashboard/
```

For persistent access, create an IngressRoute with auth middleware.

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| **k3s** | Traefik runs on k3s, uses LoadBalancer |
| **Helm** | Traefik installed via Helm chart |
| **ArgoCD** | Traefik IngressRoutes managed via GitOps |
| **Longhorn** | Exposes Longhorn UI via IngressRoute |
| **Infra** | Replaces SWAG for reverse proxy |

## DNS Configuration

For Barkley Farm (Tailscale-only access):

1. **MagicDNS**: Tailscale provides `*.ts.net` names automatically
2. **Custom domain**: Add DNS records pointing to Tailscale IP or node IP
3. **Split DNS**: Configure Tailscale to resolve `*.barkleyfarm.com` to cluster IP

### Tailscale + Traefik

```
barkleyfarm.com  →  Tailscale  →  ai2 (100.x.x.x)  →  Traefik  →  Service
                                  or
                    10.0.30.x (local)  →  ai2 (10.0.20.22)  →  Traefik
```

## Troubleshooting Quick Ref

```bash
# Check Traefik pods
kubectl get pods -n traefik

# Traefik logs
kubectl logs -n traefik -l app.kubernetes.io/name=traefik

# Check IngressRoutes
kubectl get ingressroutes -A

# Describe IngressRoute for events
kubectl describe ingressroute <name> -n <namespace>

# Check Traefik is receiving routes
kubectl port-forward -n traefik svc/traefik 9000:9000
# Open http://localhost:9000/dashboard/#/http/routers
```

## Security Notes

- Dashboard should NEVER be exposed publicly without auth
- Use `websecure` entrypoint for production services
- Always enable security headers middleware
- Rate limiting prevents abuse
- mTLS available for service-to-service auth

---

**Traefik skill provides ingress and routing for all k3s-hosted services.**
