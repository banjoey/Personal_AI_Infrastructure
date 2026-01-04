# Context: MCP vs Skill-Embedded Tools Architecture

**Date:** 2024-12-29
**Status:** Planning/Design Phase

## Problem Statement

MCPs have significant operational costs:
1. **Resource hogs** - Each MCP is a running process consuming memory/CPU
2. **Reliability dependency** - External MCPs = network failure mode; local MCPs = laptop resource drain
3. **Token overhead** - Every MCP tool definition sent in context, even if only using 2 of 50 tools

## Architectural Decision

**Hybrid approach:** Use both MCPs and skill-embedded TypeScript tools, allocated by usage frequency.

```
Frequent operations (multiple times/week) → Skill-embedded .ts tools (direct API)
Infrequent operations (few times/month)  → MCP (pay overhead only when needed)
```

## Key Pattern: Code Reuse

The MCP and skill tools should share the same underlying API wrapper code. This was proven with the UniFi implementation:
- Skill has `.ts` tools with direct API calls
- MCP server imports/uses the same underlying scripts
- One codebase, two interfaces

## Service-Specific Breakdown

### GitLab

**Skill-embedded (frequent):**
- Create/list/delete repos
- Create MR, merge MR, check MR status
- Pipeline status, trigger pipeline, retry failed jobs
- List/set/delete CI/CD variables (project + group level)
- Branch operations (create, delete, protect)

**Keep in MCP (infrequent):**
- Complex search across all projects
- User/group administration
- Runner management
- Detailed pipeline job logs/artifacts
- Wiki/snippets/releases

### Linear

**Skill-embedded (frequent):**
- Create issue
- Update issue status
- List my issues
- Add comment

**Keep in MCP (infrequent):**
- Complex filtering/queries
- Bulk operations
- Project/team management
- Webhooks setup

## Mental Model

> "What do I do multiple times per week?" → skill tool
> "What do I do a few times per month?" → MCP

## Implementation Notes

- Credentials managed via Secrets skill (same secrets for both MCP and skill tools)
- Skill tools documented in SKILL.md for discoverability
- Keep skill size manageable - only embed truly frequent operations

## Next Steps

- [ ] Implement GitLab skill tools (high priority - foundational to workflow)
- [ ] Implement Linear skill tools (already using Linear heavily)
- [ ] Evaluate other candidates: Cloudflare, Unraid

## Prior Art

- UniFi: Already implemented with shared code pattern between skill and MCP
