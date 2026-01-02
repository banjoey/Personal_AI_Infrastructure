# Rollback Workflow

Safely rollback a bad deployment to the previous working version.

## When to Use

- Deployment caused issues
- Application not working after update
- Need to revert to previous version
- Emergency recovery

## Prerequisites

- Previous working version exists in registry
- Container tags include SHA for versioning

## Workflow Steps

### Step 1: Assess the Situation

**Questions:**
1. What is broken? (specific symptoms)
2. When did it break? (after which deployment)
3. What was the last working version?
4. Is this urgent? (production down vs. minor issue)

**Gather info:**
```bash
# Check current running version
docker inspect [container] | jq '.[0].Config.Image'

# Check recent deployments (GitLab)
curl -s "https://gitlab.com/api/v4/projects/[ID]/deployments?order_by=created_at" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq '.[0:5]'
```

---

### Step 2: Identify Rollback Target

**Find the last known good version:**

```bash
# List recent pipeline runs
curl -s "https://gitlab.com/api/v4/projects/[ID]/pipelines?status=success" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq '.[0:10] | .[] | {id, sha, created_at}'
```

**Or check registry tags:**
```bash
# List available image tags
curl -s "https://registry.gitlab.com/v2/[namespace]/[project]/tags/list"
```

**Select target:** `$CI_REGISTRY_IMAGE:[SHA]`

---

### Step 3: Execute Rollback via CI/CD

**Option A: Re-run Previous Deploy Job**

```bash
# Find successful deploy job from target pipeline
JOB_ID=$(curl -s "https://gitlab.com/api/v4/projects/[ID]/pipelines/[TARGET_PIPELINE]/jobs" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq '.[] | select(.name=="deploy:unraid" and .status=="success") | .id')

# Retry the job (redeploys that version)
curl -X POST "https://gitlab.com/api/v4/projects/[ID]/jobs/$JOB_ID/retry" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN"
```

**Option B: Manual Rollback Script**

If you need to rollback without a pipeline job:

```bash
ssh root@$UNRAID_HOST << ENDSSH
  # Login to registry
  echo "$CI_REGISTRY_PASSWORD" | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY

  # Stop current container
  docker stop [APP_NAME] || true
  docker rm [APP_NAME] || true

  # Deploy previous version (specific SHA)
  docker run -d \
    --name [APP_NAME] \
    --restart unless-stopped \
    -p [PORT]:[PORT] \
    -v /mnt/user/appdata/[APP_NAME]/config:/app/config:ro \
    -v /mnt/user/appdata/[APP_NAME]/data:/app/data \
    -e TZ=America/New_York \
    ${CI_REGISTRY_IMAGE}:[ROLLBACK_SHA]

  docker ps | grep [APP_NAME]
ENDSSH
```

**Note:** Even in rollback, use CI/CD when possible. Manual rollback should only be used in true emergencies.

---

### Step 4: Verify Rollback

After rollback completes:

```bash
# Check container is running
docker ps | grep [APP_NAME]

# Verify correct version
docker inspect [APP_NAME] | jq '.[0].Config.Image'

# Check health endpoint
curl -f http://[HOST]:[PORT]/health

# Check logs for errors
docker logs --tail 50 [APP_NAME]
```

---

### Step 5: Document and Follow Up

**Create incident record:**

```markdown
## Rollback Report

**Date:** [timestamp]
**Service:** [APP_NAME]
**Rolled back from:** [bad-sha]
**Rolled back to:** [good-sha]
**Reason:** [what broke]
**Duration:** [time from detection to resolution]

### Timeline
- [time] Issue detected: [symptoms]
- [time] Decision to rollback
- [time] Rollback executed
- [time] Service restored

### Root Cause
[What caused the bad deployment]

### Action Items
- [ ] Fix the issue in code
- [ ] Add tests to prevent recurrence
- [ ] Re-deploy fixed version
```

**Follow-up tasks:**
1. Investigate root cause
2. Fix the issue properly
3. Add tests to catch this in CI
4. Re-deploy when ready

---

## Emergency Rollback

For critical production issues:

1. **Don't wait** - Start rollback immediately
2. **Communicate** - Alert stakeholders
3. **Document later** - Get service up first
4. **Post-mortem** - Review after resolution

```
EMERGENCY ROLLBACK AUTHORIZED

Reason: [brief description]
Action: Rolling back to [SHA]
ETA: 5 minutes

Will provide update when complete.
```

---

## Prevention

To reduce need for rollbacks:

1. **Staging environment** - Test before production
2. **Canary deployments** - Gradual rollout
3. **Health checks** - Automatic rollback on failure
4. **Feature flags** - Disable features without rollback

---

**Rollback is the safety net. Always have a working previous version tagged.**
