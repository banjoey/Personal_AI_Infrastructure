---
name: Secrets
description: Manages secrets securely across environments using vault systems (Bitwarden for home, CyberArk for work). USE WHEN user needs API keys, passwords, tokens, credentials, environment variables, OR mentions secrets management. Enforces zero hardcoded secrets.
---

# Secrets

Manages secrets securely, ensuring credentials never end up in code, logs, or git history. This skill uses environment-specific vault systems and integrates with CI/CD pipelines.

## Core Principle

```
┌─────────────────────────────────────────────────────────────────┐
│                  SECRETS ARE SACRED                              │
│                                                                  │
│   - NEVER hardcode secrets in code                              │
│   - NEVER commit secrets to git                                 │
│   - NEVER log secret values                                     │
│   - NEVER pass secrets via command line                         │
│   - ALWAYS use vault + CI/CD variables                          │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow Routing

| Workflow | When to Use |
|----------|-------------|
| AddSecret | New secret needed |
| RotateSecret | Updating existing secret |
| AuditSecrets | Security review of secrets |

## Environment-Specific Configuration

Secrets skill adapts to the environment based on git branch:

| Branch | Vault | CI/CD Variables | Runtime Injection |
|--------|-------|-----------------|-------------------|
| joey-all (Home) | Bitwarden | GitLab CI/CD | Docker env vars |
| merlin-all (Work) | CyberArk | GitHub Secrets | K8s Secrets |

## Guardrails (ENFORCEMENT)

| Check | Requirement | Blocking |
|-------|-------------|----------|
| No Hardcoded Secrets | Scan code for patterns | YES |
| .gitignore Configured | .env files excluded | YES |
| Secrets in Vault | All registered | YES |
| CI/CD Variables Set | Pipeline has access | YES |

## Secret Detection Patterns

Secrets skill scans for these patterns:

```regex
# API Keys
[a-zA-Z0-9]{32,}
api[_-]?key['\"]?\s*[:=]\s*['\"][^'\"]+['\"]

# AWS
AKIA[0-9A-Z]{16}
aws[_-]?secret[_-]?access[_-]?key

# JWT/Tokens
eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*

# Passwords
password['\"]?\s*[:=]\s*['\"][^'\"]+['\"]

# Private Keys
-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----

# Discord/Slack Webhooks
https://discord\.com/api/webhooks/
https://hooks\.slack\.com/services/

# Database URLs
postgres://.*:.*@
mysql://.*:.*@
mongodb(\+srv)?://.*:.*@
```

## Examples

### Example 1: Adding a new API key
```
User: "I need to add a Discord webhook URL"

Secrets skill activates:
1. "I'll help you add this secret securely."

2. Store in vault (Bitwarden):
   - Item name: "Discord Webhook - [Project]"
   - Type: API Credential
   - Value: [provided URL]

3. Add to CI/CD (GitLab):
   - Variable: DISCORD_WEBHOOK_URL
   - Protected: Yes
   - Masked: Yes

4. Create .env.example:
   ```
   # Discord webhook for alerts (get from Bitwarden)
   DISCORD_WEBHOOK_URL=
   ```

5. Update deployment config to inject at runtime
```

### Example 2: Detecting hardcoded secret
```
User pushes code with API key in source

Secrets skill (via Development/CodeReview):
"SECURITY VIOLATION: Hardcoded secret detected

Location: src/config.ts:15
Pattern: API key (32+ character string)
Content: const API_KEY = 'sk_live_abc123...'

BLOCKED: Cannot proceed until secret is removed.

Action required:
1. Remove secret from code
2. Add to Bitwarden vault
3. Configure as CI/CD variable
4. Reference via environment variable

Would you like help with this?"
```

### Example 3: Secret rotation
```
User: "I need to rotate the database password"

Secrets skill activates:
1. Generate new secure password
2. Update in vault (Bitwarden)
3. Update CI/CD variable
4. Trigger redeployment
5. Verify service still working
6. Document rotation in audit log
```

## Secret Categories

| Category | Example Variables | Storage |
|----------|-------------------|---------|
| API Keys | *_API_KEY, *_TOKEN | Vault + CI/CD |
| Database | DATABASE_URL, *_PASSWORD | Vault + CI/CD |
| SSH Keys | DEPLOY_KEY, SSH_PRIVATE_KEY | Vault + CI/CD |
| Webhooks | *_WEBHOOK_URL | Vault + CI/CD |
| OAuth | CLIENT_ID, CLIENT_SECRET | Vault + CI/CD |

## .env File Standards

**.env (local development):**
```bash
# Local environment - NEVER COMMIT
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DATABASE_URL=postgres://localhost:5432/dev
```

**.env.example (committed):**
```bash
# Copy to .env and fill in values
# Get secrets from Bitwarden

# Discord webhook for alerts
DISCORD_WEBHOOK_URL=

# Database connection
DATABASE_URL=
```

**.gitignore (REQUIRED):**
```
.env
.env.local
.env.*.local
*.pem
*.key
credentials.json
secrets/
```

## CI/CD Variable Configuration

### GitLab Variables

| Setting | Meaning | Use When |
|---------|---------|----------|
| Protected | Only on protected branches | Production secrets |
| Masked | Hidden in job logs | Always for secrets |
| Expand | Allows $VAR in value | Never for secrets |

**API to set variable:**
```bash
curl -X POST "https://gitlab.com/api/v4/projects/[ID]/variables" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  -F "key=DISCORD_WEBHOOK_URL" \
  -F "value=$SECRET_VALUE" \
  -F "protected=true" \
  -F "masked=true"
```

### GitHub Secrets

```bash
gh secret set DISCORD_WEBHOOK_URL --body "$SECRET_VALUE"
```

## Bitwarden Integration (Home)

**Prerequisites:**
- Bitwarden CLI installed: `brew install bitwarden-cli`
- Logged in: `bw login`

**Store secret:**
```bash
# Create secure note
bw create item '{
  "type": 2,
  "secureNote": {"type": 0},
  "name": "Discord Webhook - Investment Bot",
  "notes": "https://discord.com/api/webhooks/...",
  "folderId": "[projects-folder-id]"
}'
```

**Retrieve secret:**
```bash
bw get item "Discord Webhook - Investment Bot" | jq -r '.notes'
```

## Secret Lifecycle

```
┌──────────────────┐
│   CREATE         │
│   New secret     │
│   needed         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   STORE          │
│   Add to vault   │
│   (Bitwarden)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   CONFIGURE      │
│   CI/CD variable │
│   (GitLab)       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   DOCUMENT       │
│   .env.example   │
│   README         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   USE            │
│   process.env    │
│   at runtime     │
└────────┬─────────┘
         │
         ▼ (periodically)
┌──────────────────┐
│   ROTATE         │
│   Update value   │
│   in all places  │
└────────┬─────────┘
         │
         ▼ (when no longer needed)
┌──────────────────┐
│   REVOKE         │
│   Remove from    │
│   vault + CI/CD  │
└──────────────────┘
```

## Audit Trail

Every secret operation should be logged:

```markdown
## Secrets Audit Log - [Project]

| Date | Action | Secret | By |
|------|--------|--------|-----|
| 2025-12-17 | Created | DISCORD_WEBHOOK_URL | Charles |
| 2025-12-17 | Configured | DISCORD_WEBHOOK_URL (GitLab) | Charles |
| 2025-12-20 | Rotated | DATABASE_PASSWORD | Charles |
```

---

**Secrets skill ensures credentials stay secure. No exceptions, no shortcuts.**
