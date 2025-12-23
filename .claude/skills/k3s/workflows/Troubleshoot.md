# Troubleshoot Workflow

Diagnose and fix common k3s issues. Start with symptom, follow decision tree.

---

## Quick Diagnostic Commands

Run these first to gather info:

```bash
# Cluster overview
kubectl get nodes -o wide
kubectl get pods -A | grep -v Running
kubectl get events -A --sort-by='.lastTimestamp' | tail -20

# On specific node
ssh joey@<node-ip>
sudo systemctl status k3s
sudo journalctl -u k3s --since "10 min ago" | tail -50
df -h /var/lib/rancher
free -h
```

---

## Symptom: Node Shows "NotReady"

### Check 1: Is k3s service running?

```bash
ssh joey@<node-ip>
sudo systemctl status k3s
```

**If stopped:** `sudo systemctl start k3s`

**If failed:** Check logs: `sudo journalctl -u k3s -e`

### Check 2: Network connectivity

```bash
# From the NotReady node, ping the API server
ping 10.0.20.22

# Check if API port is reachable
nc -zv 10.0.20.22 6443
```

**If unreachable:** Network/firewall issue. Check UniFi firewall rules.

### Check 3: Disk pressure

```bash
df -h /var/lib/rancher
# If over 85%, clean up:
sudo k3s crictl rmi --prune
docker system prune -a  # if docker is installed
```

### Check 4: Memory pressure

```bash
free -h
# If low, check what's consuming memory
top -o %MEM
```

### Check 5: Time sync

```bash
timedatectl status
# If not synced:
sudo systemctl restart systemd-timesyncd
```

---

## Symptom: Pods Stuck in "Pending"

### Check 1: Node resources

```bash
kubectl describe pod <pod-name> | grep -A 10 "Events:"
# Look for "Insufficient cpu" or "Insufficient memory"

kubectl top nodes
# Check available capacity
```

### Check 2: Taints and tolerations

```bash
kubectl describe node <node> | grep Taints
# If tainted (e.g., CriticalAddonsOnly), pod needs matching toleration
```

### Check 3: Node selector/affinity

```bash
kubectl get pod <pod> -o yaml | grep -A 5 nodeSelector
kubectl get pod <pod> -o yaml | grep -A 10 affinity
```

### Check 4: PVC binding

```bash
kubectl get pvc -A
# If Pending, check Longhorn or storage provisioner
```

---

## Symptom: Pods Stuck in "ContainerCreating"

### Check 1: Image pull issues

```bash
kubectl describe pod <pod> | grep -A 5 "Events:"
# Look for "ImagePullBackOff" or "ErrImagePull"
```

**For private registries:**
```bash
kubectl get secret <image-pull-secret> -o yaml
# Verify credentials are correct
```

### Check 2: Network/CNI issues

```bash
kubectl get pods -n kube-system | grep flannel
kubectl get pods -n kube-system | grep coredns
```

### Check 3: Volume mount issues

```bash
kubectl describe pod <pod> | grep -A 10 "Volumes:"
# Check for failed mount operations
```

---

## Symptom: Pods CrashLoopBackOff

### Check 1: Application logs

```bash
kubectl logs <pod> --previous
# Shows logs from last crashed container
```

### Check 2: Resource limits

```bash
kubectl describe pod <pod> | grep -A 5 "Limits:"
# OOMKilled if memory limit hit
```

### Check 3: Liveness/readiness probes

```bash
kubectl describe pod <pod> | grep -A 5 "Liveness:"
# Failed probes cause restarts
```

---

## Symptom: kubectl Connection Refused

### Check 1: Is API server running?

```bash
ssh joey@10.0.20.22 'sudo systemctl status k3s'
```

### Check 2: kubeconfig correct?

```bash
cat ~/.kube/config | grep server
# Should point to https://10.0.20.22:6443 (or cluster IP)
```

### Check 3: Certificate issues

```bash
# If you changed node IPs, certs may be invalid
# Regenerate certs (on server node):
sudo rm /var/lib/rancher/k3s/server/tls/*.crt
sudo systemctl restart k3s
# Then copy new kubeconfig
```

---

## Symptom: etcd Issues (HA Cluster)

### Check 1: etcd health

```bash
# On a server node
sudo k3s etcd-snapshot ls
```

### Check 2: Member list

```bash
# Check if all 3 members are visible
kubectl get nodes | grep control-plane
```

### Check 3: etcd logs

```bash
sudo journalctl -u k3s | grep etcd
```

### Nuclear option: Reset etcd

**WARNING: DATA LOSS - only use if cluster is completely broken**

```bash
# On ONE server node:
sudo k3s server --cluster-reset
# This creates a new single-node cluster from current data
# Other nodes must rejoin
```

---

## Symptom: DNS Not Resolving

### Check 1: CoreDNS pods

```bash
kubectl get pods -n kube-system | grep coredns
kubectl logs -n kube-system -l k8s-app=kube-dns
```

### Check 2: DNS service

```bash
kubectl get svc -n kube-system kube-dns
```

### Check 3: Test from a pod

```bash
kubectl run dnstest --rm -it --image=busybox -- nslookup kubernetes.default.svc.cluster.local
```

### Fix: Restart CoreDNS

```bash
kubectl rollout restart deployment coredns -n kube-system
```

---

## Symptom: Services Not Accessible

### Check 1: Service endpoints

```bash
kubectl get endpoints <service-name>
# Should show pod IPs, not empty
```

### Check 2: Service selector matches pods

```bash
kubectl get svc <service> -o yaml | grep -A 3 selector
kubectl get pods -l <selector-label>=<selector-value>
```

### Check 3: kube-proxy

```bash
kubectl get pods -n kube-system | grep kube-proxy
kubectl logs -n kube-system <kube-proxy-pod>
```

---

## Collect Full Diagnostics

For complex issues, gather everything:

```bash
# Save cluster state
kubectl cluster-info dump > cluster-dump.txt

# Node descriptions
for node in $(kubectl get nodes -o name); do
  kubectl describe $node >> node-descriptions.txt
done

# All pod statuses
kubectl get pods -A -o wide > all-pods.txt

# Events
kubectl get events -A --sort-by='.lastTimestamp' > events.txt

# k3s logs from all nodes
for ip in 10.0.20.22 10.0.20.21 10.0.20.15; do
  ssh joey@$ip 'sudo journalctl -u k3s --since "1 hour ago"' > k3s-$ip.log
done
```
