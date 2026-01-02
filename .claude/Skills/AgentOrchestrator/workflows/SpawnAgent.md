# Spawn Agent Workflow

## Purpose
Spawn a single isolated agent with its own MCP configuration.

## Prerequisites
- Agent directory exists with `.mcp.json`
- TASK.md template ready
- Network connectivity to agent's target

## Steps

### 1. Write Task
```bash
cat > agents/{agent-name}/TASK.md << 'EOF'
# {Agent} Agent Task

## CRITICAL: Fail-Fast Protocol
1. [Connectivity check]
2. [API check]
3. If either fails → STATUS: CONNECTIVITY_FAILED

## Task
{Detailed task description}

## Context
{Agent-specific context}

## MCP Enhancement Protocol
Document any MCP gaps found.

## Output
Write RESULT.md with status and findings.
EOF
```

### 2. Spawn Agent
```bash
cd agents/{agent-name} && \
timeout 90 claude -p "Read TASK.md. Execute fail-fast checks first. Complete the task using available MCP tools. Write results to RESULT.md. Be concise." \
--dangerously-skip-permissions 2>&1
```

### 3. Read Result
```bash
cat agents/{agent-name}/RESULT.md
```

### 4. Process MCP Gaps
If RESULT.md contains `## MCP Gaps Found`:
1. Add to session CAPTURE
2. Queue for MCP enhancement
3. Note if SSH fallback was needed

## Timeout Guidelines

| Task Type | Timeout |
|-----------|---------|
| Quick check | 60s |
| Standard query | 90s |
| Complex operation | 180s |
| Long-running | 300s |

## Error Handling

| Exit Code | Meaning | Action |
|-----------|---------|--------|
| 0 | Success | Read RESULT.md |
| 124 | Timeout | Check connectivity, increase timeout |
| 1 | Error | Check agent logs |
