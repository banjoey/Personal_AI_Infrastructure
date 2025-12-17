# AddFeature Workflow

Add a new feature to an existing project with proper spec updates, tests, and implementation.

## When to Use

- Adding new functionality to existing project
- Implementing a feature from the backlog
- Extending current capabilities

## Prerequisites

- Project exists with `.claude/project.json`
- PRD exists (will update it)
- Test strategy exists (will update it)

## Workflow Steps

### Step 1: Verify Project Context

Check that required artifacts exist:

```
Check: .claude/project.json exists?
  NO → "This project needs initialization. Use NewProject workflow."
  YES → Continue

Check: PRD exists at configured location?
  NO → "No spec found. Let's create one first." → AgilePm/CreatePrd
  YES → Continue
```

---

### Step 2: Document the Feature

Update the PRD with the new feature:

**Questions:**
1. What does this feature do?
2. Why is it needed? (user value)
3. What priority? (Must/Should/Could)
4. Any dependencies on existing features?
5. Acceptance criteria?

**Action:**
- Add feature to appropriate section of PRD (Must Have / Should Have / Could Have)
- Include user value and acceptance criteria
- Update implementation checklist

---

### Step 3: Update Test Strategy

**Delegate to:** TestArchitect

```
Invoke: TestArchitect skill
Input: New feature description, acceptance criteria
Output: Updated test strategy with new test cases
```

Define tests BEFORE implementation (TDD):

- Unit tests for new functions
- Integration tests for feature flows
- E2E tests for user-facing features

---

### Step 4: Implementation

Implement the feature following stack standards:

**Code Standards:**
- TypeScript strict mode
- No `any` types (unless truly unavoidable)
- Proper error handling
- Input validation
- Comments for complex logic

**TDD Flow:**
1. Write failing test
2. Implement minimum code to pass
3. Refactor for quality
4. Repeat

---

### Step 5: Verify Tests Pass

```bash
# Run all tests
bun test

# Check coverage
bun test --coverage
```

**BLOCK until:** All tests pass, coverage meets threshold (typically 80%+)

---

### Step 6: Security Check

Quick security validation:

- [ ] No hardcoded secrets
- [ ] Input validation on user data
- [ ] Output encoding (prevent XSS)
- [ ] SQL parameterization (if applicable)
- [ ] No new dependencies with known vulnerabilities

---

### Step 7: Update Documentation

- Update README if needed
- Add JSDoc/TSDoc comments
- Update API docs if applicable

---

## Checklist Before Complete

- [ ] Feature added to PRD
- [ ] Test cases written BEFORE code
- [ ] Implementation follows stack standards
- [ ] All tests pass
- [ ] No security issues introduced
- [ ] Documentation updated
- [ ] Ready for code review

---

## Time Estimate

| Feature Size | Time |
|--------------|------|
| Small (1 function) | 15-30 min |
| Medium (multiple files) | 1-2 hours |
| Large (new subsystem) | 2-4 hours |

---

## Example

```
User: "Add a /health endpoint to the API"

AddFeature workflow:
1. ✓ Project exists (.claude/project.json found)
2. ✓ PRD exists (docs/PRD.md)
3. Update PRD:
   - Add "/health endpoint" to Must Have features
   - Acceptance: Returns 200 with uptime, version, status
4. Write tests first:
   - test_health_returns_200()
   - test_health_includes_uptime()
   - test_health_includes_version()
5. Implement:
   - Create src/routes/health.ts
   - Add to router
6. ✓ Tests pass
7. ✓ No security issues
8. Update README with new endpoint

Ready for deployment.
```

---

**AddFeature ensures every change is spec'd, tested, and reviewed.**
