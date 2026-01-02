# Create Agent Workflow

## Purpose
Create a new agent in the pool with its own MCP configuration.

## Steps

### 1. Create Directory Structure
```bash
mkdir -p {project}/agents/{agent-name}
```

### 2. Create MCP Config
```bash
cat > {project}/agents/{agent-name}/.mcp.json << 'EOF'
{
  "mcpServers": {
    "{mcp-name}": {
      "command": "{command}",
      "args": [{args}],
      "description": "{description}"
    }
  }
}
EOF
```

### 3. Create Task Template
```bash
cat > {project}/agents/{agent-name}/TASK.md << 'EOF'
# {Agent Name} Agent Task

## CRITICAL: Fail-Fast Protocol
**BEFORE doing anything else, verify connectivity:**
1. {Connectivity check specific to this agent}
2. {API/service check}
3. If EITHER fails, write RESULT.md with `STATUS: CONNECTIVITY_FAILED` and exit

## Task
[Task will be written here by orchestrator]

## Context
- {Target details}
- Available tools: mcp__{server}__*

## MCP Enhancement Protocol
**If you encounter MCP limitations:**
1. Document the gap in RESULT.md under `## MCP Gaps Found`
2. Include: what you tried, what failed, what's needed
3. Note whether fallback was required
4. Suggest specific enhancements

## Output Format
Write RESULT.md with:
1. STATUS: SUCCESS | NEEDS_WORK | CONNECTIVITY_FAILED | ERROR
2. Task results and findings
3. **MCP Gaps Found** (if any)
4. Recommendations
EOF
```

### 4. Create Result Placeholder
```bash
cat > {project}/agents/{agent-name}/RESULT.md << 'EOF'
# {Agent Name} Agent Result

*Awaiting task execution...*
EOF
```

### 5. Register in AgentOrchestrator
Update the Agent Registry table in SKILL.md.

### 6. Test Agent
Spawn with a simple connectivity test task to verify setup.

## Example: Creating Unifi Agent

```bash
# 1. Directory
mkdir -p agents/unifi

# 2. MCP config
cat > agents/unifi/.mcp.json << 'EOF'
{
  "mcpServers": {
    "unifi": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-unifi"],
      "env": {
        "UNIFI_HOST": "10.0.0.1",
        "UNIFI_USERNAME": "${UNIFI_USERNAME}",
        "UNIFI_PASSWORD": "${UNIFI_PASSWORD}"
      }
    }
  }
}
EOF

# 3. Task template (customize fail-fast for UniFi)
# 4. Result placeholder
# 5. Register in skill
# 6. Test
```

## Checklist
- [ ] Directory created
- [ ] .mcp.json with correct MCP config
- [ ] TASK.md with fail-fast protocol
- [ ] RESULT.md placeholder
- [ ] Registered in AgentOrchestrator skill
- [ ] Tested with connectivity check
