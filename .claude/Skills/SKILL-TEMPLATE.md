# SKILL-TEMPLATE.md

A canonical template for creating PAI skills based on patterns from the highest-scoring skills (Unifi 25/25, Linear 25/25).

---

## Directory Structure

```
SkillName/
├── SKILL.md           # Main skill definition (REQUIRED)
├── tools/             # CLI tools for deterministic execution
│   ├── ToolName.ts    # TypeScript CLI tool
│   └── Client.ts      # Shared API client (if needed)
└── workflows/         # Step-by-step procedures
    └── WorkflowName.md
```

---

## SKILL.md Template

```markdown
---
name: SkillName
description: Brief description. USE WHEN user mentions X, wants to Y, needs to Z, OR says "trigger phrase". Provides [capabilities].
---

# SkillName

One-sentence purpose statement explaining what this skill does.

## Authentication

(If applicable - how to access credentials)
- **Service:** `service-name`
- **Account:** `account-name`
- **Retrieve:** `security find-generic-password -s service-name -a account-name -w`

## Current Context

(Default values, IDs, or configuration)
- **Resource:** Name (ID: `abc-123`)
- **Default Setting:** Value

## Reference Tables

(Lookup tables for IDs, states, values - makes skill self-contained)

| State | Type | ID |
|-------|------|-----|
| Backlog | backlog | `id-here` |
| In Progress | started | `id-here` |
| Done | completed | `id-here` |

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

\`\`\`bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName SkillName
\`\`\`

| Workflow | Trigger | File |
|----------|---------|------|
| **WorkflowOne** | "trigger phrase", "action words" | `workflows/WorkflowOne.md` |
| **WorkflowTwo** | "other trigger", "more phrases" | `workflows/WorkflowTwo.md` |

## Tools

All tools are TypeScript files that [describe execution method].

| Tool | Purpose | File |
|------|---------|------|
| **ToolOne** | What it does | `tools/ToolOne.ts` |
| **ToolTwo** | What it does | `tools/ToolTwo.ts` |

## Examples

**Example 1: [Common Use Case]**
\`\`\`
User: "Natural language request"
→ Invokes WorkflowOne workflow
→ Runs tools/ToolOne.ts with parameters
→ Returns: Expected output description
\`\`\`

**Example 2: [Another Use Case]**
\`\`\`
User: "Different request"
→ Invokes WorkflowTwo workflow
→ Runs tools/ToolTwo.ts with parameters
→ Returns: Expected output description
\`\`\`

**Example 3: [Edge Case or Advanced Use]**
\`\`\`
User: "Complex request"
→ Invokes multiple workflows or tools
→ Returns: Expected output description
\`\`\`

## API/Tool Reference

- **Endpoint:** `https://api.example.com`
- **Auth:** Bearer token from keychain
- **Docs:** https://docs.example.com

## Integration

- **Related Skill:** How this skill integrates with others
- **Orchestrator:** Which skill delegates to this one (if applicable)

## Common Operations

(Quick reference for frequently used operations)

### Operation Name
\`\`\`
tool_name
  argument: value
\`\`\`
```

---

## Workflow Template (workflows/WorkflowName.md)

```markdown
# WorkflowName Workflow

**Purpose:** One sentence describing what this workflow accomplishes.

## Execution Steps

1. **Step description**
   \`\`\`
   Command or tool call
   \`\`\`

2. **Next step**
   - Option A: scenario
   - Option B: scenario

3. **Format output**
   - How to present results
   - What to highlight

## Example Calls

### Basic Usage
\`\`\`
tool_call
  argument: value
\`\`\`

### With Options
\`\`\`
tool_call
  argument: value
  optional_arg: value
\`\`\`

## Output Format

\`\`\`
Expected output format
=======================

Section:
- Item (detail) - Status
  More details here

Summary line.
\`\`\`

## Related Tools

| Tool | Use For |
|------|---------|
| `tool_one` | Specific purpose |
| `tool_two` | Specific purpose |
```

---

## Tool Template (tools/ToolName.ts)

```typescript
#!/usr/bin/env bun
/**
 * ToolName - Brief description of what this tool does
 *
 * Usage:
 *   bun run tools/ToolName.ts REQUIRED_ARG [options]
 *
 * Options:
 *   --option=VALUE    Description of option
 *   --flag            Boolean flag description
 *
 * Examples:
 *   bun run tools/ToolName.ts "value"
 *   bun run tools/ToolName.ts "value" --option=setting
 */

import { apiClient, CONFIG } from './Client.ts';

// TypeScript interfaces for type safety
interface ApiResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
  };
}

// API query/mutation (GraphQL, REST, etc.)
const API_QUERY = `
  query GetData($id: String!) {
    getData(id: $id) {
      id
      name
    }
  }
`;

async function main() {
  const args = process.argv.slice(2);

  // Help output
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Usage: bun run ToolName.ts REQUIRED_ARG [options]

Options:
  --option=VALUE    Description
  --flag            Description

Examples:
  bun run ToolName.ts "value"
  bun run ToolName.ts "value" --option=setting
`);
    process.exit(0);
  }

  // Parse arguments
  const requiredArg = args[0];
  let optionalValue: string | undefined;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--option=')) {
      optionalValue = arg.split('=')[1];
    }
  }

  // Validate required arguments
  if (!requiredArg) {
    console.error('Error: REQUIRED_ARG is required');
    process.exit(1);
  }

  try {
    // Make API call
    const result = await apiClient<ApiResponse>(API_QUERY, {
      id: requiredArg
    });

    // Handle success
    if (result.success) {
      console.log(`Success: ${result.data.name}`);
    } else {
      console.error('Operation failed');
      process.exit(1);
    }
  } catch (error) {
    // Handle errors gracefully
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
```

---

## Scoring Checklist

Before finalizing a skill, verify it scores well on all 5 dimensions:

| Dimension | Score 5 | Score 1 |
|-----------|---------|---------|
| **Determinism** | Has CLI tools, runs code | Prompt-only, no tools |
| **Routing** | Clear USE WHEN with specific triggers | Vague description |
| **Clarity** | Explicit instructions, structured | Ambiguous, unstructured |
| **Examples** | 3+ concrete input/output examples | No examples |
| **Structure** | Proper SKILL.md, tools/, workflows/ | Missing sections |

**Target Score:** 20+ out of 25

---

## Anti-Patterns to Avoid

1. **No tools/** directory - Skill is prompt-only (Determinism = 1)
2. **Missing USE WHEN** - Claude won't auto-invoke the skill
3. **No examples** - Users don't know how to trigger it
4. **Vague triggers** - "use for stuff" instead of specific phrases
5. **No reference tables** - Users must look up IDs elsewhere
6. **Missing integration notes** - Unclear how skill fits with others

---

## Creating a New Skill

1. Copy this template to `.claude/skills/SkillName/`
2. Rename and customize `SKILL.md`
3. Create at least one tool in `tools/`
4. Create workflow files for complex operations
5. Add 3+ concrete examples
6. Add USE WHEN triggers to description
7. Score against checklist (target 20+)
8. Test with real requests

---

*Generated from PAI Skill Audit - Phase 1 (December 2025)*
*Based on patterns from: Unifi (25/25), Linear (25/25)*
