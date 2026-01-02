---
name: Forgetting
description: Memory lifecycle management for PAI. USE WHEN user mentions forgetting, archiving completed items, memory cleanup, stale items, weekly synthesis, change tracking, retrospective, OR wants to compress, archive, or manage what PAI remembers.
---

# Forgetting

Manages the three-stage memory lifecycle: Active → Archived → Pointer. Enables hypothesis-driven change tracking and weekly reflection on effectiveness.

## Architecture

```
Active Items (BACKLOG.md)
        ↓ Complete
Archived Items (captures/archive/)
        ↓ Time passes (90+ days)
Pointers (POINTERS.md)
```

**Principle:** Forgetting is intentional, not accidental. Every transition is explicit and tracked.

## Workflow Routing

**When executing a workflow, do BOTH of these:**

1. **Call the notification script** (for observability tracking):
   ```bash
   ~/.claude/Tools/SkillWorkflowNotification WORKFLOWNAME Forgetting
   ```

2. **Output the text notification** (for user visibility):
   ```
   Running the **WorkflowName** workflow from the **Forgetting** skill...
   ```

| Workflow | Trigger | File |
|----------|---------|------|
| **GenerateCandidates** | "what can I forget", "forgetting candidates", "memory cleanup" | `workflows/GenerateCandidates.md` |
| **ArchiveItem** | "archive this", "mark as done and archive" | `workflows/ArchiveItem.md` |
| **TrackChange** | "track this change", "record what we changed" | `workflows/TrackChange.md` |
| **WeeklySynthesis** | "weekly review", "synthesize changes", "how effective were changes" | `workflows/WeeklySynthesis.md` |
| **ConvertToPointer** | "convert to pointer", "compress archive" | `workflows/ConvertToPointer.md` |
| **AutomationSetup** | "enable automatic synthesis", "schedule weekly synthesis", "automate forgetting" | `workflows/AutomationSetup.md` |

## Examples

**Example 1: Weekly memory review**
```
User: "Run the weekly synthesis"
→ Invokes WeeklySynthesis workflow
→ Gathers changes and sessions from past 7 days
→ Analyzes change effectiveness
→ Generates WEEKLY-SYNTHESIS.md with suggestions
→ Reports: 3 effective, 1 unclear, 0 unused changes
```

**Example 2: Archive a completed project**
```
User: "Archive ACT-001, we finished the DNS migration"
→ Invokes ArchiveItem workflow
→ Generates retrospective prompts
→ Creates archive entry with summary
→ Removes from BACKLOG.md
→ Tracks the change for reflection
```

**Example 3: Find things to forget**
```
User: "What can I forget? My backlog feels cluttered"
→ Invokes GenerateCandidates workflow
→ Scans BACKLOG.md for completed and stale items
→ Checks archive for items ready to become pointers
→ Generates FORGETTING-CANDIDATES.md
→ Reports: 5 ready for archive, 2 stale, 1 ready for pointer
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CAPTURE_TOOLS` | Path to CaptureIntelligence tools | `~/src/pai/CaptureIntelligence/tools` |
| `WORKSPACE_ROOT` | Root workspace for captures | `~/workshop` |

## Change Tracking

Changes are tracked with hypotheses for later effectiveness measurement:

```json
{
  "id": "CHANGE-2026-01-02-001",
  "type": "claude-md",
  "target": "~/workshop/church/CLAUDE.md",
  "change": "Added shut-in visitation tracking",
  "source": "PROP-001",
  "hypothesis": "Will help remember to document visits",
  "applied": "2026-01-02T14:30:00Z"
}
```

**Change Types:**
- `claude-md` - Updates to CLAUDE.md files
- `strategy` - Changes to STRATEGY.md
- `workflow` - Process improvements
- `skill` - Skill updates
- `automation` - Automation additions
- `backlog` - Backlog modifications

## Effectiveness Assessment

The synthesis workflow assesses changes after 3+ days:

| Assessment | Meaning | Action |
|------------|---------|--------|
| `effective` | Evidence of usage found | Keep and expand |
| `unclear` | Sessions exist but no clear evidence | Review in 1-2 weeks |
| `not-used` | No sessions after change | Review relevance |
| `needs-more-time` | Less than 3 days since applied | Wait |

## Integration Points

- **MeetingIntelligence:** Consumes session outputs for synthesis
- **SessionIntelligence:** Provides session data for effectiveness analysis
- **Linear:** Can archive items synced from Linear
- **Joplin:** Archive summaries can be stored in Joplin

## Forgetting Philosophy

1. **Active items** are things you're working on now
2. **Archived items** are compressed summaries of completed work
3. **Pointers** are just references ("we did X, see archive if needed")
4. **Forgotten** items are completely removed

The goal is to reduce cognitive load while preserving the ability to recall important context when needed.
