# ConfigureTLS Workflow

Configures TLS certificates for Traefik, including Let's Encrypt automation and self-signed certs for internal services.

## TLS Options

| Option | Use Case | Automation |
|--------|----------|------------|
| Let's Encrypt | Public domains | Automatic |
| Self-Signed | Internal only | Manual/cert-manager |
| Custom Cert | Enterprise CA | Manual |

---

## Option A: Let's Encrypt (Recommended for Public)

### Prerequisites

- Domain has DNS pointing to Traefik
- Port 80 accessible for HTTP challenge (or use DNS challenge)

### Step 1: Configure ACME in Traefik Values

```yaml
# In traefik-values.yaml or HelmChartConfig
certificatesResolvers:
  letsencrypt:
    acme:
      email: joey@barkleyfarm.com
      storage: /data/acme.json
      httpChallenge:
        entryPoint: web
```

### Step 2: Enable Persistence

```yaml
persistence:
  enabled: true
  size: 128Mi
  path: /data
```

### Step 3: Use in IngressRoute

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: myapp
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`myapp.example.com`)
      kind: Rule
      services:
        - name: myapp
          port: 80
  tls:
    certResolver: letsencrypt
```

### Step 4: Verify Certificate

```bash
# Check ACME storage
kubectl exec -n traefik <pod> -- cat /data/acme.json | jq '.letsencrypt.Certificates'

# Test via curl
curl -v https://myapp.example.com 2>&1 | grep -A 5 "Server certificate"
```

---

## Option B: Self-Signed Certificates (Internal)

For internal services that don't need public trust.

### Step 1: Generate Self-Signed Cert

```bash
# Generate CA
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.crt \
  -subj "/CN=Barkley Farm CA"

# Generate server cert
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr \
  -subj "/CN=*.barkleyfarm.com"

# Sign with CA
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days 365 -sha256
```

### Step 2: Create Kubernetes Secret

```bash
kubectl create secret tls wildcard-cert \
  --cert=server.crt \
  --key=server.key \
  -n traefik
```

### Step 3: Create TLSStore (Optional - Default Cert)

```yaml
apiVersion: traefik.io/v1alpha1
kind: TLSStore
metadata:
  name: default
  namespace: traefik
spec:
  defaultCertificate:
    secretName: wildcard-cert
```

### Step 4: Use in IngressRoute

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: internal-app
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`internal.barkleyfarm.com`)
      kind: Rule
      services:
        - name: internal-app
          port: 80
  tls:
    secretName: wildcard-cert
```

---

## Option C: DNS Challenge (Cloudflare)

For wildcard certs or when port 80 isn't accessible.

### Step 1: Create Cloudflare API Token Secret

```bash
kubectl create secret generic cloudflare-api-token \
  -n traefik \
  --from-literal=CF_API_EMAIL=joey@example.com \
  --from-literal=CF_DNS_API_TOKEN=<your-token>
```

### Step 2: Configure ACME with DNS Challenge

```yaml
# In traefik-values.yaml
env:
  - name: CF_API_EMAIL
    valueFrom:
      secretKeyRef:
        name: cloudflare-api-token
        key: CF_API_EMAIL
  - name: CF_DNS_API_TOKEN
    valueFrom:
      secretKeyRef:
        name: cloudflare-api-token
        key: CF_DNS_API_TOKEN

certificatesResolvers:
  letsencrypt-dns:
    acme:
      email: joey@barkleyfarm.com
      storage: /data/acme.json
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"
```

### Step 3: Use DNS Resolver

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: wildcard-app
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`*.barkleyfarm.com`)
      kind: Rule
      services:
        - name: app
          port: 80
  tls:
    certResolver: letsencrypt-dns
    domains:
      - main: "barkleyfarm.com"
        sans:
          - "*.barkleyfarm.com"
```

---

## TLS Options (Security Hardening)

### Create Secure TLS Options

```yaml
apiVersion: traefik.io/v1alpha1
kind: TLSOption
metadata:
  name: modern
  namespace: traefik
spec:
  minVersion: VersionTLS12
  cipherSuites:
    - TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
    - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
    - TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305
    - TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305
  curvePreferences:
    - CurveP521
    - CurveP384
  sniStrict: true
```

### Apply to IngressRoute

```yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: secure-app
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`secure.barkleyfarm.com`)
      kind: Rule
      services:
        - name: secure-app
          port: 80
  tls:
    certResolver: letsencrypt
    options:
      name: modern
      namespace: traefik
```

---

## Troubleshooting TLS

### Certificate Not Issued

```bash
# Check Traefik logs for ACME errors
kubectl logs -n traefik -l app.kubernetes.io/name=traefik | grep -i acme

# Common issues:
# - DNS not pointing to Traefik
# - Port 80 blocked
# - Rate limited by Let's Encrypt (use staging first)
```

### Use Staging Environment for Testing

```yaml
certificatesResolvers:
  letsencrypt-staging:
    acme:
      email: joey@barkleyfarm.com
      caServer: https://acme-staging-v02.api.letsencrypt.org/directory
      storage: /data/acme-staging.json
      httpChallenge:
        entryPoint: web
```

### Certificate Expired

```bash
# Force renewal by deleting stored cert
kubectl exec -n traefik <pod> -- rm /data/acme.json
kubectl rollout restart deployment traefik -n traefik
```

### SSL Labs Test

For public domains, test TLS configuration:
https://www.ssllabs.com/ssltest/
