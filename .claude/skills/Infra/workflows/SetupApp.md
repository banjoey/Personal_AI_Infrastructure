# SetupApp Workflow

Set up infrastructure for a new application on the home environment (Unraid).

## When to Use

- Deploying a new service
- Setting up new application infrastructure
- Migrating an app to Unraid

## Prerequisites

- Application code ready (or being developed)
- CI/CD pipeline exists (or will be created)
- Know port requirements

## Workflow Steps

### Step 1: Gather Application Requirements

**Questions:**
1. Application name?
2. Port(s) needed?
3. Configuration files required?
4. Persistent data needs?
5. Environment variables?
6. External dependencies (database, Redis, etc.)?

---

### Step 2: Create AppData Directory

```bash
ssh root@10.0.20.21 << 'EOF'
  APP_NAME="[app-name]"

  # Create directory structure
  mkdir -p /mnt/user/appdata/$APP_NAME/{config,data}

  # Set permissions
  chmod 755 /mnt/user/appdata/$APP_NAME
  chmod 755 /mnt/user/appdata/$APP_NAME/config
  chmod 755 /mnt/user/appdata/$APP_NAME/data

  # Verify
  ls -la /mnt/user/appdata/$APP_NAME
EOF
```

---

### Step 3: Create Configuration Files

If the app needs configuration:

```bash
# Copy config template to Unraid
scp config/config.example.json root@10.0.20.21:/mnt/user/appdata/[app-name]/config/config.json

# Or create inline
ssh root@10.0.20.21 << 'EOF'
cat > /mnt/user/appdata/[app-name]/config/config.json << 'CONFIG'
{
  "setting1": "value1",
  "setting2": "value2"
}
CONFIG
EOF
```

---

### Step 4: Configure GitLab CI/CD

**Delegate to:** Deployment/PipelineCreate

Ensure pipeline includes:
- Build stage (Docker)
- Test stage
- Deploy stage (manual trigger to Unraid)

**Required CI/CD variables:**

| Variable | Description |
|----------|-------------|
| UNRAID_HOST | 10.0.20.21 |
| UNRAID_SSH_KEY | SSH private key |
| UNRAID_HOST_KEY | SSH host key |
| [APP_SECRETS] | App-specific secrets |

---

### Step 5: Configure Secrets

**Delegate to:** Secrets skill

For each required secret:
1. Add to Bitwarden
2. Configure as GitLab CI/CD variable
3. Document in .env.example

---

### Step 6: Set Up DNS (if needed)

**Delegate to:** Cloudflare skill

If the app needs a domain:

```bash
# Example: Add A record
# api.example.com → Cloudflare Tunnel or direct IP

# Or configure Cloudflare Tunnel for secure access
```

---

### Step 7: Create Docker Run Template

Document the exact docker run command:

```bash
docker run -d \
  --name [app-name] \
  --restart unless-stopped \
  -p [HOST_PORT]:[CONTAINER_PORT] \
  -v /mnt/user/appdata/[app-name]/config:/app/config:ro \
  -v /mnt/user/appdata/[app-name]/data:/app/data \
  -e TZ=America/New_York \
  -e VARIABLE_1="${VARIABLE_1}" \
  -e VARIABLE_2="${VARIABLE_2}" \
  registry.gitlab.com/[namespace]/[project]:latest
```

This should match what's in `.gitlab-ci.yml`.

---

### Step 8: Test Initial Deployment

```bash
# Push code to trigger build
git push origin main

# Wait for build to complete

# Trigger manual deploy (via GitLab UI or API)
```

---

### Step 9: Verify Deployment

```bash
# Check container is running
ssh root@10.0.20.21 "docker ps | grep [app-name]"

# Check health endpoint
curl -f http://10.0.20.21:[PORT]/health

# Check logs
ssh root@10.0.20.21 "docker logs --tail 50 [app-name]"
```

---

### Step 10: Document the Setup

Create or update project documentation:

```markdown
## Infrastructure Setup

### Unraid
- **AppData:** `/mnt/user/appdata/[app-name]`
- **Port:** [PORT]
- **Container:** [app-name]

### GitLab CI/CD
- **Registry:** `registry.gitlab.com/[namespace]/[project]`
- **Deploy:** Manual trigger on main branch

### Required Secrets
| Variable | Source |
|----------|--------|
| VARIABLE_1 | Bitwarden: "[item]" |
| VARIABLE_2 | Bitwarden: "[item]" |

### Health Check
```
curl http://10.0.20.21:[PORT]/health
```
```

---

## Checklist

- [ ] AppData directory created
- [ ] Configuration files in place
- [ ] CI/CD pipeline configured
- [ ] Secrets configured (Bitwarden + GitLab)
- [ ] DNS configured (if needed)
- [ ] Docker run command documented
- [ ] Initial deployment successful
- [ ] Health check working
- [ ] Documentation updated

---

## Output

After SetupApp workflow:
- Application infrastructure ready
- CI/CD pipeline working
- Secrets secured
- Documentation complete

---

**SetupApp ensures consistent, reproducible infrastructure setup.**
