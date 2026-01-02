# Agent-Pool Pattern

**Created:** 2025-12-21
**Status:** Implemented
**First Implementation:** Scraper Agent

## Overview

The Agent-Pool Pattern is an architectural approach that keeps the main Claude Code session lean by loading heavy MCP servers only when needed via dedicated subagents.

## Problem Statement

Loading all MCP servers in every session creates issues:
- **Slow startup** - Each MCP server adds initialization time
- **Context bloat** - Tool definitions consume context window
- **Unnecessary cost** - Paying for tools you rarely use
- **Complexity** - More tools = more confusion for the model

## Solution: Lean Orchestrator + Heavy Agents

```
┌─────────────────────────────────────────────────────────────┐
│  ORCHESTRATOR (Your Main Session)                          │
│  - Essential MCPs only (joplin, cloudflare, infisical)     │
│  - Built-in tools (WebSearch, WebFetch, Bash, etc.)        │
│  - Fast startup, lean context                              │
├─────────────────────────────────────────────────────────────┤
│  When heavy tools needed:                                   │
│  ↓                                                          │
│  Task({ subagent_type: "agent-name", ... })                │
│  ↓                                                          │
│  Agent spawns with its own MCP config                       │
│  Agent does the heavy work                                  │
│  Agent returns results                                      │
│  Agent terminates (MCPs unload)                            │
└─────────────────────────────────────────────────────────────┘
```

## Architecture Components

### 1. MCP Config Files (`~/.claude/mcp-configs/`)

Each heavy agent has its own MCP configuration:

```
~/.claude/mcp-configs/
├── scraper.json      # BrightData, Apify, Playwright
├── database.json     # (future) PostgreSQL, Redis MCPs
└── monitoring.json   # (future) Prometheus, Grafana MCPs
```

### 2. Agent Definitions (`~/.claude/agents/`)

Each agent has a markdown definition with frontmatter:

```markdown
---
name: scraper
description: Heavy-duty web scraping agent...
model: sonnet
mcpConfig: .claude/mcp-configs/scraper.json
---

# Agent instructions here...
```

### 3. Skill Workflows

Skills route to agents when heavy work is needed:

```typescript
// Skill tries built-in tools first
WebFetch({ url: "https://example.com", prompt: "..." })

// If that fails, spawn the heavy agent
Task({
  subagent_type: "scraper",
  prompt: "...",
  model: "sonnet"
})
```

## Implementation Checklist

When creating a new agent-pool agent:

- [ ] Create MCP config in `~/.claude/mcp-configs/<agent>.json`
- [ ] Create agent definition in `~/.claude/agents/<agent>.md`
- [ ] Update relevant skills to use the agent
- [ ] Document the agent in `/docs/architecture/agents/<agent>.md`
- [ ] Test that main session doesn't load the heavy MCPs

## Benefits

| Aspect | Before (All MCPs) | After (Agent-Pool) |
|--------|-------------------|---------------------|
| Startup time | 15-30s | 5-10s |
| Context usage | High (all tool defs) | Low (essential only) |
| Cost | Pay for unused tools | Pay only when used |
| Complexity | 100+ tools visible | 30-40 essential tools |

## When to Use This Pattern

**Good candidates for agent-pool:**
- Heavy MCP servers (Playwright, BrightData, Apify)
- Specialized tools used <10% of sessions
- Tools with expensive API calls
- Tools with long initialization times

**Keep in main session:**
- Essential daily tools (Joplin, Cloudflare, Infisical)
- Built-in Claude Code tools
- Lightweight MCPs with fast startup

## Current Implementations

| Agent | MCPs | Use Case |
|-------|------|----------|
| `scraper` | BrightData, Apify, Playwright | Protected site scraping, social media, JS SPAs |

## Future Candidates

- `database` - PostgreSQL, Redis, MongoDB MCPs
- `monitoring` - Prometheus, Grafana, alerting MCPs
- `media` - Image processing, video transcoding MCPs

## Related Documentation

- [Scraper Agent](agents/scraper.md)
- [Research Skill - Retrieve Workflow](../../.claude/skills/research/workflows/retrieve.md)
- [AgentOrchestrator Skill](../../.claude/skills/AgentOrchestrator/SKILL.md)
