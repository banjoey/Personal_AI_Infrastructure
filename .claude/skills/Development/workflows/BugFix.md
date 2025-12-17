# BugFix Workflow

Fix bugs with proper reproduction, root cause analysis, and regression testing.

## When to Use

- Fixing reported bugs
- Addressing failing tests
- Resolving production issues

## Workflow Steps

### Step 1: Reproduce the Bug

Before fixing, verify the bug exists:

**Questions:**
1. What is the expected behavior?
2. What is the actual behavior?
3. Steps to reproduce?
4. Environment (production, staging, local)?
5. Error messages or logs?

**Create reproduction test:**
```typescript
test('bug: [description of issue]', () => {
  // This test should FAIL before fix
  // and PASS after fix
});
```

---

### Step 2: Root Cause Analysis

Investigate the actual cause:

**Checklist:**
- [ ] Check error logs
- [ ] Trace code path
- [ ] Identify the faulty logic
- [ ] Check recent changes (git blame, git log)
- [ ] Check for related issues

**Document:**
```markdown
## Bug Analysis

**Symptom:** [What user sees]
**Root Cause:** [Actual code issue]
**Location:** [File:line]
**Introduced:** [Commit or date if known]
```

---

### Step 3: Write Regression Test

BEFORE fixing, write a test that:
- Currently FAILS (proves bug exists)
- Will PASS after fix (proves fix works)
- Stays in test suite forever (prevents regression)

```typescript
describe('regression: issue-123', () => {
  test('should not [describe bug behavior]', () => {
    // Arrange
    const input = /* problematic input */;

    // Act
    const result = functionWithBug(input);

    // Assert
    expect(result).not.toBe(/* buggy output */);
    expect(result).toBe(/* correct output */);
  });
});
```

---

### Step 4: Implement Fix

Fix the bug with minimal changes:

**Principles:**
- Fix the root cause, not symptoms
- Minimal change to reduce risk
- Follow existing code patterns
- Add comments explaining the fix

**Bad fix:**
```typescript
// WRONG: Hiding the symptom
try {
  riskyOperation();
} catch (e) {
  // Ignore error
}
```

**Good fix:**
```typescript
// RIGHT: Fix the root cause
if (!isValidInput(data)) {
  throw new ValidationError('Invalid input: ' + reason);
}
riskyOperation(validatedData);
```

---

### Step 5: Verify Fix

Run tests to confirm:

```bash
# Run the regression test
bun test --grep "regression: issue-123"

# Run all tests to check for side effects
bun test
```

**BLOCK until:**
- Regression test passes
- All other tests still pass
- No new failures introduced

---

### Step 6: Update Documentation

If the bug reveals a gap:
- Update API docs if behavior was unclear
- Add examples if usage was confusing
- Update README if setup was wrong

---

## Bug Severity Guide

| Severity | Response Time | Examples |
|----------|---------------|----------|
| Critical | Immediate | Data loss, security breach, complete outage |
| High | Same day | Major feature broken, significant user impact |
| Medium | This sprint | Minor feature broken, workaround exists |
| Low | Backlog | Cosmetic, edge case, minor inconvenience |

---

## Checklist Before Complete

- [ ] Bug reproduced and understood
- [ ] Root cause identified (not just symptom)
- [ ] Regression test written and fails before fix
- [ ] Fix implemented with minimal changes
- [ ] All tests pass
- [ ] No side effects introduced
- [ ] Documentation updated if needed

---

## Example

```
User: "Users are getting 500 errors when submitting forms with emojis"

BugFix workflow:
1. Reproduce:
   - Submit form with emoji "Hello 👋"
   - Error: 500 Internal Server Error
   - Log: "UnicodeEncodeError in save_message()"

2. Root Cause:
   - Database column is VARCHAR instead of NVARCHAR
   - Unicode characters not supported

3. Regression Test:
   test('should handle emoji in messages', () => {
     const result = saveMessage('Hello 👋');
     expect(result.success).toBe(true);
   });
   // Currently FAILS ❌

4. Fix:
   - Migrate column to NVARCHAR
   - Update schema definition

5. Verify:
   - Regression test now PASSES ✓
   - All other tests PASS ✓

6. Documentation:
   - Add note about unicode support in API docs

Done. Bug fixed with permanent regression protection.
```

---

**BugFix ensures bugs stay fixed. Forever.**
