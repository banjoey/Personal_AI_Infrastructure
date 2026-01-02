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
| joey-all (Home) | Bitwarden + Infisical | GitLab CI/CD | K8s Secrets via Infisical |
| merlin-all (Work) | CyberArk | GitHub Secrets | K8s Secrets |

### Kubernetes Secrets (Home Lab)

For k3s workloads, use **Infisical** as the secrets management platform:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECRETS FLOW (k3s)                           │
│                                                                 │
│  Bitwarden → Infisical → InfisicalSecret CRD → K8s Secret      │
│  (master)   (centralized)  (operator)          (workload)       │
└─────────────────────────────────────────────────────────────────┘
```

**Infisical URL:** https://secrets.barkleyfarm.com

**Usage:**
1. Store master secrets in Bitwarden (backup)
2. Add secrets to Infisical project via UI or CLI
3. Create InfisicalSecret CRD in k8s to sync
4. Workloads consume native K8s Secrets

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

## Bitwarden Integration (Home - Master Backup)

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

## Infisical Integration (Home - k3s Workloads)

**Infisical** is the centralized secrets manager for all k3s deployments.

**URL:** https://secrets.barkleyfarm.com

### CLI Setup

```bash
# Install CLI
brew install infisical/get-cli/infisical

# Login
infisical login

# Set default project
infisical init
```

### Adding Secrets via CLI

```bash
# Add secret to development environment
infisical secrets set DISCORD_WEBHOOK_URL="https://discord.com/..." --env=dev

# Add secret to production
infisical secrets set DISCORD_WEBHOOK_URL="https://discord.com/..." --env=prod

# List secrets
infisical secrets --env=prod
```

### Syncing to Kubernetes

Create an InfisicalSecret CRD to sync secrets to a Kubernetes namespace:

```yaml
apiVersion: secrets.infisical.com/v1alpha1
kind: InfisicalSecret
metadata:
  name: my-app-secrets
  namespace: my-app
spec:
  # Authentication with Infisical
  authentication:
    universalAuth:
      secretsScope:
        projectSlug: my-project
        envSlug: prod
      credentialsRef:
        secretName: infisical-machine-identity
        secretNamespace: infisical-operator

  # Where to sync the secrets
  managedSecretReference:
    secretName: my-app-env
    secretNamespace: my-app
    creationPolicy: Owner

  # Sync interval
  resyncInterval: 60
```

### Machine Identity Setup

For the operator to authenticate with Infisical:

1. Create Machine Identity in Infisical UI
2. Generate client credentials
3. Create K8s secret with credentials:

```bash
kubectl create secret generic infisical-machine-identity \
  -n infisical-operator \
  --from-literal=clientId=<CLIENT_ID> \
  --from-literal=clientSecret=<CLIENT_SECRET>
```

### Workflow: Adding Secret for k3s App

```
1. Add to Bitwarden (master backup)
2. Add to Infisical project (via CLI or UI)
3. Create InfisicalSecret CRD in GitOps repo
4. Operator syncs to K8s Secret
5. App deployment references K8s Secret
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
