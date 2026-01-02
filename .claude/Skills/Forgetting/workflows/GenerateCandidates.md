# GenerateCandidates Workflow

Scans the workspace for items that are candidates for forgetting transitions.

## Trigger

- "what can I forget"
- "forgetting candidates"
- "memory cleanup"
- "clean up my backlog"

## Prerequisites

- Workspace exists at `$WORKSPACE_ROOT` (default: `~/workshop`)
- BACKLOG.md exists in `captures/`

## Steps

### 1. Run the Generator

```bash
bun run ${CAPTURE_TOOLS}/generate-forgetting.ts -w ${WORKSPACE_ROOT}
```

This scans:
- `captures/BACKLOG.md` for completed and stale items
- `captures/archive/` for items old enough to become pointers
- `captures/changes/` for tracked changes

### 2. Review Output

The tool generates `captures/FORGETTING-CANDIDATES.md` with three sections:

1. **Active → Archived:** Completed items ready for compression
2. **Archived → Pointer:** Old archived items ready for reference-only
3. **Stale Items:** Low-priority items with no activity

### 3. Present Summary

Report the counts to the user:
- X items ready for archival
- Y items ready for pointer conversion
- Z stale items to review

### 4. Offer Actions

For each category, offer to:
- Archive items (with retrospective prompts)
- Convert to pointers
- Delete stale items
- Keep items (reset staleness timer)

## Output

- `captures/FORGETTING-CANDIDATES.md` - Human-readable review document

## JSON Mode

For automation, use `--json` flag:

```bash
bun run ${CAPTURE_TOOLS}/generate-forgetting.ts -w ${WORKSPACE_ROOT} --json
```

Returns structured data for programmatic processing.

## Next Actions

After generating candidates:
- Use **ArchiveItem** workflow to archive completed items
- Use **ConvertToPointer** workflow to compress old archives
- Delete or keep stale items as directed
