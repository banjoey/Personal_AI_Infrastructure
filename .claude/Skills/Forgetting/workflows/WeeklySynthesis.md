# WeeklySynthesis Workflow

Generates a weekly synthesis report analyzing change effectiveness and suggesting improvements.

## Trigger

- "weekly review"
- "synthesize changes"
- "how effective were the changes"
- "run synthesis"
- "weekly synthesis"

## When to Run

- End of each week (Friday or Sunday)
- When you want to reflect on recent changes
- Before making major new changes

## Prerequisites

- Tracked changes in `captures/changes/`
- Session data in `captures/sessions/`

## Steps

### 1. Run the Synthesis

Default (7 days):
```bash
bun run ${CAPTURE_TOOLS}/synthesis.ts -w ${WORKSPACE_ROOT}
```

Custom period:
```bash
bun run ${CAPTURE_TOOLS}/synthesis.ts -w ${WORKSPACE_ROOT} --days 14
```

### 2. Review the Report

The tool generates `captures/WEEKLY-SYNTHESIS.md` with:

**Summary Stats:**
- Total changes applied
- Sessions processed
- Effectiveness breakdown

**Changes Applied:**
- Each change with date and hypothesis

**Effectiveness Assessment:**
For each change (3+ days old):
- Evidence found
- Assessment: effective, unclear, not-used, needs-more-time
- Recommendation

**Sessions This Period:**
- Session types and dates
- Review/long-term review status

**Suggestions:**
- Actionable recommendations

### 3. Present Key Findings

Report to user:
- X changes assessed
- Y effective, Z unclear, W unused
- Top suggestions

### 4. Offer Follow-Up Actions

Based on suggestions:
- Remove unused changes
- Expand effective patterns
- Review unclear changes
- Improve session capture consistency

## Output

- `captures/WEEKLY-SYNTHESIS.md` - Human-readable report

## JSON Mode

```bash
bun run ${CAPTURE_TOOLS}/synthesis.ts -w ${WORKSPACE_ROOT} --json
```

Returns structured data including all effectiveness assessments.

## Effectiveness Criteria

| Assessment | Criteria | Recommendation |
|------------|----------|----------------|
| `effective` | Sessions show usage of change target | Keep, consider expanding |
| `unclear` | Sessions exist but no clear evidence | Review in 1-2 weeks |
| `not-used` | No sessions after change applied | Check if still relevant |
| `needs-more-time` | Less than 3 days since applied | Wait before assessing |

## Example

```
User: "Run the weekly synthesis"

→ bun run synthesis.ts -w ~/workshop

Generated WEEKLY-SYNTHESIS.md

Summary:
  Period: 2025-12-26 to 2026-01-02
  Changes: 5
  Sessions: 12
  Effective: 3
  Unclear: 1
  Unused: 1

Suggestions:
  - 1 change shows no usage - consider removing
  - 1 change has unclear effectiveness - review in next synthesis
  - 3 changes appear effective - consider expanding similar patterns
```

## Automation

For scheduled weekly runs, add to cron or launchd:

```bash
# Every Sunday at 6 PM
0 18 * * 0 cd ~/workshop && bun run ~/src/pai/CaptureIntelligence/tools/synthesis.ts -w ~/workshop
```

See the automation workflow for hook-based triggering.
