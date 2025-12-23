# DependencyCheck Workflow

**Purpose:** Validate dependencies before adding or upgrading them.

## Activation Triggers

This workflow activates BEFORE:
- `npm install`, `bun add`, `pip install`
- Upgrading existing dependencies
- Adding new libraries to the project
- Choosing between alternative libraries

## Execution Steps

### Step 1: Identify the Dependency

| Question | Answer |
|----------|--------|
| Package name | |
| Purpose | |
| Current version (if upgrading) | |
| Target version | |

### Step 2: Verify Package Health

**Use WebSearch/WebFetch to check:**

```
Search: "[package] npm" or "[package] pypi"
Search: "[package] github"
Search: "[package] security vulnerabilities"
```

| Check | Status | Notes |
|-------|--------|-------|
| Last updated | | Should be within 6 months |
| Open issues | | High count may indicate problems |
| Downloads/week | | Indicates adoption |
| GitHub stars | | Indicates community trust |
| Maintainer active | | Check recent commits |

### Step 3: Security Audit

**Check for known vulnerabilities:**

```bash
# JavaScript
npm audit
npx snyk test

# Python
pip-audit
safety check
```

**Also search:**
```
Search: "[package] CVE"
Search: "[package] security advisory"
Search: "[package] vulnerability"
```

| Vulnerability | Severity | Fixed In | Action |
|---------------|----------|----------|--------|
| | | | |

### Step 4: License Check

**Verify license compatibility:**

| License | Commercial Use | Modification | Distribution | Notes |
|---------|----------------|--------------|--------------|-------|
| MIT | ✓ | ✓ | ✓ | Very permissive |
| Apache 2.0 | ✓ | ✓ | ✓ | Patent protection |
| GPL | ? | ✓ | Copyleft | May require open source |
| BSD | ✓ | ✓ | ✓ | Permissive |

### Step 5: Evaluate Alternatives

**Before adding, check if better options exist:**

```
Search: "[package] vs alternatives 2025"
Search: "best [purpose] library [language] 2025"
```

| Alternative | Pros | Cons | Recommendation |
|-------------|------|------|----------------|
| | | | |

### Step 6: Check Breaking Changes (Upgrades)

**If upgrading, review:**

```
Search: "[package] v[new] migration guide"
Search: "[package] v[new] breaking changes"
Search: "[package] v[new] changelog"
```

| Breaking Change | Impact | Migration |
|-----------------|--------|-----------|
| | | |

### Step 7: Bundle Size (Frontend)

**For frontend dependencies:**

```
Search: "[package] bundlephobia"
```

| Package | Minified | Gzipped | Tree-shakeable |
|---------|----------|---------|----------------|
| | | | |

### Step 8: Dependency Checklist

**ALL boxes must be checked before adding:**

```
[ ] Package is actively maintained
[ ] No critical security vulnerabilities
[ ] License is compatible with project
[ ] Checked for better alternatives
[ ] Reviewed breaking changes (if upgrade)
[ ] Bundle size acceptable (if frontend)
[ ] Understood what the package does
```

**If any box is unchecked: INVESTIGATE FIRST.**

## Output

Decision: [ ] Add [ ] Upgrade [ ] Don't Add [ ] Use Alternative

Justification: _______________
