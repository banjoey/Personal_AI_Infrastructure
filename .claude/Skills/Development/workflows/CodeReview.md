# CodeReview Workflow

Comprehensive code review before merge, covering quality, security, and standards.

## When to Use

- Before merging feature branch
- Before deploying to production
- When reviewing pull requests
- Quality gate before release

## Review Checklist

### 1. Code Quality

**Structure & Organization:**
- [ ] Clear file and folder structure
- [ ] Single responsibility per file/function
- [ ] No files over 300 lines (split if larger)
- [ ] Consistent naming conventions

**Readability:**
- [ ] Self-documenting code (clear names)
- [ ] Comments for complex logic only
- [ ] No commented-out code
- [ ] Consistent formatting (run linter)

**TypeScript Specific:**
- [ ] No `any` types (except truly unavoidable)
- [ ] Proper type definitions
- [ ] Strict mode enabled
- [ ] No type assertions without justification

---

### 2. Stack Standards Compliance

**Verify correct technologies:**

| Component | Required | Violations |
|-----------|----------|------------|
| Package manager | bun (TS) / uv (Py) | npm, yarn, pip |
| Backend | Bun + TypeScript | Node, JavaScript |
| Frontend | Next.js + Tailwind | CRA, plain CSS |
| Components | shadcn/ui | MUI, Bootstrap |
| ORM | Drizzle | Prisma, Sequelize |

**Flag violations:**
```
STACK VIOLATION: Found npm in package-lock.json
Action: Remove package-lock.json, use bun.lockb instead
```

---

### 3. Testing Coverage

**Delegate to:** TestArchitect

```
Check:
- [ ] Unit tests for new functions
- [ ] Integration tests for new flows
- [ ] E2E tests for user-facing features
- [ ] Coverage meets threshold (80%+)
- [ ] All tests pass
```

**Run:**
```bash
bun test --coverage
```

---

### 4. Security Review

**Delegate to:** Security skill

**Critical Checks:**
- [ ] No hardcoded secrets (API keys, passwords)
- [ ] No secrets in git history
- [ ] Input validation on all user data
- [ ] Output encoding (XSS prevention)
- [ ] SQL parameterization (injection prevention)
- [ ] Authentication on protected routes
- [ ] Authorization checks
- [ ] No sensitive data in logs
- [ ] Dependencies have no critical CVEs

**Run security scan:**
```bash
# Check dependencies
bun audit

# Check for secrets
git secrets --scan
```

---

### 5. Performance Considerations

- [ ] No N+1 queries
- [ ] Appropriate indexing for queries
- [ ] No blocking operations in hot paths
- [ ] Pagination for large data sets
- [ ] Caching where appropriate

---

### 6. Error Handling

- [ ] All errors caught and handled
- [ ] User-friendly error messages
- [ ] Errors logged with context
- [ ] No silent failures
- [ ] Graceful degradation

---

### 7. Documentation

- [ ] README updated if needed
- [ ] API docs updated
- [ ] JSDoc/TSDoc for public functions
- [ ] Changelog updated
- [ ] Migration notes if breaking changes

---

## Review Output Format

```markdown
## Code Review: [PR/Branch Name]

**Reviewer:** Charles (PAI)
**Date:** [Date]
**Verdict:** APPROVED / CHANGES REQUESTED / BLOCKED

### Summary
[1-2 sentence summary]

### Findings

#### Critical (Must Fix)
- [ ] Issue 1: [Description] - [File:Line]
- [ ] Issue 2: [Description] - [File:Line]

#### Important (Should Fix)
- [ ] Issue 3: [Description]
- [ ] Issue 4: [Description]

#### Minor (Nice to Fix)
- [ ] Issue 5: [Description]

### Stack Compliance
✓ Package manager: bun
✓ Framework: Next.js
✓ Styling: Tailwind
✗ VIOLATION: Found npm usage in scripts

### Test Coverage
- Coverage: 85% (meets 80% threshold)
- All tests passing: YES
- New tests added: YES

### Security
- Secrets scan: PASS
- Dependency audit: PASS (0 critical, 2 moderate)
- Input validation: PASS

### Recommendation
[Approve/Request changes/Block] because [reason]
```

---

## Severity Definitions

| Level | Meaning | Action |
|-------|---------|--------|
| Critical | Security issue, data loss risk, broken feature | BLOCK merge |
| Important | Bug, significant code smell, missing tests | Request changes |
| Minor | Style, optimization, nice-to-have | Approve with comments |

---

## Example Review

```
User: "Review the auth feature branch before merge"

CodeReview workflow:

## Code Review: feature/user-auth

**Verdict:** CHANGES REQUESTED

### Critical
- [ ] Hardcoded JWT secret in auth.ts:42
      Fix: Move to environment variable

### Important
- [ ] Missing input validation on login endpoint
- [ ] No rate limiting on auth routes

### Minor
- [ ] Consider extracting token generation to util

### Stack Compliance
✓ All stack standards met

### Test Coverage
- 78% (below 80% threshold - needs 2 more tests)

### Security
✗ FAIL: Hardcoded secret found

### Recommendation
Request changes. Critical security issue must be fixed.
Address test coverage before merge.
```

---

**CodeReview is the last line of defense. Be thorough.**
