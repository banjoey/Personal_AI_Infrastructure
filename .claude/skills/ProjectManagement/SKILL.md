---
name: ProjectManagement
description: Agile project management for infrastructure and development projects. USE WHEN planning sprints, managing backlogs, tracking progress, organizing epics, OR coordinating work across multiple workstreams. Enforces structured planning and execution patterns.
---

# ProjectManagement

Project management skill for organizing and tracking infrastructure and development work using Agile methodologies.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName ProjectManagement
```

| Workflow | Trigger | File |
|----------|---------|------|
| **CreateEpic** | "create epic", "new epic", "major initiative" | `workflows/CreateEpic.md` |
| **PlanSprint** | "plan sprint", "sprint planning", "next sprint" | `workflows/PlanSprint.md` |
| **RefineBacklog** | "refine backlog", "groom stories", "prioritize" | `workflows/RefineBacklog.md` |
| **TrackProgress** | "status update", "progress report", "where are we" | `workflows/TrackProgress.md` |
| **RunRetrospective** | "retrospective", "retro", "what went well" | `workflows/RunRetrospective.md` |
| **ManageDependencies** | "dependencies", "what blocks what", "critical path" | `workflows/ManageDependencies.md` |
| **EstimateWork** | "estimate", "how long", "sizing" | `workflows/EstimateWork.md` |

## Examples

**Example 1: Create new epic**
```
User: "Create an epic for the observability stack"
→ Invokes CreateEpic workflow
→ Defines epic scope and goals
→ Breaks into stories
→ Identifies dependencies
→ Creates tracking structure in Joplin
```

**Example 2: Sprint planning**
```
User: "Plan the next sprint"
→ Invokes PlanSprint workflow
→ Reviews backlog priorities
→ Assesses team capacity
→ Selects stories for sprint
→ Identifies risks and dependencies
→ Documents sprint goals
```

**Example 3: Progress tracking**
```
User: "Where are we on the infrastructure project?"
→ Invokes TrackProgress workflow
→ Reviews epic status
→ Identifies blocked items
→ Calculates burn-down
→ Reports with recommendations
```

## Agile Framework

### Hierarchy

```
INITIATIVE (Big Vision)
└── EPIC (Major Workstream)
    └── STORY (Deliverable Unit)
        └── TASK (Work Item)
```

### Story Format

```markdown
## Story: [Title]

**As a** [persona/role]
**I want** [capability]
**So that** [benefit]

### Acceptance Criteria
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]

### Technical Notes
- [Implementation considerations]
- [Dependencies]

### Estimate
- Size: [S/M/L/XL]
- Effort: [hours/days]
```

### Sprint Structure

```
Sprint Duration: 2 weeks

Week 1:
├── Day 1-2: Sprint Planning, start work
├── Day 3-5: Development
└── Midpoint check

Week 2:
├── Day 6-8: Development, testing
├── Day 9: Integration, documentation
└── Day 10: Demo, Retrospective
```

## Epic Template

```markdown
# Epic: [Title]

## Vision
[What are we trying to achieve?]

## Goals
1. [Measurable goal 1]
2. [Measurable goal 2]
3. [Measurable goal 3]

## Success Criteria
- [ ] [How do we know we're done?]
- [ ] [What does success look like?]

## Stories
| ID | Story | Size | Priority | Status |
|----|-------|------|----------|--------|
| 1 | [Story title] | M | P1 | Todo |
| 2 | [Story title] | S | P2 | Todo |

## Dependencies
- [What must happen first?]
- [What external factors?]

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk] | High/Med/Low | High/Med/Low | [Plan] |

## Timeline
- Start: [Date]
- Target Complete: [Date]
- Milestones: [Key dates]
```

## Prioritization Framework

### MoSCoW Method
- **Must Have**: Critical, non-negotiable
- **Should Have**: Important but not critical
- **Could Have**: Nice to have
- **Won't Have**: Out of scope (this time)

### Priority Matrix

| | High Impact | Low Impact |
|---|-------------|------------|
| **Low Effort** | Do First | Quick Wins |
| **High Effort** | Plan Carefully | Deprioritize |

## Estimation Guidelines

### T-Shirt Sizing

| Size | Description | Typical Duration |
|------|-------------|------------------|
| XS | Trivial change, < 1 hour | Same day |
| S | Simple, well-understood | 1-2 days |
| M | Moderate complexity | 3-5 days |
| L | Complex, some unknowns | 1-2 weeks |
| XL | Very complex, many unknowns | 2+ weeks (break down) |

### Estimation Anti-Patterns
- Don't estimate in hours (false precision)
- Don't estimate unknowns (spike first)
- Don't commit to XL stories (break them down)

## Tracking Locations

### Joplin Notebooks
- `Projects/` - Active project tracking
- `Projects/{project}/Epics/` - Epic definitions
- `Projects/{project}/Sprints/` - Sprint records

### Status Indicators
- `[TODO]` - Not started
- `[IN PROGRESS]` - Actively working
- `[BLOCKED]` - Waiting on dependency
- `[REVIEW]` - Needs validation
- `[DONE]` - Completed

## Ceremonies

### Sprint Planning
- Review backlog priorities
- Select stories for sprint
- Identify dependencies
- Define sprint goal

### Daily Standup (for Standups)
- What did we accomplish?
- What's the plan today?
- What's blocking us?

### Sprint Review
- Demo completed work
- Gather feedback
- Update backlog

### Retrospective
- What went well?
- What didn't go well?
- What will we try differently?

## Related Skills

- **Standup** - For multi-agent decision making
- **AgilePm** - Extended Agile capabilities
- **Adr** - For recording decisions

## Integration Points

- Works with Standup skill for collaborative planning
- Records decisions in ADRs
- Documents in Joplin
- Tracks in structured markdown files
