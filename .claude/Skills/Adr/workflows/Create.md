# Create Workflow

**Purpose:** Create a new Architecture Decision Record.

## Execution Steps

1. **Determine scope**
   - Is this a project-specific or PAI-wide decision?
   - Project: `<project>/docs/decisions/`
   - PAI-wide: `${PAI_DIR}/docs/decisions/`

2. **Find next ADR number**
   ```bash
   ls <target-dir>/docs/decisions/ADR-*.md 2>/dev/null | sort -V | tail -1
   ```
   - Extract current highest number
   - Increment by 1
   - If no ADRs exist, start with 001

3. **Gather decision information**
   - Title (concise, descriptive)
   - Context (why this decision was needed)
   - Decision (what we chose)
   - Consequences (positive and negative)
   - Alternatives considered (and why rejected)

4. **Create the ADR file**
   - Filename: `ADR-XXX-descriptive-name.md`
   - Use lowercase-kebab-case for the name portion
   - Initial status: `accepted` (or `proposed` if needs review)

5. **Write the ADR**
   ```markdown
   # ADR-XXX: [Title]

   **Status:** accepted

   **Date:** YYYY-MM-DD

   **Context:**
   [Context gathered in step 3]

   **Decision:**
   [Decision gathered in step 3]

   **Consequences:**
   [Consequences gathered in step 3]

   **Alternatives Considered:**
   [Alternatives gathered in step 3]
   ```

6. **Verify creation**
   - Read the file back
   - Confirm it exists and is properly formatted
   - Report ADR number and path to user

## Example

**Creating an ADR for secrets management:**

```bash
# 1. Check existing ADRs
ls ~/PAI/docs/decisions/ADR-*.md 2>/dev/null

# 2. No existing ADRs, so this is ADR-001
# 3. Create docs/decisions/ if needed
mkdir -p ~/PAI/docs/decisions

# 4. Write the ADR
# (Use Write tool to create ADR-001-use-infisical-for-secrets.md)

# 5. Verify
cat ~/PAI/docs/decisions/ADR-001-use-infisical-for-secrets.md
```

## Proactive Trigger

When detecting decision language, prompt:
> "This sounds like an architectural decision: '[detected decision]'. Want me to record it as an ADR?"

If user confirms, gather any missing information through brief questions.

## Notes

- Always use today's date
- Keep titles concise but descriptive
- Context should explain the problem, not the solution
- Include both positive and negative consequences
- Don't skip Alternatives - even "do nothing" is an alternative
