---
name: AnalyzeTranscript
description: Extract insights from meeting transcripts and recordings. USE WHEN user wants to summarize meetings, extract action items, find key decisions, identify topics, OR analyze transcripts for insights, follow-ups, or participant contributions.
---

# AnalyzeTranscript

**Extract actionable insights from transcripts: summaries, action items, decisions, topics, and participant analysis.**

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName AnalyzeTranscript
```

| Workflow | Trigger | File |
|----------|---------|------|
| **ExtractActionItems** | "what are the action items", "extract tasks", "who needs to do what" | `workflows/ExtractActionItems.md` |
| **SummarizeMeeting** | "summarize this meeting", "meeting summary", "what was discussed" | `workflows/SummarizeMeeting.md` |
| **FindDecisions** | "what decisions were made", "key decisions", "what was agreed" | `workflows/FindDecisions.md` |
| **AnalyzeParticipation** | "who talked the most", "speaker breakdown", "participation analysis" | `workflows/AnalyzeParticipation.md` |

## Examples

**Example 1: Extract action items from meeting**
```
User: "What are the action items from this meeting transcript?"
-> Invokes ExtractActionItems workflow
-> Analyzes transcript for tasks, assignments, deadlines
-> Returns structured action item list with owners
-> Output:
   ## Action Items
   1. [Joey] Send proposal to client by Friday
   2. [Sarah] Schedule follow-up meeting for next week
   3. [Team] Review documentation before release
```

**Example 2: Summarize a long meeting**
```
User: "Summarize this 1-hour meeting in a few paragraphs"
-> Invokes SummarizeMeeting workflow
-> Identifies key topics and discussion points
-> Creates executive summary
-> Output:
   ## Meeting Summary
   The team discussed Q4 planning with focus on three areas...
   Key decisions included launching the new feature in November...
   Next steps involve finalizing the timeline by EOW.
```

**Example 3: Find decisions made**
```
User: "What decisions were made in this call?"
-> Invokes FindDecisions workflow
-> Scans for agreement language, conclusions
-> Returns list of decisions with context
-> Output:
   ## Decisions Made
   1. **Budget approved**: $50k for new tooling (decided by leadership)
   2. **Timeline confirmed**: Launch date set for Nov 15
   3. **Resource allocation**: Two additional engineers assigned
```

## Input Formats

The skill accepts transcripts in multiple formats:

| Format | Description | Example |
|--------|-------------|---------|
| **Plain text** | Raw transcript text | "Hello everyone..." |
| **Speaker-labeled** | `[SPEAKER_00]: text` format | From Transcribe skill |
| **Timestamped** | `[00:00:00] text` format | With timing information |
| **JSON** | Full API response | From transcription service |

## Analysis Capabilities

### 1. Action Item Extraction
- Identifies tasks and assignments
- Detects owners (who is responsible)
- Finds deadlines and timeframes
- Distinguishes between commitments and suggestions

### 2. Meeting Summarization
- Executive summary (2-3 paragraphs)
- Key topics covered
- Main discussion points
- Outcomes and conclusions

### 3. Decision Identification
- Explicit decisions ("we decided to...")
- Implicit agreements ("let's go with...")
- Consensus points
- Open questions remaining

### 4. Topic Extraction
- Main themes discussed
- Topic transitions
- Time spent on each topic
- Related topics and connections

### 5. Participant Analysis
- Speaking time per person
- Contribution types (questions, answers, proposals)
- Interaction patterns
- Key contributors

## Output Formats

### Structured Markdown (Default)
```markdown
## Meeting Analysis: [Title]

### Summary
Brief overview of the meeting...

### Action Items
| Owner | Task | Deadline |
|-------|------|----------|
| Joey | Send proposal | Friday |

### Decisions
1. Budget approved for Q4
2. Launch date confirmed

### Topics Covered
- Q4 Planning (15 min)
- Budget Review (10 min)
- Timeline Discussion (20 min)

### Open Questions
- Final vendor selection TBD
```

### JSON (For Integration)
```json
{
  "summary": "Brief overview...",
  "action_items": [
    {"owner": "Joey", "task": "Send proposal", "deadline": "Friday"}
  ],
  "decisions": ["Budget approved", "Launch date confirmed"],
  "topics": ["Q4 Planning", "Budget Review"],
  "open_questions": ["Vendor selection TBD"]
}
```

## Integration with Transcribe Skill

**Chained workflow example:**

```
User: "Transcribe this meeting and extract action items"

1. Transcribe skill processes audio
2. Output passed to AnalyzeTranscript
3. ExtractActionItems workflow runs
4. Combined result returned to user
```

## Fabric Pattern Integration

For enhanced analysis, can use Fabric patterns:

```bash
# Summarize meeting
cat transcript.txt | fabric -p summarize_meeting

# Extract wisdom
cat transcript.txt | fabric -p extract_wisdom

# Analyze claims
cat transcript.txt | fabric -p analyze_claims
```

## File Organization

### Working Files
```
${PAI_DIR}/scratchpad/analysis/
├── meeting-summary.md
└── action-items.json
```

### Permanent Storage
```
${PAI_DIR}/history/meeting-analysis/YYYY-MM/
├── YYYY-MM-DD_meeting-title/
│   ├── transcript.txt
│   ├── summary.md
│   ├── action-items.md
│   └── metadata.json
```

## Best Practices

### For Accurate Action Item Extraction
- Ensure transcript has speaker labels
- Look for action verbs: "will", "need to", "should", "must"
- Check for deadline indicators: "by Friday", "next week", "EOD"
- Verify assignments: "Joey will...", "Sarah to handle..."

### For Good Summaries
- Focus on decisions over discussion
- Highlight key outcomes
- Keep executive summary under 3 paragraphs
- Include next steps

### For Decision Finding
- Look for agreement language
- Check for explicit confirmations
- Note conditional decisions
- Identify who made/approved decisions
