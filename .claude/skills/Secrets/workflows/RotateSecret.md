# RotateSecret Workflow

Safely rotate a secret without service disruption.

## When to Use

- Regular security rotation (recommended: 90 days)
- Secret may have been exposed
- Employee departure
- Security audit requirement

## Prerequisites

- Know which secret to rotate
- Access to generate new value (or source system)
- Ability to update vault and CI/CD

## Workflow Steps

### Step 1: Plan the Rotation

**Questions:**
1. Which secret is being rotated?
2. Why? (scheduled, exposure, audit)
3. Can the service handle brief downtime?
4. Do multiple services use this secret?

**Risk assessment:**

| Scenario | Risk | Approach |
|----------|------|----------|
| Database password | High - service disruption | Blue-green if possible |
| API key | Medium - brief auth failures | Quick swap |
| Webhook URL | Low - notifications delayed | Standard |

---

### Step 2: Generate New Secret

**For passwords:**
```bash
# Generate secure password (32 chars)
openssl rand -base64 32 | tr -d '/+=' | head -c 32
```

**For API keys:**
- Generate from source system (Stripe dashboard, AWS IAM, etc.)
- Don't delete old key yet

**For tokens:**
- Request new token from provider
- Note expiration if applicable

---

### Step 3: Update Source System (if applicable)

If rotating a password for an external system:

```bash
# Example: Database password
# 1. Update in database server
psql -c "ALTER USER app_user PASSWORD 'new_password';"

# 2. Or for cloud services, use their API
aws iam update-login-profile --user-name deploy --password "$NEW_PASSWORD"
```

---

### Step 4: Update Vault

**Bitwarden:**
```bash
# Get item ID
ITEM_ID=$(bw get item "[Item Name]" | jq -r '.id')

# Update the item
bw edit item $ITEM_ID "$(bw get item $ITEM_ID | jq '.notes = "NEW_SECRET_VALUE"')"

# Sync
bw sync
```

**Add rotation note:**
```
Previous value rotated on [date]
Reason: [scheduled/exposure/audit]
```

---

### Step 5: Update CI/CD Variable

**GitLab:**
```bash
# Update existing variable
curl -X PUT "https://gitlab.com/api/v4/projects/$PROJECT_ID/variables/VARIABLE_NAME" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  -F "value=$NEW_SECRET_VALUE" \
  -F "protected=true" \
  -F "masked=true"
```

**GitHub:**
```bash
gh secret set VARIABLE_NAME --body "$NEW_SECRET_VALUE"
```

---

### Step 6: Trigger Redeployment

The application needs to pick up the new secret:

**Option A: Trigger deployment via CI/CD**
```bash
# Trigger manual deploy job
curl -X POST "https://gitlab.com/api/v4/projects/$PROJECT_ID/jobs/$DEPLOY_JOB_ID/play" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN"
```

**Option B: Restart container (if env vars are dynamic)**
```bash
# Via Unraid MCP or SSH
docker restart [container-name]
```

---

### Step 7: Verify Service Health

After redeployment:

```bash
# Check container is running
docker ps | grep [container-name]

# Check health endpoint
curl -f http://[host]:[port]/health

# Check logs for auth errors
docker logs --tail 100 [container-name] | grep -i "auth\|error\|fail"
```

---

### Step 8: Revoke Old Secret (if applicable)

Once new secret is confirmed working:

**For API keys with both old/new:**
```bash
# Delete old key from provider
# (Stripe, AWS, etc. dashboard or API)
```

**For database passwords:**
- Old password is already invalid after Step 3

---

### Step 9: Update Audit Log

Document the rotation:

```markdown
## Secret Rotation - [Date]

**Secret:** VARIABLE_NAME
**Reason:** [Scheduled rotation / Potential exposure / Security audit]
**Old value hash:** [first 8 chars of sha256]
**New value hash:** [first 8 chars of sha256]
**Services affected:** [list]
**Downtime:** [none / X seconds]
**Verified working:** YES
```

---

## Emergency Rotation (Exposure)

If a secret may have been exposed:

1. **IMMEDIATE:** Generate and deploy new secret
2. **THEN:** Investigate exposure
3. **THEN:** Revoke old secret
4. **THEN:** Audit for unauthorized use

```
EMERGENCY ROTATION

Secret [NAME] may have been exposed.
Rotating immediately.

Timeline:
- [time] Exposure suspected
- [time] New secret generated
- [time] CI/CD updated
- [time] Service redeployed
- [time] Old secret revoked
- [time] Audit initiated
```

---

## Rotation Schedule

| Secret Type | Recommended | Maximum |
|-------------|-------------|---------|
| Database passwords | 90 days | 180 days |
| API keys | 90 days | 365 days |
| SSH keys | 365 days | 2 years |
| OAuth tokens | Per expiration | N/A |

---

## Checklist

- [ ] New secret generated
- [ ] Source system updated (if applicable)
- [ ] Vault updated
- [ ] CI/CD variable updated
- [ ] Service redeployed
- [ ] Health verified
- [ ] Old secret revoked
- [ ] Audit log updated

---

**RotateSecret ensures credentials stay fresh without service disruption.**
