# Traefik Quick Command Reference

Fast lookup for common Traefik operations.

---

## Status & Info

```bash
# Traefik pods
kubectl get pods -n traefik

# Traefik service (check external IP)
kubectl get svc -n traefik

# Traefik logs
kubectl logs -n traefik -l app.kubernetes.io/name=traefik --tail=100
kubectl logs -n traefik -l app.kubernetes.io/name=traefik -f  # follow

# Dashboard access
kubectl port-forward -n traefik svc/traefik 9000:9000
# Open http://localhost:9000/dashboard/
```

---

## IngressRoutes

```bash
# List all IngressRoutes
kubectl get ingressroutes -A

# Get specific IngressRoute
kubectl get ingressroute <name> -n <namespace> -o yaml

# Describe (shows events)
kubectl describe ingressroute <name> -n <namespace>

# Create from file
kubectl apply -f ingressroute.yaml

# Delete
kubectl delete ingressroute <name> -n <namespace>
```

### Quick IngressRoute Template

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp
  namespace: default
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`myapp.barkleyfarm.com`)
      kind: Rule
      services:
        - name: myapp-svc
          port: 80
  tls:
    certResolver: letsencrypt
```

---

## Middlewares

```bash
# List all middlewares
kubectl get middlewares -A

# Get specific middleware
kubectl get middleware <name> -n <namespace> -o yaml

# Common middleware types
kubectl get middleware -A -o custom-columns=NAME:.metadata.name,TYPE:.spec
```

### Quick Middleware Templates

**Basic Auth:**
```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: admin-auth
spec:
  basicAuth:
    secret: auth-secret
```

**Redirect HTTPS:**
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

**Rate Limit:**
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

---

## TLS & Certificates

```bash
# Check ACME storage
kubectl exec -n traefik <pod> -- cat /data/acme.json | jq '.'

# List certificates in ACME
kubectl exec -n traefik <pod> -- cat /data/acme.json | jq '.letsencrypt.Certificates[].domain.main'

# Check TLS secrets
kubectl get secrets -A | grep tls

# Get TLSOptions
kubectl get tlsoptions -A

# Get TLSStores
kubectl get tlsstores -A
```

---

## Other CRDs

```bash
# TCP IngressRoutes
kubectl get ingressroutetcps -A

# UDP IngressRoutes
kubectl get ingressrouteudps -A

# ServersTransports (backend TLS config)
kubectl get serverstransports -A

# TraefikServices (weighted, mirrored)
kubectl get traefikservices -A
```

---

## Helm Operations

```bash
# Check current values
helm get values traefik -n traefik

# Upgrade with new values
helm upgrade traefik traefik/traefik -n traefik -f traefik-values.yaml

# Rollback
helm rollback traefik -n traefik

# Uninstall
helm uninstall traefik -n traefik
```

---

## Testing Routes

```bash
# Test HTTP
curl -v -H "Host: app.barkleyfarm.com" http://10.0.20.22

# Test HTTPS (ignore cert for self-signed)
curl -vk -H "Host: app.barkleyfarm.com" https://10.0.20.22

# Test with specific path
curl -v "http://10.0.20.22/api/health" -H "Host: app.barkleyfarm.com"

# Show response headers
curl -I -H "Host: app.barkleyfarm.com" https://10.0.20.22

# Debug SSL
openssl s_client -connect 10.0.20.22:443 -servername app.barkleyfarm.com
```

---

## Match Rule Syntax

| Rule | Example |
|------|---------|
| Host | `Host(\`example.com\`)` |
| Path | `Path(\`/api\`)` |
| PathPrefix | `PathPrefix(\`/api\`)` |
| Headers | `Headers(\`X-Custom\`, \`value\`)` |
| Method | `Method(\`GET\`, \`POST\`)` |
| Query | `Query(\`token\`, \`abc\`)` |

**Combine with:**
- `&&` (AND)
- `||` (OR)

Example: `Host(\`api.example.com\`) && PathPrefix(\`/v1\`)`

---

## Common Fixes

### Restart Traefik

```bash
kubectl rollout restart deployment traefik -n traefik
```

### Force Certificate Renewal

```bash
# Delete ACME storage
kubectl exec -n traefik <pod> -- rm /data/acme.json
kubectl rollout restart deployment traefik -n traefik
```

### Clear Stuck IngressRoute

```bash
kubectl delete ingressroute <name> -n <namespace>
kubectl apply -f <ingressroute.yaml>
```

---

## Barkley Farm Specific

```bash
# Traefik external IP
kubectl get svc traefik -n traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# All exposed routes
kubectl get ingressroutes -A -o custom-columns=NAME:.metadata.name,HOST:.spec.routes[0].match

# Quick test all routes
for host in argocd longhorn jellyfin; do
  curl -sk -o /dev/null -w "%{http_code} $host\n" \
    -H "Host: $host.barkleyfarm.com" https://10.0.20.22
done
```
