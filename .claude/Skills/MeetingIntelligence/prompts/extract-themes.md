# Theme Extraction Prompt

You are analyzing a parsed meeting transcript to extract themes and synthesize insights.

## Input

You will receive:
1. **Parsed Transcript** - JSON with speakers, segments, and metadata
2. **Extracted Actions** - Action items already identified by deterministic tools
3. **Project Context** (optional) - Strategic goals or OKRs for alignment

## Your Task

Analyze the transcript and extract:

### 1. Themes

Identify 3-7 major themes discussed. For each theme:

```json
{
  "id": "THEME-001",
  "name": "Short descriptive name",
  "summary": "2-3 sentence summary of this theme",
  "whyItMatters": "Business impact or importance",
  "technicalDetails": "Technical specifics if applicable",
  "decisionsMade": ["List of decisions related to this theme"],
  "openQuestions": ["Unresolved questions"],
  "actionItemIds": ["ACTION-001", "ACTION-003"],
  "keyQuotes": ["Verbatim quotes that capture the theme"],
  "lineRanges": [[10, 25], [45, 60]]
}
```

### 2. Decisions

Extract all decisions made during the meeting:
- What was decided
- Who made/approved the decision
- Any conditions or caveats
- Related action items

### 3. Open Questions

Identify questions that were raised but not resolved:
- The question itself
- Who raised it
- Any partial answers discussed
- Suggested owner for follow-up

### 4. Key Quotes

Extract 3-5 verbatim quotes that:
- Capture critical decisions
- Highlight important insights
- Represent turning points in discussion

## Output Format

```json
{
  "themes": [...],
  "decisions": [
    {
      "decision": "We will use JSON as default format",
      "madeBy": "Joey",
      "context": "Discussion about capture output formats",
      "relatedActions": ["ACTION-005"]
    }
  ],
  "openQuestions": [
    {
      "question": "How do we handle large transcript files?",
      "raisedBy": "Sarah",
      "partialAnswer": "Might be a memory issue",
      "suggestedOwner": "Mike"
    }
  ],
  "keyQuotes": [
    {
      "quote": "Let's always default to JSON for captures since it's more parseable",
      "speaker": "Joey",
      "significance": "Establishes project standard for output format"
    }
  ],
  "meetingHealth": {
    "decisionsMade": 3,
    "actionsAssigned": 8,
    "questionsResolved": 2,
    "questionsOpen": 1,
    "participationBalance": "good|uneven|dominated"
  }
}
```

## Guidelines

1. **Preserve Attribution** - Always note who said what
2. **Be Specific** - Avoid vague summaries, cite specific examples
3. **Link to Actions** - Connect themes to extracted action items by ID
4. **Flag Conflicts** - Note any disagreements or unresolved tensions
5. **Note Patterns** - Identify recurring topics or concerns

## Do NOT

- Fabricate quotes not in the transcript
- Add action items (those are extracted deterministically)
- Make assumptions about unstated context
- Include meta-commentary about the analysis process
