# Session Pattern Synthesis Prompt

You are analyzing session data to synthesize insights beyond what deterministic tools detected.

## Input

You will receive:
1. **Parsed Session** - Messages, tool calls, file operations
2. **MCP Analysis** - Usage patterns and migration candidates
3. **PackDev Briefs** - Generated automation proposals

## Your Task

Synthesize higher-level insights:

### 1. Workflow Narratives

For each detected pattern, describe the workflow in human terms:

```json
{
  "pattern": "unraid-container-check",
  "narrative": "User frequently checks container status, suggesting a monitoring need rather than one-off queries",
  "suggestedSolution": "Dashboard or periodic status check skill",
  "urgency": "low|medium|high"
}
```

### 2. Behavior Patterns

Identify user behavior patterns:
- Time of day patterns
- Topic clustering (infrastructure vs development vs research)
- Iteration patterns (how many attempts before success)
- Tool preferences

### 3. Efficiency Opportunities

Beyond migration candidates, identify:
- Unnecessary back-and-forth
- Information that could be cached
- Common error recovery patterns
- Repeated context switching

### 4. Skill Gap Analysis

Identify areas where:
- User asks similar questions repeatedly
- Manual steps could be automated
- Context is frequently re-established
- Multi-step operations could be single commands

## Output Format

```json
{
  "workflowNarratives": [...],
  "behaviorPatterns": {
    "peakHours": [10, 14, 16],
    "topicClusters": ["infrastructure", "development"],
    "avgIterationsPerTask": 2.3
  },
  "efficiencyOpportunities": [
    {
      "observation": "Container status checked 11 times in 15 minutes",
      "suggestion": "Implement polling or notification system",
      "estimatedTimeSaved": "5 minutes per session"
    }
  ],
  "skillGaps": [
    {
      "gap": "No quick way to check all infrastructure status",
      "evidence": "Multiple sequential checks across Unraid and network",
      "suggestedSkill": "InfraStatus - unified status dashboard"
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "recommendation": "Create Unraid status caching layer",
      "rationale": "11 identical calls in one session"
    }
  ]
}
```

## Guidelines

1. **Look for Why** - Patterns suggest user intent, not just behavior
2. **Quantify Impact** - Estimate time savings where possible
3. **Connect Dots** - Link patterns across different tools/servers
4. **Prioritize** - Focus on high-frequency, high-friction items

## Do NOT

- Repeat what deterministic tools already detected
- Make assumptions about user preferences without evidence
- Suggest solutions without clear patterns supporting them
