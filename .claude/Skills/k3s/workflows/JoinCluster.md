# JoinCluster Workflow

Adds a new node to an existing k3s cluster. Covers both server (control plane) and agent (worker-only) joins.

## Decision: Server vs Agent?

| Join As | When to Use | What It Runs |
|---------|-------------|--------------|
| **Server** | Need HA, want etcd vote | etcd, API server, scheduler + optionally kubelet |
| **Agent** | Just need more compute | kubelet only, receives workloads |

For Barkley Farm cluster:
- **nas1, ai1, ai2**: Server (3-node HA with etcd quorum)
- Future expansion could use agents for pure compute

---

## Workflow: Join as Server

### Step 1: Gather Information

From existing cluster node (ai2):

```bash
# Get join token
sudo cat /var/lib/rancher/k3s/server/node-token

# Get first server IP (for --server flag)
echo "https://10.0.20.22:6443"
```

### Step 2: Prepare New Node

```bash
ssh joey@<new-node-ip>

# Set hostname if needed
sudo hostnamectl set-hostname <hostname>

# Verify network connectivity to existing cluster
nc -zv 10.0.20.22 6443

# Check required ports are open
# 6443, 2379-2380, 10250, 8472/UDP
```

### Step 3: Join as Server

**Standard server (runs workloads):**
```bash
export K3S_TOKEN="<token>"
export K3S_URL="https://10.0.20.22:6443"

curl -sfL https://get.k3s.io | sh -s - server \
  --server $K3S_URL \
  --tls-san <node-ip> \
  --tls-san <hostname>
```

**Control-plane-only (no workloads, e.g., nas1):**
```bash
export K3S_TOKEN="<token>"
export K3S_URL="https://10.0.20.22:6443"

curl -sfL https://get.k3s.io | sh -s - server \
  --server $K3S_URL \
  --node-taint CriticalAddonsOnly=true:NoExecute \
  --disable-agent \
  --tls-san <node-ip> \
  --tls-san <hostname>
```

### Step 4: Verify Join

```bash
# On any cluster node
sudo k3s kubectl get nodes

# Check etcd membership grew
sudo k3s etcd-snapshot ls
```

---

## Workflow: Join as Agent

For worker-only nodes that just run workloads.

### Step 1: Get Agent Token

```bash
# On any server node
sudo cat /var/lib/rancher/k3s/server/node-token
```

### Step 2: Install Agent

```bash
ssh joey@<worker-ip>

export K3S_TOKEN="<token>"
export K3S_URL="https://10.0.20.22:6443"

curl -sfL https://get.k3s.io | sh -s - agent \
  --server $K3S_URL
```

### Step 3: Verify

```bash
kubectl get nodes

# Agent shows only 'worker' role, no 'control-plane' or 'etcd'
```

---

## Post-Join Configuration

### Label the Node

```bash
# For worker capability
kubectl label node <name> node-role.kubernetes.io/worker=true

# For Longhorn storage (if has local SSD)
kubectl label node <name> longhorn=true

# For GPU workloads
kubectl label node <name> gpu=true

# For TPU workloads
kubectl label node <name> tpu=true
```

### Verify Workload Scheduling

```bash
# Check existing pods redistributed
kubectl get pods -A -o wide

# If pods should move to new node, you may need to:
# - Delete pods to let scheduler redistribute
# - Use pod anti-affinity for spreading
```

---

## Troubleshooting Join Issues

### "certificate signed by unknown authority"

```bash
# Token might be wrong or expired
# Get fresh token from server:
sudo cat /var/lib/rancher/k3s/server/node-token
```

### "connection refused"

```bash
# Check server is running
ssh joey@10.0.20.22 'sudo systemctl status k3s'

# Check port accessibility
nc -zv 10.0.20.22 6443
```

### Node stuck in "NotReady"

```bash
# Check kubelet logs on the new node
sudo journalctl -u k3s -f

# Common issues:
# - Network plugin not ready
# - DNS not resolving
# - Resource pressure
```

### etcd learner not promoted

```bash
# Check etcd health
sudo k3s etcd-snapshot ls

# May need to wait for etcd to sync
# Check logs: sudo journalctl -u k3s | grep etcd
```
