# PipelineDebug Workflow

Debug and fix failing CI/CD pipelines.

## When to Use

- Pipeline failed
- Build errors
- Test failures in CI
- Deployment stage failing

## Workflow Steps

### Step 1: Get Pipeline Status

```bash
# Get latest pipeline
curl -s "https://gitlab.com/api/v4/projects/[ID]/pipelines?ref=main" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq '.[0]'
```

**Output:** Pipeline ID, status, failure reason

---

### Step 2: Identify Failing Job

```bash
# Get jobs for pipeline
curl -s "https://gitlab.com/api/v4/projects/[ID]/pipelines/[PIPELINE_ID]/jobs" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq '.[] | select(.status=="failed")'
```

**Common failing stages:**
- build (Docker build fails)
- test (Tests failing)
- deploy (Deployment fails)

---

### Step 3: Get Job Logs

```bash
# Get job log
curl -s "https://gitlab.com/api/v4/projects/[ID]/jobs/[JOB_ID]/trace" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN"
```

**Parse logs for:**
- Error messages
- Stack traces
- Missing dependencies
- Permission issues

---

### Step 4: Diagnose Issue

**Common Build Failures:**

| Error | Cause | Fix |
|-------|-------|-----|
| `docker: command not found` | Missing DinD service | Add `services: [docker:24-dind]` |
| `unauthorized` | Registry auth | Add docker login step |
| `COPY failed: file not found` | Wrong path in Dockerfile | Fix COPY paths |
| `bun install failed` | Lockfile mismatch | `bun install` locally, commit lockfile |

**Common Test Failures:**

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module` | Missing dependency | Check package.json |
| `Timeout` | Slow test | Increase timeout or optimize |
| `ECONNREFUSED` | Service not running | Add service container |

**Common Deploy Failures:**

| Error | Cause | Fix |
|-------|-------|-----|
| `Permission denied (publickey)` | SSH key issue | Check UNRAID_SSH_KEY variable |
| `Host key verification failed` | Missing host key | Update UNRAID_HOST_KEY |
| `unauthorized: authentication required` | Registry auth | Add docker login in deploy |
| `Cannot connect to Docker daemon` | Docker not running | Check Unraid Docker service |

---

### Step 5: Fix the Issue

**For build issues:**
- Fix Dockerfile
- Fix dependencies
- Fix CI config

**For test issues:**
- Fix failing tests locally first
- Ensure CI environment matches local

**For deploy issues:**
- Verify CI/CD variables
- Check SSH connectivity
- Verify registry authentication

---

### Step 6: Commit Fix and Retry

```bash
git add [fixed-files]
git commit -m "fix(ci): [description of fix]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push
```

**Monitor new pipeline:**
```bash
# Watch pipeline status
watch -n 10 'curl -s "https://gitlab.com/api/v4/projects/[ID]/pipelines?ref=main" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq ".[0].status"'
```

---

### Step 7: Verify Fix

Once pipeline passes:
- All jobs green
- Deployment succeeded (if applicable)
- Application healthy

---

## Common Fixes Reference

### Docker Login in Deploy Stage

**Problem:** Deploy can't pull from private registry

**Fix:**
```yaml
deploy:
  script:
    - |
      ssh root@$UNRAID_HOST << ENDSSH
        # ADD THIS LINE
        echo "${CI_REGISTRY_PASSWORD}" | docker login -u ${CI_REGISTRY_USER} --password-stdin ${CI_REGISTRY}

        docker pull ${CI_REGISTRY_IMAGE}:latest
        # ...
      ENDSSH
```

### Heredoc Variable Expansion

**Problem:** Variables not expanding in SSH heredoc

**Fix:**
```yaml
# WRONG - quoted heredoc prevents expansion
ssh root@host << 'ENDSSH'  # <-- quotes prevent expansion
  echo $VARIABLE  # Won't work
ENDSSH

# RIGHT - unquoted heredoc allows expansion
ssh root@host << ENDSSH  # <-- no quotes
  echo $VARIABLE  # Works
ENDSSH
```

### Missing SSH Host Key

**Problem:** `Host key verification failed`

**Fix:**
1. Get the host key:
   ```bash
   ssh-keyscan -t ed25519 $UNRAID_HOST
   ```
2. Add to CI/CD variable `UNRAID_HOST_KEY`

### Runner Offline

**Problem:** Pipeline stuck in pending

**Fix:**
1. Check runner status in GitLab
2. On runner host: `docker ps | grep gitlab-runner`
3. Restart if needed: `docker restart gitlab-runner`

---

## Escalation

If pipeline issues persist after 3 fix attempts:

1. Check GitLab status page
2. Review recent GitLab/Docker updates
3. Test locally with same commands
4. Consider runner reinstallation

---

**PipelineDebug ensures CI/CD issues are resolved systematically, not bypassed.**
