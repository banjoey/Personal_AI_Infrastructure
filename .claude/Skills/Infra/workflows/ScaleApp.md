# ScaleApp Workflow

Adjust resources for an application on Unraid.

## When to Use

- Application needs more resources
- Reducing resources to save capacity
- Troubleshooting performance issues

## Prerequisites

- Application already deployed on Unraid
- Know current resource allocation

## Workflow Steps

### Step 1: Check Current Resources

```bash
# Via Unraid MCP
mcp__unraid__get_docker_container_details("[app-name]")

# Or via SSH
ssh root@10.0.20.21 << 'EOF'
  docker stats --no-stream [app-name]
  docker inspect [app-name] | jq '.[0].HostConfig | {Memory, NanoCpus, CpuShares}'
EOF
```

**Current allocations:**
- Memory limit: [current]
- CPU shares: [current]
- CPU quota: [current]

---

### Step 2: Analyze Resource Usage

Check historical usage:

```bash
# Current usage snapshot
docker stats --no-stream [app-name]

# Check for OOM events
dmesg | grep -i "out of memory"
docker inspect [app-name] | jq '.[0].State.OOMKilled'
```

**Determine if:**
- CPU bound (high CPU, normal memory)
- Memory bound (normal CPU, high memory, OOM events)
- I/O bound (check disk wait)

---

### Step 3: Determine New Limits

**Recommendations:**

| Issue | Adjustment |
|-------|------------|
| High CPU | Increase CPU shares or quota |
| High memory | Increase memory limit |
| OOM killed | Increase memory + add swap |
| Under-utilized | Reduce limits to free resources |

**Standard allocations:**

| App Type | Memory | CPU |
|----------|--------|-----|
| Small service | 256MB-512MB | 0.5 cores |
| Medium service | 512MB-1GB | 1 core |
| Large service | 1GB-2GB | 2 cores |

---

### Step 4: Update Container

**Option A: Recreate with new limits**

Update `.gitlab-ci.yml` deploy command:

```yaml
docker run -d \
  --name [app-name] \
  --restart unless-stopped \
  --memory="1g" \
  --memory-swap="2g" \
  --cpus="1.5" \
  ...
```

Then redeploy via CI/CD.

**Option B: Update running container (temporary)**

```bash
ssh root@10.0.20.21 << 'EOF'
  # Update memory limit
  docker update --memory="1g" --memory-swap="2g" [app-name]

  # Update CPU
  docker update --cpus="1.5" [app-name]
EOF
```

Note: Option B is temporary and will be lost on next deploy. Always update the pipeline too.

---

### Step 5: Verify Changes

```bash
# Check new limits applied
docker inspect [app-name] | jq '.[0].HostConfig | {Memory, MemorySwap, NanoCpus}'

# Monitor for a few minutes
watch -n 5 'docker stats --no-stream [app-name]'

# Check logs for issues
docker logs --tail 50 [app-name]
```

---

### Step 6: Document Changes

```markdown
## Resource Scaling - [Date]

**Application:** [app-name]
**Reason:** [why scaling needed]

### Before
- Memory: 512MB
- CPU: 0.5 cores

### After
- Memory: 1GB
- CPU: 1.5 cores

### Verification
- Container running: YES
- Health check: PASS
- Performance improved: YES
```

---

## Scaling Limits (Unraid)

Check available resources:

```bash
# System resources
mcp__unraid__get_system_info

# Available memory
free -h

# CPU usage
top -bn1 | head -20
```

**Consider:**
- Don't allocate more than 80% of total RAM to containers
- Leave CPU headroom for Unraid and array operations

---

## Checklist

- [ ] Current resources documented
- [ ] Resource usage analyzed
- [ ] New limits determined
- [ ] Pipeline updated (if using Option A)
- [ ] Container updated
- [ ] Changes verified
- [ ] Documentation updated

---

**ScaleApp ensures applications have appropriate resources.**
