---
name: Helm
description: Kubernetes package manager for application deployment. USE WHEN user mentions Helm, charts, releases, package, deploy app, install app, values file, OR needs to manage Kubernetes applications. Used with ArgoCD for GitOps.
---

# Helm

Kubernetes package manager skill. Provides installation, management, and creation of Helm charts for k3s deployments.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Helm
```

| Workflow | Trigger | File |
|----------|---------|------|
| **Install** | "install helm", "set up helm" | `workflows/Install.md` |
| **DeployChart** | "deploy app", "helm install", "install chart" | `workflows/DeployChart.md` |
| **CreateChart** | "create chart", "package app", "helm template" | `workflows/CreateChart.md` |
| **ManageReleases** | "upgrade", "rollback", "helm history" | `workflows/ManageReleases.md` |

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Chart** | Package containing Kubernetes manifests + templates |
| **Release** | Instance of a chart deployed to cluster |
| **Repository** | Collection of charts (like npm registry) |
| **Values** | Configuration for a chart (values.yaml) |
| **Template** | Kubernetes manifests with Go templating |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Helm Workflow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Chart     │ +  │   Values    │ =  │  Manifests  │         │
│  │  (Template) │    │   (Config)  │    │  (Applied)  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
│  Examples:                                                      │
│  • traefik/traefik + traefik-values.yaml → Traefik deployment  │
│  • longhorn/longhorn + longhorn-values.yaml → Longhorn setup   │
│  • my-app/chart + prod-values.yaml → Production deployment     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Examples

### Example 1: Install application from public chart

```
User: "Install Redis for caching"

Helm skill activates:
1. Add Bitnami repo
2. Create values file with config
3. Install chart
4. Verify deployment
```

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install redis bitnami/redis -n redis --create-namespace -f redis-values.yaml
```

### Example 2: Upgrade release with new config

```
User: "Increase Redis memory limit"

Helm skill activates:
1. Update values file
2. Run helm upgrade
3. Verify rollout
```

```bash
helm upgrade redis bitnami/redis -n redis -f redis-values.yaml
```

### Example 3: Create chart for custom app

```
User: "Package my API for deployment"

Helm skill activates:
1. Create chart structure
2. Template Deployment, Service, Ingress
3. Create values.yaml with defaults
```

```bash
helm create my-api
```

## Quick Reference

### Common Commands

```bash
# Repository management
helm repo add <name> <url>
helm repo update
helm repo list
helm search repo <keyword>

# Install/Upgrade
helm install <release> <chart> -n <namespace> -f values.yaml
helm upgrade <release> <chart> -n <namespace> -f values.yaml
helm upgrade --install <release> <chart>  # Install or upgrade

# Release management
helm list -A                    # All releases
helm status <release> -n <ns>   # Release status
helm history <release> -n <ns>  # Version history
helm rollback <release> <rev>   # Rollback to revision

# Debugging
helm template <chart> -f values.yaml  # Render templates locally
helm get values <release> -n <ns>     # Get deployed values
helm get manifest <release> -n <ns>   # Get deployed manifests
```

### Common Repositories

| Repository | URL | Contents |
|------------|-----|----------|
| Bitnami | `https://charts.bitnami.com/bitnami` | PostgreSQL, Redis, MySQL, etc. |
| Traefik | `https://traefik.github.io/charts` | Traefik ingress |
| Longhorn | `https://charts.longhorn.io` | Longhorn storage |
| ArgoCD | `https://argoproj.github.io/argo-helm` | ArgoCD |
| Prometheus | `https://prometheus-community.github.io/helm-charts` | Monitoring |
| Grafana | `https://grafana.github.io/helm-charts` | Grafana |

### Values File Best Practices

```yaml
# values.yaml structure

# Image configuration
image:
  repository: myapp
  tag: v1.0.0
  pullPolicy: IfNotPresent

# Resource limits
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi

# Replica count
replicaCount: 2

# Service configuration
service:
  type: ClusterIP
  port: 80

# Ingress configuration
ingress:
  enabled: true
  className: traefik
  hosts:
    - host: myapp.barkleyfarm.com
      paths:
        - path: /
          pathType: Prefix

# Environment variables
env:
  - name: LOG_LEVEL
    value: info

# Persistence
persistence:
  enabled: true
  size: 5Gi
  storageClass: longhorn
```

## Chart Structure

```
my-chart/
├── Chart.yaml          # Chart metadata
├── values.yaml         # Default values
├── charts/             # Dependencies
├── templates/          # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── pvc.yaml
│   ├── _helpers.tpl    # Template functions
│   └── NOTES.txt       # Post-install notes
└── .helmignore         # Files to ignore
```

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| **k3s** | Helm deploys to k3s cluster |
| **ArgoCD** | Helm charts managed via GitOps |
| **Traefik** | Traefik installed via Helm |
| **Longhorn** | Longhorn installed via Helm |
| **GitLab** | Charts stored in GitLab repos |

## GitOps Pattern (with ArgoCD)

Instead of running `helm install` manually:

1. Store chart + values in GitLab
2. ArgoCD watches the repo
3. Changes to values.yaml trigger deployment
4. ArgoCD handles upgrades and rollbacks

```
GitLab repo:
└── apps/
    └── redis/
        ├── Chart.yaml (or chart reference)
        └── values.yaml (environment config)
```

## Values Files for Environments

```
my-app/
├── Chart.yaml
├── values.yaml           # Defaults
├── values-dev.yaml       # Development overrides
├── values-staging.yaml   # Staging overrides
└── values-prod.yaml      # Production overrides
```

```bash
# Deploy to production
helm upgrade --install my-app ./my-app \
  -f values.yaml \
  -f values-prod.yaml
```

## Security Best Practices

- Never commit secrets to values files
- Use `--set` for sensitive values or external secrets
- Pin chart versions in production
- Review chart templates before installing
- Use `helm template` to preview what will be deployed

## Troubleshooting

```bash
# Debug installation
helm install <release> <chart> --debug --dry-run

# Get release info
helm get all <release> -n <namespace>

# Check for failed releases
helm list -A --failed

# Force reinstall
helm uninstall <release> -n <namespace>
helm install <release> <chart> -n <namespace>
```

---

**Helm skill provides package management for all k3s application deployments.**
