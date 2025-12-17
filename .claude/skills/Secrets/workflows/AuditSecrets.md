# AuditSecrets Workflow

Comprehensive security audit of secrets management.

## When to Use

- Regular security review (quarterly recommended)
- Before major release
- After security incident
- Compliance requirement

## Workflow Steps

### Step 1: Scan Codebase for Secrets

Run secret detection on entire codebase:

```bash
# Using git-secrets
git secrets --scan

# Using trufflehog
trufflehog git file://. --only-verified

# Using gitleaks
gitleaks detect --source=. --verbose

# Manual grep for common patterns
grep -rn "api[_-]?key\s*[:=]" --include="*.ts" --include="*.js" .
grep -rn "password\s*[:=]" --include="*.ts" --include="*.js" .
grep -rn "secret\s*[:=]" --include="*.ts" --include="*.js" .
```

**Report format:**
```markdown
## Secret Scan Results

**Scan Date:** [date]
**Tool:** [gitleaks/trufflehog/git-secrets]
**Scope:** [repo/directory]

### Findings

| Severity | File | Line | Type | Status |
|----------|------|------|------|--------|
| HIGH | src/config.ts | 15 | API Key | REMEDIATE |
| MEDIUM | .env.backup | 3 | Password | REMEDIATE |
| FALSE+ | docs/example.md | 42 | Example | IGNORE |
```

---

### Step 2: Review Git History

Check for secrets in git history:

```bash
# Search all commits for patterns
git log -p --all -S "password" -- "*.ts" "*.js"
git log -p --all -S "api_key" -- "*.ts" "*.js"
git log -p --all -S "secret" -- "*.ts" "*.js"

# Using BFG for comprehensive scan
bfg --no-blob-protection --private .
```

**If secrets found in history:**
```
WARNING: Secret found in git history

Commit: [sha]
Date: [date]
File: [path]
Type: [API key/password/etc]

Remediation required:
1. Rotate the exposed secret immediately
2. Consider history rewrite (BFG Repo-Cleaner)
3. Force push (coordinate with team)
```

---

### Step 3: Verify .gitignore

Ensure sensitive files are excluded:

```bash
# Check .gitignore exists
cat .gitignore

# Required entries:
.env
.env.local
.env.*.local
*.pem
*.key
*.p12
credentials.json
secrets/
config/local.json
```

**Test gitignore:**
```bash
# These should NOT be tracked
git check-ignore -v .env
git check-ignore -v secrets/api.key
```

---

### Step 4: Audit Vault Contents

Review secrets stored in Bitwarden:

```bash
# List all items in Projects folder
bw list items --folderid [projects-folder-id] | jq '.[].name'
```

**Check for:**
- [ ] All secrets have clear names
- [ ] All secrets have project association
- [ ] No orphaned secrets (project deleted)
- [ ] No duplicate secrets
- [ ] Rotation dates documented

---

### Step 5: Audit CI/CD Variables

Review variables configured in GitLab:

```bash
# List all project variables
curl -s "https://gitlab.com/api/v4/projects/$PROJECT_ID/variables" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq '.[] | {key, protected, masked}'
```

**Check for:**
- [ ] All secrets are marked `protected: true`
- [ ] All secrets are marked `masked: true`
- [ ] No unnecessary variables
- [ ] Variable names match vault names

---

### Step 6: Review Access Controls

Who has access to secrets?

**GitLab:**
```bash
# List project members
curl -s "https://gitlab.com/api/v4/projects/$PROJECT_ID/members" \
  -H "PRIVATE-TOKEN: $GITLAB_TOKEN" | jq '.[] | {username, access_level}'
```

**Bitwarden:**
- Review organization members
- Check sharing settings

**Check for:**
- [ ] Only necessary people have access
- [ ] Access levels appropriate
- [ ] No former employees

---

### Step 7: Check Secret Age

Review when secrets were last rotated:

```bash
# Get item metadata from Bitwarden
bw list items --folderid [projects-folder-id] | \
  jq '.[] | {name, revisionDate}'
```

**Flag secrets older than:**
- 90 days: Consider rotation
- 180 days: Should rotate
- 365 days: MUST rotate

---

### Step 8: Generate Audit Report

```markdown
# Secrets Audit Report

**Project:** [name]
**Audit Date:** [date]
**Auditor:** Charles (PAI)

## Summary

| Category | Status | Issues |
|----------|--------|--------|
| Code Scanning | PASS/FAIL | [count] |
| Git History | PASS/FAIL | [count] |
| .gitignore | PASS/FAIL | [count] |
| Vault | PASS/FAIL | [count] |
| CI/CD Variables | PASS/FAIL | [count] |
| Access Control | PASS/FAIL | [count] |
| Secret Age | PASS/FAIL | [count] |

## Critical Issues

[List any HIGH severity issues]

## Recommendations

1. [Action item 1]
2. [Action item 2]
3. [Action item 3]

## Secrets Inventory

| Secret | Location | Age | Rotated | Status |
|--------|----------|-----|---------|--------|
| DISCORD_WEBHOOK_URL | Vault + GitLab | 30d | 2025-11-17 | OK |
| DATABASE_PASSWORD | Vault + GitLab | 95d | 2025-09-13 | ROTATE |

## Next Audit

Scheduled: [date + 90 days]
```

---

## Severity Definitions

| Severity | Meaning | Action |
|----------|---------|--------|
| CRITICAL | Secret exposed publicly | Rotate immediately, investigate |
| HIGH | Secret in code/history | Rotate, remove from code |
| MEDIUM | Poor secret hygiene | Fix within sprint |
| LOW | Best practice violation | Fix when convenient |

---

## Automation

Consider automating these checks:

```yaml
# .gitlab-ci.yml - Secret scanning
secret-scan:
  stage: test
  image: zricethezav/gitleaks:latest
  script:
    - gitleaks detect --source=. --verbose
  allow_failure: false
```

---

**AuditSecrets ensures no credential slips through the cracks.**
