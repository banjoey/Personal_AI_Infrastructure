# AnalyzeParticipation Workflow

**Analyze speaker participation and contribution patterns in meetings.**

## Trigger Phrases
- "who talked the most"
- "speaker breakdown"
- "participation analysis"
- "meeting dynamics"
- "who contributed what"

## Input Requirements

| Input | Required | Description |
|-------|----------|-------------|
| Transcript | Yes | Meeting transcript text |
| Speaker labels | **Required** | Must have speaker identification |
| Timestamps | Helpful | For time-based analysis |

**Note**: This workflow requires speaker-labeled transcripts. Use the Transcribe skill with `diarize=true` to generate appropriate input.

## Execution Steps

### 1. Parse Speaker Segments

Extract all speaker turns:
```
SPEAKER_00: [text segment 1]
SPEAKER_01: [text segment 2]
SPEAKER_00: [text segment 3]
```

### 2. Calculate Speaking Metrics

**Quantitative metrics:**
- Word count per speaker
- Segment count (number of turns)
- Average segment length
- Total speaking time (if timestamps available)
- Percentage of total conversation

### 3. Analyze Contribution Types

**Contribution categories:**
- **Questions asked**: Interrogative statements
- **Answers provided**: Responses to questions
- **Proposals made**: New ideas or suggestions
- **Agreements**: Supporting others' points
- **Challenges**: Questioning or pushing back
- **Summaries**: Synthesizing discussion

### 4. Identify Interaction Patterns

- Who responds to whom most often
- Question-answer pairs
- Discussion initiators
- Dominant voices vs. quiet participants
- Turn-taking patterns

### 5. Generate Insights

**Participation balance:**
- Is discussion dominated by few speakers?
- Are all participants engaged?
- Any silent participants?

**Discussion dynamics:**
- Collaborative vs. hierarchical
- Debate vs. consensus building
- Facilitated vs. free-form

## Output Format

```markdown
## Participation Analysis

### Meeting Overview
- **Duration**: X minutes
- **Participants**: N speakers identified
- **Total words**: X words spoken

### Speaking Distribution

| Speaker | Words | % of Total | Turns | Avg Turn |
|---------|-------|------------|-------|----------|
| SPEAKER_00 | 1,250 | 45% | 23 | 54 words |
| SPEAKER_01 | 890 | 32% | 18 | 49 words |
| SPEAKER_02 | 640 | 23% | 15 | 43 words |

### Contribution Breakdown

#### SPEAKER_00 (Primary facilitator)
- Questions asked: 12
- Proposals made: 3
- Summaries given: 5
- **Role**: Meeting leader/facilitator

#### SPEAKER_01 (Active contributor)
- Questions asked: 5
- Answers provided: 8
- Proposals made: 4
- **Role**: Subject matter expert

#### SPEAKER_02 (Supportive participant)
- Agreements: 8
- Questions asked: 2
- Challenges: 1
- **Role**: Reviewer/validator

### Interaction Patterns

**Most active exchanges:**
- SPEAKER_00 ↔ SPEAKER_01: 15 exchanges
- SPEAKER_01 ↔ SPEAKER_02: 8 exchanges
- SPEAKER_00 ↔ SPEAKER_02: 5 exchanges

**Discussion dynamics:**
- SPEAKER_00 initiated 60% of topics
- SPEAKER_01 provided most technical input
- SPEAKER_02 served as tiebreaker on decisions

### Insights

**Participation balance**: Slightly uneven
- SPEAKER_00 dominated discussion (45%)
- Consider creating more space for SPEAKER_02

**Meeting dynamics**: Collaborative
- Good back-and-forth between participants
- Questions were answered constructively
- Healthy debate with resolution

### Recommendations
1. In future meetings, explicitly invite SPEAKER_02 input
2. Consider time-boxing topics to balance participation
3. Assign facilitation role to spread the load
```

## Analysis Prompts

**Participation quantification:**
```
Analyze this speaker-labeled transcript for participation metrics.

Calculate for each speaker:
1. Total word count
2. Number of speaking turns
3. Average words per turn
4. Percentage of total conversation

Transcript:
{transcript}
```

**Contribution analysis:**
```
For each speaker in this transcript, categorize their contributions:

Categories:
- Questions asked (ending with ?)
- Answers/responses (directly following questions)
- Proposals/suggestions (new ideas)
- Agreements (supporting statements)
- Challenges (questioning or pushing back)
- Summaries (synthesizing discussion)

Count and provide examples of each type per speaker.

Transcript:
{transcript}
```

## Speaker Identification

If transcript uses generic labels (SPEAKER_00, SPEAKER_01):
- Note the limitation in output
- Suggest identifying speakers from context clues
- Offer to re-label if names are provided

```markdown
**Note**: Speakers identified by system labels.
Based on context clues:
- SPEAKER_00 appears to be the meeting organizer
- SPEAKER_01 seems to be the technical lead
- SPEAKER_02 may be a stakeholder or reviewer
```

## Visualization Suggestions

For visual reporting:
- Pie chart of speaking time distribution
- Bar chart of contribution types per speaker
- Network diagram of interaction patterns
- Timeline of speaker turns

```markdown
COMPLETED: Analyzed participation for N speakers over X minute meeting
```
