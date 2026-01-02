# Install Workflow

Installs Traefik as the ingress controller for the k3s cluster using Helm.

## Prerequisites

- [ ] k3s cluster running
- [ ] Helm installed (see Helm skill)
- [ ] kubectl configured for cluster access

**Note**: k3s comes with Traefik by default. If not disabled during k3s install, skip to "Verify Existing Installation".

---

## Option A: Fresh Install (k3s installed with `--disable traefik`)

### Step 1: Add Traefik Helm Repository

```bash
helm repo add traefik https://traefik.github.io/charts
helm repo update
```

### Step 2: Create Traefik Namespace

```bash
kubectl create namespace traefik
```

### Step 3: Create Values File

```yaml
# traefik-values.yaml
deployment:
  replicas: 1  # Increase for HA

ports:
  web:
    port: 8000
    expose: true
    exposedPort: 80
    protocol: TCP
  websecure:
    port: 8443
    expose: true
    exposedPort: 443
    protocol: TCP
    tls:
      enabled: true
  traefik:
    port: 9000
    expose: false  # Dashboard internal only

service:
  type: LoadBalancer

# Enable Traefik CRDs (IngressRoute, Middleware, etc.)
ingressRoute:
  dashboard:
    enabled: false  # We'll create our own secured route

# Persist ACME certs across restarts
persistence:
  enabled: true
  size: 128Mi
  path: /data
  accessMode: ReadWriteOnce

# Let's Encrypt configuration
certificatesResolvers:
  letsencrypt:
    acme:
      email: joey@barkleyfarm.com
      storage: /data/acme.json
      httpChallenge:
        entryPoint: web

# Resource limits
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "256Mi"

# Logs
logs:
  general:
    level: INFO
  access:
    enabled: true

# Node selector - only run on worker nodes
nodeSelector:
  node-role.kubernetes.io/worker: "true"
```

### Step 4: Install Traefik

```bash
helm install traefik traefik/traefik \
  --namespace traefik \
  --values traefik-values.yaml \
  --wait
```

### Step 5: Verify Installation

```bash
# Check pods
kubectl get pods -n traefik
# Should show traefik-xxx Running

# Check service
kubectl get svc -n traefik
# Should show LoadBalancer with EXTERNAL-IP

# Check CRDs installed
kubectl get crd | grep traefik
# Should show ingressroutes.traefik.io, middlewares.traefik.io, etc.
```

---

## Option B: Verify/Configure Existing k3s Traefik

If k3s was installed without `--disable traefik`:

### Check Current State

```bash
# Find existing Traefik
kubectl get pods -n kube-system | grep traefik
kubectl get svc -n kube-system | grep traefik

# Check Traefik version
kubectl get deployment -n kube-system traefik -o jsonpath='{.spec.template.spec.containers[0].image}'
```

### Customize via HelmChartConfig

k3s allows customizing bundled Traefik via HelmChartConfig:

```yaml
# /var/lib/rancher/k3s/server/manifests/traefik-config.yaml
apiVersion: helm.cattle.io/v1
kind: HelmChartConfig
metadata:
  name: traefik
  namespace: kube-system
spec:
  valuesContent: |-
    logs:
      general:
        level: INFO
      access:
        enabled: true
    ports:
      web:
        exposedPort: 80
      websecure:
        exposedPort: 443
    service:
      type: LoadBalancer
```

Apply by placing in manifests directory - k3s auto-applies.

---

## Post-Installation Setup

### 1. Create Default Middleware Stack

```yaml
# default-middlewares.yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: redirect-https
  namespace: traefik
spec:
  redirectScheme:
    scheme: https
    permanent: true
---
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: security-headers
  namespace: traefik
spec:
  headers:
    stsSeconds: 31536000
    stsIncludeSubdomains: true
    forceSTSHeader: true
    contentTypeNosniff: true
    browserXssFilter: true
```

```bash
kubectl apply -f default-middlewares.yaml
```

### 2. Create Dashboard IngressRoute (Optional)

```yaml
# dashboard-ingress.yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: dashboard-auth
  namespace: traefik
spec:
  basicAuth:
    secret: dashboard-credentials
---
apiVersion: v1
kind: Secret
metadata:
  name: dashboard-credentials
  namespace: traefik
type: Opaque
data:
  users: |
    # Generate with: htpasswd -nb admin <password> | base64
    YWRtaW46JGFwcjEkLi4u...
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: traefik-dashboard
  namespace: traefik
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`traefik.barkleyfarm.com`)
      kind: Rule
      services:
        - name: api@internal
          kind: TraefikService
      middlewares:
        - name: dashboard-auth
  tls: {}
```

### 3. Test Installation

```bash
# Create test service
kubectl create deployment nginx-test --image=nginx
kubectl expose deployment nginx-test --port=80

# Create test IngressRoute
cat <<EOF | kubectl apply -f -
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: nginx-test
spec:
  entryPoints:
    - web
  routes:
    - match: Host(\`test.barkleyfarm.com\`)
      kind: Rule
      services:
        - name: nginx-test
          port: 80
EOF

# Test (add test.barkleyfarm.com to /etc/hosts if needed)
curl -H "Host: test.barkleyfarm.com" http://10.0.20.22

# Cleanup
kubectl delete ingressroute nginx-test
kubectl delete deployment nginx-test
kubectl delete svc nginx-test
```

---

## Upgrade Traefik

```bash
# Update repo
helm repo update

# Check available versions
helm search repo traefik/traefik --versions

# Upgrade
helm upgrade traefik traefik/traefik \
  --namespace traefik \
  --values traefik-values.yaml \
  --wait
```

---

## Uninstall

```bash
# Helm uninstall
helm uninstall traefik --namespace traefik

# Delete namespace
kubectl delete namespace traefik

# If using k3s bundled Traefik, delete the HelmChart
kubectl delete helmchart traefik -n kube-system
```
