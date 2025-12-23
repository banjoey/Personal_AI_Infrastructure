# Detect Agent Opportunity Workflow

## Purpose
Identify when a new specialized agent should be created based on usage patterns.

## Detection Triggers

### 1. MCP Usage Patterns
**Signal:** Same MCP tools used repeatedly in a session

| Pattern | Threshold | Example |
|---------|-----------|---------|
| Same MCP, multiple calls | 3+ calls | `mcp__unraid__*` called 5 times |
| Related queries | 2+ in sequence | Docker status, then container list |
| Cross-session pattern | Same MCP in 3+ sessions | Always checking Cloudflare DNS |

### 2. SSH Fallback Patterns
**Signal:** Repeatedly SSH'ing to same target

```
# Watch for patterns like:
ssh root@10.0.20.15 "..."   # First time - fine
ssh root@10.0.20.15 "..."   # Second time - note it
ssh root@10.0.20.15 "..."   # Third time - suggest agent
```

**Action:** "I've SSH'd to nas1 three times. This suggests we need an Unraid agent with proper MCP tools."

### 3. Domain Expertise Signals
**Signal:** Task requires specialized knowledge

| Domain | Signals | Agent Candidate |
|--------|---------|-----------------|
| Network | firewall rules, VLANs, clients | unifi agent |
| Storage | arrays, shares, NFS | unraid agent |
| DNS/CDN | records, pages, workers | cloudflare agent |
| CI/CD | pipelines, runners, repos | gitlab agent |
| Email | forwarding, send-as, labels | google-workspace agent |

### 4. Resource Isolation Signals
**Signal:** MCP is heavy or blocks orchestrator

| Pattern | Indicator |
|---------|-----------|
| Slow responses | MCP calls taking >10s |
| High memory | Docker containers, browser automation |
| Blocking | Orchestrator waits on single MCP |

## Suggestion Template

When patterns detected, suggest:

```
I've noticed {pattern}:
- {specific observation 1}
- {specific observation 2}
- {specific observation 3}

This looks like a good candidate for a **{domain} agent**. Benefits:
- Isolated MCP config (only loads when needed)
- Specialized context for {domain} tasks
- Faster orchestrator response

Want me to create the {domain} agent?
```

## Decision Matrix

| Pattern | Frequency | Complexity | Create Agent? |
|---------|-----------|------------|---------------|
| MCP usage | 3+ calls | Low | Maybe (if heavy) |
| MCP usage | 3+ calls | High | Yes |
| SSH fallback | 3+ times | Any | Yes (with MCP enhancement) |
| Domain expertise | Ongoing | High | Yes |
| Resource concern | Any | Heavy | Yes |

## Anti-Patterns (Don't Suggest)

1. **One-off tasks** - Single use doesn't justify agent
2. **Already in orchestrator** - MCP already loaded globally
3. **Simple queries** - Quick lookups don't need isolation
4. **Infrequent use** - Less than monthly usage

## After Detection

1. Suggest agent creation to user
2. If approved, use CreateAgent workflow
3. Register in AgentOrchestrator skill
4. Note MCP gaps for enhancement
5. Update CONTEXT.md with new agent

## Examples

### Example 1: Unraid Agent Opportunity
```
Session activity:
- ssh root@nas1 "docker ps" (checking containers)
- ssh root@nas1 "ls /mnt/user/" (checking shares)
- mcp__unraid__* fails (schema mismatch)
- ssh root@nas1 "cat /etc/exports" (checking NFS)

Suggestion:
"I've SSH'd to nas1 four times because the Unraid MCP has schema issues.
This is a good candidate for an unraid agent with:
- Updated MCP (fix 7.2 schema)
- Specialized NFS/share workflows
Want me to create it?"
```

### Example 2: GitLab Agent Opportunity
```
Session activity:
- mcp__gitlab__list_projects (multiple repos)
- mcp__gitlab__get_pipeline (CI status)
- mcp__gitlab__create_issue (tracking)
- mcp__gitlab__mr_list (code review)

Suggestion:
"I've used GitLab MCP extensively this session for CI/CD work.
This could benefit from a gitlab agent with:
- Dedicated CI/CD context
- Pipeline monitoring workflows
Want me to create it?"
```
