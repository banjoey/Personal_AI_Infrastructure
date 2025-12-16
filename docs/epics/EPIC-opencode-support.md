# EPIC: OpenCode.ai IDE Support for PAI

**Epic ID:** EPIC-OPENCODE-001  
**Branch:** `opencode-support` (from `joey-all`)  
**Created:** 2025-12-15  
**Status:** Planning  
**Estimated Effort:** 15-25 days (phased implementation)

---

## Executive Summary

Add OpenCode.ai as a supported IDE alongside Claude Code for Personal AI Infrastructure (PAI). This enables users to choose their preferred AI coding environment while maintaining full PAI functionality including skills, agents, hooks, MCP integration, and voice server.

### Goals
1. Support both Claude Code and OpenCode.ai as first-class IDEs
2. Minimize code duplication through shared abstractions
3. Maintain backward compatibility with existing Claude Code installations
4. Enable model-agnostic operation (Claude, GPT, Gemini, etc.) when using OpenCode

### Non-Goals
- Replacing Claude Code support
- Modifying PAI's skill architecture
- Creating a new skill system for OpenCode (skills remain universal)

---

## Architecture Overview

### Current State (Claude Code Only)

```
~/.claude/                          # Runtime directory
├── settings.json                   # Claude Code config (hooks, permissions, env)
├── pai-config.json                 # PAI shared config
├── .mcp.json                       # MCP server definitions
├── skills/ → $PAI_DIR/.claude/skills/    # Symlink
├── hooks/ → $PAI_DIR/.claude/hooks/      # Symlink
├── agents/ → $PAI_DIR/.claude/agents/    # Symlink
├── commands/ → $PAI_DIR/.claude/commands/# Symlink
├── scripts/ → $PAI_DIR/.claude/scripts/  # Symlink
└── history/                        # Local runtime data
```

### Target State (Dual IDE Support)

```
$PAI_DIR/
├── .claude/                        # Claude Code specific
│   ├── settings.json               # Claude Code config
│   ├── hooks/                      # Hook scripts (TypeScript)
│   └── ...
├── .opencode/                      # OpenCode specific (NEW)
│   ├── opencode.json               # OpenCode config
│   ├── plugin/                     # Plugin adapters
│   │   └── pai-hooks.ts            # Hook adapter
│   ├── agent/                      # Converted agents (or symlinks)
│   └── command/                    # Converted commands (or symlinks)
├── shared/                         # IDE-agnostic (NEW)
│   ├── lib/                        # Shared TypeScript utilities
│   │   ├── pai-paths.ts            # Path resolution (supports both IDEs)
│   │   └── ide-detection.ts        # Runtime IDE detection
│   ├── skills/                     # Skills (moved from .claude/)
│   └── AGENTS.md                   # Shared instructions
└── setup.sh                        # Enhanced for dual IDE setup
```

---

## Story Breakdown

### Phase 1: Foundation & Infrastructure (5-7 days)

#### Story 1.1: Create Shared Library Abstraction
**Priority:** Critical  
**Estimate:** 2 days

**Description:**
Create an IDE-agnostic shared library that handles path resolution, IDE detection, and common utilities used by both IDEs.

**Acceptance Criteria:**
- [ ] Create `shared/lib/pai-paths.ts` that detects IDE and resolves paths accordingly
- [ ] Create `shared/lib/ide-detection.ts` to determine runtime environment
- [ ] Support environment variable `PAI_IDE=claude|opencode|auto` for explicit override
- [ ] Default to auto-detection based on environment variables (`CLAUDE_*` vs `OPENCODE_*`)
- [ ] Update existing `.claude/hooks/lib/pai-paths.ts` to import from shared
- [ ] All existing hooks continue to work unchanged

**Technical Notes:**
```typescript
// shared/lib/ide-detection.ts
export type IDE = 'claude' | 'opencode' | 'unknown';

export function detectIDE(): IDE {
  if (process.env.PAI_IDE) return process.env.PAI_IDE as IDE;
  if (process.env.CLAUDE_PROJECT_DIR) return 'claude';
  if (process.env.OPENCODE_SESSION_ID) return 'opencode';
  return 'unknown';
}

// shared/lib/pai-paths.ts
export function getPAIDir(): string {
  const ide = detectIDE();
  if (process.env.PAI_DIR) return resolve(process.env.PAI_DIR);
  
  switch (ide) {
    case 'claude': return resolve(homedir(), '.claude');
    case 'opencode': return resolve(homedir(), '.opencode');
    default: return resolve(homedir(), '.claude'); // fallback
  }
}
```

---

#### Story 1.2: Create OpenCode Configuration File
**Priority:** Critical  
**Estimate:** 1 day

**Description:**
Create the `opencode.json` configuration file that mirrors Claude Code's `settings.json` functionality.

**Acceptance Criteria:**
- [ ] Create `.opencode/opencode.json` with schema reference
- [ ] Map all relevant settings from `settings.json`:
  - Model selection (`model`)
  - Permissions (`permission`)
  - MCP servers (`mcp`)
  - Instructions (`instructions`)
  - Environment variables (via `{env:VAR}` substitution)
- [ ] Add PAI-specific agent configurations
- [ ] Document differences between Claude Code and OpenCode configs

**Template:**
```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-5",
  "instructions": [
    "AGENTS.md",
    ".claude/skills/CORE/SKILL.md"
  ],
  "permission": {
    "edit": "allow",
    "bash": "allow",
    "webfetch": "allow"
  },
  "mcp": {
    // Translated from .mcp.json
  },
  "agent": {
    // Converted from .claude/agents/
  }
}
```

---

#### Story 1.3: Create MCP Configuration Translator
**Priority:** High  
**Estimate:** 1 day

**Description:**
Create a script/module that translates Claude Code's `.mcp.json` format to OpenCode's `mcp` config format.

**Acceptance Criteria:**
- [ ] Parse Claude Code `.mcp.json` format
- [ ] Translate to OpenCode format:
  - `type: "http"` → `type: "remote"`
  - `command`/`args` → `type: "local"` + `command` array
  - `env` → `environment`
  - `headers` → `headers` (same)
- [ ] Handle both local (command-based) and remote (URL-based) MCP servers
- [ ] Output can be embedded in `opencode.json` or written to separate file
- [ ] Create `scripts/translate-mcp.ts` CLI tool

**Example Translation:**
```json
// Claude Code (.mcp.json)
{
  "mcpServers": {
    "brightdata": {
      "command": "bunx",
      "args": ["-y", "@brightdata/mcp"],
      "env": { "API_TOKEN": "xxx" }
    },
    "httpx": {
      "type": "http",
      "url": "https://httpx-mcp.example.com",
      "headers": { "x-api-key": "xxx" }
    }
  }
}

// OpenCode (opencode.json)
{
  "mcp": {
    "brightdata": {
      "type": "local",
      "command": ["bunx", "-y", "@brightdata/mcp"],
      "environment": { "API_TOKEN": "xxx" }
    },
    "httpx": {
      "type": "remote",
      "url": "https://httpx-mcp.example.com",
      "headers": { "x-api-key": "xxx" }
    }
  }
}
```

---

#### Story 1.4: Create Agent Format Converter
**Priority:** High  
**Estimate:** 1 day

**Description:**
Create a script that converts Claude Code agent definitions to OpenCode format.

**Acceptance Criteria:**
- [ ] Parse Claude Code agent markdown files with YAML frontmatter
- [ ] Convert to OpenCode format:
  - Extract `name` from filename (OpenCode convention)
  - Map `permissions.allow` → `permission` object
  - Add `mode: "primary"` or `mode: "subagent"` based on agent type
  - Convert `model: sonnet` → `model: anthropic/claude-sonnet-4-5`
  - Remove PAI-specific fields (`voiceId`) that OpenCode doesn't support
- [ ] Preserve markdown body (prompt) unchanged
- [ ] Create `scripts/convert-agents.ts` CLI tool
- [ ] Support batch conversion of all agents

**Files Affected:**
- 13 agent files in `.claude/agents/`
- Output to `.opencode/agent/`

---

#### Story 1.5: Update setup.sh for Dual IDE Support
**Priority:** Critical  
**Estimate:** 2 days

**Description:**
Enhance the setup script to support both Claude Code and OpenCode installations.

**Acceptance Criteria:**
- [ ] Add IDE selection prompt: "Which IDE(s) do you use?"
  - Claude Code only
  - OpenCode only
  - Both (recommended)
- [ ] For Claude Code: Keep existing setup logic
- [ ] For OpenCode:
  - Create `~/.config/opencode/` global config if needed
  - Create `.opencode/` directory structure
  - Generate `opencode.json` from templates
  - Run MCP translation
  - Run agent conversion
  - Create symlinks for skills
- [ ] For Both: Set up both configurations
- [ ] Update `pai-config.json` to support `"cli": "claude" | "opencode" | "both"`
- [ ] Create/update `.pai_aliases` with appropriate launcher alias

---

### Phase 2: Plugin System & Hook Adaptation (4-6 days)

#### Story 2.1: Create PAI Plugin for OpenCode
**Priority:** Critical  
**Estimate:** 2 days

**Description:**
Create the main PAI plugin that integrates with OpenCode's plugin system, providing equivalent functionality to Claude Code hooks.

**Acceptance Criteria:**
- [ ] Create `.opencode/plugin/pai-hooks.ts` as main plugin
- [ ] Implement event handlers matching Claude Code hooks:

| Claude Code Hook | OpenCode Event | Implementation |
|-----------------|----------------|----------------|
| `SessionStart` | `session.created` | Load core context, initialize session |
| `SessionEnd` | `session.idle` | Capture session summary |
| `Stop` | `session.status` (idle) | Voice notification, history capture |
| `PreToolUse` | `tool.execute.before` | Event logging |
| `PostToolUse` | `tool.execute.after` | Output capture, event logging |
| `PreCompact` | `session.compacted` | Context compression notification |
| `UserPromptSubmit` | N/A (use `event` listener) | Tab title updates |
| `SubagentStop` | N/A | Custom handling via session tracking |

- [ ] Export plugin following OpenCode plugin interface
- [ ] Test all event handlers fire correctly

**Template:**
```typescript
import type { Plugin } from "@opencode-ai/plugin";

export const PAIPlugin: Plugin = async ({ project, client, $, directory }) => {
  return {
    // Session lifecycle
    "session.created": async ({ sessionID }) => {
      // Load core context
    },
    
    // Tool execution
    "tool.execute.before": async (input, output) => {
      // Log event
    },
    
    "tool.execute.after": async (input, output) => {
      // Capture output
    },
    
    // Global event listener
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        // Session completed - capture summary, voice notification
      }
    },
  };
};
```

---

#### Story 2.2: Port load-core-context.ts to OpenCode
**Priority:** Critical  
**Estimate:** 1 day

**Description:**
Adapt the core context loading functionality to work within OpenCode's plugin system.

**Acceptance Criteria:**
- [ ] Read CORE skill content (`skills/CORE/SKILL.md`)
- [ ] Determine method to inject into OpenCode's system prompt
  - Option A: Use `instructions` config array
  - Option B: Use `experimental.chat.system.transform` plugin hook
- [ ] Handle subagent detection (OpenCode may use different mechanism)
- [ ] Preserve persona name injection (`DA`, `ASSISTANT_NAME`)
- [ ] Test context loading on session start

**Technical Challenge:**
Claude Code uses `<system-reminder>` tags output to stdout. OpenCode uses different injection mechanisms. Need to determine OpenCode's equivalent.

---

#### Story 2.3: Port Session History Capture
**Priority:** High  
**Estimate:** 1 day

**Description:**
Adapt session history capture (stop-hook, capture-session-summary, capture-tool-output) to OpenCode.

**Acceptance Criteria:**
- [ ] Create history directory structure if not exists
- [ ] Capture tool outputs to `history/raw-outputs/`
- [ ] Capture session summaries to `history/sessions/`
- [ ] Adapt transcript parsing for OpenCode's message format
- [ ] Preserve existing history format for cross-IDE compatibility
- [ ] Voice notification integration (optional, graceful degradation)

---

#### Story 2.4: Port Event Logging System
**Priority:** Medium  
**Estimate:** 1 day

**Description:**
Adapt the capture-all-events.ts functionality to OpenCode's event system.

**Acceptance Criteria:**
- [ ] Log all relevant events to history
- [ ] Map OpenCode event types to existing log format
- [ ] Maintain agent session tracking (`agent-sessions.json`)
- [ ] Preserve timestamp and timezone handling

---

### Phase 3: Skills Adaptation (3-4 days)

#### Story 3.1: Audit Skills for IDE-Specific Dependencies
**Priority:** High  
**Estimate:** 1 day

**Description:**
Review all skills for Claude Code-specific dependencies and document required changes.

**Acceptance Criteria:**
- [ ] Audit all 30+ skills for:
  - Hardcoded `.claude/` paths → Replace with `${PAI_DIR}/`
  - Claude-specific tool names → Document equivalents
  - MCP references (`mcp__*`) → Verify OpenCode MCP naming
  - Hook references → Update to shared documentation
  - `settings.json` references → Abstract to config
- [ ] Create compatibility report for each skill
- [ ] Prioritize skills by usage frequency

**Known Issues from Analysis:**
| Skill | Issue | Resolution |
|-------|-------|------------|
| CORE | Hardcoded paths, hook references | Update documentation |
| research | Task tool subagent_type | Verify OpenCode Task equivalent |
| brightdata | MCP naming `mcp__Brightdata__*` | Verify OpenCode MCP naming |
| Unifi | Heavy MCP usage | Verify all MCP tools work |
| art/tools | Hardcoded `~/.claude/.env` path | Use shared path resolution |
| Finance/tools | PAI_DIR fallback to `.claude` | Use shared path resolution |

---

#### Story 3.2: Update CORE Skill for Dual IDE
**Priority:** Critical  
**Estimate:** 1 day

**Description:**
Update the CORE skill to be IDE-agnostic and work with both Claude Code and OpenCode.

**Acceptance Criteria:**
- [ ] Update all path references to use `${PAI_DIR}` variable
- [ ] Update hook-system.md documentation for both IDEs
- [ ] Update SKILL-STRUCTURE-AND-ROUTING.md with OpenCode notes
- [ ] Add IDE detection notes to CONSTITUTION.md
- [ ] Ensure `USE WHEN` pattern works in OpenCode (verify)
- [ ] Test CORE skill loading in both IDEs

---

#### Story 3.3: Update Tool Scripts for Dual IDE
**Priority:** High  
**Estimate:** 1 day

**Description:**
Update all TypeScript tool scripts in skills to use shared path resolution.

**Acceptance Criteria:**
- [ ] Update `art/tools/generate-ulart-image.ts` - remove hardcoded `.claude` path
- [ ] Update `Finance/tools/*.ts` - use shared pai-paths
- [ ] Update `Standup/tools/*.ts` - verify path compatibility
- [ ] Update `TestArchitect/tools/*.ts` - verify path compatibility
- [ ] All tools import from `shared/lib/pai-paths`
- [ ] Test tools work in both IDE environments

---

#### Story 3.4: Create AGENTS.md for OpenCode
**Priority:** High  
**Estimate:** 1 day

**Description:**
Create the AGENTS.md file that OpenCode uses for system instructions, combining PAI identity and skill routing.

**Acceptance Criteria:**
- [ ] Create `AGENTS.md` at PAI root (shared by both IDEs)
- [ ] Include PAI identity (from CORE skill)
- [ ] Include skill routing instructions
- [ ] Include key behavioral guidelines
- [ ] Reference skill files for detailed context
- [ ] Test OpenCode reads and applies AGENTS.md

**Template Structure:**
```markdown
# PAI - Personal AI Infrastructure

## Identity
You are [AI_NAME], a personal AI assistant...

## Skill System
PAI uses a skill-based architecture. Skills are located in `${PAI_DIR}/skills/`.

When user requests match skill triggers, load the appropriate skill:
- Research requests → Load `skills/research/SKILL.md`
- Development requests → Load `skills/development/SKILL.md`
- ...

## Behavioral Guidelines
- Always verify before destructive operations
- Use voice notifications for long-running tasks
- Follow the structured output format
...
```

---

### Phase 4: Launcher & Integration (2-3 days)

#### Story 4.1: Create OpenCode Launcher Script
**Priority:** High  
**Estimate:** 1 day

**Description:**
Create an OpenCode-equivalent of `pai-launch.sh` that runs pre-startup modules and launches OpenCode.

**Acceptance Criteria:**
- [ ] Create `scripts/pai-launch-opencode.sh`
- [ ] Run pre-startup modules (shared with Claude launcher):
  - MCP sync
  - Health check
  - Context detection
  - Auto-update
- [ ] Launch `opencode` CLI with appropriate arguments
- [ ] Support passing arguments through to opencode
- [ ] Update `.pai_aliases` generation to support both launchers

---

#### Story 4.2: Create Universal Launcher
**Priority:** Medium  
**Estimate:** 1 day

**Description:**
Create a single `pai` command that launches the appropriate IDE based on configuration.

**Acceptance Criteria:**
- [ ] Create `scripts/pai.sh` universal launcher
- [ ] Read `pai-config.json` for `cli` preference
- [ ] Support CLI override: `pai --claude` or `pai --opencode`
- [ ] Run shared pre-startup modules
- [ ] Launch appropriate IDE
- [ ] Update alias to point to universal launcher

---

#### Story 4.3: Update Pre-Startup Modules
**Priority:** Medium  
**Estimate:** 1 day

**Description:**
Ensure all pre-startup modules work with both IDEs.

**Acceptance Criteria:**
- [ ] Update `01-mcp-sync.sh` for OpenCode MCP config location
- [ ] Update `02-health-check.sh` for OpenCode directories
- [ ] Update `03-context-detection.sh` for shared context files
- [ ] Update `04-auto-update.sh` (should work unchanged)
- [ ] Test all modules with both IDEs

---

### Phase 5: Testing & Documentation (2-3 days)

#### Story 5.1: Create Integration Test Suite
**Priority:** High  
**Estimate:** 1 day

**Description:**
Create tests to verify PAI works correctly with both IDEs.

**Acceptance Criteria:**
- [ ] Test suite for shared library functions
- [ ] Test MCP translation accuracy
- [ ] Test agent conversion accuracy
- [ ] Test plugin event firing in OpenCode
- [ ] Test skill loading in both IDEs
- [ ] Test history capture in both IDEs
- [ ] Document test procedures in `tests/README.md`

---

#### Story 5.2: Update Documentation
**Priority:** High  
**Estimate:** 1 day

**Description:**
Update all PAI documentation to reflect dual IDE support.

**Acceptance Criteria:**
- [ ] Update README.md with OpenCode setup instructions
- [ ] Update QUICKSTART.md for both IDEs
- [ ] Create `docs/opencode-setup.md` detailed guide
- [ ] Update `docs/CONTEXT.md` for both environments
- [ ] Add troubleshooting section for OpenCode
- [ ] Document known differences between IDEs

---

#### Story 5.3: Create Migration Guide
**Priority:** Medium  
**Estimate:** 1 day

**Description:**
Create a guide for users migrating from Claude Code-only to dual IDE support.

**Acceptance Criteria:**
- [ ] Step-by-step migration instructions
- [ ] Backup procedures for existing configuration
- [ ] Verification steps after migration
- [ ] Rollback instructions if needed
- [ ] FAQ for common migration issues

---

## Technical Dependencies

### External Dependencies
- OpenCode.ai CLI installed (`opencode` command available)
- Bun runtime (for TypeScript execution)
- Node.js (for some MCP servers)

### Internal Dependencies
| Story | Depends On |
|-------|-----------|
| 1.2 | 1.1 (shared lib) |
| 1.3 | 1.1 (shared lib) |
| 1.4 | 1.1 (shared lib) |
| 1.5 | 1.1, 1.2, 1.3, 1.4 |
| 2.1 | 1.2 (opencode.json) |
| 2.2 | 2.1 (plugin base) |
| 2.3 | 2.1 (plugin base) |
| 2.4 | 2.1 (plugin base) |
| 3.2 | 1.1 (shared lib) |
| 3.3 | 1.1 (shared lib) |
| 3.4 | 3.2 (CORE skill) |
| 4.1 | 2.1 (plugin), 1.5 (setup) |
| 4.2 | 4.1 (opencode launcher) |
| 5.1 | All Phase 1-4 stories |
| 5.2 | 5.1 (tests passing) |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OpenCode plugin API changes | Medium | High | Pin OpenCode version, monitor changelogs |
| MCP naming incompatibility | Low | Medium | Test all MCPs, document differences |
| SubagentStop no equivalent | High | Medium | Implement custom tracking via session events |
| Skill routing differences | Medium | Medium | Test all skills, update routing as needed |
| Voice server integration | Low | Low | Make voice optional, graceful degradation |

---

## Success Criteria

1. **Functionality:** All PAI features work in both Claude Code and OpenCode
2. **Parity:** No significant feature gaps between IDEs
3. **Simplicity:** Single `pai` command works regardless of IDE choice
4. **Maintainability:** Minimal duplication, shared code where possible
5. **Documentation:** Clear setup and usage instructions for both IDEs
6. **Testing:** Comprehensive test coverage for dual-IDE scenarios

---

## Future Considerations

- **Gemini Code support:** The shared architecture should make adding future IDEs easier
- **Model-agnostic skills:** OpenCode's multi-model support enables using GPT, Gemini, etc.
- **Plugin ecosystem:** PAI could publish OpenCode plugins to npm
- **Cross-IDE session sharing:** Potential to share session history between IDEs

---

## Appendix A: File Mapping Reference

| Claude Code | OpenCode | Notes |
|-------------|----------|-------|
| `~/.claude/` | `~/.config/opencode/` (global) | Different default locations |
| `.claude/settings.json` | `opencode.json` | Different schema |
| `.claude/hooks/*.ts` | `.opencode/plugin/*.ts` | Different event model |
| `.claude/agents/*.md` | `.opencode/agent/*.md` | Similar but not identical |
| `.claude/commands/*.md` | `.opencode/command/*.md` | Similar format |
| `.mcp.json` | `mcp` in `opencode.json` | Different structure |
| `CLAUDE_PROJECT_DIR` | `OPENCODE_*` env vars | Different env vars |

---

## Appendix B: Event Mapping Reference

| Claude Code Event | OpenCode Event | Available Data |
|-------------------|----------------|----------------|
| `SessionStart` | `session.created` | sessionID |
| `SessionEnd` | `session.idle` (deprecated), `session.status` | sessionID, status |
| `Stop` | via `event` listener for `session.status` | sessionID |
| `SubagentStop` | N/A - custom implementation needed | - |
| `PreToolUse` | `tool.execute.before` | tool, sessionID, callID, args |
| `PostToolUse` | `tool.execute.after` | tool, sessionID, callID, output |
| `PreCompact` | `session.compacted` | sessionID |
| `UserPromptSubmit` | `tui.prompt.append` or `message.updated` | varies |

---

## Appendix C: MCP Translation Reference

| Claude Code Field | OpenCode Field | Notes |
|-------------------|----------------|-------|
| `type: "http"` | `type: "remote"` | Renamed |
| `url` | `url` | Same |
| `headers` | `headers` | Same |
| `command` | `command` (array) | Must be array in OpenCode |
| `args` | (merged into `command`) | OpenCode uses single array |
| `env` | `environment` | Renamed |
| `description` | N/A | Not supported in OpenCode |
