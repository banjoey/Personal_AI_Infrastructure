---
name: Infra
description: Environment-specific infrastructure management for home lab (Unraid, GitLab, Cloudflare). USE WHEN user mentions infrastructure, servers, containers, hosting, Unraid, Docker, OR environment setup. Branch-aware configuration (joey-all = home).
---

# Infra

Manages environment-specific infrastructure. This skill adapts to the deployment target based on git branch and provides consistent patterns for infrastructure operations.

## Environment Configuration

**This branch (joey-all) is configured for HOME environment:**

| Component | Technology | Management Tool |
|-----------|------------|-----------------|
| Compute | Unraid (Docker) | Unraid MCP, SSH |
| CI/CD | GitLab | GitLab skill |
| Registry | GitLab Container Registry | GitLab skill |
| DNS/CDN | Cloudflare | Cloudflare skill |
| Network | UniFi | Network skill |
| Secrets | Bitwarden | Secrets skill |

## Workflow Routing

| Workflow | When to Use | Delegates To |
|----------|-------------|--------------|
| SetupApp | New application infrastructure | Unraid, GitLab, Cloudflare |
| ScaleApp | Adjust resources | Unraid |
| Teardown | Remove infrastructure | Unraid, GitLab |

## Home Infrastructure Details

### Unraid Server

| Property | Value |
|----------|-------|
| Host | 10.0.20.21 |
| SSH Access | root@10.0.20.21 |
| Docker Socket | /var/run/docker.sock |
| AppData Path | /mnt/user/appdata |
| GraphQL API | http://10.0.20.21:8080/graphql |

**MCP Tools Available:**
- `mcp__unraid__list_docker_containers`
- `mcp__unraid__manage_docker_container`
- `mcp__unraid__get_container_logs`
- `mcp__unraid__restart_docker_container`
- `mcp__unraid__get_system_info`

### GitLab Runner

| Property | Value |
|----------|-------|
| Runner ID | 50992658 |
| Description | unraid-docker-runner |
| Executor | Docker |
| Tags | docker, unraid, self-hosted |
| Config Path | /mnt/user/appdata/gitlab-runner/config/config.toml |

### Local Docker Registry (Optional)

| Property | Value |
|----------|-------|
| URL | localhost:5050 |
| API | http://10.0.20.21:5050/v2/ |
| Storage | /mnt/user/appdata/registry |

## Examples

### Example 1: Setting up new service
```
User: "Set up infrastructure for my new API"

Infra skill activates:
1. Create appdata directory on Unraid
   → /mnt/user/appdata/[app-name]/{config,data}

2. Configure GitLab CI/CD
   → Delegate to GitLab skill for pipeline

3. Set up secrets
   → Delegate to Secrets skill

4. Configure DNS (if needed)
   → Delegate to Cloudflare skill

5. Document the setup
```

### Example 2: Checking container status
```
User: "Is my investment bot running?"

Infra skill activates:
1. Query Unraid MCP:
   → mcp__unraid__list_docker_containers

2. Find container by name
   → investment-alert-bot

3. Report status, health, resource usage
```

### Example 3: Viewing logs
```
User: "Show me the logs for the bot"

Infra skill activates:
1. Query container logs:
   → mcp__unraid__get_container_logs("investment-alert-bot")

2. Display recent log entries
3. Highlight any errors
```

## Standard AppData Structure

All applications on Unraid follow this pattern:

```
/mnt/user/appdata/[app-name]/
├── config/           # Configuration files (mounted :ro)
│   └── config.json
├── data/             # Persistent data (mounted :rw)
│   └── state.json
└── logs/             # Application logs (optional)
```

**Docker run pattern:**
```bash
docker run -d \
  --name [app-name] \
  --restart unless-stopped \
  -p [host-port]:[container-port] \
  -v /mnt/user/appdata/[app-name]/config:/app/config:ro \
  -v /mnt/user/appdata/[app-name]/data:/app/data \
  -e TZ=America/New_York \
  [image]:[tag]
```

## Network Configuration

Home network is managed by UniFi:

| VLAN | Name | Subnet | Purpose |
|------|------|--------|---------|
| Native | bf-core | 10.0.0.0/24 | Network infrastructure |
| 20 | bf-servers | 10.0.20.0/24 | Servers (Unraid here) |
| 30 | bf-staff | 10.0.30.0/24 | Personal devices |
| 40 | bf-IoT | 10.0.40.0/24 | IoT devices |
| 70 | bf-guest | 10.0.70.0/24 | Guest network |

**Delegate network operations to:** Network skill

## CI/CD Integration

For deployments, the standard flow is:

```
GitLab Pipeline → GitLab Container Registry → Unraid Docker

1. Push to main branch
2. GitLab CI builds Docker image
3. Image pushed to registry.gitlab.com/[project]
4. Deploy job SSHs to Unraid
5. Pulls and runs new container
```

**Key CI/CD variables for Unraid:**
- UNRAID_HOST (10.0.20.21)
- UNRAID_SSH_KEY (private key)
- UNRAID_HOST_KEY (known_hosts entry)

## Monitoring

### Health Checks

Most containers expose `/health`:
```bash
curl http://10.0.20.21:[port]/health
```

### Container Metrics via Unraid MCP

```
mcp__unraid__get_system_info  # Overall system health
mcp__unraid__get_array_status # Storage array
mcp__unraid__list_docker_containers # All containers
```

### Logs

```bash
# Via Unraid MCP
mcp__unraid__get_container_logs("[container]", tail=100)

# Or SSH
ssh root@10.0.20.21 "docker logs --tail 100 [container]"
```

## Integration with Other Skills

| Skill | How Infra Uses It |
|-------|-------------------|
| GitLab | Pipeline creation, CI/CD management |
| Cloudflare | DNS records, CDN configuration |
| Network | VLAN setup, firewall rules |
| Secrets | CI/CD variable configuration |
| Deployment | Receives deployment requests |

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs [container]

# Check for port conflicts
docker ps --format '{{.Names}}\t{{.Ports}}'

# Check disk space
df -h /mnt/user/appdata

# Check Unraid Docker service
/etc/rc.d/rc.docker status
```

### Can't Pull from Registry

```bash
# Login to registry
docker login registry.gitlab.com

# Check credentials
cat ~/.docker/config.json
```

### SSH Connection Issues

```bash
# Test connectivity
ping 10.0.20.21

# Test SSH
ssh -v root@10.0.20.21

# Check known_hosts
cat ~/.ssh/known_hosts | grep 10.0.20.21
```

---

**Infra skill provides consistent infrastructure patterns for home environment.**
