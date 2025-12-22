# RemoveNode Workflow

Safely removes a node from the k3s cluster, ensuring workloads are evacuated and etcd membership is updated.

## Critical Warning

Removing a server node from a 3-node HA cluster reduces fault tolerance:
- **3 nodes**: Can survive 1 failure (2/3 quorum)
- **2 nodes**: Cannot survive ANY failure (no quorum possible)
- **1 node**: Single point of failure

Only remove a server if you're replacing it or have 4+ nodes.

---

## Workflow: Remove Worker Node (Agent)

Simpler process - no etcd concerns.

### Step 1: Drain the Node

```bash
# Evict all pods from the node
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# This marks node as SchedulingDisabled and moves pods
```

### Step 2: Verify Pods Migrated

```bash
kubectl get pods -A -o wide | grep <node-name>
# Should show no pods (except daemonsets which are ignored)
```

### Step 3: Delete Node from Cluster

```bash
kubectl delete node <node-name>
```

### Step 4: Uninstall k3s on the Node

```bash
ssh joey@<node-ip>

# For agents:
/usr/local/bin/k3s-agent-uninstall.sh
```

---

## Workflow: Remove Server Node

More complex - must handle etcd membership.

### Step 1: Verify Cluster Health

```bash
# Check all nodes healthy before starting
kubectl get nodes

# Verify etcd has 3 members
sudo k3s etcd-snapshot ls
```

### Step 2: Drain the Node

```bash
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
```

### Step 3: Stop k3s on the Node

```bash
ssh joey@<node-ip>
sudo systemctl stop k3s
```

### Step 4: Remove from etcd (from ANOTHER server)

```bash
# SSH to a DIFFERENT server node
ssh joey@<other-server-ip>

# Remove the etcd member
# First, get the member ID
sudo k3s kubectl get nodes

# The node removal should happen automatically after k3s is stopped
# If it doesn't, you may need manual etcd intervention
```

### Step 5: Delete Node Object

```bash
kubectl delete node <node-name>
```

### Step 6: Uninstall k3s

```bash
ssh joey@<node-ip>
/usr/local/bin/k3s-uninstall.sh
```

### Step 7: Verify Cluster Health

```bash
kubectl get nodes
# Should show remaining nodes as Ready

# Check etcd membership decreased
sudo k3s etcd-snapshot ls
```

---

## Workflow: Temporary Node Maintenance

For reboots or temporary removal without permanently leaving cluster.

### Step 1: Cordon the Node

```bash
# Prevent new pods from scheduling
kubectl cordon <node-name>
```

### Step 2: Drain (Optional)

```bash
# If you need to evacuate existing pods:
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
```

### Step 3: Perform Maintenance

- Reboot the node
- Update software
- Replace hardware
- etc.

### Step 4: Uncordon

```bash
# Allow scheduling again
kubectl uncordon <node-name>
```

### Step 5: Verify

```bash
kubectl get nodes
# Node should show Ready, SchedulingDisabled=false
```

---

## Emergency: Force Remove Stuck Node

If a node is completely dead and can't be drained:

### Step 1: Force Delete Pods

```bash
# Find pods on the dead node
kubectl get pods -A -o wide | grep <node-name>

# Force delete each pod
kubectl delete pod <pod-name> -n <namespace> --grace-period=0 --force
```

### Step 2: Delete Node

```bash
kubectl delete node <node-name>
```

### Step 3: Clean Up PVCs (if using Longhorn)

```bash
# Check for orphaned volume attachments
kubectl get volumeattachments | grep <node-name>

# Force delete attachments
kubectl delete volumeattachment <name>
```

### Step 4: If etcd is Stuck

```bash
# On a healthy server node
# This is DANGEROUS - only use if cluster is broken

# List etcd members (from a healthy node)
# You may need to manually interact with etcd
```

---

## Rollback: Re-add a Removed Node

If you removed a node and want to add it back:

1. Ensure k3s is fully uninstalled: `/usr/local/bin/k3s-uninstall.sh`
2. Clean any leftover data: `sudo rm -rf /var/lib/rancher /etc/rancher`
3. Follow JoinCluster workflow to re-add

The node will get a fresh etcd member ID and rejoin as new.
