---
name: Deployment
description: Enforces CI/CD-first deployment with zero tolerance for manual shortcuts. USE WHEN user wants to deploy, push to production, release, mentions deployment, OR says "just get it running". Delegates to GitLab and Infra skills.
---

# Deployment

Enforces CI/CD-first deployment practices. This skill ensures all deployments go through proper pipelines - never manual SSH, never "just get it working."

## Core Principle

```
┌─────────────────────────────────────────────────────────────────┐
│                     CI/CD IS NON-NEGOTIABLE                      │
│                                                                  │
│   "If the pipeline doesn't work, we failed.                     │
│    Fix the pipeline, never bypass it."                          │
│                                                                  │
│   Manual SSH deployment = BLOCKED                               │
│   Manual docker run on server = BLOCKED                         │
│   "Just get it working" = BLOCKED                               │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow Routing

| Workflow | When to Use | Delegates To |
|----------|-------------|--------------|
| Deploy | Standard deployment | GitLab, Infra |
| PipelineCreate | New project needs CI/CD | GitLab |
| PipelineDebug | Pipeline failing | GitLab |
| Rollback | Revert bad deployment | GitLab, Infra |

## Guardrails (ENFORCEMENT)

These are non-negotiable. Deployment BLOCKS until requirements are met:

| Check | Requirement | Blocking |
|-------|-------------|----------|
| Pipeline Exists | .gitlab-ci.yml or equivalent | YES |
| Code Pushed | Changes in remote repo | YES |
| Pipeline Passes | Build + tests green | YES |
| Secrets in Vault | No hardcoded secrets | YES |
| Image in Registry | Container image pushed | YES |

## Examples

### Example 1: Standard Deployment
```
User: "Deploy this to Unraid"

Deployment skill activates:
1. Check: Pipeline exists? YES
2. Check: Code pushed? NO
   → "Push your changes first: git push"
3. Check: Pipeline passes? Running...
   → Wait for pipeline completion
4. Check: Pipeline passes? YES
5. Trigger deployment stage (manual)
6. Verify deployment succeeded
```

### Example 2: Attempting Manual Deployment
```
User: "Just SSH in and restart the container"

Deployment skill responds:
"I understand the urgency, but direct SSH bypasses our deployment
standards and creates drift between code and production.

Let me check the pipeline instead..."

→ Checks GitLab pipeline status
→ Identifies issue
→ "The issue is [X]. Let me fix the pipeline and redeploy through CI/CD."
```

### Example 3: No Pipeline Exists
```
User: "Deploy this new service"

Deployment skill activates:
1. Check: Pipeline exists? NO
   → "This project needs a CI/CD pipeline first."
   → Invoke Deployment/PipelineCreate workflow
2. Create .gitlab-ci.yml
3. Push pipeline config
4. Continue with deployment
```

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER: "Deploy this"                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                CHECK: PIPELINE EXISTS?                           │
│                                                                  │
│   NO → "Create pipeline first"                                  │
│        → PipelineCreate workflow                                │
│        → BLOCK until pipeline exists                            │
│                                                                  │
│   YES → Continue                                                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               CHECK: CODE PUSHED TO REMOTE?                      │
│                                                                  │
│   NO → "Push your changes: git push origin [branch]"            │
│        → BLOCK until pushed                                     │
│                                                                  │
│   YES → Continue                                                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               CHECK: PIPELINE PASSING?                           │
│                                                                  │
│   RUNNING → Wait for completion                                 │
│   FAILED → "Pipeline failed. Let me debug..."                   │
│            → PipelineDebug workflow                             │
│            → BLOCK until pipeline green                         │
│                                                                  │
│   PASSED → Continue                                              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               CHECK: SECRETS CONFIGURED?                         │
│                                                                  │
│   NO → Invoke Secrets skill                                     │
│        → Configure CI/CD variables                              │
│        → BLOCK until secrets ready                              │
│                                                                  │
│   YES → Continue                                                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  TRIGGER DEPLOYMENT                              │
│                                                                  │
│   - Via GitLab API (if manual trigger)                          │
│   - Or automatic on pipeline completion                         │
│   - NEVER via direct SSH                                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  VERIFY DEPLOYMENT                               │
│                                                                  │
│   - Check container running                                     │
│   - Health check endpoint responds                              │
│   - Logs show successful startup                                │
└─────────────────────────────────────────────────────────────────┘
```

## Pipeline Standards

All pipelines MUST include:

```yaml
stages:
  - build
  - test      # MANDATORY
  - deploy

build:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest

test:
  stage: test
  script:
    - bun test
  coverage: '/Coverage: \d+\.\d+%/'

deploy:
  stage: deploy
  when: manual  # Or automatic for staging
  script:
    # ALWAYS authenticate to registry first
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    # Then deploy
    - ssh ... docker pull ... docker run ...
```

## Bypass Protocol

In genuine emergencies (production down, security incident):

1. **Explicit acknowledgment required:**
   User must say: "I understand the risks and want to bypass CI/CD for emergency deployment."

2. **Logged and tracked:**
   Bypass is logged with timestamp, reason, and what was deployed

3. **Immediate remediation required:**
   ```
   MANDATORY FOLLOW-UP:
   - [ ] Push the fix to git within 1 hour
   - [ ] Pipeline must pass within 4 hours
   - [ ] Document incident and bypass reason
   ```

Example:
```
User: "Production is down, just fix it NOW"

Deployment: "I understand this is urgent. Emergency bypass available.

To proceed with manual deployment, confirm:
'I understand the risks and want to bypass CI/CD for emergency deployment.'

IMPORTANT: We must push these changes to git and run the pipeline
within 1 hour to maintain code-production parity."
```

## Integration with Other Skills

| Skill | How Deployment Uses It |
|-------|------------------------|
| GitLab | Pipeline creation, triggers, status |
| Infra | Environment-specific deployment |
| Secrets | CI/CD variable management |
| Development | Receives handoff when ready |

## Environment Detection

Deployment uses branch and config to determine target:

| Branch | Environment | Deployment Mode |
|--------|-------------|-----------------|
| main | production | Manual trigger |
| develop | staging | Automatic |
| feature/* | preview | Automatic (optional) |

---

**Deployment ensures every release is traceable, reproducible, and reversible.**
