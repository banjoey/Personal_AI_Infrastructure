# CreateVolume Workflow

Creates persistent storage volumes using Longhorn.

---

## Quick Create: PersistentVolumeClaim

Most common method - create a PVC and let Longhorn provision storage.

### Step 1: Define PVC

```yaml
# my-storage.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-storage
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce        # RWO - single pod
  storageClassName: longhorn
  resources:
    requests:
      storage: 5Gi         # Size
```

### Step 2: Apply

```bash
kubectl apply -f my-storage.yaml

# Check status
kubectl get pvc my-storage
# Should show Bound
```

### Step 3: Use in Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
    - name: app
      image: my-image
      volumeMounts:
        - name: data
          mountPath: /data
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: my-storage
```

---

## PVC Options

### Access Modes

| Mode | Short | Description | Longhorn Support |
|------|-------|-------------|------------------|
| ReadWriteOnce | RWO | Single pod read/write | Yes |
| ReadOnlyMany | ROX | Many pods read-only | Yes |
| ReadWriteMany | RWX | Many pods read/write | Yes (NFSv4) |

### Common Sizes

| Use Case | Recommended Size |
|----------|------------------|
| App config | 1Gi |
| Small database | 5-10Gi |
| Medium database | 20-50Gi |
| Large database | 100Gi+ |

---

## ReadWriteMany (RWX) Volume

For volumes that multiple pods need to write to simultaneously.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: shared-storage
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: longhorn
  resources:
    requests:
      storage: 10Gi
```

Longhorn creates an NFS server for RWX volumes automatically.

---

## Custom StorageClass

For volumes with different requirements:

### High-Performance (SSD, 2 replicas)

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: longhorn-fast
provisioner: driver.longhorn.io
allowVolumeExpansion: true
parameters:
  numberOfReplicas: "2"
  staleReplicaTimeout: "2880"
  diskSelector: "ssd"
  nodeSelector: "longhorn"
```

### Single Replica (less redundant, more space)

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: longhorn-single
provisioner: driver.longhorn.io
allowVolumeExpansion: true
parameters:
  numberOfReplicas: "1"
```

### With Encryption

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: longhorn-encrypted
provisioner: driver.longhorn.io
allowVolumeExpansion: true
parameters:
  numberOfReplicas: "2"
  encrypted: "true"
  # Requires secrets for encryption key
```

---

## Expand Existing Volume

Longhorn supports online volume expansion.

### Step 1: Edit PVC

```bash
kubectl edit pvc my-storage
# Change spec.resources.requests.storage to larger value
```

Or:

```bash
kubectl patch pvc my-storage -p '{"spec":{"resources":{"requests":{"storage":"10Gi"}}}}'
```

### Step 2: Verify Expansion

```bash
kubectl get pvc my-storage
# Capacity should show new size

# If filesystem resize needed, pod may need restart
```

---

## StatefulSet with Longhorn

For databases and stateful apps:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: longhorn
        resources:
          requests:
            storage: 20Gi
```

---

## Pre-Provisioned Volume

Create volume first, then claim it:

### Step 1: Create Volume via UI or API

```bash
# Via kubectl
cat <<EOF | kubectl apply -f -
apiVersion: longhorn.io/v1beta2
kind: Volume
metadata:
  name: pre-provisioned
  namespace: longhorn-system
spec:
  size: "10737418240"  # 10Gi in bytes
  numberOfReplicas: 2
  frontend: blockdev
EOF
```

### Step 2: Create PV

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pre-provisioned-pv
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: longhorn
  csi:
    driver: driver.longhorn.io
    volumeHandle: pre-provisioned  # Volume name
    fsType: ext4
```

### Step 3: Claim PV

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pre-provisioned-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: longhorn
  resources:
    requests:
      storage: 10Gi
  volumeName: pre-provisioned-pv  # Explicit binding
```

---

## Clone Existing Volume

Create new volume from existing volume's data:

### Via Longhorn UI

1. Go to Volume list
2. Select source volume
3. Click "Create PV/PVC"
4. Enable "Create from existing volume"

### Via Snapshot

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: cloned-volume
spec:
  dataSource:
    name: source-snapshot
    kind: VolumeSnapshot
    apiGroup: snapshot.storage.k8s.io
  accessModes:
    - ReadWriteOnce
  storageClassName: longhorn
  resources:
    requests:
      storage: 10Gi
```

---

## Volume Lifecycle

### Delete Volume

```bash
# Delete PVC (also deletes PV and Longhorn volume if reclaimPolicy: Delete)
kubectl delete pvc my-storage
```

### Retain Volume

To keep volume after PVC deletion:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: longhorn-retain
provisioner: driver.longhorn.io
reclaimPolicy: Retain  # Keep volume data
parameters:
  numberOfReplicas: "2"
```

---

## Troubleshooting Volume Creation

### PVC Stuck in Pending

```bash
kubectl describe pvc <name>
# Check events for errors

# Common causes:
# - No storage nodes available
# - Insufficient disk space
# - StorageClass doesn't exist
```

### Volume Not Attaching

```bash
# Check volume status
kubectl -n longhorn-system get volumes.longhorn.io

# Check engine status
kubectl -n longhorn-system describe volumes.longhorn.io <volume-name>
```
