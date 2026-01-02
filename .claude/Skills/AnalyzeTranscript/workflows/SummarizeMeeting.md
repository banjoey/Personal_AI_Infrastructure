# SummarizeMeeting Workflow

**Create concise summaries of meeting transcripts.**

## Trigger Phrases
- "summarize this meeting"
- "give me a meeting summary"
- "what was discussed"
- "meeting recap"
- "executive summary"

## Input Requirements

| Input | Required | Description |
|-------|----------|-------------|
| Transcript | Yes | Meeting transcript text |
| Meeting title | Recommended | For context |
| Duration | Helpful | For time-based analysis |

## Execution Steps

### 1. Assess Meeting Structure

Identify meeting components:
- **Opening**: Introductions, agenda setting
- **Main discussion**: Core topics
- **Decisions**: Agreements reached
- **Wrap-up**: Summary, next steps

### 2. Identify Key Topics

Extract main discussion topics:
- Subject changes in conversation
- Explicit agenda items
- Time spent on each topic
- Topic importance (based on discussion depth)

### 3. Extract Key Information

For each topic, note:
- Main points discussed
- Differing viewpoints
- Conclusions reached
- Open questions

### 4. Identify Outcomes

- **Decisions made**: What was agreed
- **Action items**: What needs to happen next
- **Open items**: What remains unresolved
- **Follow-ups**: Scheduled next steps

### 5. Generate Summary

**Summary structure:**

```markdown
## Meeting Summary: [Title]
**Date**: YYYY-MM-DD
**Duration**: X minutes
**Participants**: [List or count]

### Overview
2-3 sentence high-level summary of the meeting purpose and outcomes.

### Topics Discussed

#### 1. [Topic Name]
Key points:
- Point 1
- Point 2
Outcome: [Decision or status]

#### 2. [Topic Name]
Key points:
- Point 1
- Point 2
Outcome: [Decision or status]

### Decisions Made
1. [Decision 1]
2. [Decision 2]

### Action Items
| Owner | Task | Deadline |
|-------|------|----------|
| Name | Task | Date |

### Next Steps
- Scheduled follow-up on [date]
- Review needed for [item]

### Open Questions
- Question that remains unanswered
```

## Summary Lengths

**Brief** (1-2 paragraphs):
- High-level overview only
- Key decision and next step
- For quick status updates

**Standard** (half page):
- Topics with key points
- Decisions and action items
- For team distribution

**Detailed** (full page+):
- Complete topic breakdown
- Discussion context
- For documentation/records

## Analysis Prompts

**For executive summary:**
```
Create a concise executive summary of this meeting.

Focus on:
1. Meeting purpose and key outcome (1-2 sentences)
2. Main topics discussed (bullet points)
3. Key decisions made
4. Critical action items

Keep it under 200 words.

Transcript:
{transcript}
```

**For detailed summary:**
```
Create a comprehensive meeting summary.

Include:
1. Meeting overview and context
2. Each topic discussed with key points
3. All decisions made with rationale
4. Complete action item list with owners
5. Open questions and next steps

Structure with clear headings.

Transcript:
{transcript}
```

## Output Format

```markdown
SUMMARY: Created meeting summary for [meeting title]
ANALYSIS: 45-minute meeting covering 4 main topics
ACTIONS: Analyzed transcript, identified key points, structured summary
RESULTS: Executive summary with decisions and action items
STATUS: Complete

---

## Meeting Summary: Q4 Planning Session

**Date**: 2025-12-17
**Duration**: 45 minutes
**Participants**: 5 team members

### Overview
The team met to finalize Q4 planning, focusing on budget allocation
and launch timeline. Key decisions included approving the $50k tooling
budget and confirming the November 15 launch date.

### Topics Discussed

#### 1. Budget Review (15 min)
- Reviewed proposed allocations
- Discussed tooling needs
- **Decision**: Approved $50k for new tooling

#### 2. Launch Timeline (20 min)
- Reviewed dependencies
- Identified risks
- **Decision**: Confirmed Nov 15 launch

### Decisions Made
1. Budget of $50k approved for Q4 tooling
2. Launch date set for November 15
3. Weekly syncs to continue through launch

### Action Items
| Owner | Task | Deadline |
|-------|------|----------|
| Joey | Finalize vendor selection | Dec 20 |
| Sarah | Update project timeline | Dec 18 |

### Next Steps
- Follow-up meeting scheduled for Dec 20
- Team to review updated timeline

COMPLETED: Meeting summarized with 2 decisions and 2 action items
```

## Fabric Integration

For enhanced summarization:
```bash
cat transcript.txt | fabric -p summarize_meeting
cat transcript.txt | fabric -p extract_wisdom
```
