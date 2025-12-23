---
name: AgentOrchestrator
description: Manages agent-pool pattern for isolated MCP execution. USE WHEN spawning child agents, managing agent pools, delegating to specialized agents with their own MCP configs, OR coordinating multi-agent workflows.
---

# AgentOrchestrator - Agent Pool Management

Coordinates isolated child agents that run with their own MCP configurations. Use when tasks require MCPs not loaded in the orchestrator, or when parallel specialized execution is needed.

## When to Use This Skill

- Spawning agents with isolated MCP configs (e.g., Unraid agent with unraid MCP)
- Parallel task execution across multiple agents
- Tasks requiring MCPs not in orchestrator's config
- Heavy MCP operations that shouldn't block the main session

## Agent Pool Structure

```
{project}/agents/
├── AGENT_TEMPLATE.md          # Template for new agents
├── {agent-name}/
│   ├── .mcp.json              # Agent-specific MCP config
│   ├── TASK.md                # Orchestrator writes task here
│   └── RESULT.md              # Agent writes results here
```

## Agent Opportunity Detection

**Proactively identify when new agents should be created.**

### Signals to Watch For
| Signal | Threshold | Action |
|--------|-----------|--------|
| Repeated MCP usage | 3+ calls same MCP | Suggest agent if heavy |
| SSH fallbacks | 3+ to same server | Suggest agent + MCP fix |
| Domain expertise | Specialized context needed | Suggest domain agent |
| Resource concerns | Slow/blocking MCP | Suggest isolated agent |

### Suggestion Template
> "I've noticed {pattern}. This looks like a good candidate for a **{domain} agent**. Want me to create one?"

See `workflows/DetectOpportunity.md` for full detection logic.

---

## Core Workflows

### 1. Spawn Single Agent

```bash
# Write task
cat > agents/{name}/TASK.md << 'EOF'
# Task description
...
EOF

# Spawn with timeout
cd agents/{name} && \
timeout 90 claude -p "Read TASK.md. Execute fail-fast checks, complete task, write RESULT.md." \
--dangerously-skip-permissions 2>&1

# Read result
cat agents/{name}/RESULT.md
```

### 2. Spawn Parallel Agents

For independent tasks, spawn multiple agents simultaneously:

```bash
# Write tasks to each agent
echo "Task 1" > agents/agent1/TASK.md
echo "Task 2" > agents/agent2/TASK.md

# Spawn in parallel (backgrounded)
(cd agents/agent1 && timeout 90 claude -p "..." --dangerously-skip-permissions) &
(cd agents/agent2 && timeout 90 claude -p "..." --dangerously-skip-permissions) &
wait

# Aggregate results
cat agents/agent1/RESULT.md agents/agent2/RESULT.md
```

### 3. Create New Agent

1. Copy template: `cp agents/AGENT_TEMPLATE.md agents/{name}/`
2. Create `.mcp.json` with only required MCPs
3. Customize TASK.md template for agent's domain
4. Initialize RESULT.md placeholder

## Agent Registry

| Agent | MCP(s) | Domain | Location |
|-------|--------|--------|----------|
| unraid | unraid | NAS management, Docker, storage | `agents/unraid/` |
| *(future)* unifi | unifi | Network config, firewall | `agents/unifi/` |
| *(future)* cloudflare | cloudflare | DNS, Pages, Workers | `agents/cloudflare/` |

## Fail-Fast Protocol

Every agent MUST verify connectivity before work:

1. **Network check** - Ping target (5s timeout)
2. **API check** - Quick query to verify MCP works (10s timeout)
3. **If either fails** - Write `STATUS: CONNECTIVITY_FAILED` to RESULT.md and exit

## MCP Gap Reporting

Agents report MCP limitations for continuous improvement:

```markdown
## MCP Gaps Found
| Gap | What Failed | Fallback Used | Enhancement Needed |
|-----|-------------|---------------|-------------------|
| share query | no path field | SSH | Add path to Share type |
```

Orchestrator reviews gaps and queues MCP enhancements.

## Result Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| SUCCESS | Task completed | Process results |
| NEEDS_WORK | Partial completion | Review blockers |
| CONNECTIVITY_FAILED | Can't reach target | Check network/server |
| ERROR | Unexpected failure | Check agent logs |

## Best Practices

1. **Timeouts** - Always use `timeout` command (90s default, adjust for task)
2. **Isolation** - Each agent gets fresh context, don't assume state
3. **Detailed prompts** - Agents don't see conversation history
4. **MCP gaps** - Track and enhance, don't just SSH around problems
5. **Parallel when possible** - Independent tasks should run concurrently

## Example: Unraid Agent Task

```markdown
# Unraid Agent Task

## CRITICAL: Fail-Fast Protocol
1. Ping nas1 (10.0.20.15) - 5s timeout
2. Test GraphQL endpoint
3. If either fails → STATUS: CONNECTIVITY_FAILED

## Task
Check disk health and report any warnings.

## Context
- Server: nas1 (10.0.20.15)
- Tools: mcp__unraid__*

## MCP Enhancement Protocol
If MCP lacks needed functionality:
1. Document in ## MCP Gaps Found
2. Note what SSH fallback was needed
3. Suggest enhancement

## Output
Write RESULT.md with status, findings, and any MCP gaps.
```

## Integration with CORE

This skill extends CORE's delegation patterns:
- CORE defines WHEN to delegate (parallel tasks, specialized work)
- AgentOrchestrator defines HOW (agent pool, spawn, aggregate)

## Troubleshooting

### Agent Times Out
- Check if MCP server is responding
- Verify network connectivity to target
- Increase timeout if task is legitimately slow

### Agent Returns Empty Result
- Verify RESULT.md path is correct
- Check agent had write permissions
- Review agent logs for errors

### MCP Not Available in Agent
- Verify `.mcp.json` exists in agent directory
- Check MCP server path is correct
- Ensure environment variables are set
