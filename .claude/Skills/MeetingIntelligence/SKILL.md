---
name: MeetingIntelligence
description: Process meeting transcripts into actionable intelligence. USE WHEN user mentions meeting, transcript, standup, retrospective, OR wants to extract action items from conversations. Orchestrates deterministic tools with LLM synthesis.
---

# MeetingIntelligence

Transforms raw meeting transcripts into structured, actionable intelligence using deterministic extraction followed by LLM synthesis.

## Architecture

```
Transcript → [Deterministic Tools] → [LLM Synthesis] → Session Folder
                    ↓                      ↓
            - parse-transcript      - Theme extraction
            - extract-actions       - Strategic alignment
            - score-priority        - Acceptance criteria
            - generate-proposal     - Summary generation
```

**Principle:** Deterministic code first, LLM for synthesis only.

## Workflows

### ProcessTranscript

**Trigger:** User provides a meeting transcript for processing

**Input Requirements:**
- Raw transcript file (text, markdown, or JSON from transcription service)
- Optional: Project context for strategic alignment

**Steps:**

1. **Parse Transcript** (Deterministic)
   ```bash
   bun run ${CAPTURE_TOOLS}/parse-transcript.ts --input <transcript> --output parsed.json
   ```

2. **Extract Actions** (Deterministic)
   ```bash
   bun run ${CAPTURE_TOOLS}/extract-actions.ts --input parsed.json --output actions.json
   ```

3. **Score Priorities** (Deterministic)
   ```bash
   bun run ${CAPTURE_TOOLS}/score-priority.ts --input actions.json --output scored.json
   ```

4. **Generate Proposals** (Deterministic)
   ```bash
   bun run ${CAPTURE_TOOLS}/generate-proposal.ts --input scored.json --output proposals/
   ```

5. **Extract Themes** (LLM Synthesis)
   - Analyze parsed transcript for recurring topics
   - Group related discussions into themes
   - Identify decisions made and open questions

6. **Generate Summary** (LLM Synthesis)
   - Create executive summary
   - Map action items to themes
   - Add strategic alignment notes if project context available

7. **Create Session Folder**
   ```bash
   bun run ${CAPTURE_TOOLS}/create-session.ts --type meeting --input <all-outputs>
   ```

**Output:** Session folder at `~/workspace/captures/sessions/YYYY-MM-DD-meeting-<slug>/`

---

### QuickCapture

**Trigger:** User wants fast action extraction without full synthesis

**Steps:**
1. Run parse-transcript
2. Run extract-actions
3. Run score-priority
4. Output action items directly (skip proposals and themes)

**Use When:** Time-sensitive, just need the action items

---

### ReviewProposals

**Trigger:** User wants to review and apply pending proposals

**Steps:**
1. List proposals by scrutiny level (HIGH first)
2. Present CLAUDE.md proposals for approval
3. Present skill updates for review
4. Batch Linear issues for creation

**Human-in-the-Loop Gates:**
- HIGH scrutiny (CLAUDE.md): Always require explicit approval
- MEDIUM scrutiny (skills): Present for review, allow batch approval
- LOW scrutiny (Linear): Allow batch creation with single confirmation

---

### AlignToStrategy

**Trigger:** User wants to connect meeting insights to strategic goals

**Input:** Processed meeting + project STRATEGY.md or OKRs

**Steps:**
1. Load project strategy/OKRs
2. Map action items to strategic objectives
3. Flag items without clear alignment
4. Update action items with `strategicAlignment` field

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CAPTURE_TOOLS` | Path to deterministic tools | `~/src/pai/CaptureIntelligence/tools` |
| `WORKSPACE_ROOT` | Root for captures | `~/workspace` |
| `DEFAULT_FORMAT` | Output format (json/yaml) | `json` |

## Session Folder Structure

```
~/workspace/captures/sessions/2025-12-29-meeting-weekly-standup/
├── raw/
│   └── transcript.txt          # Original input
├── extracted/
│   ├── parsed.json             # Structured transcript
│   ├── actions.json            # Action candidates
│   └── scored.json             # Scored action items
├── proposals/
│   ├── claude-md.json          # HIGH scrutiny
│   ├── skill-update.json       # MEDIUM scrutiny
│   └── linear-issue.json       # LOW scrutiny
├── synthesis/
│   ├── themes.json             # Extracted themes
│   ├── summary.md              # Executive summary
│   └── strategic-alignment.json # If strategy provided
└── MANIFEST.json               # Session metadata
```

## Scrutiny Levels

| Level | Target | Gate | Auto-Apply |
|-------|--------|------|------------|
| HIGH | CLAUDE.md | Human approval required | Never |
| MEDIUM | Skills | Review recommended | With batch approval |
| LOW | Linear | Single confirmation | Yes, with review |

## Integration Points

- **Linear Skill:** Creates issues from LOW scrutiny proposals
- **Development Skill:** Triggered by PackDev briefs
- **SessionIntelligence:** Consumes session folders for cross-session analysis
- **SynthesizeCaptures:** Aggregates multiple meeting sessions

## Example Usage

```
User: "Process this meeting transcript"
→ Invoke ProcessTranscript workflow
→ Run deterministic pipeline
→ LLM synthesizes themes and summary
→ Present proposals grouped by scrutiny
→ Create session folder with all outputs
```

```
User: "Just get the action items from this standup"
→ Invoke QuickCapture workflow
→ Skip synthesis, output action items directly
```

```
User: "Review the proposals from today's meetings"
→ Invoke ReviewProposals workflow
→ Present HIGH scrutiny first
→ Process approvals/rejections
```
