# Deploy Workflow

Standard deployment through CI/CD pipeline with verification.

## When to Use

- Deploying to any environment
- Releasing new version
- Pushing updates to production

## Prerequisites

- Pipeline exists (.gitlab-ci.yml or equivalent)
- Code pushed to remote
- Pipeline passing
- Secrets configured

## Workflow Steps

### Step 1: Verify Pipeline Exists

```bash
# Check for pipeline config
ls .gitlab-ci.yml 2>/dev/null || ls .github/workflows/*.yml 2>/dev/null
```

**If no pipeline:**
```
BLOCKED: No CI/CD pipeline found.

To proceed, we need to create a pipeline first.
→ Invoke PipelineCreate workflow
```

---

### Step 2: Verify Code Pushed

```bash
# Check if local is ahead of remote
git status
# Look for "Your branch is ahead of..."
```

**If not pushed:**
```
Changes not pushed to remote.

Action: git push origin [branch]

Waiting for push before proceeding...
```

---

### Step 3: Check Pipeline Status

**Delegate to:** GitLab skill

```bash
# Via GitLab API
curl -s "https://gitlab.com/api/v4/projects/[ID]/pipelines?ref=[branch]" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq '.[0]'
```

**Status responses:**

| Status | Action |
|--------|--------|
| running | Wait for completion (poll every 30s) |
| success | Continue to deployment |
| failed | Invoke PipelineDebug workflow |
| pending | Wait for start |

**BLOCK until:** Pipeline status is "success"

---

### Step 4: Verify Secrets

Check CI/CD variables are configured:

```bash
# List project variables (names only)
curl -s "https://gitlab.com/api/v4/projects/[ID]/variables" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq '.[].key'
```

**Required variables (example):**
- UNRAID_HOST
- UNRAID_SSH_KEY
- UNRAID_HOST_KEY
- DISCORD_WEBHOOK_URL (if applicable)

**If missing:**
```
Missing CI/CD variables: DISCORD_WEBHOOK_URL

→ Invoke Secrets skill to configure
```

---

### Step 5: Trigger Deployment

**If manual deployment stage:**
```bash
# Get latest pipeline ID
PIPELINE_ID=$(curl -s "https://gitlab.com/api/v4/projects/[ID]/pipelines?ref=main" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq '.[0].id')

# Get manual job ID
JOB_ID=$(curl -s "https://gitlab.com/api/v4/projects/[ID]/pipelines/$PIPELINE_ID/jobs" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq '.[] | select(.name=="deploy:unraid") | .id')

# Trigger manual job
curl -X POST "https://gitlab.com/api/v4/projects/[ID]/jobs/$JOB_ID/play" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN"
```

**Wait for deployment to complete.**

---

### Step 6: Verify Deployment

After deployment job completes, verify:

**Via Infra skill (Unraid MCP):**
```
Check: Container running?
Check: Health endpoint responding?
Check: Logs show successful startup?
```

**Example verification:**
```bash
# Check container status (via MCP or SSH)
docker ps | grep [container-name]

# Check health endpoint
curl -f http://[host]:[port]/health

# Check recent logs
docker logs --tail 50 [container-name]
```

---

### Step 7: Report Status

```markdown
## Deployment Complete

**Project:** [name]
**Version:** [commit SHA]
**Environment:** [production/staging]
**Time:** [timestamp]

### Verification
- Container running: YES
- Health check: PASS
- Logs: No errors

### Details
- Pipeline: #[ID] (passed)
- Job: deploy:unraid #[job-id]
- Duration: [X seconds]

Deployment successful.
```

---

## Deployment Checklist

- [ ] Pipeline exists
- [ ] Code pushed to remote
- [ ] Pipeline passing (build + test)
- [ ] Secrets configured in CI/CD
- [ ] Deployment triggered via CI/CD
- [ ] Container running
- [ ] Health check passing
- [ ] Logs show success

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Pipeline stuck | Runner offline | Check GitLab Runner status |
| Deploy fails | Auth error | Verify SSH key, host key |
| Container not starting | Config issue | Check docker logs |
| Health check fails | App error | Review application logs |

---

**Deploy workflow ensures traceable, reproducible deployments.**
