# k3s Quick Command Reference

Fast lookup for common k3s operations.

---

## Cluster Status

```bash
# Node status
kubectl get nodes -o wide

# All pods
kubectl get pods -A

# Non-running pods only
kubectl get pods -A | grep -v Running

# Recent events
kubectl get events -A --sort-by='.lastTimestamp' | tail -20

# Resource usage
kubectl top nodes
kubectl top pods -A
```

---

## Node Management

```bash
# Cordon (prevent scheduling)
kubectl cordon <node>

# Uncordon (allow scheduling)
kubectl uncordon <node>

# Drain (evict pods)
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data

# Delete node
kubectl delete node <node>

# Label node
kubectl label node <node> <key>=<value>

# Taint node
kubectl taint node <node> <key>=<value>:<effect>
# Effects: NoSchedule, PreferNoSchedule, NoExecute

# Remove taint
kubectl taint node <node> <key>-
```

---

## Pod Operations

```bash
# Get pods in namespace
kubectl get pods -n <namespace>

# Describe pod (events, status)
kubectl describe pod <pod> -n <namespace>

# Pod logs
kubectl logs <pod> -n <namespace>
kubectl logs <pod> -n <namespace> --previous  # crashed container
kubectl logs <pod> -n <namespace> -f          # follow

# Exec into pod
kubectl exec -it <pod> -n <namespace> -- /bin/sh

# Delete pod (will be recreated if managed by deployment)
kubectl delete pod <pod> -n <namespace>

# Force delete stuck pod
kubectl delete pod <pod> -n <namespace> --grace-period=0 --force
```

---

## Deployment Operations

```bash
# List deployments
kubectl get deployments -A

# Scale deployment
kubectl scale deployment <name> -n <namespace> --replicas=<n>

# Restart deployment (rolling restart)
kubectl rollout restart deployment <name> -n <namespace>

# Rollout status
kubectl rollout status deployment <name> -n <namespace>

# Rollback
kubectl rollout undo deployment <name> -n <namespace>

# History
kubectl rollout history deployment <name> -n <namespace>
```

---

## Service Operations

```bash
# List services
kubectl get svc -A

# Get endpoints (what IPs the service routes to)
kubectl get endpoints <service> -n <namespace>

# Describe service
kubectl describe svc <service> -n <namespace>

# Port forward (local access)
kubectl port-forward svc/<service> -n <namespace> <local-port>:<svc-port>
```

---

## Storage Operations

```bash
# Persistent Volume Claims
kubectl get pvc -A

# Persistent Volumes
kubectl get pv

# Storage Classes
kubectl get storageclass

# Volume Attachments
kubectl get volumeattachments
```

---

## Secrets and ConfigMaps

```bash
# List secrets
kubectl get secrets -n <namespace>

# Get secret (base64 encoded)
kubectl get secret <name> -n <namespace> -o yaml

# Decode secret value
kubectl get secret <name> -n <namespace> -o jsonpath='{.data.<key>}' | base64 -d

# Create secret from literal
kubectl create secret generic <name> -n <namespace> --from-literal=<key>=<value>

# ConfigMaps
kubectl get configmaps -n <namespace>
kubectl describe configmap <name> -n <namespace>
```

---

## Namespace Operations

```bash
# List namespaces
kubectl get namespaces

# Create namespace
kubectl create namespace <name>

# Set default namespace for context
kubectl config set-context --current --namespace=<name>

# Delete namespace (and ALL resources in it!)
kubectl delete namespace <name>
```

---

## k3s-Specific Commands

Run these ON the k3s node:

```bash
# Service status
sudo systemctl status k3s
sudo systemctl restart k3s
sudo systemctl stop k3s

# Logs
sudo journalctl -u k3s -f
sudo journalctl -u k3s --since "10 min ago"

# Use built-in kubectl
sudo k3s kubectl get nodes

# Container runtime
sudo k3s crictl ps
sudo k3s crictl images
sudo k3s crictl rmi --prune  # clean unused images

# Get join token
sudo cat /var/lib/rancher/k3s/server/node-token

# etcd operations
sudo k3s etcd-snapshot ls
sudo k3s etcd-snapshot save --name <name>

# Uninstall
/usr/local/bin/k3s-uninstall.sh      # server
/usr/local/bin/k3s-agent-uninstall.sh # agent
```

---

## YAML Apply/Delete

```bash
# Apply manifest
kubectl apply -f <file.yaml>

# Apply from URL
kubectl apply -f https://example.com/manifest.yaml

# Delete resources from manifest
kubectl delete -f <file.yaml>

# Dry run (see what would happen)
kubectl apply -f <file.yaml> --dry-run=client

# Output what would be created
kubectl apply -f <file.yaml> --dry-run=client -o yaml
```

---

## Debug Commands

```bash
# Create debug pod
kubectl run debug --rm -it --image=busybox -- /bin/sh

# DNS test
kubectl run dnstest --rm -it --image=busybox -- nslookup kubernetes

# Network test from inside cluster
kubectl run curltest --rm -it --image=curlimages/curl -- curl <url>

# Check API resources
kubectl api-resources

# Check RBAC
kubectl auth can-i <verb> <resource> --as=<user>
```

---

## Context Management

```bash
# List contexts
kubectl config get-contexts

# Current context
kubectl config current-context

# Switch context
kubectl config use-context <context-name>

# View kubeconfig
kubectl config view
```

---

## Barkley Farm Specific

```bash
# SSH to nodes
ssh joey@10.0.20.22  # ai2 (first server)
ssh joey@10.0.20.21  # ai1 (when ready)
ssh joey@10.0.20.15  # nas1 (control plane only)

# Quick cluster check
kubectl get nodes -o wide && kubectl get pods -A | grep -v Running

# Copy kubeconfig from ai2 to local
ssh joey@10.0.20.22 'sudo cat /etc/rancher/k3s/k3s.yaml' > ~/.kube/config
# Then edit server: to use 10.0.20.22 instead of 127.0.0.1
```
