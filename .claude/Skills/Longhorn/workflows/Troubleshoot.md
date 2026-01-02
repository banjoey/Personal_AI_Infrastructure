# Troubleshoot Workflow

Diagnose and fix common Longhorn issues.

---

## Quick Diagnostics

```bash
# Check all Longhorn pods
kubectl get pods -n longhorn-system

# Check volumes
kubectl get volumes.longhorn.io -n longhorn-system

# Check nodes
kubectl get nodes.longhorn.io -n longhorn-system

# Check PVCs
kubectl get pvc -A

# Longhorn manager logs
kubectl logs -n longhorn-system -l app=longhorn-manager --tail=100
```

---

## Symptom: PVC Stuck in Pending

### Check 1: StorageClass Exists

```bash
kubectl get storageclass longhorn
```

**If missing:** Create default StorageClass or install Longhorn correctly

### Check 2: Longhorn Nodes Available

```bash
kubectl get nodes.longhorn.io -n longhorn-system
```

**If empty or all unschedulable:**
- Check node labels: `kubectl get nodes --show-labels | grep longhorn`
- Check Longhorn manager pods running

### Check 3: Sufficient Disk Space

```bash
# Via UI or API
kubectl get nodes.longhorn.io -n longhorn-system -o yaml | grep -A 20 "diskStatus"
```

**If low:** Clean up unused volumes or add storage

### Check 4: PVC Events

```bash
kubectl describe pvc <pvc-name>
# Look at Events section
```

---

## Symptom: Volume Stuck in Attaching

### Check 1: Engine Status

```bash
kubectl -n longhorn-system get engines.longhorn.io
kubectl -n longhorn-system describe engines.longhorn.io <volume-name>
```

### Check 2: iSCSI Service

```bash
# On the node where pod is scheduled
ssh joey@<node-ip>
sudo systemctl status iscsid
```

**If not running:**
```bash
sudo systemctl enable iscsid
sudo systemctl start iscsid
```

### Check 3: Previous Pod Not Terminated

```bash
# Check for stuck terminating pods
kubectl get pods -A | grep Terminating

# Force delete if needed
kubectl delete pod <pod> -n <ns> --grace-period=0 --force
```

### Check 4: Volume Attachment

```bash
kubectl get volumeattachments | grep <volume-name>
# Delete stale attachments if needed
kubectl delete volumeattachment <name>
```

---

## Symptom: Volume Degraded

Volume has fewer replicas than expected.

### Check 1: Node Status

```bash
kubectl get nodes.longhorn.io -n longhorn-system
```

**If node down:** Wait for recovery or add new node

### Check 2: Replica Status

```bash
kubectl get replicas.longhorn.io -n longhorn-system -l longhornvolume=<vol-name>
kubectl describe replicas.longhorn.io <replica-name> -n longhorn-system
```

### Check 3: Disk Space on Nodes

```bash
# Check each Longhorn node
for node in ai1 ai2; do
  echo "=== $node ==="
  ssh joey@$node df -h /var/lib/longhorn
done
```

### Auto-Healing

Longhorn will auto-rebuild replicas when:
- Node comes back online
- New node added with space
- Disk space freed

Force rebuild:
```bash
# Delete failed replica (Longhorn will create new one)
kubectl -n longhorn-system delete replica <replica-name>
```

---

## Symptom: Volume Faulted

Critical error - volume cannot be used.

### Check 1: Engine and Replica Status

```bash
kubectl -n longhorn-system describe volume <volume-name>
# Look for error messages
```

### Check 2: Manager Logs

```bash
kubectl logs -n longhorn-system -l app=longhorn-manager | grep -i error | tail -50
```

### Common Causes and Fixes

**All replicas failed:**
- If backup exists, restore from backup
- If no backup, data may be lost

**Engine process crashed:**
```bash
# Salvage volume (UI recommended)
# Volume → Operations → Salvage
```

**Corruption detected:**
- Restore from last known good snapshot
- Or restore from backup

---

## Symptom: Slow Performance

### Check 1: Node Resources

```bash
kubectl top nodes
kubectl top pods -n longhorn-system
```

### Check 2: Network Latency

```bash
# Between storage nodes
ssh joey@ai1 ping -c 10 10.0.20.22
```

### Check 3: Disk I/O

```bash
# On storage node
ssh joey@ai1 iostat -x 5
# Look for high %util or await
```

### Check 4: Replica Count

More replicas = more synchronous writes

```bash
# Check replica count
kubectl get volumes.longhorn.io -n longhorn-system -o jsonpath='{range .items[*]}{.metadata.name}: {.spec.numberOfReplicas}{"\n"}{end}'
```

### Optimization Options

- Reduce replica count to 1 for non-critical data
- Use dedicated storage network
- Ensure NVMe SSDs (not SATA)

---

## Symptom: Backup Failed

### Check 1: Backup Target Reachable

```bash
kubectl -n longhorn-system get settings backup-target

# Test NFS mount
kubectl run nfs-test --rm -it --image=busybox -- \
  mount -t nfs 10.0.20.15:/mnt/user/longhorn-backups /mnt && ls /mnt
```

### Check 2: Credentials (for S3)

```bash
kubectl -n longhorn-system get secret backup-target-credential-secret
```

### Check 3: Backup Job Logs

```bash
kubectl -n longhorn-system get jobs | grep backup
kubectl -n longhorn-system logs job/<backup-job>
```

---

## Symptom: UI Not Loading

### Check 1: UI Pod Status

```bash
kubectl get pods -n longhorn-system -l app=longhorn-ui
kubectl describe pod -n longhorn-system -l app=longhorn-ui
```

### Check 2: UI Service

```bash
kubectl get svc -n longhorn-system longhorn-frontend
```

### Check 3: Port Forward Working

```bash
kubectl port-forward -n longhorn-system svc/longhorn-frontend 8080:80
# Try http://localhost:8080
```

---

## Symptom: CSI Driver Issues

### Check 1: CSI Pods

```bash
kubectl get pods -n longhorn-system | grep csi
```

### Check 2: CSI Driver Registered

```bash
kubectl get csidrivers
# Should show driver.longhorn.io
```

### Check 3: CSI Logs

```bash
kubectl logs -n longhorn-system -l app=longhorn-csi-plugin --tail=100
```

---

## Recovery Procedures

### Force Detach Volume

```bash
kubectl -n longhorn-system patch volumes.longhorn.io <vol-name> \
  --type merge -p '{"spec":{"nodeID":""}}'
```

### Salvage Corrupted Volume

Via UI: Volume → Operations → Salvage

This attempts to rebuild from available replica data.

### Force Delete Stuck Volume

**WARNING: Data loss!**

```bash
# Remove finalizers
kubectl -n longhorn-system patch volumes.longhorn.io <vol-name> \
  --type merge -p '{"metadata":{"finalizers":[]}}'

# Delete
kubectl -n longhorn-system delete volumes.longhorn.io <vol-name>
```

### Reset Longhorn (Nuclear Option)

```bash
# Scale down all workloads using Longhorn PVCs
# Delete all PVCs
kubectl delete pvc --all -A

# Uninstall Longhorn
helm uninstall longhorn -n longhorn-system

# Clean node data
for node in ai1 ai2; do
  ssh joey@$node sudo rm -rf /var/lib/longhorn
done

# Reinstall
helm install longhorn longhorn/longhorn -n longhorn-system -f values.yaml
```

---

## Collect Diagnostics

```bash
# Create support bundle
kubectl -n longhorn-system create job support-bundle \
  --image=longhornio/support-bundle-kit:v0.0.25 \
  -- /bin/sh -c "support-bundle-kit collect"

# Or use Longhorn UI: Help → Generate Support Bundle
```
