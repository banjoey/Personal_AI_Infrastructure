# FindDecisions Workflow

**Identify decisions and agreements made during meetings.**

## Trigger Phrases
- "what decisions were made"
- "what was decided"
- "what did we agree on"
- "key decisions from the meeting"
- "find the agreements"

## Input Requirements

| Input | Required | Description |
|-------|----------|-------------|
| Transcript | Yes | Meeting transcript text |
| Speaker labels | Helpful | For attribution |

## Execution Steps

### 1. Identify Decision Language

**Explicit decision indicators:**
- "We decided to..."
- "The decision is..."
- "It's been agreed..."
- "We're going with..."
- "Let's go ahead with..."
- "Approved" / "Rejected"

**Implicit agreement indicators:**
- "That works for everyone"
- "No objections"
- "Sounds good, let's do that"
- "I think we all agree"
- General consensus language

**Conditional decisions:**
- "If X happens, then we'll..."
- "Pending approval, we'll..."
- "Subject to review..."

### 2. Categorize Decisions

**Decision types:**
- **Final**: Clear, unconditional agreement
- **Conditional**: Depends on future events
- **Tentative**: Agreement with reservation
- **Deferred**: Postponed to future meeting

**Decision scope:**
- **Strategic**: High-level direction
- **Tactical**: Implementation approach
- **Operational**: Day-to-day matters
- **Resource**: Budget, staffing, time

### 3. Extract Context

For each decision:
- What was the question/issue?
- What options were considered?
- Why was this option chosen?
- Who made/approved the decision?
- What are the implications?

### 4. Identify Open Questions

Things that were NOT decided:
- Topics tabled for later
- Items needing more info
- Disagreements without resolution
- Questions asked but not answered

### 5. Format Output

```markdown
## Decisions Made

### Final Decisions

#### 1. [Decision Title]
**Decision**: [What was decided]
**Context**: [Why/how it came up]
**Made by**: [Who decided or approved]
**Impact**: [What this means]
**Timestamp**: [When in meeting]

#### 2. [Decision Title]
...

### Conditional Decisions
| Decision | Condition | Owner |
|----------|-----------|-------|
| Proceed with vendor A | If pricing approved | Finance |

### Deferred Items
- Topic X tabled until more data available
- Decision Y postponed to next meeting

### Open Questions
- What is the final budget for Q1?
- Who will lead the new initiative?
```

## Analysis Prompts

**Primary decision extraction:**
```
Analyze this meeting transcript and identify all decisions made.

For each decision:
1. State the decision clearly
2. Provide context (what issue was being discussed)
3. Note who made or approved it
4. Indicate if it's final, conditional, or tentative
5. Include any conditions or caveats

Also identify:
- Items that were discussed but NOT decided
- Questions that remain open

Transcript:
{transcript}
```

**Decision validation prompt:**
```
Review these extracted decisions and verify:
1. Each is actually a decision (not just discussion)
2. The decision statement is clear and actionable
3. Conditional decisions have clear conditions
4. Attribution is correct if provided

Decisions:
{decisions}
```

## Output Format

```markdown
SUMMARY: Identified X decisions from meeting transcript
ANALYSIS: N final decisions, M conditional, K items deferred
ACTIONS: Analyzed for decision language, categorized, verified
RESULTS: Complete decision log with context and attribution
STATUS: Complete

## Decisions Log

### Final Decisions (N)

1. **Budget Approved**: $50,000 allocated for Q4 tooling
   - Context: Discussed during budget review section
   - Approved by: Leadership team
   - Impact: Enables vendor selection to proceed
   - Timestamp: 00:15:30

2. **Launch Date Confirmed**: November 15, 2025
   - Context: Reviewed dependencies and risks
   - Approved by: Team consensus
   - Impact: Sets deadline for all workstreams
   - Timestamp: 00:35:45

### Conditional Decisions (M)

| Decision | Condition | Status |
|----------|-----------|--------|
| Additional headcount | If Q3 revenue targets met | Pending Q3 close |

### Deferred to Next Meeting
- Final vendor selection (needs pricing comparison)
- Marketing launch strategy (waiting for brand guidelines)

### Open Questions
- What is the contingency plan if launch slips?
- Who will backfill during the transition?

COMPLETED: Found N final decisions and M conditional decisions
```

## Tips for Accuracy

**High-confidence decision indicators:**
- Explicit approval language
- Multiple speakers agreeing
- Summary statements at end of topic
- Action items assigned immediately after

**Low-confidence (verify manually):**
- Single person stating something will happen
- Tentative language ("maybe", "probably")
- No clear follow-up or action item
- Topic moved on without clear closure
