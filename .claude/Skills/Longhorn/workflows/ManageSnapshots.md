# ManageSnapshots Workflow

Create, manage, and restore Longhorn snapshots and backups.

---

## Concepts

| Term | Description | Storage Location |
|------|-------------|------------------|
| **Snapshot** | Point-in-time copy | Same node as replica |
| **Backup** | Snapshot exported | External (NFS/S3) |
| **Restore** | Create volume from backup | Back to cluster |

**Snapshots** are fast but local. **Backups** are for disaster recovery.

---

## Create Snapshot

### Via kubectl

```bash
# Get volume name from PVC
kubectl get pvc my-storage -o jsonpath='{.spec.volumeName}'
# Example output: pvc-abc123...

# Create snapshot
cat <<EOF | kubectl apply -f -
apiVersion: longhorn.io/v1beta2
kind: Snapshot
metadata:
  name: my-snapshot-$(date +%Y%m%d)
  namespace: longhorn-system
spec:
  volume: pvc-abc123...  # Volume name
EOF
```

### Via Longhorn UI

1. Navigate to Volumes
2. Click on volume
3. Click "Take Snapshot"
4. Name the snapshot

### Automatic Recurring Snapshots

```yaml
apiVersion: longhorn.io/v1beta2
kind: RecurringJob
metadata:
  name: daily-snapshot
  namespace: longhorn-system
spec:
  name: daily-snapshot
  task: snapshot
  cron: "0 3 * * *"  # 3 AM daily
  retain: 7          # Keep 7 days
  concurrency: 1
  labels:
    app: database
```

Apply to volumes by label:
```yaml
# On PVC
metadata:
  labels:
    recurring-job.longhorn.io/source: enabled
    recurring-job-group.longhorn.io/default: enabled
```

---

## List Snapshots

```bash
# List all snapshots for a volume
kubectl -n longhorn-system get snapshots.longhorn.io -l longhornvolume=<volume-name>

# Via Longhorn UI
# Volume → Snapshots tab
```

---

## Delete Snapshot

```bash
kubectl -n longhorn-system delete snapshot <snapshot-name>
```

**Note**: Snapshots use copy-on-write, so deleting old snapshots may not immediately free space.

---

## Create Backup

### Prerequisites

Backup target must be configured:
```bash
# Check backup target setting
kubectl -n longhorn-system get settings backup-target

# Should show something like:
# nfs://10.0.20.15:/mnt/user/longhorn-backups
# or
# s3://bucket-name@region/
```

### Create Backup from Snapshot

```bash
cat <<EOF | kubectl apply -f -
apiVersion: longhorn.io/v1beta2
kind: Backup
metadata:
  name: my-backup-$(date +%Y%m%d)
  namespace: longhorn-system
spec:
  snapshotName: my-snapshot-20240101
EOF
```

### Via UI

1. Volume → Snapshots
2. Click snapshot → "Backup"
3. Wait for completion

### Automatic Recurring Backups

```yaml
apiVersion: longhorn.io/v1beta2
kind: RecurringJob
metadata:
  name: weekly-backup
  namespace: longhorn-system
spec:
  name: weekly-backup
  task: backup
  cron: "0 2 * * 0"  # 2 AM Sunday
  retain: 4          # Keep 4 weeks
  concurrency: 1
```

---

## List Backups

```bash
# List all backups
kubectl -n longhorn-system get backups.longhorn.io

# Get backup details
kubectl -n longhorn-system describe backup <backup-name>
```

### Via UI

Settings → Backup → View backups

---

## Restore from Backup

### Create New Volume from Backup

```bash
# Get backup URL
kubectl -n longhorn-system get backup <backup-name> -o jsonpath='{.status.url}'
# Example: s3://bucket/backups/volume-abc123/backup-xyz

# Create PVC from backup
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: restored-volume
spec:
  dataSource:
    name: <backup-name>
    kind: Backup
    apiGroup: longhorn.io
  accessModes:
    - ReadWriteOnce
  storageClassName: longhorn
  resources:
    requests:
      storage: 10Gi  # Must match or exceed backup size
EOF
```

### Via StorageClass (fromBackup)

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: longhorn-from-backup
provisioner: driver.longhorn.io
parameters:
  numberOfReplicas: "2"
  fromBackup: "s3://bucket/backups/volume-abc123/backup-xyz"
```

### Via UI

1. Backup → Select backup
2. Click "Restore"
3. Name the new volume
4. Create PVC for the restored volume

---

## Restore to Existing Volume (In-Place)

**WARNING**: This overwrites current data!

1. Scale down workload using the volume
2. Detach volume (UI or delete pod)
3. UI → Volume → Attach → Revert to snapshot

---

## Disaster Recovery Scenarios

### Scenario 1: Accidental Data Deletion

```bash
# 1. Stop the application
kubectl scale deployment myapp --replicas=0

# 2. Find recent snapshot
kubectl -n longhorn-system get snapshots.longhorn.io -l longhornvolume=<vol>

# 3. Create new PVC from snapshot
# 4. Update deployment to use new PVC
# 5. Scale back up
kubectl scale deployment myapp --replicas=1
```

### Scenario 2: Complete Cluster Loss

```bash
# 1. Install fresh k3s + Longhorn
# 2. Configure same backup target
# 3. Backups will auto-discover
# 4. Restore each backup to new volume
# 5. Recreate workloads with restored PVCs
```

### Scenario 3: Single Node Failure

With 2 replicas, Longhorn auto-heals:
1. Replica on failed node is marked degraded
2. When node returns (or new node added), replica rebuilds
3. No manual intervention needed

---

## Volume Snapshot Class (CSI Snapshots)

For Kubernetes-native VolumeSnapshots:

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotClass
metadata:
  name: longhorn-snapshot
driver: driver.longhorn.io
deletionPolicy: Delete
parameters:
  type: snap
```

### Create VolumeSnapshot

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: my-snapshot
spec:
  volumeSnapshotClassName: longhorn-snapshot
  source:
    persistentVolumeClaimName: my-storage
```

### Restore from VolumeSnapshot

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: restored-from-snapshot
spec:
  dataSource:
    name: my-snapshot
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

## Backup Target Configuration

### NFS (nas1)

```bash
kubectl -n longhorn-system patch settings backup-target \
  --type merge -p '{"value": "nfs://10.0.20.15:/mnt/user/longhorn-backups"}'
```

### S3 (Backblaze B2, MinIO, etc.)

```bash
# Create secret with credentials
kubectl -n longhorn-system create secret generic s3-backup-secret \
  --from-literal=AWS_ACCESS_KEY_ID=<key> \
  --from-literal=AWS_SECRET_ACCESS_KEY=<secret>

# Set backup target
kubectl -n longhorn-system patch settings backup-target \
  --type merge -p '{"value": "s3://bucket-name@us-west-000/"}'

kubectl -n longhorn-system patch settings backup-target-credential-secret \
  --type merge -p '{"value": "s3-backup-secret"}'
```

---

## Troubleshooting

### Snapshot Creation Failed

```bash
kubectl -n longhorn-system describe snapshot <name>
# Check events

# Common causes:
# - Volume is detached
# - Insufficient snapshot space
# - Engine error
```

### Backup Stuck

```bash
kubectl -n longhorn-system describe backup <name>

# Check backup target reachable
kubectl -n longhorn-system get settings backup-target
# Test NFS mount or S3 connectivity from pod
```

### Restore Slow

- Network bandwidth to backup target
- Large volume size
- Many small files (consider compression)
