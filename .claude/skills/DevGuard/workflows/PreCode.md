# PreCode Workflow

**Purpose:** Research and verify before implementing any significant code.

## Activation Triggers

This workflow activates BEFORE:
- Implementing a new feature
- Writing framework-specific code
- Implementing business logic patterns
- Creating API endpoints
- Building UI components

## Execution Steps

### Step 1: Identify What You're Building

| Question | Answer |
|----------|--------|
| Feature description | |
| Primary language/framework | |
| Key libraries needed | |
| Domain (auth, data, UI, etc.) | |

### Step 2: Research Current Best Practices

**Use WebSearch or WebFetch to verify:**

```
Search: "[framework] [feature] best practice 2025"
Search: "[library] current documentation"
Search: "[pattern] recommended approach"
```

| Research Item | Source | Key Finding |
|---------------|--------|-------------|
| Framework pattern | | |
| Library API | | |
| Security guidance | | |
| Performance tips | | |

### Step 3: Verify Library Versions

**Check that libraries you'll use are:**
- Currently maintained
- At latest stable version
- Free of known vulnerabilities

```bash
# For JavaScript/TypeScript
npm outdated
npm audit

# For Python
pip list --outdated
pip-audit
```

| Library | Current | Latest | Notes |
|---------|---------|--------|-------|
| | | | |

### Step 4: Check for Deprecated Patterns

**Before using any pattern from memory, verify:**

- Is this API deprecated?
- Has a better alternative emerged?
- Are there breaking changes in recent versions?

```
Search: "[library] deprecated API"
Search: "[library] migration guide"
Search: "[library] v[X] changelog"
```

### Step 5: Review Security Considerations

**For the domain you're working in:**

| Domain | Check |
|--------|-------|
| Authentication | OWASP Authentication Cheatsheet |
| Input handling | OWASP Input Validation |
| Database | OWASP SQL Injection Prevention |
| API | OWASP API Security Top 10 |
| Frontend | OWASP XSS Prevention |

### Step 6: Pre-Code Checklist

**ALL boxes must be checked before writing code:**

```
[ ] Checked official docs for framework/libraries
[ ] Verified library versions are current
[ ] Searched for current best practices (with year)
[ ] Reviewed security considerations for this domain
[ ] Confirmed patterns I'll use aren't deprecated
[ ] Identified any breaking changes in recent versions
```

**If any box is unchecked: RESEARCH FIRST.**

## Output

Proceed to implementation only when research is complete.
Document key findings in code comments for future reference.
