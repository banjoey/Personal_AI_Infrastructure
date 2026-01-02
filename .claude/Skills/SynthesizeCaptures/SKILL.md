---
name: SynthesizeCaptures
description: Cross-capture pattern detection and synthesis. USE WHEN user mentions weekly review, patterns across sessions, connect the dots, synthesis, OR wants insights spanning multiple captures. Aggregates meetings, sessions, and thoughts.
---

# SynthesizeCaptures

Analyzes patterns across multiple capture types (meetings, sessions, thoughts) to identify recurring themes, evolving priorities, and strategic insights.

## Architecture

```
Multiple Captures → [Aggregate] → [Detect Patterns] → [Synthesize] → Report
      ↓                              ↓                    ↓
- Meetings              - Recurring topics       - Strategic insights
- Sessions              - Evolving decisions     - Recommendations
- Thoughts              - Skill opportunities    - Unified proposals
```

**Principle:** The whole is greater than the sum of the parts.

## Workflows

### WeeklySynthesis

**Trigger:** User requests weekly review, or scheduled weekly synthesis

**Input:**
- Date range (default: last 7 days)
- Optional: Focus areas or questions

**Steps:**

1. **Gather Captures** (Deterministic)
   ```bash
   bun run ${CAPTURE_TOOLS}/gather-captures.ts --days 7 --output captures.json
   ```

2. **Extract Cross-References** (Deterministic)
   - Find topics mentioned in multiple captures
   - Identify decisions that evolved
   - Link related action items

3. **Detect Patterns** (LLM Synthesis)
   - Recurring themes across capture types
   - Priority shifts over time
   - Emerging concerns or opportunities

4. **Generate Synthesis Report** (LLM)
   - Executive summary of the week
   - Key decisions made
   - Action items by priority
   - Patterns and recommendations

5. **Create Unified Proposals**
   - Consolidate similar proposals
   - Prioritize by frequency and impact

**Output:** Weekly synthesis report and consolidated proposals

---

### PatternDetection

**Trigger:** User wants to find patterns across captures

**Input:**
- Date range or capture selection
- Optional: Topic focus

**Steps:**
1. Load selected captures
2. Extract keywords and topics
3. Build co-occurrence matrix
4. Identify clusters
5. Present patterns with evidence

**Pattern Types:**
- **Recurring Topics** - Same subject across multiple captures
- **Evolving Decisions** - Decision that changed over time
- **Persistent Blockers** - Issues mentioned repeatedly without resolution
- **Emerging Priorities** - New topics gaining frequency
- **Silent Topics** - Previously active topics that disappeared

---

### StrategicAlignment

**Trigger:** User wants to assess capture alignment with strategy

**Input:**
- Captures to analyze
- Strategy document (OKRs, goals)

**Steps:**
1. Load captures and strategy
2. Map captures to strategic objectives
3. Calculate coverage per objective
4. Identify gaps (objectives without activity)
5. Flag misalignment (activity without strategic fit)

**Output:** Alignment report with gap analysis

---

### ConsolidateProposals

**Trigger:** User wants to review and consolidate proposals across captures

**Steps:**
1. Gather all pending proposals
2. Group by type and target
3. Identify duplicates and overlaps
4. Merge similar proposals
5. Present consolidated list by scrutiny level

**Consolidation Rules:**
- Same target file + similar content → Merge
- Same topic, different perspectives → Link as related
- Conflicting proposals → Flag for human decision

---

## Cross-Capture Metrics

### Capture Health

```json
{
  "period": "2025-W52",
  "captures": {
    "meetings": 3,
    "sessions": 12,
    "thoughts": 27
  },
  "actionItems": {
    "created": 45,
    "completed": 32,
    "overdue": 5
  },
  "proposals": {
    "generated": 18,
    "approved": 8,
    "applied": 6,
    "rejected": 2,
    "pending": 2
  },
  "patterns": {
    "recurringTopics": 4,
    "emergingPriorities": 2,
    "persistentBlockers": 1
  }
}
```

### Topic Frequency

Track how often topics appear across captures:

```json
{
  "topic": "MCP optimization",
  "frequency": {
    "meetings": 2,
    "sessions": 5,
    "thoughts": 3
  },
  "trend": "increasing",
  "firstMentioned": "2025-12-15",
  "lastMentioned": "2025-12-29"
}
```

---

## Connection Graph

Maintains relationships between captures:

```
MEETING-2025-12-29-standup
    ├── mentions: MCP caching
    ├── decision: Use JSON for captures
    ├── action: ACTION-001 (Sarah)
    └── related:
        ├── SESSION-2025-12-29-pai-dev (same topic)
        ├── THOUGHT-2025-12-28-001 (idea expanded)
        └── MEETING-2025-12-22-planning (decision origin)
```

---

## Synthesis Report Format

```markdown
# Weekly Synthesis: Dec 23-29, 2025

## Executive Summary

[2-3 paragraphs summarizing the week's key activities, decisions, and patterns]

## By the Numbers

| Metric | This Week | Last Week | Trend |
|--------|-----------|-----------|-------|
| Meetings | 3 | 4 | ↓ |
| Sessions | 12 | 8 | ↑ |
| Thoughts | 27 | 15 | ↑ |
| Actions Created | 45 | 32 | ↑ |
| Actions Completed | 32 | 28 | ↑ |

## Key Decisions

1. **[Decision]** - Made in [capture], impacts [area]
2. **[Decision]** - Made in [capture], impacts [area]

## Recurring Themes

### Theme: [Name]
- Appeared in: [list of captures]
- Key insight: [synthesis]
- Recommended action: [suggestion]

## Action Items Summary

### High Priority (Overdue or Urgent)
- [ ] [Item] - Owner, Due date

### This Week's Focus
- [ ] [Item] - Owner

## Proposals Pending Review

### Requires Approval
- [Proposal] - Target: CLAUDE.md

### Ready to Apply
- [Proposal] - Target: [Skill]

## Patterns to Watch

### Emerging
- [Pattern] - First noticed [date], appearing more frequently

### Persistent Blockers
- [Blocker] - Mentioned in [N] captures over [time], still unresolved

## Recommendations

1. [Actionable recommendation based on patterns]
2. [Actionable recommendation based on patterns]

---
*Synthesis generated on [timestamp]*
*Covering: [N] meetings, [N] sessions, [N] thoughts*
```

---

## Storage Structure

```
~/workspace/captures/synthesis/
├── weekly/
│   ├── 2025-W52.md             # Weekly synthesis reports
│   └── 2025-W52-data.json      # Supporting data
├── patterns/
│   ├── recurring-topics.json   # Topic frequency tracking
│   ├── decision-evolution.json # How decisions changed
│   └── blockers.json           # Persistent issues
├── connections/
│   └── graph.json              # Capture relationship graph
└── proposals/
    └── consolidated.json       # Merged proposals
```

---

## Integration Points

- **MeetingIntelligence:** Consumes meeting session folders
- **SessionIntelligence:** Consumes session analysis folders
- **ThoughtCapture:** Consumes thought indices
- **Linear Skill:** Creates consolidated issues
- **Development Skill:** Routes PackDev briefs

---

## Example Usage

```
User: "What patterns do you see from this week?"
→ Invoke WeeklySynthesis workflow
→ Gather all captures from last 7 days
→ Detect recurring topics and patterns
→ Generate synthesis report
→ Present with recommendations
```

```
User: "Are we making progress on our Q1 goals?"
→ Invoke StrategicAlignment workflow
→ Load captures and OKRs
→ Map activity to objectives
→ Report coverage and gaps
```

```
User: "Consolidate all the proposals from this week"
→ Invoke ConsolidateProposals workflow
→ Gather pending proposals
→ Merge duplicates
→ Present by scrutiny level
```
