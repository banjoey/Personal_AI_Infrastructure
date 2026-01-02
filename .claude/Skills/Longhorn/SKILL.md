---
name: Longhorn
description: Distributed block storage for Kubernetes. USE WHEN user mentions Longhorn, persistent storage, PVC, volumes, storage class, snapshots, backups, OR needs container storage. Runs on ai1+ai2 nodes only.
---

# Longhorn

Distributed block storage skill for k3s cluster. Provides replicated persistent volumes, snapshots, and backups.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Longhorn
```

| Workflow | Trigger | File |
|----------|---------|------|
| **Install** | "install longhorn", "set up storage" | `workflows/Install.md` |
| **CreateVolume** | "create volume", "add storage", "PVC" | `workflows/CreateVolume.md` |
| **ManageSnapshots** | "snapshot", "backup", "restore" | `workflows/ManageSnapshots.md` |
| **Troubleshoot** | "storage issues", "volume stuck", "PVC pending" | `workflows/Troubleshoot.md` |

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                    Longhorn Storage Cluster                        │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────┐              ┌─────────────────┐             │
│  │      ai1        │              │      ai2        │             │
│  │   10.0.20.21    │              │   10.0.20.22    │             │
│  ├─────────────────┤              ├─────────────────┤             │
│  │ Longhorn Node   │◄────────────►│ Longhorn Node   │             │
│  │ • Manager       │   Replicate  │ • Manager       │             │
│  │ • Driver        │              │ • Driver        │             │
│  │ • Instance Mgr  │              │ • Instance Mgr  │             │
│  ├─────────────────┤              ├─────────────────┤             │
│  │ Local Storage:  │              │ Local Storage:  │             │
│  │ /var/lib/       │              │ /var/lib/       │             │
│  │  longhorn/      │              │  longhorn/      │             │
│  │ (2TB NVMe)      │              │ (2TB NVMe)      │             │
│  └─────────────────┘              └─────────────────┘             │
│                                                                    │
│  ┌─────────────────┐                                              │
│  │      nas1       │  ← NOT part of Longhorn                      │
│  │   10.0.20.15    │  ← Control plane only (no storage)          │
│  │   (Unraid NAS)  │  ← NFS for bulk storage (recordings, etc.)  │
│  └─────────────────┘                                              │
│                                                                    │
│  StorageClass: longhorn (default)                                 │
│  Replicas: 2 (one on each node)                                   │
│  Network: 2.5Gbps between nodes                                   │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

## Storage Strategy

| Storage Type | Technology | Use Case | Location |
|--------------|------------|----------|----------|
| **Fast/Replicated** | Longhorn | App data, databases, configs | ai1+ai2 SSDs |
| **Bulk** | NFS | Recordings, media, large files | nas1 |

### Why This Split?

- Longhorn provides fast, replicated storage for critical app data
- NFS on nas1 handles large files that don't need replication speed
- nas1 isn't suitable for Longhorn (spinning disks, different workload)

## Starting with 1 Node (Scaling Later)

**Longhorn works fine on a single node.** You can start with 1 node and add more later.

### Single-Node Configuration

```yaml
# StorageClass for 1-node (no replication)
parameters:
  numberOfReplicas: "1"
```

### When Second Node Joins

1. Label the new node for Longhorn:
   ```bash
   kubectl label node ai1 longhorn=true
   ```

2. Update StorageClass to 2 replicas:
   ```bash
   kubectl patch storageclass longhorn -p \
     '{"parameters":{"numberOfReplicas":"2"}}'
   ```

3. Existing volumes stay at 1 replica. To add replica to existing volume:
   - Go to Longhorn UI → Volume → Update Replica Count
   - Or use kubectl to patch the volume

4. Longhorn auto-rebalances replicas across nodes

### Migration Path

| Phase | Nodes | Replica Count | Fault Tolerance |
|-------|-------|---------------|-----------------|
| Initial | ai2 only | 1 | None (local only) |
| After ai1 joins | ai1 + ai2 | 2 | Survives 1 node failure |

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Volume** | Block storage device attached to pods |
| **Replica** | Copy of volume data on different nodes |
| **Engine** | iSCSI target that serves volume to pods |
| **StorageClass** | Template for volume provisioning |
| **Snapshot** | Point-in-time copy of volume |
| **Backup** | Snapshot exported to external storage (S3/NFS) |

## Examples

### Example 1: Create persistent volume for app

```
User: "Add storage to my PostgreSQL deployment"

Longhorn skill activates:
1. Create PersistentVolumeClaim
2. Reference longhorn StorageClass
3. Apply to cluster
4. Update deployment to mount PVC
```

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: longhorn
  resources:
    requests:
      storage: 10Gi
```

### Example 2: Take snapshot before upgrade

```
User: "Backup the database before upgrading"

Longhorn skill activates:
1. Identify volume attached to postgres pod
2. Create snapshot via Longhorn API
3. Verify snapshot complete
```

### Example 3: Restore from snapshot

```
User: "Restore database to yesterday's snapshot"

Longhorn skill activates:
1. List available snapshots
2. Create new volume from snapshot
3. Update deployment to use new volume
```

## Quick Reference

### StorageClass

Default Longhorn StorageClass:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: longhorn
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: driver.longhorn.io
allowVolumeExpansion: true
reclaimPolicy: Delete
volumeBindingMode: Immediate
parameters:
  numberOfReplicas: "2"
  staleReplicaTimeout: "2880"
  fromBackup: ""
  fsType: "ext4"
```

### PVC Template

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-storage
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce  # RWO - single pod
  storageClassName: longhorn
  resources:
    requests:
      storage: 5Gi
```

### Volume in Pod

```yaml
spec:
  containers:
    - name: app
      volumeMounts:
        - name: data
          mountPath: /data
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: my-storage
```

## UI Access

Longhorn provides a web UI for management:

```bash
# Port forward to access UI
kubectl port-forward -n longhorn-system svc/longhorn-frontend 8080:80
# Open http://localhost:8080
```

For persistent access, expose via Traefik IngressRoute with auth.

## Node Labels

Longhorn only runs on nodes with the `longhorn` label:

```bash
# Label nodes for Longhorn storage
kubectl label node ai1 longhorn=true
kubectl label node ai2 longhorn=true

# Verify
kubectl get nodes --show-labels | grep longhorn
```

## Capacity Planning

| Node | Disk | Usable* | Notes |
|------|------|---------|-------|
| ai1 | 2TB NVMe | ~1.8TB | After system overhead |
| ai2 | 2TB NVMe | ~1.8TB | After system overhead |

*With 2 replicas, effective storage = ~1.8TB total (not 3.6TB)

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| **k3s** | Longhorn runs as workload on k3s |
| **Helm** | Longhorn installed via Helm chart |
| **Traefik** | Exposes Longhorn UI via IngressRoute |
| **ArgoCD** | Longhorn managed via GitOps |
| **Infra** | Provides persistent storage for apps |

## Backup Strategy

Longhorn supports external backups to:
- NFS server (nas1)
- S3-compatible storage (MinIO, B2, etc.)

```bash
# Configure backup target (UI or Settings CR)
kubectl -n longhorn-system edit settings backup-target

# Set to NFS: nfs://10.0.20.15:/backups/longhorn
# Set to S3: s3://bucket-name@region/
```

## Performance Notes

- NVMe SSDs provide excellent IOPS
- 2.5Gbps network supports high throughput replication
- 2 replicas = synchronous write to both nodes
- Snapshots are instant (copy-on-write)

## Security Notes

- Longhorn data is not encrypted at rest by default
- Enable encryption via StorageClass for sensitive data
- Backup to encrypted S3 bucket for off-site protection
- UI should always be behind authentication

---

**Longhorn skill provides fast, replicated persistent storage for k3s workloads.**
