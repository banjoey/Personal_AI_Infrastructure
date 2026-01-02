# Troubleshoot Workflow

Diagnose and fix common Traefik issues.

---

## Quick Diagnostic Commands

```bash
# Check Traefik pods
kubectl get pods -n traefik

# Traefik logs
kubectl logs -n traefik -l app.kubernetes.io/name=traefik --tail=100

# All IngressRoutes
kubectl get ingressroutes -A

# Check specific IngressRoute
kubectl describe ingressroute <name> -n <namespace>

# Check middlewares
kubectl get middlewares -A

# Dashboard (port forward)
kubectl port-forward -n traefik svc/traefik 9000:9000
# Open http://localhost:9000/dashboard/
```

---

## Symptom: 404 Not Found

### Check 1: IngressRoute Exists

```bash
kubectl get ingressroute -n <namespace>
```

**If missing:** Create the IngressRoute

### Check 2: Host Header Matches

```bash
# Test with explicit Host header
curl -H "Host: myapp.barkleyfarm.com" http://10.0.20.22

# Verify IngressRoute host
kubectl get ingressroute <name> -o yaml | grep -A 2 "match:"
```

**If mismatch:** Host in request must exactly match IngressRoute rule

### Check 3: EntryPoint Correct

```bash
# Check IngressRoute entryPoints
kubectl get ingressroute <name> -o yaml | grep -A 2 "entryPoints"
```

- `web` = port 80 (HTTP)
- `websecure` = port 443 (HTTPS)

**If wrong:** Update IngressRoute to correct entryPoint

### Check 4: Route Visible in Dashboard

```bash
kubectl port-forward -n traefik svc/traefik 9000:9000
# Open http://localhost:9000/dashboard/#/http/routers
```

**If not visible:** Check Traefik logs for CRD parsing errors

---

## Symptom: 502 Bad Gateway

Backend service unreachable.

### Check 1: Service Exists

```bash
kubectl get svc <service-name> -n <namespace>
```

### Check 2: Service Has Endpoints

```bash
kubectl get endpoints <service-name> -n <namespace>
```

**If empty:** Pods not running or selector doesn't match

### Check 3: Pod Is Healthy

```bash
kubectl get pods -n <namespace> -l <selector>
kubectl describe pod <pod> -n <namespace>
```

### Check 4: Port Is Correct

```bash
# IngressRoute service port must match Service port (not container port)
kubectl get svc <service> -o yaml | grep -A 5 "ports:"
kubectl get ingressroute <name> -o yaml | grep -A 5 "services:"
```

### Check 5: Network Policy

```bash
# If using network policies
kubectl get networkpolicy -n <namespace>
```

---

## Symptom: 503 Service Unavailable

### Check 1: Traefik Pod Status

```bash
kubectl get pods -n traefik
kubectl describe pod <traefik-pod> -n traefik
```

### Check 2: LoadBalancer Service

```bash
kubectl get svc -n traefik
# EXTERNAL-IP should not be <pending>
```

**If pending:** k3s servicelb may have issues

### Check 3: Resource Limits

```bash
kubectl top pod -n traefik
# Compare to limits in values
```

---

## Symptom: SSL/TLS Errors

### Certificate Not Valid

```bash
# Check if cert was issued
kubectl exec -n traefik <pod> -- cat /data/acme.json | jq '.letsencrypt.Certificates'

# Check Traefik logs for ACME errors
kubectl logs -n traefik -l app.kubernetes.io/name=traefik | grep -i acme
```

**Common causes:**
- DNS not pointing to Traefik
- Port 80 blocked (HTTP challenge fails)
- Let's Encrypt rate limited

### Self-Signed Cert Not Working

```bash
# Check secret exists
kubectl get secret <tls-secret> -n <namespace>

# Verify secret has correct keys
kubectl get secret <tls-secret> -o yaml | grep -E "tls.crt|tls.key"
```

### Wrong Certificate Served

```bash
# Check TLSStore default
kubectl get tlsstore -A

# Check IngressRoute tls section
kubectl get ingressroute <name> -o yaml | grep -A 5 "tls:"
```

---

## Symptom: Middleware Not Working

### Basic Auth Fails

```bash
# Verify secret exists
kubectl get secret <auth-secret> -n <namespace>

# Decode and check format
kubectl get secret <auth-secret> -o jsonpath='{.data.users}' | base64 -d
# Should show: username:$apr1$...
```

**Format must be htpasswd:**
```bash
htpasswd -nb admin password
```

### Middleware Not Applied

```bash
# Check middleware exists
kubectl get middleware <name> -n <namespace>

# Check IngressRoute references correct namespace
kubectl get ingressroute <name> -o yaml | grep -A 3 "middlewares:"
```

**Cross-namespace reference:**
```yaml
middlewares:
  - name: my-middleware
    namespace: traefik  # Required if different namespace
```

### Rate Limit Not Working

```bash
# Check middleware config
kubectl get middleware <rate-limit> -o yaml

# Verify sourceCriterion
# If behind proxy, need correct depth for X-Forwarded-For
```

---

## Symptom: Slow Response Times

### Check 1: Traefik Resources

```bash
kubectl top pod -n traefik
```

### Check 2: Backend Service Performance

```bash
# Bypass Traefik and test directly
kubectl port-forward svc/<backend> 8080:80
curl http://localhost:8080
```

### Check 3: Enable Access Logs

```yaml
# In Traefik values
logs:
  access:
    enabled: true
```

```bash
kubectl logs -n traefik -l app.kubernetes.io/name=traefik | grep <path>
```

---

## Symptom: Traefik Pod CrashLoopBackOff

### Check 1: Pod Events

```bash
kubectl describe pod <traefik-pod> -n traefik
```

### Check 2: Configuration Errors

```bash
kubectl logs -n traefik <traefik-pod> --previous
```

**Common causes:**
- Invalid Helm values
- Missing required configuration
- Port conflict

### Check 3: Persistent Volume

```bash
kubectl get pvc -n traefik
kubectl describe pvc <pvc-name> -n traefik
```

---

## Collect Full Diagnostics

```bash
# Create diagnostics directory
mkdir traefik-diag && cd traefik-diag

# Gather info
kubectl get pods -n traefik -o wide > pods.txt
kubectl get svc -n traefik -o wide > services.txt
kubectl get ingressroutes -A -o yaml > ingressroutes.yaml
kubectl get middlewares -A -o yaml > middlewares.yaml
kubectl logs -n traefik -l app.kubernetes.io/name=traefik --tail=500 > logs.txt
kubectl describe pods -n traefik > pod-describe.txt

# Package
tar czf traefik-diagnostics.tar.gz *
```

---

## Reset Traefik

Nuclear option if nothing else works:

```bash
# Uninstall
helm uninstall traefik -n traefik

# Delete persistent data
kubectl delete pvc -n traefik --all

# Delete namespace
kubectl delete namespace traefik

# Reinstall
kubectl create namespace traefik
helm install traefik traefik/traefik -n traefik -f traefik-values.yaml
```
