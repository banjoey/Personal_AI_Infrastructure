# ExposeService Workflow

Creates IngressRoute to expose a Kubernetes service via Traefik.

## Prerequisites

- [ ] Traefik installed and running
- [ ] Target service exists and is working
- [ ] DNS configured (or will use /etc/hosts for testing)

---

## Step 1: Identify Target Service

```bash
# Find the service to expose
kubectl get svc -n <namespace>

# Note:
# - Service NAME
# - Service PORT
# - Service NAMESPACE
```

## Step 2: Determine Route Configuration

| Question | Options |
|----------|---------|
| Protocol | HTTP (web) / HTTPS (websecure) |
| Host | mydomain.com |
| Path | / (root) or /api, /admin, etc. |
| TLS | None, self-signed, Let's Encrypt |
| Auth | None, basicAuth, forwardAuth |

---

## Step 3: Create IngressRoute

### Basic HTTP Route

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: <service-name>-ingress
  namespace: <service-namespace>
spec:
  entryPoints:
    - web
  routes:
    - match: Host(`<hostname>`)
      kind: Rule
      services:
        - name: <service-name>
          port: <service-port>
```

### HTTPS Route (recommended)

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: <service-name>-ingress
  namespace: <service-namespace>
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`<hostname>`)
      kind: Rule
      services:
        - name: <service-name>
          port: <service-port>
  tls:
    certResolver: letsencrypt
```

### With Path-Based Routing

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: api-ingress
  namespace: default
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`example.com`) && PathPrefix(`/api`)
      kind: Rule
      services:
        - name: api-service
          port: 8080
      middlewares:
        - name: strip-api-prefix
  tls:
    certResolver: letsencrypt
---
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: strip-api-prefix
  namespace: default
spec:
  stripPrefix:
    prefixes:
      - /api
```

### With HTTP to HTTPS Redirect

```yaml
# HTTP redirect route
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp-http-redirect
  namespace: default
spec:
  entryPoints:
    - web
  routes:
    - match: Host(`myapp.barkleyfarm.com`)
      kind: Rule
      middlewares:
        - name: redirect-https
          namespace: traefik
      services:
        - name: noop@internal
          kind: TraefikService
---
# HTTPS route
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp-https
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

---

## Step 4: Apply Configuration

```bash
kubectl apply -f <ingressroute-file>.yaml

# Verify created
kubectl get ingressroute -n <namespace>
```

---

## Step 5: Verify Route Working

```bash
# Check Traefik has picked up the route
kubectl describe ingressroute <name> -n <namespace>

# Test via curl (add to /etc/hosts if DNS not set up)
curl -v http://<hostname>
# or
curl -v https://<hostname>

# Check Traefik dashboard for route status
kubectl port-forward -n traefik svc/traefik 9000:9000
# Open http://localhost:9000/dashboard/#/http/routers
```

---

## Common Patterns

### Expose ArgoCD

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: argocd
  namespace: argocd
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`argocd.barkleyfarm.com`)
      kind: Rule
      services:
        - name: argocd-server
          port: 80
  tls: {}  # ArgoCD handles TLS internally
```

### Expose Longhorn UI

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: longhorn-ui
  namespace: longhorn-system
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`longhorn.barkleyfarm.com`)
      kind: Rule
      services:
        - name: longhorn-frontend
          port: 80
      middlewares:
        - name: admin-auth
          namespace: traefik
  tls:
    certResolver: letsencrypt
```

### Expose with Sticky Sessions

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: stateful-app
  namespace: default
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`app.barkleyfarm.com`)
      kind: Rule
      services:
        - name: stateful-app
          port: 8080
          sticky:
            cookie:
              name: server_id
              secure: true
              httpOnly: true
  tls:
    certResolver: letsencrypt
```

---

## Troubleshooting

### Route not appearing in dashboard

```bash
# Check IngressRoute was created
kubectl get ingressroute -A

# Check for errors
kubectl describe ingressroute <name> -n <namespace>

# Check Traefik logs
kubectl logs -n traefik -l app.kubernetes.io/name=traefik
```

### 404 Not Found

- Verify Host header matches exactly
- Check service exists and has endpoints
- Verify entryPoint is correct (web vs websecure)

### 502 Bad Gateway

```bash
# Check target service
kubectl get endpoints <service-name> -n <namespace>
# Should show pod IPs, not be empty

# Check pod is healthy
kubectl get pods -n <namespace> -l <service-selector>
```

### TLS Certificate Issues

```bash
# Check cert resolver logs
kubectl logs -n traefik -l app.kubernetes.io/name=traefik | grep -i acme

# Verify ACME storage
kubectl exec -n traefik <traefik-pod> -- cat /data/acme.json
```
