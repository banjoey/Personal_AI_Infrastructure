---
name: AgilePm
description: Agile project management with Linear integration. USE WHEN user needs PRD creation, epic decomposition, user story generation, sprint planning, OR wants to sync agile artifacts to Linear. Provides CLI tools for deterministic issue tracking.
---

# AgilePm

Structured agile workflows for software development. Transform ideas into executable plans with PRDs, epics, user stories, and sprint tracking - all synced to Linear.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName AgilePm
```

| Workflow | Trigger | File |
|----------|---------|------|
| **CreatePrd** | "create PRD", "new project", "product requirements" | `workflows/CreatePrd.md` |
| **CreateTechnicalSpec** | "technical spec", "system design", "architecture doc" | `workflows/CreateTechnicalSpec.md` |
| **CreateEpics** | "create epics", "break down PRD", "decompose features" | `workflows/CreateEpics.md` |
| **CreateStories** | "create stories", "user stories", "acceptance criteria" | `workflows/CreateStories.md` |
| **SprintPlanning** | "plan sprint", "organize work", "sprint status" | `workflows/SprintPlanning.md` |

## Tools

All tools are TypeScript files that integrate with the Linear skill.

| Tool | Purpose | File |
|------|---------|------|
| **SyncToLinear** | Sync epics/stories to Linear issues | `tools/SyncToLinear.ts` |
| **SprintStatus** | Get current sprint status from Linear | `tools/SprintStatus.ts` |

## Examples

**Example 1: Create PRD and sync to Linear**
```
User: "Create a PRD for user authentication and sync to Linear"
→ Invokes CreatePrd workflow
→ Generates docs/PRD.md with features and architecture
→ Runs tools/SyncToLinear.ts docs/epics.md
→ Returns: PRD created, 4 epics synced as MML-200 through MML-203
```

**Example 2: Check sprint status**
```
User: "What's our sprint status?"
→ Runs tools/SprintStatus.ts
→ Returns: 3 in progress, 5 todo, 12 backlog, velocity metrics
```

**Example 3: Create stories from epic**
```
User: "Create user stories for the authentication epic"
→ Invokes CreateStories workflow
→ Generates docs/stories.md with acceptance criteria
→ Runs tools/SyncToLinear.ts docs/stories.md --parent=MML-200
→ Returns: 8 stories created as sub-issues of MML-200
```

## Integration

- **Linear Skill:** Uses Linear tools for issue creation and tracking
- **Security Skill:** Adds security requirements to stories
- **TestArchitect Skill:** Adds test strategy to PRD
- **Standup Skill:** Collaborative sprint planning sessions

## Templates

| Template | Purpose | File |
|----------|---------|------|
| PRD | Product requirements document | `templates/prd-template.md` |
| Epic | Epic description | `templates/epic-template.md` |
| Story | User story with AC | `templates/story-template.md` |
| Sprint Status | YAML tracking file | `templates/sprint-status-template.yaml` |

## Methodology

This skill follows agile best practices:
- **User-centric:** Start with WHY (user value)
- **Iterative:** PRD → Epics → Stories → Sprints
- **Testable:** Acceptance criteria drive development
- **Tracked:** All work synced to Linear

Based on BMAD METHOD patterns adapted for PAI architecture.

## Common Operations

### Sync epics to Linear
```bash
bun run tools/SyncToLinear.ts docs/epics.md --dry-run
bun run tools/SyncToLinear.ts docs/epics.md
```

### Create stories as sub-issues
```bash
bun run tools/SyncToLinear.ts docs/stories.md --parent=MML-123
```

### Get sprint status
```bash
bun run tools/SprintStatus.ts
bun run tools/SprintStatus.ts --format=yaml
```
