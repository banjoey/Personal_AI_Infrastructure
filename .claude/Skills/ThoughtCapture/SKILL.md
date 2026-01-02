---
name: ThoughtCapture
description: Quick capture and categorization of thoughts, ideas, and notes. USE WHEN user mentions idea, thought, note, remember this, quick note, OR wants to capture something for later. Low-friction capture with automatic categorization.
---

# ThoughtCapture

Enables rapid capture of thoughts, ideas, and observations with automatic categorization and connection detection. Designed for minimal friction - capture first, organize later.

## Architecture

```
Raw Thought → [Quick Categorize] → [Detect Connections] → Thought Store
                    ↓                      ↓
            - Category inference    - Project links
            - Urgency detection     - Past thought links
            - Domain tagging        - Meeting/session links
```

**Principle:** Capture is instant, organization is automatic.

## Workflows

### QuickCapture

**Trigger:** User says "note:", "idea:", "thought:", "remember:", or similar

**Input:** Raw text (voice transcript, typed note, or clipboard)

**Steps:**

1. **Categorize** (Deterministic + LLM)
   ```bash
   bun run ${CAPTURE_TOOLS}/categorize-thought.ts --input "<text>"
   ```

2. **Detect Connections** (Deterministic)
   - Scan for project keywords
   - Check against recent captures
   - Link to active context

3. **Store** (Deterministic)
   ```bash
   bun run ${CAPTURE_TOOLS}/store-thought.ts --input categorized.json
   ```

4. **Acknowledge** (Immediate feedback)
   - Confirm capture
   - Show category and connections
   - Suggest next action if urgent

**Output:** Stored thought with ID, available for later review

---

### ReviewThoughts

**Trigger:** User wants to review captured thoughts

**Options:**
- By category: ideas, questions, tasks, observations
- By domain: work, personal, project-specific
- By urgency: urgent first
- By date: recent, this week, older

**Steps:**
1. Query thought store
2. Group by requested dimension
3. Present with context
4. Allow batch actions (convert to task, archive, connect)

---

### ConvertToAction

**Trigger:** User wants to turn a thought into an action item

**Steps:**
1. Load thought by ID
2. Extract actionable elements
3. Generate action item proposal
4. Route to appropriate system (Linear, todo, calendar)

---

### ConnectThoughts

**Trigger:** User wants to link related thoughts or find connections

**Steps:**
1. Analyze thought content
2. Search for related thoughts (semantic + keyword)
3. Search for related captures (meetings, sessions)
4. Present connections with rationale
5. Allow manual connection creation

---

## Thought Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `idea` | New concept, feature, innovation | "What if we...", "Could build..." |
| `question` | Needs research or answer | "How does...", "Why is..." |
| `task` | Action item, something to do | "Need to...", "Should..." |
| `observation` | Note for future reference | "Noticed that...", "Interesting..." |
| `decision` | Choice that needs to be made | "Deciding between...", "Option A or B" |
| `reflection` | Learning, retrospective insight | "Learned that...", "In retrospect..." |
| `connection` | Link between concepts | "This relates to...", "Similar to..." |

## Urgency Detection

| Signal | Urgency | Action |
|--------|---------|--------|
| "urgent", "asap", "now" | High | Immediate notification |
| "soon", "this week" | Medium | Add to daily review |
| "eventually", "someday" | Low | Store for later |
| No signal | None | Store without alert |

## Domain Tagging

Automatically detect domains from keywords:

```typescript
const domainPatterns = {
  'work': /\b(meeting|project|deadline|client|team)\b/i,
  'personal': /\b(family|home|health|hobby)\b/i,
  'pai': /\b(skill|workflow|claude|mcp|capture)\b/i,
  'infrastructure': /\b(server|container|network|deploy)\b/i,
  'finance': /\b(budget|investment|expense|tax)\b/i
};
```

## Connection Types

| Type | Description | Example |
|------|-------------|---------|
| `project` | Links to a project | Thought mentions "PAI" → links to PAI project |
| `skill` | Relates to a skill | Thought about MCPs → links to Platform skill |
| `past-thought` | Similar previous thought | Semantic similarity > 0.7 |
| `meeting` | Related meeting capture | Topic overlap with recent meeting |
| `session` | Related coding session | File/project overlap |
| `strategy` | Aligns with strategy | OKR keyword match |

## Storage Structure

```
~/workspace/captures/thoughts/
├── 2025/
│   └── 12/
│       ├── 29/
│       │   ├── thought-001.json
│       │   └── thought-002.json
│       └── index.json          # Daily index
├── by-category/
│   ├── ideas.json              # Category indices
│   ├── questions.json
│   └── tasks.json
├── by-domain/
│   ├── work.json
│   └── personal.json
└── connections.json            # Graph of thought connections
```

## Thought Record Format

```json
{
  "id": "THOUGHT-2025-12-29-001",
  "rawText": "What if we added voice capture to ThoughtCapture?",
  "category": "idea",
  "summary": "Voice capture for ThoughtCapture",
  "domains": ["pai"],
  "urgency": "none",
  "connections": [
    {
      "type": "project",
      "target": "CaptureIntelligence",
      "strength": 0.9,
      "rationale": "Direct enhancement to capture system"
    }
  ],
  "proposedActions": [
    "Add to CaptureIntelligence backlog",
    "Research voice-to-text options"
  ],
  "capturedAt": "2025-12-29T15:30:00Z",
  "source": {
    "type": "thought",
    "path": "direct-input",
    "timestamp": "2025-12-29T15:30:00Z"
  }
}
```

## Integration Points

- **MeetingIntelligence:** Thoughts during meetings captured separately
- **SessionIntelligence:** Thoughts during coding sessions
- **SynthesizeCaptures:** Thoughts included in cross-capture analysis
- **Linear Skill:** Tasks converted to Linear issues
- **Development Skill:** Ideas become PackDev briefs

## Example Usage

```
User: "note: what if we cached MCP responses for frequently called endpoints"
→ Invoke QuickCapture workflow
→ Category: idea
→ Domain: pai, infrastructure
→ Connections: SessionIntelligence (MCP analysis), Platform skill
→ Store and confirm

Response: "Captured idea about MCP caching. Connected to SessionIntelligence
and Platform skill. Want me to create a PackDev brief for this?"
```

```
User: "remember: need to review the Q1 OKRs before Monday standup"
→ Invoke QuickCapture workflow
→ Category: task
→ Urgency: medium (before Monday)
→ Domain: work
→ Store and confirm

Response: "Captured task: Review Q1 OKRs. Due before Monday standup.
Added to your weekend review list."
```

```
User: "review my ideas from this week"
→ Invoke ReviewThoughts workflow
→ Filter: category=idea, date=this week
→ Present grouped list
→ Offer actions: convert to task, create brief, archive
```
