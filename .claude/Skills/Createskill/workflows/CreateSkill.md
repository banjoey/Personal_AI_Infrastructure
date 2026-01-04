# CreateSkill Workflow

Create a new skill following the canonical template with proper TitleCase naming.

## Step 1: Read the Authoritative Sources

**REQUIRED FIRST:**

1. Read the skill template: `${PAI_DIR}/skills/SKILL-TEMPLATE.md`
2. Study a top-scoring example:
   - `${PAI_DIR}/skills/Linear/SKILL.md` (25/25) - For TypeScript CLI tools
   - `${PAI_DIR}/skills/Unifi/SKILL.md` (25/25) - For MCP integration

## Step 2: Understand the Request

Ask the user:
1. What does this skill do?
2. What should trigger it? (USE WHEN phrases)
3. What workflows does it need?
4. What CLI tools should it have? (CRITICAL for high score)

## Step 3: Determine TitleCase Names

**All names must use TitleCase (PascalCase).**

| Component | Format | Example |
|-----------|--------|---------|
| Skill directory | TitleCase | `StockAnalysis`, `Secrets`, `Linear` |
| Workflow files | TitleCase.md | `Create.md`, `Analyze.md` |
| Tool files | TitleCase.ts | `ListItems.ts`, `CreateItem.ts` |

**Wrong naming (NEVER use):**
- `create-skill`, `create_skill`, `CREATESKILL` → Use `CreateSkill`
- `create.md`, `CREATE.md`, `create-info.md` → Use `Create.md`

## Step 4: Create the Skill Directory

```bash
mkdir -p ${PAI_DIR}/skills/[SkillName]/workflows
mkdir -p ${PAI_DIR}/skills/[SkillName]/tools
```

## Step 5: Create SKILL.md

Follow the template structure from `SKILL-TEMPLATE.md`:

```yaml
---
name: SkillName
description: Brief description. USE WHEN user mentions X, wants to Y, needs to Z, OR says "trigger phrase". Provides CLI tools for [capabilities].
---

# SkillName

One-sentence purpose statement.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

\`\`\`bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName SkillName
\`\`\`

| Workflow | Trigger | File |
|----------|---------|------|
| **WorkflowOne** | "trigger phrase", "action words" | `workflows/WorkflowOne.md` |

## Tools

All tools are TypeScript CLIs for deterministic execution.

| Tool | Purpose | File |
|------|---------|------|
| **ToolOne** | What it does | `tools/ToolOne.ts` |

## Examples

**Example 1: [Use case]**
\`\`\`
User: "Natural language request"
→ Runs tools/ToolOne.ts with parameters
→ Returns: Expected output
\`\`\`

**Example 2: [Another use case]**
\`\`\`
User: "Different request"
→ Invokes WorkflowOne workflow
→ Returns: Expected output
\`\`\`

## Common Operations

### Operation name
\`\`\`bash
bun run tools/ToolOne.ts --option=value
\`\`\`
```

## Step 6: Create CLI Tools

**CRITICAL: Skills without tools score 1/5 on Determinism.**

Follow the tool template from `SKILL-TEMPLATE.md`:

```typescript
#!/usr/bin/env bun
/**
 * ToolName - Brief description
 *
 * Usage:
 *   bun run tools/ToolName.ts REQUIRED_ARG [options]
 *
 * Examples:
 *   bun run tools/ToolName.ts "value"
 */

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log('Usage: ...');
    process.exit(0);
  }

  // Tool logic here
}

main();
```

## Step 7: Create Workflow Files

For each workflow in the routing section:

```bash
touch ${PAI_DIR}/skills/[SkillName]/workflows/[WorkflowName].md
```

## Step 8: Scoring Checklist

Before finalizing, verify the skill scores well:

| Dimension | Target | How |
|-----------|--------|-----|
| **Determinism** | 4-5 | Has CLI tools in tools/ |
| **Routing** | 4-5 | Clear USE WHEN with specific triggers |
| **Clarity** | 4-5 | Explicit instructions, structured |
| **Examples** | 4-5 | 3+ concrete input/output examples |
| **Structure** | 4-5 | SKILL.md, tools/, workflows/ |

**Target Score:** 20+ out of 25

## Final Checklist

### Naming (TitleCase)
- [ ] Skill directory uses TitleCase
- [ ] All workflow files use TitleCase
- [ ] All tool files use TitleCase
- [ ] Routing table names match file names exactly

### YAML Frontmatter
- [ ] `name:` uses TitleCase
- [ ] `description:` includes USE WHEN triggers
- [ ] Description under 1024 characters

### Required Sections
- [ ] `## Workflow Routing` table
- [ ] `## Tools` table (CRITICAL)
- [ ] `## Examples` with 3+ concrete patterns
- [ ] `## Common Operations` with CLI commands

### Structure
- [ ] `tools/` directory with at least one .ts file
- [ ] `workflows/` directory with workflow files
- [ ] No `backups/` directory inside skill

## Done

Skill created following the canonical template. Target score: 20+/25.
