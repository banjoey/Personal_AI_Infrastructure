---
name: Linear
description: Linear issue tracking and project management. USE WHEN user mentions Linear, issues, tickets, backlog, sprint, project tracking, work items, OR needs to create/update/list issues. Provides typed TypeScript tools that call Linear API directly via SDK.
---

# Linear

Issue tracking and project management for PAI projects via the Linear API.

## Authentication

API key stored in macOS keychain:
- **Service:** `linear-api`
- **Account:** `charles`
- **Retrieve:** `security find-generic-password -s linear-api -a charles -w`

## Current Context

- **Team:** Mml-bfinfrastructure (key: MML)
- **Team ID:** `15684d66-6303-4ded-9cea-14dfeea19b9d`
- **Project:** BF Infrastructure Reboot
- **Project ID:** `713157e0-2883-4329-b54d-fe2ca9170652`

## Workflow States

| State | Type | ID |
|-------|------|-----|
| Backlog | backlog | `57ab3890-4ee6-4a89-8ce9-bd077d4c2709` |
| Todo | unstarted | `02e5e9c4-8e92-4ff0-aff9-b5e84890ce39` |
| In Progress | started | `4451e667-7eb1-4140-a37e-c57ccc7f770e` |
| Done | completed | `abf159b0-320d-4d1b-97a8-d218056311fb` |
| Canceled | canceled | `d2c78f4c-c6d9-4fa2-9a90-47c59f5e1bf3` |
| Duplicate | canceled | `1fa9e915-9cf1-40e0-8512-c4113cb1283e` |

## Workflow Routing

**When executing a workflow, output this notification:**

```
Running the **WorkflowName** workflow from the **Linear** skill...
```

| Workflow | Trigger | File |
|----------|---------|------|
| **CreateIssue** | "create issue", "new ticket", "add to backlog" | `workflows/CreateIssue.md` |
| **ListIssues** | "list issues", "show backlog", "what's in progress" | `workflows/ListIssues.md` |
| **UpdateIssue** | "update issue", "move to done", "change status" | `workflows/UpdateIssue.md` |
| **CreateSubIssue** | "create sub-issue", "add subtask" | `workflows/CreateSubIssue.md` |

## Tools

All tools are TypeScript files that call the Linear GraphQL API directly.

| Tool | Purpose | File |
|------|---------|------|
| **CreateIssue** | Create a new issue | `tools/CreateIssue.ts` |
| **ListIssues** | List issues with filters | `tools/ListIssues.ts` |
| **UpdateIssue** | Update issue status/fields | `tools/UpdateIssue.ts` |
| **GetIssue** | Get single issue details | `tools/GetIssue.ts` |

## Examples

**Example 1: Create an issue for the HLD**
```
User: "Create an issue for the HLD Security Architecture section"
→ Invokes CreateIssue workflow
→ Runs tools/CreateIssue.ts with title, project, team
→ Returns issue identifier (e.g., MML-32)
```

**Example 2: List backlog issues**
```
User: "What's in the backlog for BF Infrastructure?"
→ Invokes ListIssues workflow
→ Runs tools/ListIssues.ts with state filter
→ Returns formatted list of issues
```

**Example 3: Mark issue as done**
```
User: "Mark MML-14 as done"
→ Invokes UpdateIssue workflow
→ Runs tools/UpdateIssue.ts with identifier and stateId
→ Confirms update
```

## API Reference

- **Endpoint:** `https://api.linear.app/graphql`
- **Auth:** Bearer token from keychain
- **SDK:** `@linear/sdk` (optional, can use raw GraphQL)
- **Docs:** https://developers.linear.app/docs

## Priority Values

| Value | Meaning |
|-------|---------|
| 0 | No priority |
| 1 | Urgent |
| 2 | High |
| 3 | Medium |
| 4 | Low |
