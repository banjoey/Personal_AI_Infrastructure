---
name: k3s
description: Lightweight Kubernetes cluster management for home lab. USE WHEN user mentions k3s, kubernetes, k8s, cluster, nodes, pods, deployments, services, kubectl, OR wants to manage container orchestration. Foundation for Longhorn, Traefik, ArgoCD skills.
---

# k3s

Lightweight Kubernetes (k3s) cluster management skill. Provides installation, configuration, troubleshooting, and day-to-day operations for the home lab k3s cluster.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName k3s
```

| Workflow | Trigger | File |
|----------|---------|------|
| **InstallServer** | "install k3s", "set up kubernetes", "create cluster" | `workflows/InstallServer.md` |
| **JoinCluster** | "add node", "join cluster", "expand cluster" | `workflows/JoinCluster.md` |
| **RemoveNode** | "remove node", "drain node", "decommission" | `workflows/RemoveNode.md` |
| **Troubleshoot** | "k3s not working", "cluster issues", "node not ready" | `workflows/Troubleshoot.md` |
| **Upgrade** | "upgrade k3s", "update kubernetes" | `workflows/Upgrade.md` |

## Cluster Architecture

### Target State (3-node HA)

```
┌─────────────────────────────────────────────────────────────────┐
│                    k3s Cluster: barkleyfarm                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│  │    nas1     │   │     ai1     │   │     ai2     │          │
│  │ 10.0.20.15  │   │ 10.0.20.21  │   │ 10.0.20.22  │          │
│  ├─────────────┤   ├─────────────┤   ├─────────────┤          │
│  │ Control     │   │ Control     │   │ Control     │          │
│  │ Plane ONLY  │   │ + Worker    │   │ + Worker    │          │
│  ├─────────────┤   ├─────────────┤   ├─────────────┤          │
│  │ etcd vote   │   │ etcd vote   │   │ etcd vote   │          │
│  │ API server  │   │ API server  │   │ API server  │          │
│  │ scheduler   │   │ scheduler   │   │ scheduler   │          │
│  │             │   │ kubelet     │   │ kubelet     │          │
│  │             │   │ Longhorn    │   │ Longhorn    │          │
│  │             │   │ GPU (later) │   │ Coral TPU   │          │
│  └─────────────┘   └─────────────┘   └─────────────┘          │
│                                                                 │
│  Storage: Longhorn (ai1+ai2 SSDs only)                         │
│  Ingress: Traefik (bundled with k3s)                           │
│  GitOps:  ArgoCD                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Current State

| Node | IP | Status | Role | Hardware |
|------|-----|--------|------|----------|
| ai2 | 10.0.20.22 | Phase 0 | First server | AMD Ryzen 7 5825U, 32GB, 2TB NVMe, Coral TPU |
| ai1 | 10.0.20.21 | Phase 7 (future) | Server + Agent | To be rebuilt from srv1 |
| nas1 | 10.0.20.15 | Phase 3 | Control plane only | Unraid NAS, no workloads |

### Why 3-Node HA?

- **etcd quorum**: 3 nodes = can survive 1 failure (2/3 majority)
- **API availability**: Any node can handle kubectl requests
- **nas1 as control-plane-only**: Provides etcd vote without running workloads

## Node Roles Explained

### Server (Control Plane)
Runs: etcd, API server, controller-manager, scheduler
```bash
# Install as first server
curl -sfL https://get.k3s.io | sh -s - server --cluster-init

# Install as additional server (HA)
curl -sfL https://get.k3s.io | K3S_TOKEN=<token> sh -s - server --server https://<first-server>:6443
```

### Server + Agent (Control Plane + Worker)
Runs: Everything above PLUS kubelet, can schedule pods
```bash
# Same as above but with taints removed (default behavior)
# Pods can be scheduled on this node
```

### Control Plane Only (no workloads)
Runs: Control plane components only, no pod scheduling
```bash
# Install server with taint to prevent scheduling
curl -sfL https://get.k3s.io | K3S_TOKEN=<token> sh -s - server \
  --server https://<first-server>:6443 \
  --node-taint CriticalAddonsOnly=true:NoExecute
```

### Agent Only (Worker)
Runs: kubelet only, receives workloads
```bash
curl -sfL https://get.k3s.io | K3S_TOKEN=<token> sh -s - agent --server https://<server>:6443
```

## Installation Quick Reference

### Prerequisites

1. **Static IP assigned** (via UniFi DHCP reservation)
2. **Hostname set correctly**
3. **SSH access confirmed**
4. **Ports open**: 6443 (API), 10250 (kubelet), 2379-2380 (etcd), 8472/UDP (VXLAN)

### First Server (ai2)

```bash
# SSH to node
ssh joey@10.0.20.22

# Set hostname if not already set
sudo hostnamectl set-hostname ai2

# Install k3s as first server with embedded etcd
curl -sfL https://get.k3s.io | sh -s - server \
  --cluster-init \
  --tls-san 10.0.20.22 \
  --tls-san ai2 \
  --tls-san ai2.barkleyfarm.com \
  --disable traefik  # We'll install our own Traefik later

# Get node token for joining other nodes
sudo cat /var/lib/rancher/k3s/server/node-token

# Copy kubeconfig to local machine
sudo cat /etc/rancher/k3s/k3s.yaml
```

### Additional Server (ai1, nas1)

```bash
# SSH to node
ssh joey@<node-ip>

# Join cluster as server
curl -sfL https://get.k3s.io | K3S_TOKEN=<token> sh -s - server \
  --server https://10.0.20.22:6443 \
  --tls-san <node-ip> \
  --tls-san <hostname>

# For control-plane-only (nas1):
curl -sfL https://get.k3s.io | K3S_TOKEN=<token> sh -s - server \
  --server https://10.0.20.22:6443 \
  --node-taint CriticalAddonsOnly=true:NoExecute \
  --disable-agent
```

## Examples

### Example 1: Check cluster status
```
User: "Is the cluster healthy?"

k3s skill activates:
1. Run kubectl get nodes
2. Check node conditions
3. Verify etcd health
4. Report any issues

→ kubectl get nodes -o wide
→ kubectl get componentstatuses
```

### Example 2: Deploy an application
```
User: "Deploy nginx to the cluster"

k3s skill activates:
1. Create deployment YAML
2. Apply to cluster
3. Verify pods running
4. Expose service if needed

→ kubectl create deployment nginx --image=nginx
→ kubectl expose deployment nginx --port=80
```

### Example 3: Troubleshoot node issues
```
User: "ai1 shows NotReady"

k3s skill activates:
1. Check node conditions
2. Examine kubelet logs
3. Verify network connectivity
4. Check disk/memory pressure

→ kubectl describe node ai1
→ ssh joey@ai1 'journalctl -u k3s --since "10 min ago"'
```

## Essential kubectl Commands

### Cluster Info
```bash
kubectl cluster-info                    # Cluster endpoint info
kubectl get nodes -o wide               # Node status with IPs
kubectl get pods -A                     # All pods in all namespaces
kubectl top nodes                       # Node resource usage
kubectl top pods -A                     # Pod resource usage
```

### Workload Management
```bash
kubectl get deployments -A              # All deployments
kubectl get services -A                 # All services
kubectl get pvc -A                      # Persistent volume claims
kubectl logs <pod> -n <namespace>       # Pod logs
kubectl exec -it <pod> -- /bin/sh       # Shell into pod
```

### Troubleshooting
```bash
kubectl describe node <node>            # Detailed node info
kubectl describe pod <pod>              # Pod events and status
kubectl get events -A --sort-by='.lastTimestamp'  # Recent events
kubectl get pods -A | grep -v Running   # Non-running pods
```

### k3s Specific
```bash
# On the node itself:
k3s kubectl get nodes                   # Use k3s bundled kubectl
sudo systemctl status k3s               # Service status
sudo journalctl -u k3s -f               # Live logs
sudo k3s crictl ps                      # Container runtime status
sudo cat /var/lib/rancher/k3s/server/node-token  # Join token
```

## Configuration Files

### kubeconfig Location
- **On server node**: `/etc/rancher/k3s/k3s.yaml`
- **Local machine**: `~/.kube/config` (copy from server, update IP)

### k3s Config
- **Service config**: `/etc/systemd/system/k3s.service.env`
- **Server manifests**: `/var/lib/rancher/k3s/server/manifests/`
- **Data directory**: `/var/lib/rancher/k3s/`

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| **Longhorn** | Deploys on k3s, uses kubectl, requires agent nodes |
| **Traefik** | Deploys as Ingress controller, LoadBalancer service |
| **Helm** | Package manager for k3s applications |
| **ArgoCD** | GitOps deployment to k3s cluster |
| **Infra** | Overall infrastructure management |
| **Network** | VLAN/firewall for cluster traffic |

## Troubleshooting Guide

### Node Not Ready

```bash
# Check node status
kubectl describe node <node-name>

# Common causes:
# - Network issues (check CNI)
# - Disk pressure (check /var/lib/rancher)
# - Memory pressure
# - kubelet not running

# On the node:
sudo systemctl status k3s
sudo journalctl -u k3s --since "5 min ago"
```

### etcd Issues (HA only)

```bash
# Check etcd members
sudo k3s etcd-snapshot ls

# Force new cluster from single node (DANGEROUS - data loss)
# Only if cluster is completely broken
sudo k3s server --cluster-reset
```

### Pod Scheduling Issues

```bash
# Check for taints
kubectl describe node <node> | grep Taints

# Check resource constraints
kubectl describe pod <pod> | grep -A 20 "Events:"

# Check if node is cordoned
kubectl get nodes | grep SchedulingDisabled
```

### Network Connectivity

```bash
# Check flannel/VXLAN
kubectl get pods -n kube-system | grep flannel

# Check CoreDNS
kubectl get pods -n kube-system | grep coredns

# Test DNS from a pod
kubectl run test --rm -it --image=busybox -- nslookup kubernetes
```

## Security Notes

- **Node token** is sensitive - treat like a password
- **kubeconfig** grants full cluster access - secure it
- **API server** exposed on 6443 - only accessible from bf-servers VLAN
- **etcd** traffic on 2379-2380 - encrypted by k3s automatically

## Backup Strategy

```bash
# Snapshot etcd (built into k3s)
sudo k3s etcd-snapshot save --name manual-backup

# List snapshots
sudo k3s etcd-snapshot ls

# Snapshots stored in:
# /var/lib/rancher/k3s/server/db/snapshots/
```

---

**k3s skill provides Kubernetes foundation for home lab container orchestration.**
