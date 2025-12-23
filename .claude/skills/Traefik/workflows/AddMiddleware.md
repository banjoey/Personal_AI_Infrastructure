# AddMiddleware Workflow

Creates and applies Traefik middleware for authentication, rate limiting, headers, and request modification.

---

## Middleware Types

| Type | Purpose | Example Use |
|------|---------|-------------|
| `basicAuth` | Username/password | Admin panels |
| `forwardAuth` | External auth service | SSO, OAuth |
| `rateLimit` | Throttle requests | API protection |
| `headers` | Add/modify headers | Security, CORS |
| `stripPrefix` | Remove path prefix | API routing |
| `addPrefix` | Add path prefix | Backend routing |
| `redirectScheme` | HTTP → HTTPS | Force HTTPS |
| `ipWhiteList` | IP filtering | Internal only |
| `chain` | Combine multiple | Reusable stacks |

---

## Basic Authentication

### Step 1: Create htpasswd Credentials

```bash
# Install htpasswd (if needed)
# brew install httpd  # macOS
# apt install apache2-utils  # Ubuntu

# Generate password hash
htpasswd -nb admin MySecurePassword123
# Output: admin:$apr1$xyz...

# Base64 encode for Kubernetes secret
echo 'admin:$apr1$xyz...' | base64
```

### Step 2: Create Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: admin-auth
  namespace: <target-namespace>
type: Opaque
data:
  users: YWRtaW46JGFwcjEkeHl6Li4u  # base64 encoded htpasswd
```

### Step 3: Create Middleware

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: admin-auth
  namespace: <target-namespace>
spec:
  basicAuth:
    secret: admin-auth
    removeHeader: true  # Don't pass auth header to backend
```

### Step 4: Apply to IngressRoute

```yaml
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

---

## Rate Limiting

### Create Rate Limit Middleware

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: rate-limit-api
  namespace: default
spec:
  rateLimit:
    average: 100        # Requests per second average
    burst: 50           # Allow burst up to this
    period: 1s          # Time period for average
    sourceCriterion:
      ipStrategy:
        depth: 1        # Use first X-Forwarded-For IP
```

### Apply to API Routes

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: api
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`api.barkleyfarm.com`)
      kind: Rule
      services:
        - name: api-service
          port: 8080
      middlewares:
        - name: rate-limit-api
  tls:
    certResolver: letsencrypt
```

---

## Security Headers

### Create Headers Middleware

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: security-headers
  namespace: traefik
spec:
  headers:
    # HSTS
    stsSeconds: 31536000
    stsIncludeSubdomains: true
    stsPreload: true
    forceSTSHeader: true

    # Security
    contentTypeNosniff: true
    browserXssFilter: true
    frameDeny: true

    # Custom headers
    customResponseHeaders:
      X-Robots-Tag: "noindex,nofollow"
      Server: ""  # Remove server header
```

---

## IP Whitelist

### Allow Only Specific IPs

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: internal-only
  namespace: default
spec:
  ipWhiteList:
    sourceRange:
      - "10.0.0.0/8"        # Local network
      - "100.64.0.0/10"     # Tailscale CGNAT range
      - "192.168.0.0/16"    # Local network
```

---

## Strip/Add Prefix

### Strip API Prefix

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: strip-api
  namespace: default
spec:
  stripPrefix:
    prefixes:
      - /api
    forceSlash: false
```

Use case: Route `example.com/api/users` → backend receives `/users`

### Add Prefix

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: add-v1
  namespace: default
spec:
  addPrefix:
    prefix: /v1
```

Use case: Route `example.com/users` → backend receives `/v1/users`

---

## HTTP to HTTPS Redirect

### Create Redirect Middleware

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: redirect-https
  namespace: traefik
spec:
  redirectScheme:
    scheme: https
    permanent: true
```

### Apply to HTTP Entrypoint

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: http-redirect
spec:
  entryPoints:
    - web  # HTTP
  routes:
    - match: HostRegexp(`{host:.+}`)  # All hosts
      kind: Rule
      middlewares:
        - name: redirect-https
          namespace: traefik
      services:
        - name: noop@internal
          kind: TraefikService
```

---

## Middleware Chains

Combine multiple middlewares into reusable chains.

### Create Chain

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: secure-admin
  namespace: traefik
spec:
  chain:
    middlewares:
      - name: redirect-https
      - name: security-headers
      - name: admin-auth
      - name: rate-limit-api
```

### Use Chain

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: admin
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
        - name: secure-admin
          namespace: traefik
  tls:
    certResolver: letsencrypt
```

---

## Cross-Namespace Middleware Reference

To use middleware from another namespace:

```yaml
middlewares:
  - name: security-headers
    namespace: traefik  # Specify namespace
```

---

## CORS Headers

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: cors
  namespace: default
spec:
  headers:
    accessControlAllowMethods:
      - GET
      - POST
      - PUT
      - DELETE
      - OPTIONS
    accessControlAllowHeaders:
      - Content-Type
      - Authorization
    accessControlAllowOriginList:
      - "https://app.barkleyfarm.com"
      - "https://localhost:3000"
    accessControlMaxAge: 86400
    addVaryHeader: true
```

---

## Troubleshooting Middleware

### Middleware Not Applied

```bash
# Check middleware exists
kubectl get middleware -A

# Check IngressRoute references it correctly
kubectl get ingressroute <name> -o yaml | grep -A 5 middlewares
```

### Auth Not Working

```bash
# Verify secret exists
kubectl get secret <auth-secret> -n <namespace>

# Decode and verify htpasswd format
kubectl get secret <auth-secret> -o jsonpath='{.data.users}' | base64 -d
```

### Rate Limit Too Aggressive

Increase `average` and `burst` values, or check if `sourceCriterion` is correctly identifying unique clients.
