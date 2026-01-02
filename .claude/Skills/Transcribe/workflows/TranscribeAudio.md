# TranscribeAudio Workflow

**Transcribe an audio file with optional speaker diarization.**

## Trigger Phrases
- "transcribe this audio"
- "convert speech to text"
- "get transcript of"
- "transcribe the recording"

## Input Requirements

| Input | Required | Description |
|-------|----------|-------------|
| Audio file path | Yes | Local path or URL to audio file |
| Diarization | No | Enable speaker identification (default: false) |

## Execution Steps

### 1. Validate Input File

```bash
# Check file exists and is readable
ls -la "${AUDIO_FILE}"

# Check file format (should be audio)
file "${AUDIO_FILE}"
```

Supported formats: MP3, WAV, OGG, FLAC, M4A, WEBM (any FFmpeg-supported format)

### 2. Determine Diarization Need

**Enable diarization if:**
- User explicitly requests speaker identification
- User mentions "who said what", "speakers", "meeting"
- Multiple speakers are expected

**Skip diarization if:**
- Single speaker (voice notes, dictation)
- User wants fast results
- Simple transcription request

### 3. Send to Transcription API

```bash
# Without diarization (faster)
curl -X POST "http://10.0.20.25:8000/transcribe?diarize=false" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@${AUDIO_FILE}" \
  --max-time 900

# With diarization (identifies speakers)
curl -X POST "http://10.0.20.25:8000/transcribe?diarize=true" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@${AUDIO_FILE}" \
  --max-time 900
```

**Timeout guidance:**
- Short audio (<5 min): 300 seconds
- Medium audio (5-30 min): 600 seconds
- Long audio (30+ min): 900 seconds

### 4. Process Response

**Success response format:**
```json
{
  "success": true,
  "duration_seconds": 120.5,
  "processing_time_seconds": 45.3,
  "language": "en",
  "speakers": ["SPEAKER_00", "SPEAKER_01"],
  "segments": [...],
  "full_text": "[SPEAKER_00]: Hello..."
}
```

### 5. Format Output

**For user display, format as:**

Without diarization:
```
TRANSCRIPT
Duration: 2:00
Language: English

This is the transcribed text from the audio file...
```

With diarization:
```
TRANSCRIPT
Duration: 2:00
Language: English
Speakers: 2 (SPEAKER_00, SPEAKER_01)

[SPEAKER_00] (0:00-0:05): Hello everyone.
[SPEAKER_01] (0:05-0:12): Thanks for having me.
```

### 6. Save to History (Optional)

If user wants to keep the transcript:

```bash
# Create history directory
mkdir -p "${PAI_DIR}/history/transcripts/$(date +%Y-%m)"

# Save formatted transcript
TRANSCRIPT_FILE="${PAI_DIR}/history/transcripts/$(date +%Y-%m)/$(date +%Y-%m-%d)_${TOPIC}.txt"

# Save JSON for future processing
JSON_FILE="${PAI_DIR}/history/transcripts/$(date +%Y-%m)/$(date +%Y-%m-%d)_${TOPIC}.json"
```

## Error Handling

| Error | Action |
|-------|--------|
| File not found | Ask user for correct path |
| Unsupported format | Suggest converting with FFmpeg |
| Connection refused | Check if ai server is reachable |
| Timeout | Suggest splitting audio or increasing timeout |
| 500 error | Check server logs: `ssh joey@10.0.20.25 'docker logs whisperx'` |

## Output Format

Return to user:
1. **Summary**: Duration, language, speaker count
2. **Full transcript**: Formatted with speaker labels (if diarization)
3. **Next steps**: Offer to analyze, summarize, or extract action items
