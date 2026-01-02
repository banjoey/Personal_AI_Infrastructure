# InstallServer Workflow

Installs k3s server on a node, either as the first node (cluster-init) or joining an existing cluster.

## Prerequisites Checklist

- [ ] Node has static IP (via UniFi DHCP reservation)
- [ ] Hostname is set correctly (`hostnamectl set-hostname <name>`)
- [ ] SSH access works (`ssh joey@<ip>`)
- [ ] Node is in bf-servers VLAN (10.0.20.0/24)
- [ ] Required ports are accessible (6443, 10250, 2379-2380, 8472/UDP)

## Scenario A: First Server (Cluster Initialization)

**Use for**: ai2 (10.0.20.22) - the first node in the cluster

### Step 1: SSH and Verify

```bash
ssh joey@10.0.20.22

# Verify hostname
hostname
# Should output: ai2

# Verify IP
ip addr show | grep 10.0.20.22
```

### Step 2: Install k3s with cluster-init

```bash
curl -sfL https://get.k3s.io | sh -s - server \
  --cluster-init \
  --tls-san 10.0.20.22 \
  --tls-san ai2 \
  --tls-san ai2.barkleyfarm.com \
  --disable traefik
```

**Flags explained:**
- `--cluster-init`: Initialize embedded etcd for HA
- `--tls-san`: Add IP/hostname to API server certificate
- `--disable traefik`: We'll install Traefik separately with custom config

### Step 3: Verify Installation

```bash
# Check service status
sudo systemctl status k3s

# Verify node is ready
sudo k3s kubectl get nodes

# Expected output:
# NAME   STATUS   ROLES                       AGE   VERSION
# ai2    Ready    control-plane,etcd,master   1m    v1.28.x+k3s1
```

### Step 4: Get Join Token

```bash
# This token is needed for other nodes to join
sudo cat /var/lib/rancher/k3s/server/node-token

# Save this securely! Treat it like a password.
```

### Step 5: Copy kubeconfig to Local Machine

```bash
# On the server:
sudo cat /etc/rancher/k3s/k3s.yaml

# Copy the output, then on your local machine:
mkdir -p ~/.kube
# Paste content and change server: https://127.0.0.1:6443 to https://10.0.20.22:6443
```

---

## Scenario B: Additional Server (Join Existing Cluster)

**Use for**: ai1 (10.0.20.21), nas1 (10.0.20.15)

### Step 1: SSH and Verify

```bash
ssh joey@<node-ip>

# Verify hostname
hostname

# Verify IP
ip addr show | grep <expected-ip>
```

### Step 2: Get Token from Existing Server

```bash
# On first server (ai2):
sudo cat /var/lib/rancher/k3s/server/node-token
```

### Step 3: Install as Additional Server

**For ai1 (server + agent, runs workloads):**
```bash
export K3S_TOKEN="<token-from-step-2>"

curl -sfL https://get.k3s.io | K3S_TOKEN=$K3S_TOKEN sh -s - server \
  --server https://10.0.20.22:6443 \
  --tls-san 10.0.20.21 \
  --tls-san ai1 \
  --tls-san ai1.barkleyfarm.com
```

**For nas1 (control plane only, no workloads):**
```bash
export K3S_TOKEN="<token-from-step-2>"

curl -sfL https://get.k3s.io | K3S_TOKEN=$K3S_TOKEN sh -s - server \
  --server https://10.0.20.22:6443 \
  --node-taint CriticalAddonsOnly=true:NoExecute \
  --disable-agent \
  --tls-san 10.0.20.15 \
  --tls-san nas1
```

**Flags for control-plane-only:**
- `--node-taint CriticalAddonsOnly=true:NoExecute`: Prevents normal pods from scheduling
- `--disable-agent`: Don't run kubelet (no pod execution at all)

### Step 4: Verify Join

```bash
# On any server node:
sudo k3s kubectl get nodes

# Expected output (after all 3 nodes):
# NAME   STATUS   ROLES                       AGE   VERSION
# ai2    Ready    control-plane,etcd,master   10m   v1.28.x+k3s1
# ai1    Ready    control-plane,etcd,master   5m    v1.28.x+k3s1
# nas1   Ready    control-plane,etcd,master   1m    v1.28.x+k3s1
```

### Step 5: Verify etcd Cluster

```bash
# Check etcd member list
sudo k3s etcd-snapshot ls

# Verify 3 members for HA quorum
```

---

## Post-Installation Steps

### 1. Label Nodes for Scheduling

```bash
# Label worker nodes
kubectl label node ai1 node-role.kubernetes.io/worker=true
kubectl label node ai2 node-role.kubernetes.io/worker=true

# Label for Longhorn storage (only nodes with local SSDs)
kubectl label node ai1 longhorn=true
kubectl label node ai2 longhorn=true

# Label for GPU workloads (when available)
kubectl label node ai1 gpu=true

# Label for TPU workloads
kubectl label node ai2 tpu=true
```

### 2. Verify CoreDNS

```bash
kubectl get pods -n kube-system | grep coredns
# Should show 2 coredns pods running
```

### 3. Test Cluster

```bash
# Create test deployment
kubectl create deployment nginx-test --image=nginx --replicas=2

# Verify pods scheduled on worker nodes (not nas1)
kubectl get pods -o wide

# Clean up
kubectl delete deployment nginx-test
```

---

## Rollback: Uninstall k3s

If something goes wrong:

**On server nodes:**
```bash
/usr/local/bin/k3s-uninstall.sh
```

**On agent nodes:**
```bash
/usr/local/bin/k3s-agent-uninstall.sh
```

This removes k3s completely, including all data. Start fresh with Step 1.

---

## Troubleshooting Installation

### "connection refused" when joining

1. Check first server is running: `sudo systemctl status k3s`
2. Check port 6443 is accessible: `nc -zv 10.0.20.22 6443`
3. Verify token is correct (no extra whitespace)

### Node shows "NotReady"

1. Check k3s logs: `sudo journalctl -u k3s --since "5 min ago"`
2. Check network: `ping 10.0.20.22`
3. Check disk space: `df -h /var/lib/rancher`

### etcd fails to start

1. Check existing cluster state on first node
2. Ensure clocks are synchronized (NTP)
3. Check for leftover data: `sudo rm -rf /var/lib/rancher/k3s/server/db/etcd`
