# SyncApp Workflow

Syncs an ArgoCD Application to apply Git changes to the cluster.

---

## Quick Sync

```bash
# Sync application
argocd app sync <app-name>

# Sync and wait for health
argocd app sync <app-name> --prune
argocd app wait <app-name> --health
```

---

## Sync Operations

### Basic Sync

```bash
argocd app sync my-app
```

### Sync with Prune

Delete resources removed from Git:

```bash
argocd app sync my-app --prune
```

### Sync Specific Resources

```bash
# Sync only specific resource
argocd app sync my-app --resource :Deployment:my-deployment

# Sync by label
argocd app sync my-app --label app=frontend
```

### Force Sync

Overwrite even if no changes detected:

```bash
argocd app sync my-app --force
```

### Dry Run

Preview what would change:

```bash
argocd app sync my-app --dry-run
```

---

## Refresh Operations

### Refresh (Check for Changes)

```bash
# Normal refresh - check Git for new commits
argocd app get my-app --refresh
```

### Hard Refresh

Clear cache and force re-fetch:

```bash
argocd app get my-app --hard-refresh
```

---

## Sync with Options

```bash
argocd app sync my-app \
  --prune \
  --force \
  --retry-limit 3 \
  --timeout 300
```

---

## Automated Sync

When auto-sync is enabled, ArgoCD automatically syncs when:

1. Git repo changes detected (polled every 3 minutes by default)
2. Webhook triggers refresh
3. Cluster state drifts (if selfHeal enabled)

### Enable Auto-Sync

```bash
argocd app set my-app --sync-policy automated
```

### Enable Self-Heal

Revert manual changes in cluster:

```bash
argocd app set my-app --self-heal
```

### Enable Auto-Prune

Delete resources removed from Git:

```bash
argocd app set my-app --auto-prune
```

### Disable Auto-Sync

```bash
argocd app set my-app --sync-policy none
```

---

## Sync Waves

Control order of resource application.

### In Manifest Annotations

```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "-1"  # Applied first
---
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "0"   # Applied second (default)
---
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "1"   # Applied third
```

### Common Pattern

```
Wave -5: Namespaces
Wave -3: CRDs, RBAC
Wave -1: ConfigMaps, Secrets
Wave 0:  Deployments, Services (default)
Wave 1:  Ingress, IngressRoutes
Wave 5:  Jobs, post-deploy tasks
```

---

## Hooks

Run jobs at specific sync phases.

### Pre-Sync Hook

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
spec:
  template:
    spec:
      containers:
        - name: migrate
          image: my-app:latest
          command: ["./migrate.sh"]
      restartPolicy: Never
```

### Post-Sync Hook

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: notify-slack
  annotations:
    argocd.argoproj.io/hook: PostSync
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
spec:
  template:
    spec:
      containers:
        - name: notify
          image: curlimages/curl
          command:
            - curl
            - -X
            - POST
            - $(SLACK_WEBHOOK)
            - -d
            - '{"text":"Deployment complete!"}'
      restartPolicy: Never
```

### Hook Phases

| Phase | When |
|-------|------|
| PreSync | Before sync starts |
| Sync | During sync |
| PostSync | After successful sync |
| SyncFail | After failed sync |
| Skip | Never run (disabled) |

### Hook Delete Policies

| Policy | Behavior |
|--------|----------|
| HookSucceeded | Delete after success |
| HookFailed | Delete after failure |
| BeforeHookCreation | Delete before creating new hook |

---

## Wait for Sync

### Wait for Healthy

```bash
argocd app wait my-app --health
```

### Wait for Sync Complete

```bash
argocd app wait my-app --sync
```

### Wait with Timeout

```bash
argocd app wait my-app --health --timeout 300
```

### Wait for Specific Operation

```bash
argocd app wait my-app --operation
```

---

## Sync Status

### Get Current Status

```bash
argocd app get my-app
```

Output shows:
- Sync Status: Synced, OutOfSync, Unknown
- Health Status: Healthy, Progressing, Degraded, Suspended, Missing, Unknown
- Last Sync: timestamp and result

### View Sync History

```bash
argocd app history my-app
```

### View Sync Diff

```bash
argocd app diff my-app
```

---

## Troubleshooting Sync

### Sync Stuck

```bash
# Terminate stuck operation
argocd app terminate-op my-app

# Force sync
argocd app sync my-app --force
```

### Resource Stuck Deleting

```bash
# Check finalizers
kubectl get <resource> -o yaml | grep finalizers

# Remove finalizers if needed
kubectl patch <resource> <name> -p '{"metadata":{"finalizers":[]}}' --type=merge
```

### View Sync Errors

```bash
# Get detailed status
argocd app get my-app

# View events
kubectl describe application my-app -n argocd

# View controller logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller
```

---

## Webhook Integration

For instant sync on Git push.

### GitLab Webhook

In GitLab repo settings:

```
URL: https://argocd.barkleyfarm.com/api/webhook
Secret Token: <from argocd-secret>
Trigger: Push events
```

### Get Webhook Secret

```bash
kubectl -n argocd get secret argocd-secret \
  -o jsonpath="{.data.webhook\.gitlab\.secret}" | base64 -d
```

### Configure in ArgoCD

```yaml
# In argocd-cm ConfigMap
data:
  url: https://argocd.barkleyfarm.com
```
