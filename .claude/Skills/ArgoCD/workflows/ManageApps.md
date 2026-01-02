# ManageApps Workflow

List, inspect, and delete ArgoCD applications.

---

## List Applications

### All Applications

```bash
argocd app list
```

Output columns:
- NAME
- CLUSTER
- NAMESPACE
- PROJECT
- STATUS (Synced/OutOfSync)
- HEALTH (Healthy/Progressing/Degraded)
- SYNCPOLICY
- CONDITIONS

### Filter by Project

```bash
argocd app list --project production
```

### Filter by Status

```bash
# Only out of sync
argocd app list --status OutOfSync

# Only unhealthy
argocd app list --health Degraded
argocd app list --health Progressing
```

### Output Formats

```bash
# JSON output
argocd app list -o json

# Wide output (more columns)
argocd app list -o wide

# Just names
argocd app list -o name
```

---

## Get Application Details

### Basic Info

```bash
argocd app get my-app
```

### With Refresh

```bash
argocd app get my-app --refresh
```

### Specific Fields

```bash
# Show tree of resources
argocd app resources my-app

# Show manifests
argocd app manifests my-app

# Show logs from app pods
argocd app logs my-app
```

---

## Application Status

### Health Status

| Status | Meaning |
|--------|---------|
| Healthy | All resources healthy |
| Progressing | Resources updating |
| Degraded | One or more resources unhealthy |
| Suspended | Paused (e.g., scaled to 0) |
| Missing | Resources don't exist yet |
| Unknown | Health can't be determined |

### Sync Status

| Status | Meaning |
|--------|---------|
| Synced | Live state matches Git |
| OutOfSync | Live state differs from Git |
| Unknown | Can't determine sync state |

---

## Modify Applications

### Update Source

```bash
# Change target revision
argocd app set my-app --revision develop

# Change path
argocd app set my-app --path apps/my-app-v2

# Change repo
argocd app set my-app --repo https://gitlab.com/myuser/new-repo.git
```

### Update Destination

```bash
# Change namespace
argocd app set my-app --dest-namespace my-app-prod

# Change cluster
argocd app set my-app --dest-server https://other-cluster:6443
```

### Update Sync Policy

```bash
# Enable auto-sync
argocd app set my-app --sync-policy automated

# Enable self-heal
argocd app set my-app --self-heal

# Enable auto-prune
argocd app set my-app --auto-prune

# Disable auto-sync
argocd app set my-app --sync-policy none
```

### Update Helm Values

```bash
# Set parameter
argocd app set my-app -p replicaCount=3

# Set values file
argocd app set my-app --values values-prod.yaml
```

---

## Delete Applications

### Delete Application Only

Keeps deployed resources:

```bash
argocd app delete my-app --cascade=false
```

### Delete Application and Resources

Removes app and all deployed resources:

```bash
argocd app delete my-app
```

### Force Delete

```bash
argocd app delete my-app --force
```

### Delete All Apps in Project

```bash
argocd app delete -l project=production
```

### Delete via kubectl

```bash
kubectl delete application my-app -n argocd
```

---

## View Differences

### Current Diff

```bash
argocd app diff my-app
```

### Diff with Local Changes

```bash
argocd app diff my-app --local ./apps/my-app
```

### Diff Specific Revision

```bash
argocd app diff my-app --revision develop
```

---

## Application History

### View History

```bash
argocd app history my-app
```

### Rollback to Previous

```bash
# Rollback to specific revision
argocd app rollback my-app <revision-id>
```

Note: Rollback sets targetRevision to specific commit. For long-term fix, update Git.

---

## Batch Operations

### Sync All OutOfSync Apps

```bash
argocd app list --status OutOfSync -o name | xargs -I {} argocd app sync {}
```

### Refresh All Apps

```bash
argocd app list -o name | xargs -I {} argocd app get {} --refresh
```

### Check Health of All Apps

```bash
argocd app list -o json | jq '.[] | {name: .metadata.name, health: .status.health.status}'
```

---

## kubectl Operations

### List Applications

```bash
kubectl get applications -n argocd
```

### Describe Application

```bash
kubectl describe application my-app -n argocd
```

### Get Application YAML

```bash
kubectl get application my-app -n argocd -o yaml
```

### Watch Applications

```bash
kubectl get applications -n argocd -w
```

---

## View Application Resources

### List Resources

```bash
argocd app resources my-app
```

### View Specific Resource

```bash
argocd app resources my-app --kind Deployment
```

### Actions on Resources

```bash
# Restart deployment
argocd app actions run my-app restart --kind Deployment --resource-name my-deployment

# List available actions
argocd app actions list my-app --kind Deployment
```

---

## Monitoring Applications

### View Logs

```bash
# All pods
argocd app logs my-app

# Specific container
argocd app logs my-app --container main

# Follow logs
argocd app logs my-app -f

# Last N lines
argocd app logs my-app --tail 100
```

### View Events

```bash
kubectl get events -n my-app --sort-by='.lastTimestamp'
```

---

## Troubleshooting

### App Not Syncing

```bash
# Check status
argocd app get my-app

# Check repo access
argocd repo list
argocd repo get https://gitlab.com/myuser/apps.git

# Hard refresh
argocd app get my-app --hard-refresh
```

### App Stuck

```bash
# Terminate operation
argocd app terminate-op my-app

# Check for stuck resources
kubectl get all -n my-app

# Force sync
argocd app sync my-app --force
```

### Resource Conflicts

```bash
# View diff to see conflicts
argocd app diff my-app

# Check for resource ownership
kubectl get <resource> -o yaml | grep -A5 ownerReferences
```
