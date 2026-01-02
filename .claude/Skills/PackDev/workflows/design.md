# Workflow: Writing Designs

Use this workflow during the DESIGN phase.

---

## Purpose

Define HOW we're building it. Architecture, interfaces, approach.

---

## Prerequisites

- Spec approved by Handler
- You've read and understood the spec completely

---

## Steps

### 1. Review the Spec

Read `spec.md` carefully. Understand:
- Every acceptance criterion
- Every edge case
- Every constraint

### 2. Design Architecture

Answer these questions:
- What components are needed?
- How do they interact?
- What data flows between them?

Create a diagram (ASCII or Mermaid).

### 3. Define Interfaces

Create `interfaces.ts` with:
- All types/interfaces the code will use
- Input/output types for each operation
- Error types

**Rule:** If code will call it, define the interface first.

### 4. Plan Testing

Create `tests.plan.md` with:
- What unit tests are needed
- What integration tests are needed
- How each acceptance criterion will be verified

### 5. Document Decisions

For each significant choice, record:
- What options you considered
- What you chose
- Why you chose it

### 6. Self-Review

Before marking complete, verify:
- [ ] Design addresses ALL acceptance criteria
- [ ] interfaces.ts compiles with `tsc --noEmit`
- [ ] Data flow is documented
- [ ] Error handling is designed (not just happy path)
- [ ] Risks are identified with mitigations

### 7. Queue for Review

Move story to "Design Ready" in Linear.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Over-engineering | Build for current requirements only |
| Missing interfaces | If you'll call it, define it |
| Happy path only | Design error handling explicitly |
| No rationale | Document WHY, not just WHAT |

---

## Interface Guidelines

```typescript
// GOOD: Clear, specific, documented
interface CreateUserInput {
  /** User's email address (must be unique) */
  email: string;
  
  /** Display name (2-50 characters) */
  name: string;
}

// BAD: Vague, no documentation
interface UserData {
  data: any;
}
```

---

## Output

When complete, you should have:
- `design.md` in the story folder
- `interfaces.ts` in the story folder (compiles cleanly)
- `tests.plan.md` in the story folder (recommended)
- Story status: "Design Ready" in Linear
