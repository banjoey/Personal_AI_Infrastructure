# ExtractActionItems Workflow

**Extract action items, tasks, and assignments from meeting transcripts.**

## Trigger Phrases
- "what are the action items"
- "extract tasks from this meeting"
- "who needs to do what"
- "find the follow-ups"
- "list the to-dos"

## Input Requirements

| Input | Required | Description |
|-------|----------|-------------|
| Transcript | Yes | Meeting transcript text |
| Speaker labels | Recommended | For identifying task owners |

## Execution Steps

### 1. Parse Transcript

Load the transcript and identify structure:
- Plain text vs speaker-labeled
- Timestamped vs continuous
- JSON response vs raw text

### 2. Identify Action Item Indicators

**Action verb patterns:**
- "will" / "going to" - Future commitments
- "need to" / "have to" - Requirements
- "should" / "could" - Suggestions
- "let's" - Team commitments
- "I'll" / "we'll" - Personal commitments

**Assignment patterns:**
- "[Name] will..."
- "Can [Name] handle..."
- "[Name] to follow up on..."
- "Action item for [Name]"

**Deadline patterns:**
- "by [day/date]"
- "before [event]"
- "next week"
- "end of day/week/month"
- "ASAP"

### 3. Extract and Categorize

For each potential action item, extract:

```json
{
  "task": "Send proposal to client",
  "owner": "Joey",
  "deadline": "Friday",
  "context": "Discussed in Q4 planning section",
  "confidence": "high",
  "timestamp": "00:15:30"
}
```

**Confidence levels:**
- **High**: Explicit assignment with clear owner
- **Medium**: Clear task but owner implied
- **Low**: Suggestion or conditional task

### 4. Deduplicate and Validate

- Remove duplicate mentions of same task
- Merge related action items
- Verify owner identification
- Flag ambiguous items for review

### 5. Format Output

**Markdown format:**

```markdown
## Action Items

### High Priority
| Owner | Task | Deadline | Notes |
|-------|------|----------|-------|
| Joey | Send proposal to client | Friday | Discussed at 00:15:30 |
| Sarah | Schedule follow-up meeting | Next week | With vendor team |

### Medium Priority
| Owner | Task | Deadline | Notes |
|-------|------|----------|-------|
| Team | Review documentation | Before release | All team members |

### Needs Clarification
- "Someone should look into the integration issues" - Owner TBD
```

## Analysis Prompts

Use these prompts when analyzing:

**Primary extraction prompt:**
```
Analyze this meeting transcript and extract all action items.

For each action item, identify:
1. The specific task or deliverable
2. Who is responsible (owner)
3. Any deadline mentioned
4. Context from the discussion

Only include clear commitments, not vague suggestions.
Format as a structured list with owner, task, and deadline.

Transcript:
{transcript}
```

**Follow-up validation prompt:**
```
Review these extracted action items and:
1. Verify each has a clear owner (or mark as TBD)
2. Check for implicit deadlines from context
3. Identify any tasks that might be duplicates
4. Flag any that seem like suggestions vs commitments

Action Items:
{action_items}
```

## Output Format

```markdown
SUMMARY: Extracted X action items from meeting transcript
ANALYSIS: Found N high-confidence items, M need clarification
ACTIONS: Parsed transcript, identified tasks, assigned owners
RESULTS: Structured action item list ready for follow-up
STATUS: Complete

## Action Items (X total)

### Assigned (N items)
1. **[Joey]** Send proposal to client - Due: Friday
2. **[Sarah]** Schedule follow-up meeting - Due: Next week

### Needs Assignment (M items)
1. Review integration documentation - Owner: TBD
2. Check pricing with vendor - Owner: TBD

### Follow-up Questions
- Who should own the integration review?
- Is the Friday deadline hard or soft?

COMPLETED: Extracted X action items from meeting transcript
```

## Integration Tips

**For best results:**
- Use speaker-labeled transcripts (from Transcribe skill with diarization)
- Longer meetings may need chunking
- Review low-confidence items manually
- Cross-reference with meeting agenda if available
