# PAI Agents Registry

This directory documents all agents in the PAI system. Agents are specialized Claude subprocesses that can be spawned on-demand with their own MCP configurations.

## Agent Types

### 1. Agent-Pool Agents (Heavy MCPs, On-Demand)

These agents load expensive MCP servers only when needed, keeping the main session lean.

| Agent | MCPs | Use Case | Doc |
|-------|------|----------|-----|
| `scraper` | BrightData, Apify, Playwright | Protected sites, social media, JS SPAs | [scraper.md](scraper.md) |

### 2. Researcher Agents (Built-in Tools)

These agents use Claude's built-in tools and don't require special MCPs.

| Agent | Tools | Use Case | Location |
|-------|-------|----------|----------|
| `claude-researcher` | WebSearch, WebFetch | General web research | `~/.claude/agents/claude-researcher.md` |
| `gemini-researcher` | Gemini API | Multi-query research | `~/.claude/agents/gemini-researcher.md` |
| `perplexity-researcher` | Perplexity API | Deep research | `~/.claude/agents/perplexity-researcher.md` |

### 3. Specialist Agents (Role-Based)

These agents have specialized system prompts for specific tasks.

| Agent | Specialty | Location |
|-------|-----------|----------|
| `architect` | System design, PRDs | `~/.claude/agents/architect.md` |
| `engineer` | Code implementation | `~/.claude/agents/engineer.md` |
| `designer` | UX/UI design | `~/.claude/agents/designer.md` |
| `pentester` | Security testing | `~/.claude/agents/pentester.md` |

## How to Spawn an Agent

```typescript
Task({
  subagent_type: "<agent-name>",
  prompt: "...",
  model: "sonnet"  // or "haiku" or "opus"
})
```

## Creating New Agents

See [Agent-Pool Pattern](../agent-pool-pattern.md) for the full guide.

### Quick Checklist

1. **Agent Definition** - Create `~/.claude/agents/<name>.md`
2. **MCP Config** (if needed) - Create `~/.claude/mcp-configs/<name>.json`
3. **Documentation** - Add to this registry and create `agents/<name>.md`
4. **Skill Integration** - Update relevant skills to spawn the agent

### Agent Definition Template

```markdown
---
name: agent-name
description: What this agent does. USE WHEN [triggers].
model: sonnet
mcpConfig: .claude/mcp-configs/agent-name.json  # optional
---

# Agent Name

You are a specialized agent for [purpose].

## Your Tools

[List available MCPs and key tools]

## Response Format

[How the agent should structure responses]

## Important Notes

[Any constraints or guidelines]
```

## Agent-Pool vs Regular Agents

| Aspect | Agent-Pool | Regular |
|--------|------------|---------|
| MCPs | Heavy, loaded on-demand | None or lightweight |
| Startup | 10-30s (MCP init) | 2-5s |
| Use case | <10% of sessions | Frequent use |
| Examples | scraper, database | researcher, engineer |

## Planned Agents

| Agent | MCPs | Purpose | Status |
|-------|------|---------|--------|
| `database` | PostgreSQL, Redis | Database operations | Planned |
| `monitoring` | Prometheus, Grafana | Infrastructure monitoring | Planned |
| `media` | FFmpeg, ImageMagick | Media processing | Planned |
