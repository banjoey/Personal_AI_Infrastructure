# PAI Improvement Suggestions - 2025-12-21

Based on today's session analyzing MCP performance, architecture decisions, and cross-project work.

---

## 1. MCP Startup Performance Skill

**Problem:** No systematic approach to diagnosing slow Claude Code startup.

**Suggestion:** Create an `McpPerformance` skill with workflows:
- `Diagnose.md` - Analyze which MCPs are slow
- `Optimize.md` - Suggest optimizations (pre-install, HTTP, lazy-load)
- `Benchmark.md` - Run standardized benchmarks

**Trigger phrases:** "Claude is slow", "startup takes too long", "MCP performance"

---

## 2. Fix Benchmark Script

**Problem:** `~/.claude/scripts/benchmark.sh` outputs ANSI color codes into JSON, breaking parsing.

**Fix needed:** Strip ANSI codes before writing to JSON, or capture only the numeric values.

**Location:** `~/.claude/scripts/benchmark.sh` lines 76-83 (benchmark functions return output with color codes)

---

## 3. Cross-Project Context Loading

**Problem:** When one project's Charles is hung, working on that project's files from another project loses context.

**Observation:** Worked on bfinfrastructure from productivity project. Had to manually read CONTEXT.md, BACKLOG.md, etc.

**Suggestion:** Add a `/load-project <path>` command or skill that:
1. Reads the target project's CLAUDE.local.md, CONTEXT.md
2. Summarizes key architecture decisions
3. Loads relevant context without switching directories

---

## 4. Secrets Strategy Skill

**Problem:** No clear guidance on secrets management patterns.

**Current state:** Mix of:
- `~/.config/.env` for local development
- Hardcoded in k8s manifests (bad)
- Infisical for production (planned)

**Suggestion:** Create `Secrets` skill improvements:
- Add workflow for "local + remote sync" pattern
- Add workflow for "External Secrets Operator setup"
- Add workflow for "secrets rotation"
- Add trigger for hardcoded secrets detection

---

## 5. Vendor MCP Research Pattern

**Problem:** When deciding between custom vs official MCPs, I had to manually research capabilities.

**Suggestion:** Add to McpManager skill:
- `ResearchVendorMcp.md` workflow - Compare official vs community MCPs
- Cache of known vendor MCPs and their capabilities
- Decision matrix template

---

## 6. Architecture Decision Records (ADRs)

**Problem:** Architecture decisions (like "use supergateway for HTTP transport") are scattered in CONTEXT.md.

**Suggestion:** Create standardized ADR format:
```
docs/decisions/
├── ADR-001-mcp-http-transport.md
├── ADR-002-infisical-for-secrets.md
└── ADR-003-argocd-gitops.md
```

Each ADR should have:
- Context
- Decision
- Consequences
- Status (proposed/accepted/deprecated)

---

## 7. Session Handoff Automation

**Problem:** Manually updating CLAUDE.local.md with session summaries is error-prone.

**Current state:** "Session completed without explicit summary" is common.

**Suggestion:** Improve CORE skill's session end behavior:
- Auto-generate session summary when user says "done" or session ends
- Include: files changed, decisions made, next steps
- Append to CLAUDE.local.md automatically

---

## 8. Infrastructure Skill Integration

**Problem:** Multiple infrastructure skills exist but don't reference each other well.

**Current skills:** k3s, ArgoCD, Traefik, Longhorn, Ansible, Infra, GitLab, Cloudflare

**Suggestion:** Add cross-references and delegation patterns:
- k3s skill should know to delegate TLS to Traefik skill
- ArgoCD skill should know to delegate secrets to Infisical skill
- Create skill dependency graph in CORE

---

## 9. MCP Template Updates Needed

**Problem:** `~/.claude/mcp-templates/` may have outdated templates.

**Finding:** cloudflare template pointed to non-existent path.

**Suggestion:**
- Audit all MCP templates
- Add validation step to McpManager's AddMcp workflow
- Add "last verified" date to templates

---

## 10. Research Skill Integration with MCP Architecture

**Problem:** Research skill mentions brightdata but it's now removed from main session.

**Current state:** brightdata moved to agent-pool pattern, but research skill may not be updated.

**Action needed:** Verify research skill's workflows use the agent-pool pattern for heavy scrapers.

---

## 11. Config Edit Verification Pattern (CRITICAL)

**Problem:** Agents claim "done" after editing config files without verification, leaving old junk.

**Observed:** User told "MCP config updated" in 2+ sessions, but changes never actually committed/applied.

**Root causes:**
- Incremental Edit vs declarative Write
- No read-back verification step
- No diff shown before claiming done
- No commit verification

**Fix needed:** Universal rule for ALL config file edits:
1. Read current state
2. Build desired final state (declarative)
3. Write complete new config
4. Read back and verify
5. Show diff to user
6. Only then claim "done"

**Applies to:** `.mcp.json`, `settings.json`, `package.json`, any JSON/YAML config

---

## 12. McpManager Workflow Fixes

**Problem:** McpManager skill workflows are too vague, causing incomplete edits.

**Specific issues found:**
| File | Line | Issue |
|------|------|-------|
| RemoveMcp.md | 19 | "Use Edit tool" - doesn't specify how |
| RemoveMcp.md | all | No READ BACK verification step |
| AuditMcp.md | 9 | Wrong path `~/.claude/.mcp.json` |
| RemoveMcp.md | all | No check if MCP also in global config |
| RemoveMcp.md | all | No post-remove AuditMcp invocation |

**Fix needed:** Rewrite workflows with explicit steps:
- Declarative config rewrite (not incremental edits)
- Mandatory read-back verification
- Cross-config (global + project) awareness
- Post-change audit invocation

---

## 13. Full Skill Audit

**Problem:** Skills created over time may not follow current SkillSystem.md standards.

**Scope:** Audit all 50+ skills for compliance with:
- TitleCase naming throughout
- Single-line USE WHEN descriptions
- Examples section present
- Workflow routing table
- No backups/ directories inside skills
- tools/ directory present

**Suggested approach:**
1. Run ValidateSkill workflow on each skill
2. Generate compliance report
3. Prioritize fixes by skill usage frequency
4. Canonicalize non-compliant skills

---

## 14. Skill Auto-Invocation Before Asking User (CRITICAL)

**Problem:** Agents ask users questions that skills/Joplin could answer.

**Examples from today:**
- Asked "Is your controller at unifi.op.barkleyfarm.com?" → Should check Joplin
- Asked "Where are credentials stored?" → Should check Infisical/Joplin
- Asked about network topology → Should invoke Network skill
- Guessed ai2 is a VM → Should have checked Joplin for architecture

**Fix needed:** Before asking user ANY infrastructure question:
1. Invoke relevant skill (Unifi, Network, Infra)
2. Query Joplin for project architecture
3. Check Infisical for credentials
4. ONLY ask user if info not found

**Implementation:**
- Add "check sources first" to skill invocation patterns
- Infra skill should auto-query Joplin on activation
- Network skill should load topology from Joplin
- Constitutional rule: "Query before asking"

---

## 15. Deploy MCP Server Skill (CRITICAL)

**Problem:** No repeatable pattern for deploying MCP servers to k3s.

**Current state:** Every MCP deployment is ad-hoc, agents ask same questions every time.

**What's needed:** `DeployMcp` skill with standardized workflow:

1. **Dockerfile template**
   - Base image selection (node, python, etc.)
   - Supergateway wrapper for HTTP transport
   - Pre-install dependencies (no runtime downloads)

2. **Build & Push**
   - GitLab CI pipeline (not local builds)
   - Registry: registry.barkleyfarm.com

3. **K8s Resources**
   - Deployment with proper resource limits
   - Service (ClusterIP)
   - ExternalSecret for Infisical integration

4. **Traefik Ingress**
   - IngressRoute with mTLS (per ADR-001)
   - Proper TLS configuration

5. **Local Config Update**
   - Update ~/.claude/.mcp.json or project .mcp.json
   - Point to HTTP endpoint via mcp-proxy

6. **Verification**
   - Test MCP connectivity
   - Verify tools are exposed

**Trigger phrases:** "deploy MCP", "add MCP to k3s", "set up [name] MCP server"

---

## 16. Fork vs Main Decision Pattern

**Problem:** No defined pattern for "should I use fork or main?"

**Current state:** Agent asks user every time.

**Fix needed:** Document decision pattern:
- If fork has features needed → use fork
- If fork is stale (>30 days behind main) → consider rebasing
- If contributing upstream → work from main
- Store fork status in project context

---

## 17. 1Password → Bitwarden Migration + Password Cleanup

**Problem:** Currently using 1Password, want to migrate to Bitwarden (self-hostable, open source).

**Scope:**
- Export from 1Password
- Import to Bitwarden (self-hosted or cloud)
- Clean up duplicate/old passwords
- Update saved credentials across devices

**Note:** This is separate from the Infisical secrets management for infrastructure.

---

## Priority Order

1. **Skill Auto-Invocation Before Asking** - CRITICAL - stops agents from asking dumb questions
2. **Cross-project context loading** - CRITICAL - sessions need project architecture auto-loaded
3. **Deploy MCP Server Skill** - CRITICAL - repeatable pattern for k3s MCP deployment
4. **Config Edit Verification Pattern** - CRITICAL - prevents "claimed done but didn't" anti-pattern
5. **McpManager workflow fixes** - Apply verification pattern to specific skill
6. **Fork vs Main Decision Pattern** - Document standard approach
7. **Fix benchmark script** - Quick win, enables performance tracking ✅ DONE
8. **Secrets Strategy skill** - Security critical (ADR-001 created, implementation pending)
9. **ADR skill** - Record architectural decisions ✅ DONE (created 2025-12-21)
10. **Session handoff automation** - Reduces context loss
11. **MCP template audit** - Prevents broken configs ✅ DONE
12. **Full Skill Audit** - Ensure all skills follow SkillSystem.md
13. **1Password → Bitwarden migration** - Personal password management
14. **Others** - Nice to have

---

*Generated from productivity project session while bfinfrastructure was hung.*
*Updated 2025-12-21: Added items 11-12 for config verification pattern*
