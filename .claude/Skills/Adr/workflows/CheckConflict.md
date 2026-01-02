# CheckConflict Workflow

**Purpose:** Check if a proposed action conflicts with existing ADRs.

## Execution Steps

1. **Identify the proposed action**
   - What is the user trying to do?
   - What domain does it affect? (infra, security, architecture, etc.)

2. **Scan relevant ADRs**
   ```bash
   # Search ADRs for related keywords
   grep -l "<keyword>" ${PAI_DIR}/docs/decisions/ADR-*.md
   grep -l "<keyword>" <project>/docs/decisions/ADR-*.md
   ```

3. **Analyze potential conflicts**
   For each potentially related ADR:
   - Read the Decision section
   - Compare with proposed action
   - Identify contradictions

4. **Report findings**

   **No conflicts:**
   > "Checked X ADRs. No conflicts with your proposed approach."

   **Conflict found:**
   > "This may conflict with ADR-XXX: [title]"
   > "[Explain the conflict]"
   > "Options: (1) Supersede ADR-XXX, (2) Adjust your approach, (3) Proceed anyway"

5. **If user chooses to supersede**
   - Invoke Supersede workflow
   - Create new ADR with updated decision

## Proactive Checking

**This workflow should run automatically when:**
- User proposes something that sounds architectural
- Implementation would contradict established patterns
- Keywords match existing ADR titles

**Example triggers:**
- "Let's add secrets to the manifest" → Check secrets ADRs
- "We should use npm instead" → Check package manager ADRs
- "Let's deploy directly without CI" → Check deployment ADRs

## Example

**User wants to hardcode a secret:**

```
User: "Just put the API key in the config file for now"

Charles: [Runs CheckConflict]
→ Finds ADR-001: Use Infisical for secrets
→ Conflict detected

Charles: "This conflicts with ADR-001 which states all secrets
must go through Infisical. Options:
1. Use Infisical as specified
2. Supersede ADR-001 with a new approach
3. Proceed anyway (document as exception)"
```

## Notes

- Be helpful, not blocking - offer alternatives
- Document exceptions if user proceeds despite conflict
- Minor deviations don't need full supersession
