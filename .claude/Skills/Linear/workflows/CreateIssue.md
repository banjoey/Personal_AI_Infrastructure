# CreateIssue Workflow

Create a new issue in Linear.

## Prerequisites

- Linear API key in macOS keychain (`security find-generic-password -s linear-api -a charles -w`)
- bun installed for running TypeScript tools

## Procedure

1. **Gather issue details:**
   - Title (required)
   - Description (optional)
   - Priority: 1=Urgent, 2=High, 3=Medium, 4=Low (optional)
   - Initial state: backlog, todo, inProgress (optional, defaults to backlog)
   - Parent issue ID for sub-issues (optional)

2. **Run the CreateIssue tool:**

```bash
cd ${PAI_DIR}/.claude/skills/Linear
bun run tools/CreateIssue.ts "Issue title" ["Description"] [--priority=N] [--state=STATE] [--parent=ID]
```

3. **Capture the result:**
   - Tool returns the issue identifier (e.g., MML-32) and URL
   - Report the identifier to the user

## Examples

```bash
# Simple issue
bun run tools/CreateIssue.ts "Fix login bug"

# Issue with description and priority
bun run tools/CreateIssue.ts "Add dark mode" "User requested dark theme support" --priority=3

# Urgent issue starting in todo
bun run tools/CreateIssue.ts "Urgent security fix" --priority=1 --state=todo

# Sub-issue
bun run tools/CreateIssue.ts "Subtask for parent" --parent=PARENT_ID
```

## Error Handling

- If keychain access fails, user needs to add key: `security add-generic-password -s linear-api -a charles -w YOUR_KEY`
- If API returns error, check team/project IDs in LinearClient.ts
