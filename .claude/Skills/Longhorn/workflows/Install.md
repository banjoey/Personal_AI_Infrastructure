# Install Workflow

Installs Longhorn distributed storage on the k3s cluster.

## Prerequisites

- [ ] k3s cluster running with at least one worker node
- [ ] Helm installed
- [ ] `open-iscsi` installed on worker nodes
- [ ] Nodes labeled with `longhorn=true`

---

## Step 1: Prepare Worker Nodes

Longhorn requires `open-iscsi` for iSCSI target support.

### On ai1 and ai2 (Ubuntu-based):

```bash
ssh joey@10.0.20.21  # and 10.0.20.22

# Install open-iscsi
sudo apt update
sudo apt install -y open-iscsi

# Enable and start iscsid
sudo systemctl enable iscsid
sudo systemctl start iscsid

# Verify
sudo systemctl status iscsid
```

### Label Nodes for Longhorn

```bash
# Label nodes that will provide storage
kubectl label node ai1 longhorn=true
kubectl label node ai2 longhorn=true

# Do NOT label nas1 - it's control-plane-only
```

---

## Step 2: Add Longhorn Helm Repository

```bash
helm repo add longhorn https://charts.longhorn.io
helm repo update
```

---

## Step 3: Create Namespace

```bash
kubectl create namespace longhorn-system
```

---

## Step 4: Create Values File

```yaml
# longhorn-values.yaml

# Default settings
defaultSettings:
  # Only schedule on nodes with longhorn=true label
  systemManagedComponentsNodeSelector: "longhorn:true"

  # Default replica count (2 for our 2-node setup)
  defaultReplicaCount: 2

  # Backup target (NFS on nas1)
  backupTarget: "nfs://10.0.20.15:/backups/longhorn"

  # Replica auto-balance
  replicaAutoBalance: "best-effort"

  # Storage reserved for system (prevent overfilling)
  storageReservedPercentageForDefaultDisk: 15

  # Guaranteed engine manager CPU (prevents OOM)
  guaranteedEngineManagerCPU: 15
  guaranteedReplicaManagerCPU: 15

# Only run Longhorn components on storage nodes
longhornManager:
  nodeSelector:
    longhorn: "true"

longhornDriver:
  nodeSelector:
    longhorn: "true"

# UI settings
longhornUI:
  replicas: 1
  nodeSelector:
    longhorn: "true"

# CSI driver settings
csi:
  attacherReplicaCount: 1
  provisionerReplicaCount: 1
  resizerReplicaCount: 1
  snapshotterReplicaCount: 1

# Default StorageClass
persistence:
  defaultClass: true
  defaultFsType: ext4
  defaultClassReplicaCount: 2
  reclaimPolicy: Delete

# Resource limits
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi
```

---

## Step 5: Install Longhorn

```bash
helm install longhorn longhorn/longhorn \
  --namespace longhorn-system \
  --values longhorn-values.yaml \
  --wait
```

This takes a few minutes as Longhorn deploys:
- Manager pods on each storage node
- Driver pods
- CSI components
- UI

---

## Step 6: Verify Installation

```bash
# Check all pods running
kubectl get pods -n longhorn-system

# Expected pods:
# - longhorn-manager-xxx (one per storage node)
# - longhorn-driver-deployer-xxx
# - longhorn-ui-xxx
# - longhorn-csi-attacher-xxx
# - longhorn-csi-provisioner-xxx
# - engine-image-xxx
# - instance-manager-xxx

# Check nodes recognized
kubectl -n longhorn-system get nodes.longhorn.io

# Check default StorageClass
kubectl get storageclass
# Should show 'longhorn' with (default)
```

---

## Step 7: Access UI

```bash
# Port forward to access UI
kubectl port-forward -n longhorn-system svc/longhorn-frontend 8080:80

# Open http://localhost:8080
```

In UI, verify:
- Both ai1 and ai2 nodes visible
- Storage capacity shown correctly
- No errors in dashboard

---

## Step 8: Test Storage

```bash
# Create test PVC
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: longhorn-test
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: longhorn
  resources:
    requests:
      storage: 1Gi
EOF

# Check PVC bound
kubectl get pvc longhorn-test

# Create test pod
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: volume-test
  namespace: default
spec:
  containers:
    - name: test
      image: busybox
      command: ["sh", "-c", "echo 'Longhorn works!' > /data/test.txt && cat /data/test.txt && sleep 3600"]
      volumeMounts:
        - name: data
          mountPath: /data
  volumes:
    - name: data
      persistentVolumeClaim:
        claimName: longhorn-test
EOF

# Check pod running and data written
kubectl logs volume-test
# Should output: Longhorn works!

# Cleanup
kubectl delete pod volume-test
kubectl delete pvc longhorn-test
```

---

## Step 9: Configure Backup Target (Optional)

### NFS Backup to nas1

First, create NFS share on nas1:
1. Unraid UI → Shares → Add Share: `longhorn-backups`
2. Enable NFS export

Then configure Longhorn:

```bash
# Via kubectl
kubectl -n longhorn-system edit settings backup-target
# Set value to: nfs://10.0.20.15:/mnt/user/longhorn-backups

# Or via UI
# Settings → General → Backup Target
# nfs://10.0.20.15:/mnt/user/longhorn-backups
```

---

## Step 10: Expose UI via Traefik (Optional)

```yaml
# longhorn-ingress.yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: longhorn-auth
  namespace: longhorn-system
spec:
  basicAuth:
    secret: longhorn-auth-secret
---
apiVersion: v1
kind: Secret
metadata:
  name: longhorn-auth-secret
  namespace: longhorn-system
type: Opaque
data:
  users: <base64-encoded-htpasswd>
---
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: longhorn-ui
  namespace: longhorn-system
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`longhorn.barkleyfarm.com`)
      kind: Rule
      services:
        - name: longhorn-frontend
          port: 80
      middlewares:
        - name: longhorn-auth
  tls:
    certResolver: letsencrypt
```

---

## Post-Install Configuration

### Adjust Replica Count for Single Node (Phase 0)

If starting with only ai2:

```bash
# Temporarily set default replicas to 1
kubectl -n longhorn-system edit settings default-replica-count
# Set value to "1"

# After ai1 joins, set back to 2
```

### Reserve Space for System

Already configured in values, but verify:

```bash
kubectl -n longhorn-system get settings storage-reserved-percentage-for-default-disk
# Should be 15 (meaning 15% reserved)
```

---

## Upgrade Longhorn

```bash
helm repo update
helm upgrade longhorn longhorn/longhorn \
  --namespace longhorn-system \
  --values longhorn-values.yaml
```

---

## Uninstall Longhorn

**WARNING: This deletes ALL persistent data!**

```bash
# Delete all PVCs first
kubectl delete pvc --all -A

# Uninstall
helm uninstall longhorn -n longhorn-system

# Delete namespace
kubectl delete namespace longhorn-system

# Clean up CRDs
kubectl delete crd engines.longhorn.io nodes.longhorn.io ...
```
