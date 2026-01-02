# Workflow: Verification

Use this workflow during the VERIFY phase.

---

## Purpose

Confirm the implementation is correct. Not just "it runs"—it's RIGHT.

---

## Prerequisites

- BUILD phase complete
- All unit tests pass
- Code compiles without errors

---

## Steps

### 1. Run All Tests

```bash
bun test
```

All tests must pass.

### 2. Check Coverage

```bash
bun test --coverage
```

Coverage should meet targets from tests.plan.md.

### 3. Verify Each Acceptance Criterion

Open `spec.md`. For EACH acceptance criterion:
1. Find the test(s) that verify it
2. Run those tests specifically
3. Document the evidence in verify.md

### 4. Test Edge Cases

From spec.md edge cases:
1. Verify each edge case has a test
2. Run edge case tests
3. Document results

### 5. Multi-Agent Standup

Review from four perspectives:

**Developer:** Is the code clean? Maintainable? Any obvious bugs?

**Security:** Input validation? Auth checks? Data protection?

**User:** Does it solve the problem? Is it usable?

**Reviewer:** Does it match spec? Does it match design?

### 6. Create verify.md

Document everything:
- Test results summary
- Acceptance criteria verification
- Edge case verification  
- Standup findings
- Any issues found and how they were resolved

### 7. Final Check

- [ ] All acceptance criteria verified
- [ ] All edge cases tested
- [ ] All tests pass
- [ ] No regressions
- [ ] verify.md complete

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| "Tests pass = verified" | Verify against spec, not just tests |
| Skipping edge cases | They're in spec for a reason |
| No evidence | Document HOW each criterion was verified |
| Rushing | VERIFY catches what BUILD missed |

---

## Output

When complete:
- `stories/PACK-XXX/verify.md` exists
- All tests pass
- Story ready for SHIP phase
