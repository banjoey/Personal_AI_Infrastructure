# Workflow: Building Implementation

Use this workflow during the BUILD phase.

---

## Purpose

Implement the solution. Write code that matches the design.

---

## Prerequisites

- Design approved by Handler
- You've read spec.md and design.md
- interfaces.ts exists and compiles

---

## Steps

### 1. Load Context

Read these files in order:
1. `stories/PACK-XXX/spec.md` - What we're building
2. `stories/PACK-XXX/design.md` - How we're building it
3. `stories/PACK-XXX/interfaces.ts` - The contracts

### 2. Set Up Structure

Create the file structure from design.md if it doesn't exist.

### 3. Implement in Order

Work through components in dependency order:
1. Types and interfaces (copy from interfaces.ts)
2. Utilities and helpers
3. Core logic
4. Integration points

### 4. Write Tests Alongside

For each component:
1. Write the test first (or alongside)
2. Implement the code
3. Run the test
4. Refactor if needed

### 5. Commit Frequently

After each logical chunk:
```bash
git add .
git commit -m "PACK-XXX: feat: implement [component]"
```

### 6. Self-Review Before Finishing

- [ ] Code matches interfaces.ts exactly
- [ ] All unit tests pass
- [ ] No TypeScript errors
- [ ] No hardcoded values that should be config
- [ ] Error handling implemented

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Not reading design first | Always load context |
| Giant commits | Commit after each component |
| Tests after code | Write test first, watch it fail |
| Ignoring interface types | Code MUST match interfaces.ts |

---

## Code Quality Checklist

Before moving to VERIFY:
- [ ] `bun run typecheck` passes
- [ ] `bun test` passes
- [ ] No `// TODO` comments left unaddressed
- [ ] No `any` types
- [ ] Error messages are helpful

---

## Output

When complete:
- Source code in `src/`
- Tests in `tests/`
- All tests passing
- Ready for VERIFY phase
