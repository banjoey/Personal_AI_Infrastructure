---
name: SessionIntelligence
description: Analyze Claude Code sessions for patterns and optimization opportunities. USE WHEN user mentions session analysis, MCP usage, tool optimization, skill migration, OR wants to understand coding session patterns. Identifies candidates for deterministic tools.
---

# SessionIntelligence

Analyzes Claude Code session transcripts to identify MCP usage patterns, tool optimization opportunities, and candidates for skill migration or deterministic tooling.

## Architecture

```
Session Transcript → [Deterministic Analysis] → [Pattern Detection] → PackDev Briefs
                            ↓                         ↓
                    - Parse tool calls         - MCP usage patterns
                    - Extract MCP usage        - Follow-up sequences
                    - Calculate frequencies    - Migration candidates
                    - Detect sequences         - Skill opportunities
```

**Principle:** Identify what can be automated, then propose it.

## Workflows

### AnalyzeSession

**Trigger:** User provides a Claude Code session transcript or JSONL

**Input Requirements:**
- Session transcript (from Claude Code export or history)
- Optional: Project context for relevance scoring

**Steps:**

1. **Parse Session** (Deterministic)
   ```bash
   bun run ${CAPTURE_TOOLS}/parse-session.ts --input <session> --output parsed.json
   ```

2. **Extract Tool Calls** (Deterministic)
   ```bash
   bun run ${CAPTURE_TOOLS}/extract-tool-calls.ts --input parsed.json --output tools.json
   ```

3. **Analyze MCP Usage** (Deterministic)
   ```bash
   bun run ${CAPTURE_TOOLS}/analyze-mcp.ts --input tools.json --output mcp-analysis.json
   ```

4. **Detect Patterns** (Deterministic + LLM)
   - Identify repeated tool sequences
   - Find MCP endpoints with high call counts
   - Detect error patterns and retries

5. **Generate Migration Candidates** (Deterministic)
   ```bash
   bun run ${CAPTURE_TOOLS}/generate-migrations.ts --input mcp-analysis.json --output migrations.json
   ```

6. **Create PackDev Briefs** (LLM Synthesis)
   - For candidates meeting threshold (10+ calls)
   - Suggest skill wrapper vs deterministic tool
   - Estimate effort and dependencies

**Output:** Session folder at `~/workspace/captures/sessions/YYYY-MM-DD-session-<slug>/`

---

### AnalyzeMCPUsage

**Trigger:** User wants to understand MCP usage patterns across sessions

**Input:** Multiple session folders or date range

**Steps:**
1. Aggregate MCP calls across sessions
2. Calculate usage frequencies by server/endpoint
3. Identify underutilized endpoints
4. Detect endpoints with high error rates
5. Suggest consolidation or deprecation

**Output:** MCP usage report with recommendations

---

### DetectMigrationCandidates

**Trigger:** User wants to find opportunities for deterministic tooling

**Threshold Criteria:**
- 10+ calls to same endpoint pattern
- Repeated tool sequences (3+ occurrences)
- High-frequency MCP calls that could be cached
- Error-prone patterns that need guardrails

**Migration Types:**
| Type | When to Use | Example |
|------|-------------|---------|
| `skill-wrapper` | Complex orchestration needed | Multi-step MCP workflows |
| `deterministic-tool` | Predictable input/output | Parsing, formatting |
| `cli-command` | Simple shell operations | File operations, git |
| `caching-layer` | Repeated identical calls | API lookups |

---

### TrackSessionPatterns

**Trigger:** Continuous analysis of coding sessions

**Steps:**
1. Monitor new session files in history
2. Extract patterns incrementally
3. Update pattern database
4. Alert on significant new patterns
5. Suggest optimizations when thresholds met

---

## Tool Call Analysis

### Extracted Metrics

```typescript
interface ToolCallMetrics {
  tool: string;
  server?: string;           // For MCP tools
  endpoint?: string;         // For MCP tools
  callCount: number;
  avgDurationMs: number;
  errorRate: number;
  commonParameters: Record<string, number>;  // Parameter frequency
  followUpTools: FollowUpPattern[];
  timeDistribution: {
    hour: number;
    count: number;
  }[];
}
```

### Follow-Up Pattern Detection

Identifies tool sequences like:
- `Read → Edit → Read` (common edit verification pattern)
- `mcp__linear_search → mcp__linear_get → mcp__linear_update` (Linear workflow)
- `Glob → Read → Read → Read` (file exploration pattern)

These sequences are candidates for workflow skills.

---

## MCP Migration Analysis

### High-Value Migration Signals

1. **Frequency** - Endpoints called 10+ times per session
2. **Predictability** - Same parameters used repeatedly
3. **Simplicity** - Could be a CLI command or script
4. **Error Patterns** - Retries suggest need for guardrails
5. **Latency** - Slow calls that could be cached

### Migration Recommendation Format

```json
{
  "endpoint": "mcp__unraid_get_containers",
  "server": "unraid-mcp",
  "callCount": 47,
  "recommendation": {
    "type": "caching-layer",
    "rationale": "Container list changes infrequently, called 47 times in 3 sessions",
    "implementation": "Cache with 5-minute TTL, invalidate on container operations",
    "effort": "small",
    "dependencies": []
  }
}
```

---

## Session Folder Structure

```
~/workspace/captures/sessions/2025-12-29-session-pai-development/
├── raw/
│   └── session.jsonl           # Original session transcript
├── extracted/
│   ├── parsed.json             # Structured session data
│   ├── tool-calls.json         # All tool invocations
│   └── mcp-analysis.json       # MCP-specific analysis
├── patterns/
│   ├── sequences.json          # Detected tool sequences
│   ├── migrations.json         # Migration candidates
│   └── packdev-briefs/         # Generated briefs
└── MANIFEST.json               # Session metadata
```

---

## Integration Points

- **MeetingIntelligence:** Session analysis may reveal discussed improvements
- **Development Skill:** PackDev briefs trigger new tool/skill creation
- **SynthesizeCaptures:** Patterns aggregated across sessions and meetings
- **Platform Skill:** Infrastructure-related MCP patterns

---

## Example Usage

```
User: "Analyze my last coding session"
→ Invoke AnalyzeSession workflow
→ Parse session transcript
→ Extract and analyze tool calls
→ Identify patterns and migration candidates
→ Generate PackDev briefs for high-value opportunities
```

```
User: "What MCPs am I using most?"
→ Invoke AnalyzeMCPUsage workflow
→ Aggregate across recent sessions
→ Report usage by server/endpoint
→ Highlight optimization opportunities
```

```
User: "Find things I could automate"
→ Invoke DetectMigrationCandidates workflow
→ Analyze tool sequences and frequencies
→ Generate migration recommendations
→ Create PackDev briefs for top candidates
```
