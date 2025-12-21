---
name: Infisical
description: Centralized secrets management for PAI infrastructure. USE WHEN user mentions secrets, credentials, API keys, environment variables, Infisical, OR needs to manage sensitive configuration. Provides MCP-based access to self-hosted Infisical instance.
---

# Infisical - Secrets Management

Manage secrets across all PAI infrastructure using the self-hosted Infisical instance.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Infisical
```

| Workflow | Trigger | File |
|----------|---------|------|
| **ManageSecrets** | "add secret", "get secret", "update secret" | `workflows/ManageSecrets.md` |
| **SetupProject** | "create Infisical project", "new secrets project" | `workflows/SetupProject.md` |
| **SyncToK8s** | "sync secrets to kubernetes", "create InfisicalSecret" | `workflows/SyncToK8s.md` |

## Examples

**Example 1: Add a new secret**
```
User: "Add the OpenAI API key to Infisical"
→ Invokes ManageSecrets workflow
→ Uses mcp__infisical__create-secret
→ Stores in appropriate project/environment
```

**Example 2: Create a new project**
```
User: "Set up secrets for the new service"
→ Invokes SetupProject workflow
→ Creates project with standard environments (dev, staging, prod)
→ Sets up folder structure
```

**Example 3: Sync to Kubernetes**
```
User: "Make the API keys available to the pod"
→ Invokes SyncToK8s workflow
→ Creates InfisicalSecret resource
→ Operator syncs to native K8s Secret
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECRETS FLOW                              │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │  Bitwarden  │    │  Infisical  │    │  Infisical MCP  │  │
│  │  (backup)   │───▶│  (central)  │◀───│  (k3s/HTTP)     │  │
│  └─────────────┘    └──────┬──────┘    └─────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│                 ┌─────────────────────┐                     │
│                 │ Infisical Operator  │                     │
│                 └──────────┬──────────┘                     │
│                            │                                 │
│                            ▼                                 │
│                 ┌─────────────────────┐                     │
│                 │   K8s Secrets       │                     │
│                 │   (native)          │                     │
│                 └─────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## MCP Access

The Infisical MCP runs in k3s and is accessible via Streamable HTTP:

| Component | URL |
|-----------|-----|
| Infisical UI | https://secrets.op.barkleyfarm.com |
| Infisical MCP | https://mcp-infisical.op.barkleyfarm.com/mcp |
| Health Check | https://mcp-infisical.op.barkleyfarm.com/healthz |

**Transport:** Streamable HTTP (recommended, not deprecated SSE)

### Docker Image

Built via GitLab CI/CD, not local machine:
- **Registry:** `registry.gitlab.com/barkleyfarm2/bfinfrastructure/infisical-mcp:latest`
- **Source:** `docker/infisical-mcp/Dockerfile`
- **Pipeline:** Triggers on changes to `docker/infisical-mcp/**`

### mcp-proxy Configuration

To use from Claude Code (stdio proxy to HTTP endpoint):

```json
{
  "mcpServers": {
    "infisical": {
      "command": "/usr/local/bin/mcp-proxy",
      "args": [
        "--transport", "streamablehttp",
        "--no-verify-ssl",
        "https://mcp-infisical.op.barkleyfarm.com/mcp"
      ]
    }
  }
}
```

### Available MCP Tools

| Tool | Purpose |
|------|---------|
| `mcp__infisical__create-secret` | Add new secret |
| `mcp__infisical__get-secret` | Retrieve secret value |
| `mcp__infisical__update-secret` | Modify existing secret |
| `mcp__infisical__delete-secret` | Remove secret |
| `mcp__infisical__list-secrets` | List all secrets in environment |
| `mcp__infisical__create-project` | Create new project |
| `mcp__infisical__create-environment` | Add environment to project |
| `mcp__infisical__create-folder` | Organize secrets in folders |
| `mcp__infisical__invite-members-to-project` | Add team members |

## Project Structure Convention

```
Organization: BarkleyFarm
├── k3s-infrastructure          # Cluster-wide secrets
│   ├── dev/
│   ├── staging/
│   └── prod/
│       ├── /databases          # Database credentials
│       ├── /api-keys           # External API keys
│       └── /certificates       # TLS certs, signing keys
├── mcp-servers                 # MCP service credentials
│   └── prod/
│       ├── /unifi
│       ├── /cloudflare
│       └── /gitlab
└── applications                # Per-app secrets
    └── prod/
        ├── /app-name-1
        └── /app-name-2
```

## Security Principles

1. **Bitwarden for backup** - Critical secrets duplicated to Bitwarden
2. **Least privilege** - Each service gets minimal required access
3. **Rotate regularly** - Especially for production API keys
4. **Never log secrets** - Mask in all output
5. **Use Machine Identities** - Not personal credentials for automation

## Agent Pool Configuration

For complex secret operations, spawn a dedicated agent:

```json
// agents/infisical/.mcp.json
{
  "mcpServers": {
    "infisical": {
      "command": "/usr/local/bin/mcp-proxy",
      "args": [
        "--transport", "streamablehttp",
        "--no-verify-ssl",
        "https://mcp-infisical.op.barkleyfarm.com/mcp"
      ],
      "description": "Infisical secrets management - stdio proxy to k3s Streamable HTTP MCP"
    }
  }
}
```

### Testing MCP Connectivity

```bash
# Health check
curl -k https://mcp-infisical.op.barkleyfarm.com/healthz

# MCP initialize (requires proper headers)
curl -k -X POST https://mcp-infisical.op.barkleyfarm.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0"}}}'
```

## Quick Reference

### Bootstrap Secrets (save to Bitwarden!)
- ENCRYPTION_KEY: Used for data encryption
- AUTH_SECRET: Session signing key
- Machine Identity credentials

### URLs
- UI: https://secrets.op.barkleyfarm.com
- MCP: https://mcp-infisical.op.barkleyfarm.com

### Namespaces
- `infisical` - Main Infisical deployment
- `infisical-operator` - Secrets operator
- `infisical-mcp` - MCP server (Supergateway)
