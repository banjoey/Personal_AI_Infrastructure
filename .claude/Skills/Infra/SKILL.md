---
name: Infra
description: Home lab infrastructure orchestration for Unraid, GitLab, and Cloudflare. USE WHEN user mentions infrastructure status, container management, deployment setup, OR needs to check Unraid servers, GitLab runners, or infrastructure health. Provides CLI tools and delegates to vendor-specific skills.
---

# Infra

Orchestrates home lab infrastructure across multiple platforms. Provides status checking and delegates to vendor-specific skills for detailed operations.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Infra
```

| Workflow | Trigger | File |
|----------|---------|------|
| **SetupApp** | "set up infrastructure", "new app", "deploy to Unraid" | `workflows/SetupApp.md` |
| **ScaleApp** | "scale app", "adjust resources", "more containers" | `workflows/ScaleApp.md` |
| **Teardown** | "remove infrastructure", "tear down", "delete app" | `workflows/Teardown.md` |

## Tools

| Tool | Purpose | File |
|------|---------|------|
| **InfraStatus** | Check infrastructure component health | `tools/InfraStatus.ts` |

## Examples

**Example 1: Check infrastructure health**
```
User: "Is my infrastructure healthy?"
→ Runs tools/InfraStatus.ts
→ Returns: Unraid online (45ms), GitLab online (120ms), Cloudflare online (80ms)
```

**Example 2: Check specific component**
```
User: "Is Unraid responding?"
→ Runs tools/InfraStatus.ts --component=unraid
→ Returns: Unraid online, SSH: 10.0.20.21:22, GraphQL API: OK
```

**Example 3: Set up new app infrastructure**
```
User: "Set up infrastructure for my new API"
→ Invokes SetupApp workflow
→ Creates appdata on Unraid, configures GitLab CI, sets up DNS
→ Returns: App ready at api.example.com
```

**Example 4: Check container status**
```
User: "Is my investment bot running?"
→ Calls mcp__unraid__list_docker_containers
→ Returns: investment-alert-bot running, healthy, 15MB memory
```

## Environment Configuration

**This branch (joey-all) = HOME environment**

| Component | Technology | Skill |
|-----------|------------|-------|
| Compute | Unraid (Docker) | Unraid MCP |
| CI/CD | GitLab | GitLab skill |
| Registry | GitLab Container Registry | GitLab skill |
| DNS/CDN | Cloudflare | Cloudflare skill |
| Network | UniFi | Unifi skill |
| Secrets | Bitwarden | Secrets skill |

## Infrastructure Reference

### Unraid Server

| Property | Value |
|----------|-------|
| Host | 10.0.20.21 |
| SSH | root@10.0.20.21 |
| GraphQL API | http://10.0.20.21:8080/graphql |
| AppData | /mnt/user/appdata |

### MCP Tools

```
mcp__unraid__list_docker_containers
mcp__unraid__manage_docker_container
mcp__unraid__get_container_logs
mcp__unraid__restart_docker_container
mcp__unraid__get_system_info
```

### Network VLANs

| VLAN | Name | Subnet | Purpose |
|------|------|--------|---------|
| Native | bf-core | 10.0.0.0/24 | Network infrastructure |
| 20 | bf-servers | 10.0.20.0/24 | Servers (Unraid) |
| 30 | bf-staff | 10.0.30.0/24 | Personal devices |
| 40 | bf-IoT | 10.0.40.0/24 | IoT devices |

## Integration

| Skill | Relationship |
|-------|--------------|
| **GitLab** | Delegates CI/CD, pipeline creation |
| **Cloudflare** | Delegates DNS, CDN configuration |
| **Unifi** | Delegates network operations |
| **Secrets** | Delegates credential management |
| **Platform** | Receives k8s deployment requests |

## Common Operations

### Check infrastructure status
```bash
bun run tools/InfraStatus.ts
bun run tools/InfraStatus.ts --component=unraid
bun run tools/InfraStatus.ts --json
```

### View container logs (via MCP)
```
mcp__unraid__get_container_logs("investment-alert-bot", tail=100)
```

### SSH to Unraid
```bash
ssh root@10.0.20.21
```

## Standard AppData Structure

```
/mnt/user/appdata/[app-name]/
├── config/    # Configuration (mounted :ro)
├── data/      # Persistent data (mounted :rw)
└── logs/      # Application logs (optional)
```

## CI/CD Pattern

```
GitLab Push → Build Image → Push to Registry → SSH to Unraid → Pull & Run
```

**Key Variables:**
- `UNRAID_HOST` (10.0.20.21)
- `UNRAID_SSH_KEY` (private key)
- `UNRAID_HOST_KEY` (known_hosts)
