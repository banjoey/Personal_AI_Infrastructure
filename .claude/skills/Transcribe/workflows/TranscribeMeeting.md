# TranscribeMeeting Workflow

**Transcribe a meeting recording with speaker identification.**

## Trigger Phrases
- "transcribe this meeting"
- "who said what in this meeting"
- "meeting transcript"
- "transcribe the call"

## Input Requirements

| Input | Required | Description |
|-------|----------|-------------|
| Audio file path | Yes | Path to meeting recording |
| Meeting title | No | For organizing transcript (inferred from filename) |

## Execution Steps

### 1. Validate Meeting Recording

```bash
# Check file exists
ls -la "${MEETING_FILE}"

# Get duration estimate
ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${MEETING_FILE}"
```

### 2. Transcribe with Diarization

**Meetings ALWAYS use diarization** to identify speakers.

```bash
curl -X POST "http://10.0.20.25:8000/transcribe?diarize=true" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@${MEETING_FILE}" \
  --max-time 900
```

**Processing time estimate:**
- 30 min meeting: ~3-5 min processing
- 1 hour meeting: ~6-10 min processing

### 3. Format Meeting Transcript

**Meeting-specific format:**

```markdown
# Meeting Transcript
Date: YYYY-MM-DD
Duration: X minutes
Speakers: N participants

---

## Transcript

[00:00:00] **SPEAKER_00**: Welcome everyone to today's meeting.

[00:00:15] **SPEAKER_01**: Thanks for organizing this.

[00:00:45] **SPEAKER_00**: Let's start with updates from last week...
```

### 4. Identify Key Sections (Optional Enhancement)

If the transcript is long, help identify sections:
- **Introductions**: First speaker greetings
- **Agenda items**: Topic transitions
- **Action items**: Tasks mentioned
- **Wrap-up**: Closing statements

### 5. Save Meeting Transcript

```bash
# Meeting-specific history path
MEETING_DIR="${PAI_DIR}/history/transcripts/meetings/$(date +%Y-%m)"
mkdir -p "${MEETING_DIR}"

# Save with meeting title
TRANSCRIPT_FILE="${MEETING_DIR}/$(date +%Y-%m-%d)_${MEETING_TITLE}.md"
JSON_FILE="${MEETING_DIR}/$(date +%Y-%m-%d)_${MEETING_TITLE}.json"
```

## Post-Transcription Options

After transcription, offer:

1. **Summarize**: Create executive summary
2. **Extract action items**: List tasks and owners
3. **Create follow-up email**: Draft summary for participants
4. **Save to Joplin**: Store in notes for reference

## Output Format

```markdown
SUMMARY: Meeting transcribed successfully
ANALYSIS: 45-minute meeting with 3 speakers identified
ACTIONS: Transcribed with diarization, formatted with timestamps
RESULTS: Full speaker-labeled transcript available
STATUS: Complete - ready for analysis

## Quick Stats
- Duration: 45:23
- Speakers: 3 (SPEAKER_00, SPEAKER_01, SPEAKER_02)
- Word count: ~4,500 words

## Next Steps
Would you like me to:
1. Summarize the key points?
2. Extract action items?
3. Identify who's responsible for what?
4. Save to your notes?

COMPLETED: Meeting transcribed with 3 speakers identified
```
