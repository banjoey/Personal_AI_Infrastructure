# PAI Development & Deployment Skills System

**Version:** 1.0
**Updated:** 2025-12-17

A comprehensive skill system that enforces quality guardrails throughout the software development lifecycle, from initial requirements through production deployment.

---

## Overview

This skill system provides four orchestrator skills that work together to ensure:

- **Spec-first development** - No code without requirements
- **Test-first implementation** - No merge without tests
- **CI/CD-first deployment** - No manual shortcuts
- **Secure secrets management** - No hardcoded credentials

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR SKILLS                          │
│                                                                 │
│   Development → Deployment → Secrets → Infra                   │
│        ↓              ↓           ↓         ↓                  │
│   "What to      "How to      "Where      "Where                │
│    build"       deploy"      are creds"  to run"               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXISTING SKILLS (Delegated To)               │
│                                                                 │
│   AgilePm  TestArchitect  Security  GitLab  Cloudflare  Network│
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

| Skill | Purpose | USE WHEN |
|-------|---------|----------|
| Development | Enforces spec/test requirements | Starting project, adding feature, fixing bug |
| Deployment | Enforces CI/CD-first | Deploying, releasing, "just get it working" |
| Secrets | Manages credentials | API keys, passwords, environment variables |
| Infra | Environment-specific setup | Servers, containers, hosting |

---

## 1. Development Skill

**Purpose:** Ensure every piece of code has requirements and tests.

### Core Principle
```
NO CODE WITHOUT SPEC. NO MERGE WITHOUT TESTS. NO SHORTCUTS.
```

### Guardrails

| Stage | Requirement | Blocks Until |
|-------|-------------|--------------|
| Requirements | Spec/PRD exists | Spec created |
| Security | Threat model (new projects) | Review complete |
| Testing | Test strategy exists | Tests defined |
| Implementation | Stack standards | Compliance |
| Validation | Tests pass | All green |

### Stack Standards

| Component | Technology | Package Manager |
|-----------|------------|-----------------|
| Backend (default) | Bun + TypeScript | bun |
| Backend (data/ML) | Python 3.11+ | uv |
| Frontend | Next.js + TypeScript | bun |
| Styling | Tailwind CSS | - |
| Components | shadcn/ui | - |
| Database | PostgreSQL / SQLite | - |
| ORM | Drizzle (TS) / SQLAlchemy (Py) | - |

### Workflows

| Workflow | Purpose |
|----------|---------|
| NewProject | Full project initialization with all artifacts |
| AddFeature | Add feature with spec and test updates |
| BugFix | Fix with reproduction test and regression protection |
| CodeReview | Comprehensive pre-merge review |

### Example Flow

```
User: "Build me a Discord bot"

Development:
1. "Let's start with requirements."
   → Invokes AgilePm/CreatePrd

2. "New project needs security review."
   → Invokes Security/ThreatModel

3. "Let's define our test strategy."
   → Invokes TestArchitect

4. Creates project with Bun + TypeScript
5. Implements with TDD
6. "Tests pass. Ready for deployment."
```

---

## 2. Deployment Skill

**Purpose:** Ensure all deployments go through CI/CD pipelines.

### Core Principle
```
CI/CD IS NON-NEGOTIABLE.
If the pipeline doesn't work, we failed. Fix the pipeline, never bypass it.
```

### What's Blocked

- Direct SSH deployments
- Manual `docker run` on servers
- "Just get it working" shortcuts

### Guardrails

| Check | Requirement |
|-------|-------------|
| Pipeline exists | .gitlab-ci.yml present |
| Code pushed | Changes in remote repo |
| Pipeline passes | Build + tests green |
| Secrets configured | No hardcoded values |
| Image in registry | Container pushed |

### Workflows

| Workflow | Purpose |
|----------|---------|
| Deploy | Standard CI/CD deployment |
| PipelineCreate | Create new CI/CD pipeline |
| PipelineDebug | Fix failing pipelines |
| Rollback | Revert bad deployment |

### Standard Pipeline

```yaml
stages:
  - build
  - test      # MANDATORY
  - deploy

build:
  # Build Docker image, push to registry

test:
  # Run tests, check coverage

deploy:
  when: manual  # Human approval required
  # Deploy via SSH to target environment
```

### Bypass Protocol

In genuine emergencies:

1. User must confirm: "I understand the risks and want to bypass CI/CD"
2. Bypass is logged with timestamp
3. Follow-up task created to fix properly within 24 hours

---

## 3. Secrets Skill

**Purpose:** Manage credentials securely across environments.

### Core Principle
```
SECRETS ARE SACRED.
Never in code, never in git, never in logs.
```

### Environment Configuration

| Environment | Vault | CI/CD Variables |
|-------------|-------|-----------------|
| Home (joey-all) | Bitwarden | GitLab CI/CD |
| Work (merlin-all) | CyberArk | GitHub Secrets |

### Secret Lifecycle

```
CREATE → STORE → CONFIGURE → DOCUMENT → USE → ROTATE → REVOKE
  ↓        ↓         ↓           ↓        ↓       ↓
Generate  Vault   CI/CD var   .env.example  Runtime  Update
```

### Workflows

| Workflow | Purpose |
|----------|---------|
| AddSecret | Securely add new credential |
| RotateSecret | Update existing credential |
| AuditSecrets | Security review of all secrets |

### Detection Patterns

The skill scans for:
- API keys (32+ character strings)
- AWS credentials (AKIA...)
- JWT tokens (eyJ...)
- Database URLs (postgres://...)
- Webhook URLs (discord.com/api/webhooks/...)

---

## 4. Infra Skill

**Purpose:** Environment-specific infrastructure management.

### Branch-Based Configuration

| Branch | Environment | Components |
|--------|-------------|------------|
| joey-all | Home | Unraid, GitLab, Cloudflare, Bitwarden |
| merlin-all | Work | AWS EKS, GitHub Actions, CyberArk |

### Home Environment (joey-all)

| Component | Technology | Access |
|-----------|------------|--------|
| Compute | Unraid (Docker) | MCP + SSH |
| CI/CD | GitLab | GitLab skill |
| Registry | GitLab Container Registry | GitLab skill |
| DNS/CDN | Cloudflare | Cloudflare skill |
| Network | UniFi | Network skill |

### Standard AppData Structure

```
/mnt/user/appdata/[app-name]/
├── config/     # Configuration (mounted :ro)
├── data/       # Persistent data (mounted :rw)
└── logs/       # Application logs (optional)
```

### Workflows

| Workflow | Purpose |
|----------|---------|
| SetupApp | New application infrastructure |
| ScaleApp | Adjust resources |
| Teardown | Remove infrastructure |

---

## Skill Integration Flow

### New Project (Full Flow)

```
┌─────────────────┐
│  User Request   │
│  "Build X"      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────┐
│  Development    │────►│   AgilePm   │ (PRD)
│  Skill          │     │ TestArchitect│ (Tests)
│                 │     │   Security  │ (Review)
└────────┬────────┘     └─────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────┐
│  Deployment     │────►│   GitLab    │ (Pipeline)
│  Skill          │     │   Infra     │ (Target)
└────────┬────────┘     └─────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────┐
│  Secrets        │────►│  Bitwarden  │ (Vault)
│  Skill          │     │  GitLab     │ (CI/CD vars)
└────────┬────────┘     └─────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────┐
│  Infra          │────►│   Unraid    │ (Docker)
│  Skill          │     │  Cloudflare │ (DNS)
└────────┬────────┘     └─────────────┘
         │
         ▼
┌─────────────────┐
│  Deployed!      │
└─────────────────┘
```

### Quick Fix (Guardrails Active)

```
User: "SSH in and restart it"
         │
         ▼
┌─────────────────────────────────────────┐
│  Deployment Skill                       │
│                                         │
│  "I understand the urgency, but direct  │
│   SSH bypasses our standards.           │
│                                         │
│   Let me check the pipeline instead..." │
│                                         │
│  → Identifies issue                     │
│  → Fixes pipeline                       │
│  → Deploys via CI/CD                   │
└─────────────────────────────────────────┘
```

---

## Files Created

```
.claude/skills/
├── Development/
│   ├── SKILL.md
│   └── workflows/
│       ├── NewProject.md
│       ├── AddFeature.md
│       ├── BugFix.md
│       └── CodeReview.md
│
├── Deployment/
│   ├── SKILL.md
│   └── workflows/
│       ├── Deploy.md
│       ├── PipelineCreate.md
│       ├── PipelineDebug.md
│       └── Rollback.md
│
├── Secrets/
│   ├── SKILL.md
│   └── workflows/
│       ├── AddSecret.md
│       ├── RotateSecret.md
│       └── AuditSecrets.md
│
├── Infra/
│   ├── SKILL.md
│   └── workflows/
│       ├── SetupApp.md
│       ├── ScaleApp.md
│       └── Teardown.md
│
└── AgilePm/
    └── workflows/
        └── CreateTechnicalSpec.md  (NEW)
```

---

## Usage Examples

### Starting a New Project
```
"I want to build an investment alert bot"
→ Development skill activates
→ Guides through PRD, security, tests
→ Creates project with standards
```

### Deploying Changes
```
"Deploy this to Unraid"
→ Deployment skill activates
→ Verifies pipeline exists and passes
→ Triggers CI/CD deployment
→ Never uses direct SSH
```

### Adding a Secret
```
"I need to add a Discord webhook"
→ Secrets skill activates
→ Stores in Bitwarden
→ Configures GitLab CI/CD variable
→ Updates documentation
```

### Setting Up Infrastructure
```
"Set up infrastructure for my new API"
→ Infra skill activates
→ Creates AppData on Unraid
→ Configures CI/CD via GitLab skill
→ Sets up DNS via Cloudflare skill
```

---

## Philosophy

### Why Guardrails?

Without guardrails:
- Shortcuts become habits
- Technical debt accumulates
- Production differs from code
- Security holes appear
- Deployments become scary

With guardrails:
- Quality is consistent
- Code matches production
- Deployments are boring (in a good way)
- Security is built-in
- New team members are productive immediately

### The Investment

Setting up CI/CD takes 30 minutes.
Setting up proper secrets takes 15 minutes.
Writing a spec takes 10 minutes.

The alternative: Hours of debugging, security incidents, deployment failures, and "it works on my machine" problems.

---

## Related Documentation

- [Full Technical Specification](/docs/specs/development-deployment-system-spec.md)
- [AgilePm Skill](/docs/skills/agilePm.md)
- [TestArchitect Skill](/docs/skills/testArchitect.md)
- [Security Skill](/docs/skills/security.md)
- [GitLab Skill](/docs/skills/gitlab.md)

---

*This skill system ensures quality through enforcement, not suggestion.*
