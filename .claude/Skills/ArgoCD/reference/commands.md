# ArgoCD Command Reference

Quick reference for common ArgoCD operations.

---

## Application Management

```bash
# List all apps
argocd app list

# Get app details
argocd app get <app>

# Get app with refresh
argocd app get <app> --refresh

# Create app
argocd app create <app> \
  --repo <url> \
  --path <path> \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace <namespace>

# Delete app (keeps resources)
argocd app delete <app> --cascade=false

# Delete app and resources
argocd app delete <app>

# Modify app
argocd app set <app> --revision <branch>
argocd app set <app> --sync-policy automated
argocd app set <app> --self-heal
argocd app set <app> --auto-prune
```

---

## Sync Operations

```bash
# Sync app
argocd app sync <app>

# Sync with prune
argocd app sync <app> --prune

# Force sync
argocd app sync <app> --force

# Dry run
argocd app sync <app> --dry-run

# Sync specific resource
argocd app sync <app> --resource :Deployment:my-deploy

# Wait for health
argocd app wait <app> --health

# Wait for sync
argocd app wait <app> --sync
```

---

## Diff & History

```bash
# View diff
argocd app diff <app>

# View history
argocd app history <app>

# Rollback
argocd app rollback <app> <revision>

# View manifests
argocd app manifests <app>

# View resources
argocd app resources <app>
```

---

## Repository Management

```bash
# List repos
argocd repo list

# Add repo (HTTPS)
argocd repo add <url> --username <user> --password <token>

# Add repo (SSH)
argocd repo add <url> --ssh-private-key-path <path>

# Remove repo
argocd repo rm <url>

# Get repo details
argocd repo get <url>
```

---

## Cluster Management

```bash
# List clusters
argocd cluster list

# Add cluster
argocd cluster add <context-name>

# Remove cluster
argocd cluster rm <server>

# Get cluster details
argocd cluster get <server>
```

---

## Project Management

```bash
# List projects
argocd proj list

# Get project
argocd proj get <project>

# Create project
argocd proj create <project> \
  --src <repo> \
  --dest <server>,<namespace>

# Delete project
argocd proj delete <project>
```

---

## Account & Auth

```bash
# Login
argocd login <server> --username admin --password <pass>

# Login via SSO
argocd login <server> --sso

# Logout
argocd logout <server>

# Change password
argocd account update-password

# Get current user
argocd account get-user-info

# List accounts
argocd account list

# Generate auth token
argocd account generate-token
```

---

## Logs & Debugging

```bash
# View app logs
argocd app logs <app>

# Follow logs
argocd app logs <app> -f

# Specific container
argocd app logs <app> --container <name>

# Tail lines
argocd app logs <app> --tail 100

# Terminate stuck operation
argocd app terminate-op <app>
```

---

## Admin Operations

```bash
# ArgoCD version
argocd version

# Export apps as YAML
argocd admin export > backup.yaml

# Import apps
argocd admin import < backup.yaml

# Check settings
argocd admin settings

# View notifications (if enabled)
argocd admin notifications
```

---

## kubectl Equivalents

```bash
# List applications
kubectl get applications -n argocd

# Describe app
kubectl describe application <app> -n argocd

# Get app YAML
kubectl get application <app> -n argocd -o yaml

# Delete app
kubectl delete application <app> -n argocd

# List app projects
kubectl get appprojects -n argocd

# View ArgoCD pods
kubectl get pods -n argocd

# View controller logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller

# View server logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
```

---

## Common Flags

| Flag | Description |
|------|-------------|
| `--grpc-web` | Use gRPC-Web (for Traefik/nginx) |
| `--insecure` | Skip TLS verification |
| `-o json` | JSON output |
| `-o yaml` | YAML output |
| `-o wide` | Wide output |
| `-o name` | Names only |
| `--project` | Filter by project |
| `--refresh` | Refresh before showing |
| `--hard-refresh` | Clear cache and refresh |

---

## Status Quick Check

```bash
# All apps health at a glance
argocd app list -o json | jq -r '.[] | "\(.metadata.name): \(.status.health.status) / \(.status.sync.status)"'

# Only unhealthy
argocd app list --health Degraded

# Only out of sync
argocd app list --status OutOfSync
```

---

## Bulk Operations

```bash
# Sync all out-of-sync apps
argocd app list --status OutOfSync -o name | xargs -I {} argocd app sync {}

# Refresh all apps
argocd app list -o name | xargs -I {} argocd app get {} --refresh

# Delete all apps in namespace (careful!)
argocd app list -o name | grep "my-project" | xargs -I {} argocd app delete {}
```
