# Supersede Workflow

**Purpose:** Mark an existing ADR as superseded and create the new decision.

## Execution Steps

1. **Identify the ADR to supersede**
   - User specifies by number or title
   - Verify it exists and is currently `accepted`

2. **Read the existing ADR**
   - Understand the original context and decision
   - This informs the new ADR's "Alternatives Considered"

3. **Create the new ADR**
   - Follow Create workflow
   - Reference the superseded ADR in context
   - Include "supersedes ADR-XXX" in the decision

4. **Update the old ADR**
   - Change status to: `superseded by ADR-YYY`
   - Add note at top explaining the supersession
   - Do NOT delete the original content

5. **Verify both files**
   - Read back the old ADR (confirm status updated)
   - Read back the new ADR (confirm it references the old)

## Example

**Superseding ADR-001 (Vault) with ADR-005 (Infisical):**

Old ADR-001 becomes:
```markdown
# ADR-001: Use HashiCorp Vault for secrets

**Status:** superseded by ADR-005

> **Note:** This decision was superseded on 2025-12-21.
> See ADR-005 for the current approach.

**Date:** 2025-11-15
...
```

New ADR-005:
```markdown
# ADR-005: Use Infisical for secrets management

**Status:** accepted

**Date:** 2025-12-21

**Context:**
ADR-001 established Vault as our secrets solution. However,
Vault's operational complexity proved too high for our team size...

**Decision:**
We will use Infisical instead of Vault. This supersedes ADR-001.
...
```

## Notes

- Never delete superseded ADRs (they provide historical context)
- Both ADRs must cross-reference each other
- The superseding ADR should explain WHY the change was made
