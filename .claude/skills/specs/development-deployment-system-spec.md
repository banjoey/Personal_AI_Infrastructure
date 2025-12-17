# Development & Deployment Skills System Specification

**Version:** 1.0
**Date:** 2025-12-17
**Author:** Charles (PAI)
**Status:** Draft

---

## Executive Summary

This specification defines a cohesive skill system for software development and deployment that enforces guardrails, prevents shortcuts, and enables non-engineers to produce quality code through AI-assisted software development. The system uses an **orchestrator pattern** where high-level skills delegate to existing specialized skills.

---

## Problem Statement

### Issues Observed
1. **Shortcut-taking:** Direct SSH deployments bypassing CI/CD pipelines
2. **Inconsistent deployments:** Manual processes vary between projects
3. **Missing standards:** No enforced spec-first or test-first requirements
4. **Environment sprawl:** Home (Unraid/GitLab) vs Work (AWS K8s) differences
5. **Non-engineer challenges:** "Vibe coders" lack knowledge of best practices

### Goals
- **Enforce CI/CD-first deployment** - Never bypass the pipeline
- **Enforce spec-driven development** - Requirements before code
- **Enforce test-driven development** - Tests before implementation
- **Standardize technology stacks** - Consistent choices across projects
- **Environment portability** - Same workflow, different infrastructure
- **Enable vibe coding** - AI handles complexity, humans provide intent

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR SKILLS (New)                        │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ Development │  │ Deployment  │  │   Secrets   │  │   Infra   │ │
│  │   Skill     │  │   Skill     │  │   Skill     │  │   Skill   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘ │
│         │                │                │               │        │
│         ▼                ▼                ▼               ▼        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   DELEGATION LAYER                          │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   EXISTING SPECIALIZED SKILLS                       │
│                                                                     │
│  ┌─────────┐ ┌─────────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ │
│  │ AgilePm │ │TestArchitect│ │ Security │ │ GitLab │ │Cloudflare│ │
│  └─────────┘ └─────────────┘ └──────────┘ └────────┘ └──────────┘ │
│                                                                     │
│  ┌─────────┐ ┌─────────────┐ ┌──────────┐                         │
│  │ Network │ │system-create│ │  Unifi   │  ... (vendor skills)    │
│  │         │ │     cli     │ │          │                         │
│  └─────────┘ └─────────────┘ └──────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Branch-Based Environment Separation

```
┌─────────────────────────┐     ┌─────────────────────────┐
│     joey-all branch     │     │    merlin-all branch    │
│        (Home)           │     │        (Work)           │
├─────────────────────────┤     ├─────────────────────────┤
│ Infra Skill:            │     │ Infra Skill:            │
│ - Unraid (Docker)       │     │ - AWS EKS (K8s)         │
│ - GitLab CI/CD          │     │ - GitHub Actions        │
│ - Local Registry        │     │ - ECR                   │
│ - Cloudflare            │     │ - Route53/ALB           │
├─────────────────────────┤     ├─────────────────────────┤
│ Secrets Skill:          │     │ Secrets Skill:          │
│ - Bitwarden             │     │ - CyberArk              │
├─────────────────────────┤     ├─────────────────────────┤
│ Development Skill:      │     │ Development Skill:      │
│ (SAME)                  │     │ (SAME)                  │
├─────────────────────────┤     ├─────────────────────────┤
│ Deployment Skill:       │     │ Deployment Skill:       │
│ (SAME - delegates to    │     │ (SAME - delegates to    │
│  Infra for specifics)   │     │  Infra for specifics)   │
└─────────────────────────┘     └─────────────────────────┘
```

---

## Skill Definitions

### 1. Development Skill

**Purpose:** Enforce spec-first, test-first development standards for all new projects and features.

**USE WHEN:** User wants to start a new project, add a feature, fix a bug, or write code.

**Guardrails (ENFORCEMENT):**

| Stage | Requirement | Blocking? | Delegated To |
|-------|-------------|-----------|--------------|
| 1. Requirements | Spec/PRD must exist | YES | AgilePm |
| 2. Security Review | Threat model for new projects | YES | Security |
| 3. Test Strategy | Test plan must exist | YES | TestArchitect |
| 4. Implementation | Follow stack standards | YES | (self) |
| 5. Testing | Tests must pass | YES | TestArchitect |
| 6. Review | Security scan complete | YES | Security |

**Stack Standards (MANDATORY):**

| Layer | Technology | Package Manager |
|-------|------------|-----------------|
| Backend (default) | Bun + TypeScript | bun |
| Backend (data/ML) | Python 3.11+ | uv |
| Frontend | Next.js 14+ + TypeScript | bun |
| Styling | Tailwind CSS | (included) |
| Components | shadcn/ui | (included) |
| CLI Tools | Bun + TypeScript | bun |
| Database | PostgreSQL / SQLite | - |
| ORM | Drizzle (TS) / SQLAlchemy (Py) | - |

**Prohibited:**
- npm, yarn, pnpm (use bun)
- pip (use uv)
- Create React App (use Next.js)
- Plain CSS/SCSS (use Tailwind)
- Express.js (use Hono or Elysia with Bun)

**Workflow:**

```
User: "I want to build a new feature"
                │
                ▼
┌─────────────────────────────────────┐
│ DEVELOPMENT SKILL ACTIVATED         │
│                                     │
│ 1. Check: Does spec/PRD exist?      │
│    NO → Invoke AgilePm skill        │
│    YES → Continue                   │
│                                     │
│ 2. Check: Is this a new project?    │
│    YES → Invoke Security skill      │
│          (threat model)             │
│    NO → Continue                    │
│                                     │
│ 3. Check: Does test plan exist?     │
│    NO → Invoke TestArchitect skill  │
│    YES → Continue                   │
│                                     │
│ 4. Implementation (with standards)  │
│                                     │
│ 5. Run tests (must pass)            │
│                                     │
│ 6. Security scan                    │
│                                     │
│ 7. Ready for deployment             │
└─────────────────────────────────────┘
```

---

### 2. Deployment Skill

**Purpose:** Enforce CI/CD-first deployment, prevent manual shortcuts.

**USE WHEN:** User wants to deploy, push to production, release, or "just get it running."

**CRITICAL GUARDRAIL:**
```
┌─────────────────────────────────────────────────────────────┐
│  DEPLOYMENT SKILL - CORE PRINCIPLE                          │
│                                                             │
│  "CI/CD is NON-NEGOTIABLE. If the pipeline doesn't work,   │
│   we failed. Fix the pipeline, never bypass it."           │
│                                                             │
│  Manual deployment via SSH = BLOCKED                        │
│  Manual docker run on server = BLOCKED                      │
│  "Just get it working" = BLOCKED                           │
└─────────────────────────────────────────────────────────────┘
```

**Guardrails (ENFORCEMENT):**

| Check | Requirement | Blocking? |
|-------|-------------|-----------|
| Pipeline Exists | .gitlab-ci.yml or equivalent | YES |
| Pipeline Works | Last build succeeded | YES |
| Tests Pass | CI tests green | YES |
| Security Scan | No critical vulnerabilities | YES |
| Secrets in Vault | No hardcoded secrets | YES |
| Container Registry | Image pushed to registry | YES |

**Workflow:**

```
User: "Deploy this to Unraid"
                │
                ▼
┌─────────────────────────────────────┐
│ DEPLOYMENT SKILL ACTIVATED          │
│                                     │
│ 1. Check: CI/CD pipeline exists?    │
│    NO → "Create pipeline first"     │
│         Invoke GitLab skill         │
│    YES → Continue                   │
│                                     │
│ 2. Check: Code pushed to remote?    │
│    NO → "Push your changes"         │
│    YES → Continue                   │
│                                     │
│ 3. Check: Pipeline passing?         │
│    NO → "Fix pipeline errors first" │
│    YES → Continue                   │
│                                     │
│ 4. Check: Secrets in vault?         │
│    NO → Invoke Secrets skill        │
│    YES → Continue                   │
│                                     │
│ 5. Trigger deployment via CI/CD     │
│    (NEVER via direct SSH)           │
│                                     │
│ 6. Verify deployment succeeded      │
└─────────────────────────────────────┘
```

**Delegation:**
- Pipeline creation/management → GitLab skill
- Infrastructure specifics → Infra skill
- Secrets management → Secrets skill

---

### 3. Secrets Skill

**Purpose:** Manage secrets securely across environments, never hardcode.

**USE WHEN:** User needs API keys, passwords, tokens, or mentions secrets, credentials, environment variables.

**Guardrails (ENFORCEMENT):**

| Check | Requirement | Blocking? |
|-------|-------------|-----------|
| No Hardcoded Secrets | Scan for patterns | YES |
| .env in .gitignore | Never commit secrets | YES |
| Secrets in Vault | All secrets registered | YES |
| CI/CD Variables Set | Pipeline has access | YES |

**Environment-Specific Implementation:**

| Environment | Vault | CI/CD Variables | App Access |
|-------------|-------|-----------------|------------|
| Home (joey-all) | Bitwarden | GitLab CI/CD Variables | Docker env vars |
| Work (merlin-all) | CyberArk | GitHub Secrets | K8s Secrets |

**Workflow:**

```
User: "I need to add an API key"
                │
                ▼
┌─────────────────────────────────────┐
│ SECRETS SKILL ACTIVATED             │
│                                     │
│ 1. Store in vault (Bitwarden/       │
│    CyberArk based on branch)        │
│                                     │
│ 2. Add to CI/CD variables           │
│    (protected, masked)              │
│                                     │
│ 3. Document in project README       │
│    (variable name only, not value)  │
│                                     │
│ 4. Update deployment config to      │
│    inject at runtime                │
└─────────────────────────────────────┘
```

---

### 4. Infra Skill

**Purpose:** Environment-specific infrastructure management. Different implementations per branch.

**USE WHEN:** User mentions infrastructure, servers, containers, hosting, or environment setup.

**Branch: joey-all (Home)**

| Component | Technology | Management |
|-----------|------------|------------|
| Compute | Unraid (Docker) | Unraid MCP + SSH |
| CI/CD | GitLab | GitLab skill |
| Registry | GitLab Container Registry | GitLab skill |
| DNS/CDN | Cloudflare | Cloudflare skill |
| Network | UniFi | Network skill |
| Secrets | Bitwarden | Secrets skill |

**Branch: merlin-all (Work)**

| Component | Technology | Management |
|-----------|------------|------------|
| Compute | AWS EKS (Kubernetes) | kubectl + Terraform |
| CI/CD | GitHub Actions | GitHub API |
| Registry | AWS ECR | AWS CLI |
| DNS/CDN | Route53 + CloudFront | Terraform |
| Network | AWS VPC | Terraform |
| Secrets | CyberArk | CyberArk API |

**Workflow:**

```
User: "Set up infrastructure for my new app"
                │
                ▼
┌─────────────────────────────────────┐
│ INFRA SKILL ACTIVATED               │
│                                     │
│ 1. Detect environment (branch)      │
│    joey-all → Home config           │
│    merlin-all → Work config         │
│                                     │
│ 2. Create/configure:                │
│    - Container/pod definition       │
│    - CI/CD pipeline template        │
│    - Registry configuration         │
│    - Secrets references             │
│                                     │
│ 3. Delegate to specialized skills:  │
│    - GitLab/GitHub for CI/CD        │
│    - Cloudflare/Route53 for DNS     │
│    - Secrets skill for vault setup  │
└─────────────────────────────────────┘
```

---

## Interaction Patterns

### Pattern 1: New Project (Full Flow)

```
User: "I want to build a Discord bot"

1. Development Skill activates
   → "Let's start with requirements. What should this bot do?"
   → Invokes AgilePm for PRD creation

2. Security Skill (via Development)
   → Generates threat model for Discord API integration

3. TestArchitect (via Development)
   → Creates test strategy (unit, integration, e2e)

4. Development Skill continues
   → Creates project with standard stack (Bun + TS)
   → Implements features per spec
   → Runs tests

5. Deployment Skill activates
   → Creates .gitlab-ci.yml via GitLab skill
   → Configures secrets via Secrets skill
   → Sets up Unraid via Infra skill

6. User pushes code
   → Pipeline builds automatically
   → Manual deploy trigger available
```

### Pattern 2: Quick Fix (Guardrails Active)

```
User: "The bot is broken, just SSH in and restart it"

Deployment Skill activates:
→ "I understand the urgency, but direct SSH bypasses our
   deployment standards. Let me check the pipeline instead."

→ Checks GitLab pipeline status
→ Identifies failing deployment
→ "The issue is [X]. Let me fix the pipeline and redeploy
   through CI/CD."
```

### Pattern 3: Feature Addition (Abbreviated Flow)

```
User: "Add a /status command to the bot"

Development Skill activates:
→ "I see we have a PRD for this project. Let me add this
   feature to the spec first."
→ Updates PRD with new requirement
→ Updates test plan
→ Implements feature
→ Tests pass
→ "Ready for deployment. Push to trigger the pipeline."
```

---

## Skill File Structure

```
~/.claude/skills/
├── Development/
│   ├── SKILL.md           # Main skill definition
│   ├── tools/             # (empty per convention)
│   └── workflows/
│       ├── NewProject.md      # Full project creation flow
│       ├── AddFeature.md      # Feature addition flow
│       ├── BugFix.md          # Bug fix flow
│       └── CodeReview.md      # Review checklist
│
├── Deployment/
│   ├── SKILL.md           # Main skill definition
│   ├── tools/             # (empty per convention)
│   └── workflows/
│       ├── Deploy.md          # Standard deployment
│       ├── Rollback.md        # Rollback procedure
│       ├── PipelineCreate.md  # New pipeline setup
│       └── PipelineDebug.md   # Pipeline troubleshooting
│
├── Secrets/
│   ├── SKILL.md           # Main skill definition
│   ├── tools/             # (empty per convention)
│   └── workflows/
│       ├── AddSecret.md       # Add new secret
│       ├── RotateSecret.md    # Rotate existing secret
│       └── AuditSecrets.md    # Security audit
│
├── Infra/
│   ├── SKILL.md           # Main skill (branch-aware)
│   ├── tools/             # (empty per convention)
│   └── workflows/
│       ├── SetupApp.md        # New app infrastructure
│       ├── ScaleApp.md        # Scaling operations
│       └── Teardown.md        # Cleanup/decommission
│
└── (existing skills remain unchanged)
    ├── AgilePm/
    ├── TestArchitect/
    ├── Security/
    ├── GitLab/
    ├── Cloudflare/
    ├── Network/
    ├── Unifi/
    └── system-createcli/
```

---

## Configuration

### Project Detection

Each project should have a `.claude/project.json`:

```json
{
  "name": "investment-alert-bot",
  "type": "service",
  "stack": {
    "runtime": "bun",
    "language": "typescript",
    "framework": null
  },
  "deployment": {
    "target": "unraid",
    "registry": "gitlab",
    "cicd": "gitlab"
  },
  "secrets": [
    "DISCORD_WEBHOOK_URL"
  ],
  "spec": "./docs/PRD.md",
  "tests": "./tests/"
}
```

### Environment Detection

Based on git branch or explicit config:

```bash
# In joey-all branch
git branch --show-current  # joey-all
→ Use Home configuration

# In merlin-all branch
git branch --show-current  # merlin-all
→ Use Work configuration
```

---

## Success Criteria

### For Development Skill
- [ ] No code written without spec existing
- [ ] No new project without threat model
- [ ] No merge without passing tests
- [ ] Stack standards enforced 100%

### For Deployment Skill
- [ ] Zero manual/SSH deployments
- [ ] All deployments through CI/CD
- [ ] All secrets in vault (never hardcoded)
- [ ] Pipeline failures addressed, not bypassed

### For Secrets Skill
- [ ] No secrets in git history
- [ ] All secrets in appropriate vault
- [ ] CI/CD variables properly configured
- [ ] Regular rotation reminders

### For Infra Skill
- [ ] Environment correctly detected
- [ ] Infrastructure as code where possible
- [ ] Consistent deployment patterns per environment
- [ ] Clean teardown capability

---

## Migration Plan

### Phase 1: Core Skills (Week 1)
1. Create Development skill with guardrails
2. Create Deployment skill with CI/CD enforcement
3. Test with investment-alert-bot as reference

### Phase 2: Secrets & Infra (Week 2)
1. Create Secrets skill (Bitwarden integration)
2. Create Infra skill (joey-all/Home first)
3. Document all existing secrets

### Phase 3: Work Environment (Week 3)
1. Add merlin-all configurations to Infra
2. Add CyberArk integration to Secrets
3. Test cross-environment workflows

### Phase 4: Refinement (Ongoing)
1. Add more workflow templates
2. Tune guardrail sensitivity
3. Document edge cases

---

## Appendix A: Stack Decision Rationale

### Why Bun over Node?
- 4x faster startup, 3x faster runtime
- Built-in TypeScript support
- Built-in test runner
- Single binary, simpler deployment

### Why uv over pip?
- 10-100x faster dependency resolution
- Deterministic lockfiles
- Better virtual environment handling
- Rust-based reliability

### Why Next.js over alternatives?
- React ecosystem (largest community)
- Server components for performance
- App router for modern patterns
- Vercel/Cloudflare deployment support
- TypeScript-first

### Why shadcn/ui over component libraries?
- Copy-paste, not dependency
- Full control over components
- Tailwind integration
- Accessible by default
- No version lock-in

---

## Appendix B: Existing Skill Integration Matrix

| New Skill | Delegates To | For What |
|-----------|--------------|----------|
| Development | AgilePm | PRD/spec creation |
| Development | TestArchitect | Test strategy/execution |
| Development | Security | Threat modeling, security review |
| Development | system-createcli | CLI tool generation |
| Deployment | GitLab | Pipeline creation/management |
| Deployment | Infra | Environment-specific config |
| Deployment | Secrets | Secret injection |
| Secrets | Bitwarden (home) | Secret storage |
| Secrets | CyberArk (work) | Secret storage |
| Infra | Cloudflare | DNS, CDN, hosting |
| Infra | Network | Network configuration |
| Infra | Unraid MCP | Container management |

---

## Appendix C: Guardrail Bypass Protocol

In exceptional circumstances, guardrails may need to be bypassed. This requires:

1. **Explicit acknowledgment:** User must say "I understand the risks and want to bypass [specific guardrail]"
2. **Documentation:** Log the bypass with reason and timestamp
3. **Remediation plan:** Schedule follow-up to properly address the bypass
4. **No silent bypasses:** Charles must always explain what guardrail is being bypassed and why it exists

Example:
```
User: "Just deploy it manually, I'll fix the pipeline later"

Charles: "I can do a manual deployment, but this bypasses our CI/CD
guardrail. To proceed, please confirm: 'I understand the risks and
want to bypass the CI/CD requirement for this deployment.'

Note: We should create a follow-up task to fix the pipeline within
24 hours to prevent this from becoming a pattern."
```

---

*End of Specification*
