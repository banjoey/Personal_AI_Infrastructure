# Install Workflow

Installs ArgoCD on the k3s cluster via Helm.

---

## Prerequisites

- k3s cluster running
- kubectl configured
- Helm installed with argo repo added

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
```

---

## Step 1: Create Namespace

```bash
kubectl create namespace argocd
```

---

## Step 2: Create Values File

```yaml
# argocd-values.yaml
global:
  domain: argocd.barkleyfarm.com

configs:
  params:
    server.insecure: true  # TLS handled by Traefik

server:
  ingress:
    enabled: false  # We'll use Traefik IngressRoute instead

  resources:
    requests:
      cpu: 50m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 256Mi

controller:
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 512Mi

repoServer:
  resources:
    requests:
      cpu: 50m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 256Mi

redis:
  resources:
    requests:
      cpu: 50m
      memory: 64Mi
    limits:
      cpu: 200m
      memory: 128Mi

applicationSet:
  resources:
    requests:
      cpu: 50m
      memory: 64Mi
    limits:
      cpu: 200m
      memory: 128Mi

notifications:
  enabled: false  # Enable later if needed
```

---

## Step 3: Install ArgoCD

```bash
helm install argocd argo/argo-cd \
  --namespace argocd \
  -f argocd-values.yaml \
  --wait
```

---

## Step 4: Get Initial Admin Password

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

Save this password - you'll need it for initial login.

---

## Step 5: Create Traefik IngressRoute

```yaml
# argocd-ingress.yaml
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: argocd-server
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
  tls:
    certResolver: letsencrypt
```

```bash
kubectl apply -f argocd-ingress.yaml
```

---

## Step 6: Install ArgoCD CLI (macOS)

```bash
brew install argocd
```

---

## Step 7: Login via CLI

```bash
# Get initial password
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d)

# Login (via Tailscale or local)
argocd login argocd.barkleyfarm.com \
  --username admin \
  --password $ARGOCD_PASSWORD \
  --grpc-web
```

---

## Step 8: Change Admin Password

```bash
argocd account update-password
```

---

## Step 9: Add GitLab Repository

### Using HTTPS with Token

```bash
argocd repo add https://gitlab.com/myuser/infrastructure.git \
  --username git \
  --password <gitlab-personal-access-token>
```

### Using SSH

```bash
# Add SSH key first
argocd repo add git@gitlab.com:myuser/infrastructure.git \
  --ssh-private-key-path ~/.ssh/gitlab_argocd
```

---

## Step 10: Verify Installation

```bash
# Check pods
kubectl get pods -n argocd

# Check services
kubectl get svc -n argocd

# List repos
argocd repo list

# Check ArgoCD version
argocd version
```

---

## Post-Installation

### Delete Initial Secret (Security)

After changing password:

```bash
kubectl -n argocd delete secret argocd-initial-admin-secret
```

### Enable Metrics (Optional)

```yaml
# In argocd-values.yaml
controller:
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true  # If using Prometheus Operator

server:
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true
```

---

## Upgrade ArgoCD

```bash
helm repo update
helm upgrade argocd argo/argo-cd \
  --namespace argocd \
  -f argocd-values.yaml \
  --wait
```

---

## Uninstall ArgoCD

```bash
# Remove all applications first
argocd app delete --all

# Uninstall Helm release
helm uninstall argocd -n argocd

# Delete namespace
kubectl delete namespace argocd
```
