# OpenCode Compatibility Analysis for PAI

**Date:** 2025-12-15  
**Purpose:** Detailed analysis of PAI components for OpenCode.ai compatibility  
**Branch:** `opencode-support`

---

## Executive Summary

This document contains the research findings from analyzing PAI's codebase for OpenCode.ai compatibility. The analysis covers skills, hooks, agents, MCP integration, and other components that need adaptation for dual-IDE support.

---

## 1. Skills Analysis: IDE-Specific Dependencies

### 1.1 Claude Code-Specific Tool Names

#### Task Tool & Subagent System
**Location**: Throughout workflows, especially `CORE/SKILL.md`, `research/workflows/conduct.md`

```typescript
// Claude Code-specific pattern
Task({
  prompt: "...",
  subagent_type: "intern" | "engineer" | "researcher" | "architect" | "designer",
  model: "haiku" | "sonnet" | "opus"
})
```

**Files affected**:
- `/CORE/SKILL.md` (lines 206-235)
- `/research/workflows/conduct.md` (extensive Task tool usage)
- `/ArticleWriter/workflows/*.md`

**Adaptation needed**: OpenCode needs equivalent agent/task delegation system. The `subagent_type` concept must be mapped to OpenCode's agent model.

#### WebFetch & WebSearch Tools
**Location**: `brightdata/`, `research/`, `story-explanation/`

Referenced as native Claude Code tools:
- `WebFetch(url, prompt)` - Content retrieval
- `WebSearch(query)` - Web search

**Files affected**:
- `/brightdata/SKILL.md` - 4-tier scraping workflow depends on WebFetch
- `/research/workflows/retrieve.md` - Layer 1 uses WebFetch/WebSearch
- `/research/SKILL.md` - Claude-based research uses built-in WebSearch

**Adaptation needed**: Map to OpenCode's equivalent tools or implement fallbacks.

### 1.2 MCP Server References (`mcp__*`)

#### Extensively Used MCP Servers

**UniFi MCP** (`/skills/Unifi/`):
```
mcp__unifi__unifi_execute
mcp__unifi__unifi_tool_index
mcp__unifi__unifi_batch
mcp__unifi__unifi_batch_status
```

**BrightData MCP** (`/skills/brightdata/`, `/skills/research/`):
```
mcp__Brightdata__scrape_as_markdown
mcp__Brightdata__scrape_batch
mcp__Brightdata__search_engine
mcp__Brightdata__search_engine_batch
```

**Cloudflare MCP** (`/skills/ContentPublishing/`):
```
mcp__cloudflare__cloudflare-dns-mcp_create_pages_project
```

**Files with MCP dependencies**:
- `/Unifi/` - 7 workflow files with extensive MCP usage
- `/brightdata/workflows/four-tier-scrape.md`
- `/research/workflows/retrieve.md`
- `/McpManager/` - Entire skill manages MCP configurations

**Adaptation needed**: 
1. Document which MCPs are essential vs optional
2. Verify OpenCode MCP naming convention
3. Create fallback mechanisms for when MCPs unavailable

### 1.3 Hook System References

The PAI system uses these Claude Code hook events:
- `SessionStart` - Context loading, session initialization
- `SessionEnd` - Session summaries
- `UserPromptSubmit` - Tab title updates
- `Stop` - Main agent completion (voice notifications, history capture)
- `SubagentStop` - Agent-specific completions
- `PreToolUse` / `PostToolUse` - Tool execution tracking
- `PreCompact` - Context compression

**Hook implementation files** (`${PAI_DIR}/hooks/`):
- `load-core-context.ts`
- `initialize-pai-session.ts`
- `capture-all-events.ts`
- `stop-hook.ts`
- `subagent-stop-hook.ts`
- `capture-session-summary.ts`
- `update-tab-titles.ts`
- `context-compression-hook.ts`

**Files affected**:
- `/CORE/hook-system.md` - Complete hook documentation
- `/CORE/history-system.md` - References hook implementations
- `/CORE/terminal-tabs.md` - Tab title system via hooks

### 1.4 `.claude/` Path References

Throughout the skills, these `.claude/` paths are referenced:

```
~/.claude/                           # Global PAI directory
~/.claude/pai-config.json            # PAI configuration
~/.claude/.mcp.json                  # Global MCP config
~/.claude/mcp-templates/             # MCP templates
~/.claude/.env                       # API keys
~/.claude/hooks/                     # Hook scripts
~/.claude/skills/                    # Skills directory
~/.claude/history/                   # History system
~/.claude/scratchpad/                # Temporary files
~/.claude/agent-sessions.json        # Agent session mapping
.claude/                             # Project-level config
.claude/context.md                   # Project context
.claude/pai-config.json              # Project PAI config
```

**Files affected**:
- `/CORE/SKILL.md` - Extensive `.claude/` references
- `/McpManager/workflows/*.md` - All reference `~/.claude/`
- `/Finance/tools/*.ts` - Hardcoded fallback paths
- `/art/tools/generate-ulart-image.ts` - Hardcoded `.claude/.env`

### 1.5 `settings.json` References

Claude Code uses `settings.json` for:
- Environment variables (`"env": {...}`)
- Hook configuration (`"hooks": {...}`)
- MCP configuration
- CLI selection (`"cli": "claude"`)

### 1.6 Skills with tools/ Directories

#### Art Skill (`/art/tools/`)
- `generate-prompt.ts`
- `generate-ulart-image.ts`

**Hardcoded path** (line 30):
```typescript
const envPath = resolve(process.env.HOME!, '.claude/.env');
```

#### Finance Skill (`/Finance/tools/`)
- `Watchlist.ts`
- `Portfolio.ts`
- `DecisionJournal.ts`
- `Backtest.ts`

**Hardcoded fallback** in all:
```typescript
const PAI_DIR = process.env.PAI_DIR || join(process.env.HOME || "", ".claude");
```

#### Other Skills with Embedded Tools
- `/observability/` - Complete dashboard application
- `/Standup/` - Agent orchestration tools
- `/TestArchitect/` - Testing tools

---

## 2. Hooks Analysis for OpenCode Adaptation

### 2.1 Hook Mapping Table

| Hook Name | Claude Event | OpenCode Event | Adaptation Needed |
|-----------|--------------|----------------|-------------------|
| **load-core-context.ts** | `SessionStart` | `session.created` | **HIGH** - System reminder injection pattern |
| **initialize-session.ts** | `SessionStart` | `session.created` | **MEDIUM** - Voice server optional |
| **capture-session-summary.ts** | `SessionEnd` | `session.idle` | **MEDIUM** - Transcript format differs |
| **stop-hook.ts** | `Stop` | `session.status` | **HIGH** - Complex transcript parsing |
| **capture-tool-output.ts** | `PostToolUse` | `tool.execute.after` | **LOW** - Straightforward logging |
| **capture-all-events.ts** | Multiple | `event` (wildcard) | **MEDIUM** - Event type detection |
| **check-required-mcp.ts** | `SessionStart` | `session.created` | **LOW** - MCP checking portable |
| **context-compression-hook.ts** | `PreCompact` | `session.compacted` | **LOW** - Notification optional |
| **load-dynamic-requirements.ts** | `Prompt` | `prompt:before` | **MEDIUM** - System reminder pattern |
| **update-tab-titles.ts** | `Prompt` | N/A | **LOW** - Terminal-specific |
| **subagent-stop-hook.ts** | `SubagentStop` | N/A | **MEDIUM** - No direct equivalent |
| **validate-docs.ts** | Pre-commit | N/A (git hook) | **N/A** - Not IDE-specific |
| **validate-protected.ts** | Pre-commit | N/A (git hook) | **N/A** - Not IDE-specific |

### 2.2 lib/ Helper Modules Analysis

| Module | Purpose | Claude-Specific | OpenCode Adaptation |
|--------|---------|-----------------|---------------------|
| **lib/pai-paths.ts** | Centralized path resolution | Defaults to `~/.claude` | **CRITICAL** - Must abstract |
| **lib/context-save.ts** | Session context persistence | Config path | **MEDIUM** - Location abstraction |
| **lib/metadata-extraction.ts** | Agent instance ID extraction | None | **LOW** - Portable |

### 2.3 Detailed Analysis: High-Priority Hooks

#### load-core-context.ts

**Claude-Specific Behaviors:**
- Uses `<system-reminder>` XML tag format for context injection
- Detects subagents via `CLAUDE_PROJECT_DIR.includes('/.claude/agents/')` and `CLAUDE_AGENT_TYPE`
- Outputs to stdout which Claude Code captures

**Environment Variables:**
```typescript
process.env.PAI_DIR        // Defaults to ~/.claude
process.env.DA             // AI persona name
process.env.DA_COLOR       // Persona color
process.env.ENGINEER_NAME  // Human name
process.env.TIME_ZONE      // For timestamp formatting
process.env.CLAUDE_PROJECT_DIR   // Subagent detection
process.env.CLAUDE_AGENT_TYPE    // Subagent detection
```

**Adaptation Required:**
1. Abstract `<system-reminder>` to OpenCode's system prompt injection mechanism
2. Replace Claude subagent detection with OpenCode subagent pattern
3. Change default path from `~/.claude` to support both

#### stop-hook.ts

**Claude-Specific Behaviors:**
- Parses transcript JSONL with structure:
  ```typescript
  { type: 'user' | 'assistant', message: { content: [...] } }
  ```
- Looks for `tool_use` blocks with `name === 'Task'`
- Extracts `🎯 COMPLETED:` and `🗣️ CUSTOM COMPLETED:` markers
- Uses `Bun.stdin.stream().getReader()` for input

**External Integrations:**
- Voice server at `http://localhost:8888/notify`
- Voice config from iCloud path

**Adaptation Required:**
1. Map OpenCode's transcript/conversation format
2. Abstract voice notification (make optional/pluggable)
3. Standardize completion message extraction

#### lib/pai-paths.ts

**Current Implementation:**
```typescript
export const PAI_DIR = process.env.PAI_DIR
  ? resolve(process.env.PAI_DIR)
  : resolve(homedir(), '.claude');  // <-- Claude-specific default

export const HOOKS_DIR = join(PAI_DIR, 'hooks');
export const SKILLS_DIR = join(PAI_DIR, 'skills');
export const AGENTS_DIR = join(PAI_DIR, 'agents');
export const HISTORY_DIR = join(PAI_DIR, 'history');
export const COMMANDS_DIR = join(PAI_DIR, 'commands');
```

**Adaptation Required:**
Create abstraction layer supporting both IDEs.

---

## 3. OpenCode Source Code Findings

### 3.1 Statusline/Statusbar Feature

OpenCode has a **rich built-in status system**:

**Footer Component** shows:
- Directory path
- Permissions count
- LSP count
- MCP count

**Header Component** shows:
- Session title
- Context usage (tokens + percentage)
- Cost

**Status Dialog** shows:
- MCP server status (connected/failed/disabled/needs_auth)
- LSP server status
- Formatter status

### 3.2 Plugin System

OpenCode has a comprehensive plugin system with these hooks:

```typescript
export interface Hooks {
  event?: (input: { event: Event }) => Promise<void>
  config?: (input: Config) => Promise<void>
  tool?: { [key: string]: ToolDefinition }
  auth?: AuthHook
  "chat.message"?: (input, output) => Promise<void>
  "chat.params"?: (input, output) => Promise<void>
  "permission.ask"?: (input, output) => Promise<void>
  "tool.execute.before"?: (input, output) => Promise<void>
  "tool.execute.after"?: (input, output) => Promise<void>
  "experimental.chat.messages.transform"?: (input, output) => Promise<void>
  "experimental.chat.system.transform"?: (input, output) => Promise<void>
  "experimental.text.complete"?: (input, output) => Promise<void>
}
```

### 3.3 Complete Bus Events List

| Event Type | Description |
|------------|-------------|
| `session.created` | Session creation |
| `session.updated` | Session modification |
| `session.deleted` | Session deletion |
| `session.diff` | Session file changes |
| `session.error` | Session errors |
| `session.status` | Status changes (idle/busy/retry) |
| `session.idle` | Session becomes idle (deprecated) |
| `session.compacted` | Session compacted |
| `message.updated` | Message created/updated |
| `message.removed` | Message removed |
| `message.part.updated` | Part created/updated |
| `message.part.removed` | Part removed |
| `permission.updated` | Permission request |
| `permission.replied` | Permission response |
| `file.edited` | File edited by tool |
| `file.watcher.updated` | File system change detected |
| `todo.updated` | Todo list changed |
| `command.executed` | Command executed |
| `lsp.updated` | LSP status changed |
| `lsp.client.diagnostics` | LSP diagnostics received |
| `vcs.branch.updated` | Git branch changed |
| `pty.created` | PTY created |
| `pty.updated` | PTY updated |
| `pty.exited` | PTY exited |
| `pty.deleted` | PTY deleted |
| `installation.updated` | OpenCode updated |
| `installation.update-available` | Update available |
| `project.updated` | Project info changed |
| `server.connected` | Server connected |
| `tui.prompt.append` | Append to prompt |
| `tui.command.execute` | Execute TUI command |
| `tui.toast.show` | Show toast notification |

### 3.4 Agent System

OpenCode agents use markdown files with YAML frontmatter:

```markdown
---
description: Use this agent when...
mode: subagent | primary | all
model: anthropic/claude-sonnet-4-5
tools:
  write: false
permission:
  edit: allow
  bash: allow
---

Agent prompt content here...
```

### 3.5 Experimental Config Hooks

OpenCode has experimental config-based hooks:

```json
{
  "experimental": {
    "hook": {
      "file_edited": {
        "*.ts": [{ "command": ["eslint", "--fix", "$FILE"] }]
      },
      "session_completed": [
        { "command": ["notify-send", "Session done!"] }
      ]
    }
  }
}
```

---

## 4. Priority Adaptation Areas

### Critical (Must Change)
1. **`.claude/` → configurable** - All path references need abstraction
2. **`settings.json` format** - Hook configuration, env vars
3. **Task tool API** - Subagent orchestration pattern
4. **Hook event names** - Different in OpenCode
5. **lib/pai-paths.ts** - Must support both IDEs

### Important (Should Change)
1. **MCP naming convention** - Verify `mcp__*` tool names work
2. **WebFetch/WebSearch** - Tool name mapping
3. **Identity references** - "Claude Code" mentions in docs
4. **`PAI_DIR` environment variable** - May need IDE detection

### Low Priority (Can Keep As-Is)
1. **Skill structure** - `SKILL.md`, `workflows/`, `tools/` hierarchy
2. **`USE WHEN` pattern** - Likely universal
3. **Voice server** - Independent service
4. **Fabric CLI integration** - External tool

---

## 5. Agent Format Comparison

### Claude Code Agent Format
```yaml
---
name: architect
description: Use this agent when...
model: sonnet
color: purple
voiceId: Serena (Premium)        # PAI-specific
permissions:                      # Different structure
  allow:
    - "Bash"
    - "Read(*)"
    - "Write(*)"
---

# Prompt content...
```

### OpenCode Agent Format
```yaml
---
description: Use this agent when...
mode: subagent                   # Required: subagent | primary | all
model: anthropic/claude-sonnet-4-5
tools:
  write: false
permission:
  edit: allow
  bash: allow
---

Prompt content...
```

### Key Differences

| Field | Claude Code | OpenCode |
|-------|-------------|----------|
| `name` | In frontmatter | Derived from filename |
| `mode` | Not used | Required |
| `permissions` | Nested allow/deny arrays | Flat object |
| `model` | Short form (`sonnet`) | Full path (`anthropic/claude-sonnet-4-5`) |
| `voiceId` | PAI-specific | Not supported |
| `tools` | Not in frontmatter | Supported |

---

## 6. MCP Configuration Comparison

### Claude Code (.mcp.json)
```json
{
  "mcpServers": {
    "brightdata": {
      "command": "bunx",
      "args": ["-y", "@brightdata/mcp"],
      "env": { "API_TOKEN": "xxx" }
    },
    "httpx": {
      "type": "http",
      "url": "https://example.com",
      "headers": { "x-api-key": "xxx" }
    }
  }
}
```

### OpenCode (opencode.json)
```json
{
  "mcp": {
    "brightdata": {
      "type": "local",
      "command": ["bunx", "-y", "@brightdata/mcp"],
      "environment": { "API_TOKEN": "xxx" }
    },
    "httpx": {
      "type": "remote",
      "url": "https://example.com",
      "headers": { "x-api-key": "xxx" }
    }
  }
}
```

### Translation Rules

| Claude Code | OpenCode | Notes |
|-------------|----------|-------|
| `type: "http"` | `type: "remote"` | Renamed |
| `command` + `args` | `command` (array) | Merged |
| `env` | `environment` | Renamed |
| `headers` | `headers` | Same |
| `description` | N/A | Not supported |

---

## 7. Recommendations

### Immediate Actions
1. Create shared `lib/pai-paths.ts` with IDE detection
2. Create MCP translation script
3. Create agent format converter

### Short-Term
1. Build OpenCode plugin adapter
2. Update CORE skill documentation
3. Fix hardcoded paths in tool scripts

### Long-Term
1. Consider moving skills to `shared/skills/`
2. Create universal launcher
3. Comprehensive testing across both IDEs
