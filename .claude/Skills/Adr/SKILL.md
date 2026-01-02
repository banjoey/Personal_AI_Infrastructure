---
name: Adr
description: Architecture Decision Records for capturing and tracking significant decisions. USE WHEN user makes an architectural decision, mentions "let's use X instead of Y", discusses tradeoffs, OR when you detect decision-making patterns that should be recorded. Proactively prompt to record decisions.
---

# Adr

Architecture Decision Records (ADRs) capture significant technical, architectural, and infrastructure decisions with their context and consequences.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Adr
```

| Workflow | Trigger | File |
|----------|---------|------|
| **Create** | "create ADR", "record this decision", "let's document that" | `workflows/Create.md` |
| **List** | "list ADRs", "what decisions", "show architecture decisions" | `workflows/List.md` |
| **Supersede** | "supersede ADR", "update decision", "we changed our mind" | `workflows/Supersede.md` |
| **CheckConflict** | "check ADRs", "does this conflict", before implementing changes | `workflows/CheckConflict.md` |

## Examples

**Example 1: Proactive decision capture**
```
User: "Let's use Infisical for secrets instead of Vault"
→ Charles detects decision pattern
→ Prompts: "This sounds like an architectural decision. Record as ADR?"
→ User confirms
→ Invokes Create workflow
→ Creates ADR-XXX-use-infisical-for-secrets.md
```

**Example 2: Check before contradicting**
```
User: "Let's add secrets directly to the k8s manifests"
→ Charles checks existing ADRs
→ Finds ADR-001-use-infisical-for-secrets.md
→ Warns: "This contradicts ADR-001. Supersede it or reconsider?"
```

**Example 3: List decisions for a domain**
```
User: "What infrastructure decisions have we made?"
→ Invokes List workflow
→ Scans docs/decisions/ directories
→ Returns filtered list of infrastructure-related ADRs
```

## Proactive Invocation (CRITICAL)

**This skill should prompt the user when decision patterns are detected:**

Detection triggers:
- "Let's use X instead of Y"
- "We should go with approach A"
- "I've decided to..."
- "The tradeoff is..."
- "We're choosing X because..."
- Discussions comparing alternatives
- Changes to established patterns

**Prompt format:**
> "This sounds like an architectural decision. Want me to record it as an ADR?"

## ADR Storage Locations

| Scope | Location |
|-------|----------|
| Per-project | `<project>/docs/decisions/` |
| PAI-wide | `${PAI_DIR}/docs/decisions/` |

## ADR Format

```markdown
# ADR-XXX: [Title]

**Status:** proposed | accepted | deprecated | superseded by ADR-YYY

**Date:** YYYY-MM-DD

**Context:**
[Why this decision was needed. What problem we're solving.]

**Decision:**
[What we decided to do.]

**Consequences:**
[What happens as a result. Both positive and negative.]

**Alternatives Considered:**
[What other options were evaluated and why they were rejected.]
```

## Numbering Convention

- Sequential within each location: ADR-001, ADR-002, etc.
- Never reuse numbers (even after deprecation)
- Format: `ADR-XXX-descriptive-name.md`

## Status Transitions

```
proposed → accepted → deprecated
                   → superseded by ADR-XXX
```

## Integration Points

- **Development skill:** Check ADRs before implementing features
- **CORE skill:** Reference ADRs in session context
- **McpManager skill:** ADRs for MCP architecture decisions
- **Infra skill:** ADRs for infrastructure decisions
