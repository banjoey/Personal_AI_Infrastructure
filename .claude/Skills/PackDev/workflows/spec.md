# Workflow: Writing Specifications

Use this workflow during the SPEC phase.

---

## Purpose

Define WHAT we're building. Not how—just what.

---

## Steps

### 1. Understand the Problem

Before writing anything, answer:
- Who has this problem?
- Why does it matter?
- What happens if we don't solve it?

### 2. Create spec.md

Use the template from `templates/spec.template.md`.

Required sections:
- Problem Statement (2-3 sentences, specific)
- Goals (measurable outcomes)
- Non-Goals (explicit scope boundaries)
- Acceptance Criteria (testable, binary)
- Edge Cases (what could go wrong)
- Constraints (limits we must respect)
- Open Questions (for human decision)

### 3. Self-Review

Before marking complete, verify:
- [ ] Problem statement is specific, not vague
- [ ] Goals are measurable
- [ ] Acceptance criteria are testable (pass/fail)
- [ ] Edge cases have defined handling
- [ ] Open questions are flagged

### 4. Queue for Review

Move story to "Spec Ready" in Linear. It will be reviewed in the next Handler session.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Jumping to solutions | Focus on the problem, not how to solve it |
| Vague acceptance criteria | Make them binary: "User can X" not "Good UX" |
| Missing edge cases | Ask "what if X fails?" for every component |
| Scope creep | If it's not in Goals, add it to Non-Goals |

---

## Example

**Bad:** "Make the login better"

**Good:** 
```markdown
## Problem Statement
Users are abandoning the login flow at a 40% rate. Analytics show 
they're confused by the password requirements, which aren't shown 
until after they submit.

## Goals
1. Reduce login abandonment rate to under 15%
2. Show password requirements before user submits

## Acceptance Criteria
- [ ] Password requirements visible while typing
- [ ] Requirements update in real-time as user types
- [ ] Clear visual indicator for met/unmet requirements
```

---

## Output

When complete, you should have:
- `spec.md` in the story folder
- Story status: "Spec Ready" in Linear
