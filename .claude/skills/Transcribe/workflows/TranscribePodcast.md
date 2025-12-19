# TranscribePodcast Workflow

**Transcribe podcast episodes with speaker identification.**

## Trigger Phrases
- "transcribe this podcast"
- "podcast transcript"
- "transcribe the episode"
- "get podcast text"

## Input Requirements

| Input | Required | Description |
|-------|----------|-------------|
| Audio file/URL | Yes | Podcast episode file or URL |
| Episode title | No | For organizing (inferred from file) |
| Podcast name | No | For categorization |

## Execution Steps

### 1. Obtain Audio File

**If URL provided:**
```bash
# Download podcast audio
curl -L -o /tmp/podcast_episode.mp3 "${PODCAST_URL}"
```

**If local file:**
```bash
# Verify file exists
ls -la "${PODCAST_FILE}"
```

### 2. Transcribe with Diarization

Podcasts typically have multiple speakers (host + guests).

```bash
curl -X POST "http://10.0.20.25:8000/transcribe?diarize=true" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@${PODCAST_FILE}" \
  --max-time 1800  # 30 min timeout for hour-long episodes
```

**Processing expectations:**
- 30 min episode: ~3-5 min
- 1 hour episode: ~6-10 min
- 2 hour episode: ~12-20 min

### 3. Format Podcast Transcript

**Podcast-optimized format:**

```markdown
# Podcast Transcript

**Show**: [Podcast Name]
**Episode**: [Episode Title]
**Date**: YYYY-MM-DD
**Duration**: X:XX:XX
**Speakers**: Host (SPEAKER_00), Guest (SPEAKER_01)

---

## Transcript

**[00:00:00] SPEAKER_00 (Host)**
Welcome back to the show. Today we're talking about...

**[00:00:30] SPEAKER_01 (Guest)**
Thanks for having me. I'm excited to discuss...

---

## Topics Covered
- [00:05:00] Introduction and background
- [00:15:00] Main topic discussion
- [00:45:00] Q&A segment
- [01:00:00] Closing thoughts
```

### 4. Enhance with Metadata

If episode info available, enrich transcript:
- Show notes integration
- Guest bios
- Referenced links
- Timestamp chapters

### 5. Save Podcast Transcript

```bash
# Podcast-specific history path
PODCAST_DIR="${PAI_DIR}/history/transcripts/podcasts"
mkdir -p "${PODCAST_DIR}/${PODCAST_NAME}"

# Save episode transcript
TRANSCRIPT_FILE="${PODCAST_DIR}/${PODCAST_NAME}/$(date +%Y-%m-%d)_${EPISODE_TITLE}.md"
```

## Post-Transcription Options

1. **Extract wisdom**: Key insights and takeaways
2. **Create show notes**: Summarize for listeners
3. **Find quotes**: Notable soundbites
4. **Create social clips**: Identify shareable moments

## Integration with Fabric

For podcast analysis, can pipe to Fabric patterns:
```bash
cat transcript.txt | fabric -p extract_wisdom
cat transcript.txt | fabric -p summarize
```

## Output Format

```markdown
SUMMARY: Podcast episode transcribed with speaker diarization
ANALYSIS: 1-hour episode with host and 2 guests identified
ACTIONS: Downloaded, transcribed, formatted with timestamps
RESULTS: Full transcript with speaker labels and timing
STATUS: Complete - ready for wisdom extraction

## Episode Overview
- **Duration**: 1:02:34
- **Speakers**: 3 (Host + 2 Guests)
- **Language**: English
- **Word count**: ~9,000 words

## Next Steps
Would you like me to:
1. Extract key insights and wisdom?
2. Create a summary for show notes?
3. Find quotable moments?
4. Save to your podcast notes collection?

COMPLETED: Podcast transcribed with three speakers identified
```
