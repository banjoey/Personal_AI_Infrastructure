# ListIssues Workflow

List issues from Linear with optional filters.

## Prerequisites

- Linear API key in macOS keychain
- bun installed for running TypeScript tools

## Procedure

1. **Determine filter criteria:**
   - State filter: backlog, todo, inProgress, done, all (default: all)
   - Limit: max issues to return (default: 20)
   - Format: table, json, simple (default: table)

2. **Run the ListIssues tool:**

```bash
cd ${PAI_DIR}/.claude/skills/Linear
bun run tools/ListIssues.ts [--state=STATE] [--limit=N] [--format=FORMAT]
```

3. **Present results:**
   - Table format for human-readable output
   - JSON format for further processing
   - Simple format for quick scanning

## Examples

```bash
# List all issues (default)
bun run tools/ListIssues.ts

# List backlog only
bun run tools/ListIssues.ts --state=backlog

# List in-progress issues as JSON
bun run tools/ListIssues.ts --state=inProgress --format=json

# List top 5 issues
bun run tools/ListIssues.ts --limit=5
```

## Output Formats

### Table (default)
```
ID       | State       | Priority | Title
---------|-------------|----------|--------------------------------------------------
MML-14   | Done        | Medium   | Requirements standup review
MML-15   | In Progress | High     | Security architecture section
```

### Simple
```
MML-14: Requirements standup review [Done]
MML-15: Security architecture section [In Progress]
```

### JSON
Full issue objects as JSON array.
