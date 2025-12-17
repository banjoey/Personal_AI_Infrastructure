# AddSecret Workflow

Add a new secret securely to vault and CI/CD configuration.

## When to Use

- New API key or token needed
- Setting up database credentials
- Adding webhook URLs
- Any new credential requirement

## Workflow Steps

### Step 1: Gather Secret Information

**Questions:**
1. What is the secret for? (purpose)
2. What will the variable name be?
3. What is the secret value? (or should we generate one?)
4. Which project(s) need access?
5. Is this for production, staging, or both?

**Naming conventions:**
```
[SERVICE]_[TYPE]

Examples:
- DISCORD_WEBHOOK_URL
- DATABASE_PASSWORD
- STRIPE_API_KEY
- AWS_ACCESS_KEY_ID
- OPENAI_API_KEY
```

---

### Step 2: Validate Secret Format

Check that the secret looks valid for its type:

| Type | Validation |
|------|------------|
| API Key | Usually 32+ characters |
| Webhook URL | Valid URL format |
| Password | Meets complexity requirements |
| Token | Matches expected pattern |

```typescript
// Example validations
const validators = {
  discord_webhook: /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/,
  stripe_key: /^sk_(test|live)_[\w]{24,}$/,
  openai_key: /^sk-[\w]{48}$/,
};
```

---

### Step 3: Store in Vault (Bitwarden)

**For Home environment (joey-all):**

```bash
# Ensure logged in
bw unlock

# Create secure note in Projects folder
bw create item "$(cat << EOF
{
  "type": 2,
  "secureNote": {"type": 0},
  "name": "[Project] - [Description]",
  "notes": "[SECRET_VALUE]",
  "folderId": "[projects-folder-id]",
  "fields": [
    {"name": "Variable", "value": "VARIABLE_NAME", "type": 0},
    {"name": "Project", "value": "[project-name]", "type": 0},
    {"name": "Created", "value": "$(date -Iseconds)", "type": 0}
  ]
}
EOF
)"

# Sync to server
bw sync
```

**For Work environment (merlin-all):**
- Use CyberArk web UI or API
- Follow company's secret management policy

---

### Step 4: Configure CI/CD Variable

**GitLab:**

```bash
# Add protected, masked variable
curl -X POST "https://gitlab.com/api/v4/projects/$PROJECT_ID/variables" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  -F "key=VARIABLE_NAME" \
  -F "value=$SECRET_VALUE" \
  -F "protected=true" \
  -F "masked=true" \
  -F "variable_type=env_var"
```

**Verify it was added:**
```bash
curl -s "https://gitlab.com/api/v4/projects/$PROJECT_ID/variables" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq '.[].key'
```

**GitHub:**
```bash
gh secret set VARIABLE_NAME --body "$SECRET_VALUE" --repo owner/repo
```

---

### Step 5: Update .env.example

Add documentation for the new variable:

```bash
# .env.example
# [Description of what this is for]
# Get value from Bitwarden: "[Item Name]"
VARIABLE_NAME=
```

---

### Step 6: Update Deployment Config

Ensure the container receives the secret:

**Docker run (in .gitlab-ci.yml):**
```yaml
docker run -d \
  -e VARIABLE_NAME="${VARIABLE_NAME}" \
  ...
```

**Docker Compose:**
```yaml
services:
  app:
    environment:
      - VARIABLE_NAME=${VARIABLE_NAME}
```

---

### Step 7: Verify Application Can Access

After deployment, verify the secret is available:

```bash
# Check container has the env var
docker exec [container] printenv | grep VARIABLE_NAME
# Should show: VARIABLE_NAME=*** (or the value in non-prod)
```

---

### Step 8: Document

Update project README or docs:

```markdown
## Environment Variables

| Variable | Description | Required | Source |
|----------|-------------|----------|--------|
| VARIABLE_NAME | [description] | Yes | Bitwarden: "[item]" |
```

---

## Checklist

- [ ] Secret value validated
- [ ] Stored in Bitwarden (with metadata)
- [ ] Added to GitLab CI/CD variables (protected, masked)
- [ ] .env.example updated
- [ ] Deployment config updated
- [ ] Application can access the secret
- [ ] Documentation updated

---

## Output

After AddSecret workflow:
- Secret securely stored in vault
- CI/CD variable configured
- Documentation updated
- Ready to use in application

---

**AddSecret ensures every credential is properly secured from day one.**
