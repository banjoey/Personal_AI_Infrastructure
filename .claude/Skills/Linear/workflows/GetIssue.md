# GetIssue Workflow

Get detailed information about a single Linear issue.

## Prerequisites

- Linear API key in macOS keychain
- bun installed for running TypeScript tools
- Issue identifier (e.g., MML-14)

## Procedure

1. **Identify the issue:**
   - Get the issue identifier (e.g., MML-14)

2. **Run the GetIssue tool:**

```bash
cd ${PAI_DIR}/.claude/skills/Linear
bun run tools/GetIssue.ts IDENTIFIER [--format=text|json]
```

3. **Present the information:**
   - Text format: Human-readable summary
   - JSON format: Full issue object for processing

## Examples

```bash
# Get issue details (text format)
bun run tools/GetIssue.ts MML-14

# Get issue as JSON
bun run tools/GetIssue.ts MML-14 --format=json
```

## Output (Text Format)

```
MML-14: Initial Requirements Definition
============================================================
State:    Done
Priority: Medium
Project:  BF Infrastructure Reboot
URL:      https://linear.app/mml-bfinfrastructure/issue/MML-14
Created:  12/24/2025, 7:33:25 AM
Updated:  12/24/2025, 8:21:37 AM

Description:
----------------------------------------
Define initial requirements for the infrastructure reboot project.

Sub-issues:
  - MML-15: Security requirements [In Progress]
  - MML-16: Network requirements [Done]
```

## Use Cases

- **Before updating:** Verify current state of an issue
- **Researching:** Get full context including description and sub-issues
- **Reporting:** Get issue URL to share with others
- **Sub-issue navigation:** See parent and child issues
