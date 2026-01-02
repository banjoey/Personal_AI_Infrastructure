# UpdateIssue Workflow

Update an existing Linear issue.

## Prerequisites

- Linear API key in macOS keychain
- bun installed for running TypeScript tools
- Issue identifier (e.g., MML-14)

## Procedure

1. **Identify the issue:**
   - Get the issue identifier (e.g., MML-14)
   - Optionally run GetIssue first to verify current state

2. **Determine what to update:**
   - State: backlog, todo, inProgress, done, canceled
   - Priority: 0=None, 1=Urgent, 2=High, 3=Medium, 4=Low
   - Title: new title string
   - Description: new description

3. **Run the UpdateIssue tool:**

```bash
cd ${PAI_DIR}/.claude/skills/Linear
bun run tools/UpdateIssue.ts IDENTIFIER [--state=STATE] [--priority=N] [--title="Title"] [--description="Desc"]
```

4. **Confirm the update:**
   - Tool outputs the updated issue state
   - Report confirmation to user

## Examples

```bash
# Mark issue as done
bun run tools/UpdateIssue.ts MML-14 --state=done

# Escalate priority and move to in progress
bun run tools/UpdateIssue.ts MML-15 --priority=1 --state=inProgress

# Update title
bun run tools/UpdateIssue.ts MML-16 --title="Updated title with more detail"

# Cancel an issue
bun run tools/UpdateIssue.ts MML-17 --state=canceled
```

## Common State Transitions

| From | To | When |
|------|-----|------|
| Backlog | Todo | Issue is prioritized for upcoming work |
| Todo | In Progress | Work has started |
| In Progress | Done | Work is complete |
| Any | Canceled | Issue is no longer needed |
| In Progress | Backlog | Work deprioritized |
