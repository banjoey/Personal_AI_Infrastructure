# Aggregate Results Workflow

## Purpose
Collect and synthesize results from multiple parallel agents.

## When to Use
- After spawning parallel agents
- When consolidating findings from multiple domains
- For generating unified reports

## Steps

### 1. Wait for All Agents
```bash
# If spawned with & (backgrounded)
wait

# Or check completion
for agent in agent1 agent2 agent3; do
  while ! grep -q "^## " agents/$agent/RESULT.md 2>/dev/null; do
    sleep 5
  done
done
```

### 2. Collect Results
```bash
# Read all results
for agent in agents/*/; do
  echo "=== $(basename $agent) ==="
  cat "$agent/RESULT.md"
  echo ""
done
```

### 3. Parse Status Codes
```bash
# Check for failures
for agent in agents/*/; do
  status=$(grep "STATUS:" "$agent/RESULT.md" | head -1)
  echo "$(basename $agent): $status"
done
```

### 4. Aggregate MCP Gaps
```bash
# Collect all MCP gaps
echo "## All MCP Gaps Found"
for agent in agents/*/; do
  if grep -q "## MCP Gaps Found" "$agent/RESULT.md"; then
    echo "### $(basename $agent)"
    sed -n '/## MCP Gaps Found/,/^##/p' "$agent/RESULT.md" | head -n -1
  fi
done
```

## Result Synthesis Template

```markdown
# Aggregated Results

## Summary
- Total agents: {count}
- Successful: {count}
- Failed: {count}
- MCP gaps found: {count}

## Per-Agent Status
| Agent | Status | Key Finding |
|-------|--------|-------------|
| {name} | {status} | {summary} |

## Combined Findings
{Synthesized insights from all agents}

## MCP Gaps to Address
{Consolidated list of MCP enhancements needed}

## Recommendations
{Next steps based on aggregated results}
```

## Error Handling

### Some Agents Failed
1. Report which agents failed
2. Include partial results from successful agents
3. Note whether failures block the overall task

### All Agents Timed Out
1. Check network connectivity
2. Verify MCP servers are running
3. Consider if targets are offline

### Conflicting Results
1. Note the conflict
2. Determine which source is authoritative
3. Flag for manual review if needed
