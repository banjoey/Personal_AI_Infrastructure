# Longhorn Quick Command Reference

Fast lookup for common Longhorn operations.

---

## Status & Info

```bash
# All Longhorn pods
kubectl get pods -n longhorn-system

# All volumes
kubectl get volumes.longhorn.io -n longhorn-system

# All volumes with status
kubectl get volumes.longhorn.io -n longhorn-system \
  -o custom-columns=NAME:.metadata.name,STATE:.status.state,ROBUSTNESS:.status.robustness,SIZE:.spec.size

# Node status
kubectl get nodes.longhorn.io -n longhorn-system

# PVCs using Longhorn
kubectl get pvc -A -o wide | grep longhorn

# StorageClass
kubectl get storageclass longhorn -o yaml
```

---

## Volume Operations

```bash
# Get volume details
kubectl describe volumes.longhorn.io <vol-name> -n longhorn-system

# List replicas for volume
kubectl get replicas.longhorn.io -n longhorn-system -l longhornvolume=<vol-name>

# Get volume from PVC
kubectl get pvc <pvc-name> -o jsonpath='{.spec.volumeName}'

# Volume size
kubectl get volumes.longhorn.io <vol-name> -n longhorn-system \
  -o jsonpath='{.spec.size}'
```

---

## PVC Operations

```bash
# Create PVC
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes: ["ReadWriteOnce"]
  storageClassName: longhorn
  resources:
    requests:
      storage: 5Gi
EOF

# Expand PVC
kubectl patch pvc <pvc-name> -p '{"spec":{"resources":{"requests":{"storage":"10Gi"}}}}'

# Delete PVC
kubectl delete pvc <pvc-name>
```

---

## Snapshot Operations

```bash
# Create snapshot
cat <<EOF | kubectl apply -f -
apiVersion: longhorn.io/v1beta2
kind: Snapshot
metadata:
  name: snap-$(date +%Y%m%d-%H%M)
  namespace: longhorn-system
spec:
  volume: <volume-name>
EOF

# List snapshots for volume
kubectl get snapshots.longhorn.io -n longhorn-system -l longhornvolume=<vol-name>

# Delete snapshot
kubectl delete snapshots.longhorn.io <snap-name> -n longhorn-system
```

---

## Backup Operations

```bash
# Check backup target
kubectl get settings backup-target -n longhorn-system

# Set backup target (NFS)
kubectl patch settings backup-target -n longhorn-system \
  --type merge -p '{"value":"nfs://10.0.20.15:/mnt/user/longhorn-backups"}'

# List backups
kubectl get backups.longhorn.io -n longhorn-system

# Create backup from snapshot
cat <<EOF | kubectl apply -f -
apiVersion: longhorn.io/v1beta2
kind: Backup
metadata:
  name: backup-$(date +%Y%m%d)
  namespace: longhorn-system
spec:
  snapshotName: <snapshot-name>
EOF
```

---

## UI Access

```bash
# Port forward
kubectl port-forward -n longhorn-system svc/longhorn-frontend 8080:80

# Open http://localhost:8080
```

---

## Node Management

```bash
# Add Longhorn label to node
kubectl label node <node> longhorn=true

# Remove Longhorn from node
kubectl label node <node> longhorn-

# Check node disk status
kubectl get nodes.longhorn.io <node> -n longhorn-system -o yaml

# Disable scheduling on node
kubectl patch nodes.longhorn.io <node> -n longhorn-system \
  --type merge -p '{"spec":{"allowScheduling":false}}'
```

---

## Settings

```bash
# List all settings
kubectl get settings -n longhorn-system

# Get specific setting
kubectl get settings <setting-name> -n longhorn-system -o jsonpath='{.value}'

# Common settings
kubectl get settings default-replica-count -n longhorn-system
kubectl get settings backup-target -n longhorn-system
kubectl get settings storage-reserved-percentage-for-default-disk -n longhorn-system

# Update setting
kubectl patch settings <setting-name> -n longhorn-system \
  --type merge -p '{"value":"<new-value>"}'
```

---

## Troubleshooting Commands

```bash
# Manager logs
kubectl logs -n longhorn-system -l app=longhorn-manager --tail=100

# Driver logs
kubectl logs -n longhorn-system -l app=longhorn-driver-deployer --tail=100

# CSI logs
kubectl logs -n longhorn-system -l app=longhorn-csi-plugin --tail=100

# Check events
kubectl get events -n longhorn-system --sort-by='.lastTimestamp' | tail -20

# Instance manager status
kubectl get instancemanagers.longhorn.io -n longhorn-system
```

---

## Recovery Commands

```bash
# Force detach volume
kubectl patch volumes.longhorn.io <vol> -n longhorn-system \
  --type merge -p '{"spec":{"nodeID":""}}'

# Delete stuck volume (DANGER: data loss!)
kubectl patch volumes.longhorn.io <vol> -n longhorn-system \
  --type merge -p '{"metadata":{"finalizers":[]}}'
kubectl delete volumes.longhorn.io <vol> -n longhorn-system

# Delete stuck PVC
kubectl patch pvc <pvc> --type merge -p '{"metadata":{"finalizers":[]}}'
kubectl delete pvc <pvc>

# Restart Longhorn components
kubectl rollout restart deployment longhorn-ui -n longhorn-system
kubectl rollout restart daemonset longhorn-manager -n longhorn-system
```

---

## Helm Commands

```bash
# Check installed version
helm list -n longhorn-system

# Get values
helm get values longhorn -n longhorn-system

# Upgrade
helm upgrade longhorn longhorn/longhorn -n longhorn-system -f values.yaml

# Uninstall
helm uninstall longhorn -n longhorn-system
```

---

## Barkley Farm Specific

```bash
# Check both storage nodes
for node in ai1 ai2; do
  echo "=== $node ==="
  kubectl get nodes.longhorn.io $node -n longhorn-system \
    -o jsonpath='{.status.diskStatus}' | jq '.'
done

# Total cluster capacity
kubectl get nodes.longhorn.io -n longhorn-system \
  -o jsonpath='{range .items[*]}{.metadata.name}: {.status.diskStatus..storageAvailable}{"\n"}{end}'

# Quick health check
echo "Volumes:"; kubectl get volumes.longhorn.io -n longhorn-system --no-headers | wc -l
echo "Healthy:"; kubectl get volumes.longhorn.io -n longhorn-system -o jsonpath='{.items[?(@.status.robustness=="healthy")].metadata.name}' | wc -w
echo "Degraded:"; kubectl get volumes.longhorn.io -n longhorn-system -o jsonpath='{.items[?(@.status.robustness!="healthy")].metadata.name}'
```
