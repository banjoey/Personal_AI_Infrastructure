# TrackChange Workflow

Records an applied change for later effectiveness measurement.

## Trigger

- "track this change"
- "record what we changed"
- "log this update for reflection"

## When to Use

Track changes whenever you modify:
- CLAUDE.md files (domain preferences)
- STRATEGY.md (strategic direction)
- Workflows or processes
- Skills
- Automation rules
- Backlog items

## Prerequisites

- Change has been applied
- Know what was changed and why

## Steps

### 1. Gather Change Information

Collect:
- **Type:** What kind of change (claude-md, strategy, workflow, skill, automation, backlog)
- **Target:** Which file was changed
- **Change:** Brief description of what changed
- **Source:** Where the idea came from (proposal ID, session, manual)
- **Hypothesis:** Why this change should help

### 2. Record the Change

```bash
bun run ${CAPTURE_TOOLS}/track-change.ts -w ${WORKSPACE_ROOT} \
  --type <type> \
  --target "<file-path>" \
  --change "<description>" \
  --source "<source-id>" \
  --hypothesis "<expected-benefit>"
```

Optional flags:
- `--section "<section>"` - Specific section in the file
- `--tag <tag>` - Add tags (can repeat)
- `--capture-snapshot` - Capture before-state for comparison

### 3. Confirm Recording

Report:
- Change ID assigned (CHANGE-YYYY-MM-DD-NNN)
- Location of change record
- Hypothesis recorded

## Output

- `captures/changes/CHANGE-YYYY-MM-DD-NNN.json` - Change record

## Change Types

| Type | When to Use |
|------|-------------|
| `claude-md` | Updates to any CLAUDE.md file |
| `strategy` | Changes to STRATEGY.md |
| `workflow` | Process or workflow improvements |
| `skill` | Skill file updates |
| `automation` | New or modified automation |
| `backlog` | Backlog modifications |

## Example

```
User: "Track the change we just made to church CLAUDE.md"

→ What type? claude-md
→ What file? ~/workshop/church/CLAUDE.md
→ What changed? Added shut-in visitation tracking section
→ Source? PROP-001 from yesterday's deacon meeting
→ Why should this help? Will remind me to document visits

bun run track-change.ts -w ~/workshop \
  --type claude-md \
  --target "~/workshop/church/CLAUDE.md" \
  --section "Shut-in Care" \
  --change "Added shut-in visitation tracking section" \
  --source "PROP-001" \
  --hypothesis "Will remind me to document visits"

→ "Tracked: CHANGE-2026-01-02-001"
```

## From Proposal

If applying a proposal, use `--from-proposal`:

```bash
bun run ${CAPTURE_TOOLS}/track-change.ts -w ${WORKSPACE_ROOT} \
  --from-proposal captures/sessions/2026-01-02-meeting-deacons/proposals/PROP-001.json
```

This extracts all metadata from the proposal file.
