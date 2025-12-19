---
name: Transcribe
description: Audio transcription with speaker diarization via local Whisper API. USE WHEN user wants to transcribe audio, meeting recordings, podcasts, interviews, OR needs speaker-labeled transcripts, OR mentions transcription, speech-to-text, diarization.
---

# Transcribe

**Audio transcription with speaker diarization using the local Whisper service on the ai server.**

## Service Details

| Property | Value |
|----------|-------|
| **Endpoint** | `http://10.0.20.25:8000/transcribe` |
| **Model** | Whisper large-v3 |
| **Diarization** | pyannote.audio speaker-diarization-3.1 |
| **Server** | ai (ubuntu-server, 10.0.20.25) |
| **Processing** | CPU-based (32GB RAM, AMD Ryzen 7 5825U) |

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Transcribe
```

| Workflow | Trigger | File |
|----------|---------|------|
| **TranscribeAudio** | "transcribe this audio", "convert speech to text", "get transcript" | `workflows/TranscribeAudio.md` |
| **TranscribeMeeting** | "transcribe meeting", "meeting transcript", "who said what" | `workflows/TranscribeMeeting.md` |
| **TranscribePodcast** | "transcribe podcast", "podcast transcript" | `workflows/TranscribePodcast.md` |

## Examples

**Example 1: Basic transcription without diarization**
```
User: "Transcribe this audio file ~/Downloads/voicenote.mp3"
-> Invokes TranscribeAudio workflow
-> Uploads file to API with diarize=false
-> Returns text transcript
-> Output: "This is the transcribed text from the audio file..."
```

**Example 2: Meeting transcription with speaker labels**
```
User: "Transcribe this meeting recording and show who said what"
-> Invokes TranscribeMeeting workflow
-> Uploads file to API with diarize=true
-> Returns speaker-labeled transcript
-> Output:
   [SPEAKER_00]: Good morning everyone, let's begin.
   [SPEAKER_01]: Thanks for having me.
   [SPEAKER_00]: First item on the agenda...
```

**Example 3: Podcast with multiple speakers**
```
User: "Get me a transcript of this podcast episode podcast.mp3"
-> Invokes TranscribePodcast workflow
-> Uploads with diarize=true
-> Returns labeled transcript with timing
-> Saves to PAI history for future reference
```

## API Reference

### Request

```bash
curl -X POST "http://10.0.20.25:8000/transcribe" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/audio.mp3" \
  -F "diarize=true"
```

**Query Parameters:**
- `diarize` (boolean, default: false) - Enable speaker diarization

**Supported Formats:**
- MP3, WAV, OGG, FLAC, M4A, WEBM
- Any format FFmpeg can decode

### Response

```json
{
  "success": true,
  "duration_seconds": 120.5,
  "processing_time_seconds": 45.3,
  "language": "en",
  "speakers": ["SPEAKER_00", "SPEAKER_01"],
  "segments": [
    {
      "start": 0.0,
      "end": 3.5,
      "text": "Hello everyone.",
      "speaker": "SPEAKER_00"
    },
    {
      "start": 3.8,
      "end": 7.2,
      "text": "Hi, thanks for having me.",
      "speaker": "SPEAKER_01"
    }
  ],
  "full_text": "[SPEAKER_00]: Hello everyone. [SPEAKER_01]: Hi, thanks for having me."
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether transcription succeeded |
| `duration_seconds` | float | Audio duration in seconds |
| `processing_time_seconds` | float | How long processing took |
| `language` | string | Detected language code |
| `speakers` | array | List of unique speaker IDs (if diarization enabled) |
| `segments` | array | Transcript segments with timing and speaker |
| `full_text` | string | Complete formatted transcript |

## Performance Notes

- **Processing time**: ~6x realtime on CPU (1 min audio = ~6 min processing)
- **With diarization**: ~6x realtime (diarization adds ~10s overhead)
- **Large files**: May take several minutes - consider chunking for very long recordings
- **Memory**: Large-v3 model requires ~10GB RAM

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 500 Internal Server Error | Model loading failed | Check ai server logs: `docker logs whisperx` |
| Connection refused | Service not running | Restart: `ssh joey@10.0.20.25 'cd ~/services/whisperx && docker compose up -d'` |
| Timeout | Very long audio file | Increase timeout or split audio |

## File Organization

### Working Files (Scratchpad)
```
${PAI_DIR}/scratchpad/transcripts/
├── YYYY-MM-DD-HHMMSS_filename.json    # Raw API response
└── YYYY-MM-DD-HHMMSS_filename.txt     # Formatted transcript
```

### Permanent Storage (History)
```
${PAI_DIR}/history/transcripts/YYYY-MM/
├── YYYY-MM-DD_topic-name/
│   ├── transcript.txt                  # Formatted transcript
│   ├── transcript.json                 # Full API response with timing
│   └── metadata.json                   # Source info, duration, speakers
```

## Integration with AnalyzeTranscript

After transcription, use the **AnalyzeTranscript** skill to:
- Extract action items and key decisions
- Create meeting summaries
- Identify topics and themes
- Generate follow-up tasks

```
User: "Transcribe this meeting and summarize the action items"
-> Transcribe skill runs first
-> Output passed to AnalyzeTranscript skill
-> Returns structured summary with action items
```
