# ArchiveItem Workflow

Archives a completed item from BACKLOG.md with optional retrospective.

## Trigger

- "archive this item"
- "mark ACT-001 as done and archive"
- "we finished [project], archive it"

## Prerequisites

- Item exists in `captures/BACKLOG.md`
- Item ID format: `ACT-XXX`, `PROP-XXX`, `THT-XXX`, or `LIN-XXX`

## Steps

### 1. Get Retrospective (Optional but Recommended)

Generate retrospective prompts:

```bash
bun run ${CAPTURE_TOOLS}/archive-item.ts -w ${WORKSPACE_ROOT} --id <item-id> --generate-retro
```

This outputs prompts for:
- What worked well?
- What was friction?
- What would we do differently?
- Reusable patterns?
- Context for future reference?

Ask the user to answer these questions, or skip if time-sensitive.

### 2. Create Archive Entry

With summary from retrospective:

```bash
bun run ${CAPTURE_TOOLS}/archive-item.ts -w ${WORKSPACE_ROOT} \
  --id <item-id> \
  --summary "Summary of what was accomplished and key learnings"
```

This:
- Creates `captures/archive/ARCH-<id>-<slug>.md`
- Removes the item from BACKLOG.md
- Preserves source, date, and summary

### 3. Track the Change

Record the archival for reflection:

```bash
bun run ${CAPTURE_TOOLS}/track-change.ts -w ${WORKSPACE_ROOT} \
  --type backlog \
  --target "captures/BACKLOG.md" \
  --change "Archived <item-id>: <title>" \
  --source "manual" \
  --hypothesis "Keeps backlog clean and focused"
```

### 4. Confirm Completion

Report:
- Archive location
- Summary created
- Item removed from backlog
- Change tracked for synthesis

## Output

- `captures/archive/ARCH-<id>-<slug>.md` - Archived summary
- Change recorded in `captures/changes/`

## JSON Mode

```bash
bun run ${CAPTURE_TOOLS}/archive-item.ts -w ${WORKSPACE_ROOT} --id <id> --summary "..." --json
```

## Example

```
User: "Archive ACT-001, we finished the DNS migration"

→ Generate retrospective prompts
→ User provides: "Moved all DNS to IaC. Ansible worked well.
   Should have tested more before cutover."
→ Create archive with summary
→ Remove from backlog
→ Track change
→ Report: "Archived ACT-001 to captures/archive/ARCH-ACT-001-dns-migration.md"
```
