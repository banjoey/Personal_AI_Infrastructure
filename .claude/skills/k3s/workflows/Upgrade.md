# Upgrade Workflow

Upgrades k3s to a newer version across the cluster. Supports both manual and automated (system-upgrade-controller) approaches.

---

## Pre-Upgrade Checklist

- [ ] Cluster is healthy: `kubectl get nodes` all Ready
- [ ] No pending deployments or rollouts
- [ ] etcd snapshot taken: `sudo k3s etcd-snapshot save --name pre-upgrade`
- [ ] Review release notes for breaking changes
- [ ] Test upgrade in non-prod first (if available)

---

## Check Current Version

```bash
# On any node
k3s --version
# or
kubectl get nodes -o wide
# VERSION column shows k3s version
```

## Check Available Versions

```bash
# List recent releases
curl -s https://api.github.com/repos/k3s-io/k3s/releases | jq '.[].tag_name' | head -10

# Or check: https://github.com/k3s-io/k3s/releases
```

---

## Method 1: Manual Rolling Upgrade (Recommended)

Upgrade one node at a time, verify health between each.

### Order of Operations

1. **Server nodes first** (in order of joining, oldest last)
2. **Agent nodes last**
3. **Never upgrade all servers simultaneously** (lose quorum)

For Barkley Farm (ai2 was first):
1. nas1 (if joined second) or ai1
2. Then the other server
3. ai2 last (it's the original cluster-init node)

### Step 1: Create etcd Snapshot

```bash
ssh joey@10.0.20.22
sudo k3s etcd-snapshot save --name pre-upgrade-$(date +%Y%m%d)
```

### Step 2: Upgrade First Server (NOT the cluster-init node)

```bash
ssh joey@<server-ip>

# Check current version
k3s --version

# Run upgrade installer with version
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=v1.29.0+k3s1 sh -

# Verify service restarted
sudo systemctl status k3s
```

### Step 3: Verify Node Health

```bash
kubectl get nodes
# Node should show new version and Ready status

kubectl get pods -A | grep -v Running
# No crashing pods
```

### Step 4: Upgrade Remaining Servers

Repeat Steps 2-3 for each server, one at a time.

### Step 5: Upgrade Agents (if any)

```bash
ssh joey@<agent-ip>

curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=v1.29.0+k3s1 sh -s - agent

sudo systemctl status k3s-agent
```

### Step 6: Final Verification

```bash
kubectl get nodes -o wide
# All nodes showing new version

kubectl get pods -A
# All pods healthy
```

---

## Method 2: Automated Upgrade (system-upgrade-controller)

For larger clusters or regular upgrades. Uses Rancher's system-upgrade-controller.

### Step 1: Install system-upgrade-controller

```bash
kubectl apply -f https://github.com/rancher/system-upgrade-controller/releases/latest/download/system-upgrade-controller.yaml
```

### Step 2: Create Upgrade Plan

```yaml
# server-plan.yaml
apiVersion: upgrade.cattle.io/v1
kind: Plan
metadata:
  name: server-plan
  namespace: system-upgrade
spec:
  concurrency: 1
  cordon: true
  nodeSelector:
    matchExpressions:
    - key: node-role.kubernetes.io/control-plane
      operator: In
      values: ["true"]
  serviceAccountName: system-upgrade
  upgrade:
    image: rancher/k3s-upgrade
  version: v1.29.0+k3s1
---
# agent-plan.yaml
apiVersion: upgrade.cattle.io/v1
kind: Plan
metadata:
  name: agent-plan
  namespace: system-upgrade
spec:
  concurrency: 1
  cordon: true
  nodeSelector:
    matchExpressions:
    - key: node-role.kubernetes.io/control-plane
      operator: DoesNotExist
  prepare:
    args: ["prepare", "server-plan"]
    image: rancher/k3s-upgrade
  serviceAccountName: system-upgrade
  upgrade:
    image: rancher/k3s-upgrade
  version: v1.29.0+k3s1
```

### Step 3: Apply Plans

```bash
kubectl apply -f server-plan.yaml
kubectl apply -f agent-plan.yaml
```

### Step 4: Monitor Progress

```bash
kubectl -n system-upgrade get plans
kubectl -n system-upgrade get jobs
```

---

## Rollback Procedure

If upgrade fails or causes issues:

### Option 1: Reinstall Previous Version

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=v1.28.5+k3s1 sh -
```

### Option 2: Restore from etcd Snapshot

**WARNING: This is disruptive**

```bash
# On the cluster-init node (ai2)
sudo k3s server --cluster-reset --cluster-reset-restore-path=/var/lib/rancher/k3s/server/db/snapshots/pre-upgrade-20240101

# Other nodes must rejoin after reset
```

---

## Version Pinning

To prevent accidental upgrades, pin the version in systemd:

```bash
# Edit service file
sudo systemctl edit k3s

# Add:
[Service]
Environment="INSTALL_K3S_VERSION=v1.29.0+k3s1"
```

---

## Upgrade Cadence Recommendations

| Type | Frequency | Notes |
|------|-----------|-------|
| Patch (v1.29.0 → v1.29.1) | Monthly | Usually safe, quick |
| Minor (v1.28 → v1.29) | Quarterly | Review deprecations |
| Major (v1 → v2) | As needed | Major testing required |

**Stay within 2 minor versions of latest for security patches.**

---

## Troubleshooting Upgrades

### Node stuck in upgrade

```bash
# Check what's happening
kubectl describe node <node>
kubectl logs -n system-upgrade <upgrade-pod>

# May need to manually complete
ssh joey@<node-ip>
sudo systemctl restart k3s
```

### Pods failing after upgrade

```bash
# Check for API deprecations
kubectl get events -A | grep -i deprecated

# Some resources may need manifest updates
```

### etcd issues after upgrade

```bash
# Check etcd health
sudo k3s etcd-snapshot ls

# If broken, restore from pre-upgrade snapshot
```
