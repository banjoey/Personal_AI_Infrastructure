# Teardown Workflow

Safely remove infrastructure for an application.

## When to Use

- Decommissioning an application
- Removing test/staging environment
- Cleaning up after failed project

## Prerequisites

- Confirm with user that teardown is intentional
- Know what resources to remove

## Warning

```
⚠️  DESTRUCTIVE OPERATION

This workflow permanently removes:
- Running containers
- AppData directories
- CI/CD configurations (optional)
- DNS records (optional)

Data cannot be recovered after deletion.
```

## Workflow Steps

### Step 1: Confirm Teardown

**Questions:**
1. Application name to remove?
2. Remove data as well? (AppData directory)
3. Remove CI/CD pipeline?
4. Remove DNS records?
5. Remove secrets from vault?

**Get explicit confirmation:**
```
User must confirm: "I confirm teardown of [app-name] infrastructure"
```

---

### Step 2: Create Backup (Optional but Recommended)

If user wants to preserve data:

```bash
ssh root@10.0.20.21 << 'EOF'
  APP_NAME="[app-name]"
  BACKUP_DATE=$(date +%Y%m%d)

  # Create backup
  tar -czf /mnt/user/backups/${APP_NAME}_${BACKUP_DATE}.tar.gz \
    /mnt/user/appdata/$APP_NAME

  # Verify backup
  ls -la /mnt/user/backups/${APP_NAME}_${BACKUP_DATE}.tar.gz
EOF
```

---

### Step 3: Stop and Remove Container

```bash
# Via Unraid MCP
mcp__unraid__manage_docker_container("[container-id]", "stop")

# Or via SSH
ssh root@10.0.20.21 << 'EOF'
  docker stop [app-name] || true
  docker rm [app-name] || true

  # Verify removed
  docker ps -a | grep [app-name] || echo "Container removed"
EOF
```

---

### Step 4: Remove Docker Image (Optional)

```bash
ssh root@10.0.20.21 << 'EOF'
  # List images
  docker images | grep [app-name]

  # Remove images
  docker rmi registry.gitlab.com/[namespace]/[project]:latest || true
  docker rmi registry.gitlab.com/[namespace]/[project]:$(git rev-parse --short HEAD) || true

  # Prune unused images
  docker image prune -f
EOF
```

---

### Step 5: Remove AppData Directory

**Only if confirmed in Step 1:**

```bash
ssh root@10.0.20.21 << 'EOF'
  APP_NAME="[app-name]"

  # Show what will be deleted
  ls -la /mnt/user/appdata/$APP_NAME

  # Remove
  rm -rf /mnt/user/appdata/$APP_NAME

  # Verify removed
  ls /mnt/user/appdata/$APP_NAME 2>/dev/null || echo "Directory removed"
EOF
```

---

### Step 6: Remove CI/CD Variables

**Only if confirmed in Step 1:**

```bash
# List variables for this project
curl -s "https://gitlab.com/api/v4/projects/$PROJECT_ID/variables" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq '.[].key'

# Remove each variable
curl -X DELETE "https://gitlab.com/api/v4/projects/$PROJECT_ID/variables/VARIABLE_NAME" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN"
```

---

### Step 7: Remove DNS Records

**Delegate to:** Cloudflare skill (if applicable)

```bash
# If app had DNS records, remove them
# Example: api.example.com
```

---

### Step 8: Archive Secrets in Vault

**Delegate to:** Secrets skill

Instead of deleting, move to "Archived" folder in Bitwarden:

```bash
# Move item to archive folder
bw move item [item-id] [archive-folder-id]
```

---

### Step 9: Archive or Delete GitLab Project (Optional)

If the entire project is being retired:

```bash
# Archive (recommended over delete)
curl -X POST "https://gitlab.com/api/v4/projects/$PROJECT_ID/archive" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN"

# Or delete (PERMANENT)
# curl -X DELETE "https://gitlab.com/api/v4/projects/$PROJECT_ID" \
#   -H "PRIVATE-TOKEN: $GITLAB_TOKEN"
```

---

### Step 10: Document Teardown

```markdown
## Infrastructure Teardown - [Date]

**Application:** [app-name]
**Reason:** [why decommissioned]

### Removed
- [x] Container: [app-name]
- [x] AppData: /mnt/user/appdata/[app-name]
- [x] Docker images
- [x] CI/CD variables
- [ ] DNS records (if applicable)
- [ ] GitLab project archived

### Backup
- Location: /mnt/user/backups/[app-name]_[date].tar.gz
- Retention: [X days/permanent]

### Notes
[Any additional notes about the teardown]
```

---

## Checklist

- [ ] Teardown confirmed by user
- [ ] Backup created (if requested)
- [ ] Container stopped and removed
- [ ] Images removed (optional)
- [ ] AppData removed (if confirmed)
- [ ] CI/CD variables removed (if confirmed)
- [ ] DNS records removed (if applicable)
- [ ] Secrets archived
- [ ] Documentation updated

---

## Rollback

If teardown was a mistake and backup exists:

```bash
# Restore from backup
tar -xzf /mnt/user/backups/[app-name]_[date].tar.gz -C /

# Re-run SetupApp workflow to restore infrastructure
```

---

**Teardown ensures clean, documented infrastructure removal.**
