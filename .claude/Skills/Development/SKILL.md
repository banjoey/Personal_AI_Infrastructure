---
name: Development
description: Enforces spec-first, test-first development standards with guardrails. USE WHEN user wants to start a new project, add a feature, fix a bug, write code, OR mentions development standards. Orchestrates AgilePm, TestArchitect, and Security skills.
---

# Development

Enforces quality guardrails throughout the software development lifecycle. This skill acts as an orchestrator, delegating specialized work to existing skills while ensuring nothing proceeds without proper artifacts.

## Core Principle

```
NO CODE WITHOUT SPEC. NO MERGE WITHOUT TESTS. NO SHORTCUTS.
```

## Workflow Routing

| Workflow | When to Use | Delegates To |
|----------|-------------|--------------|
| NewProject | Starting from scratch | AgilePm, Security, TestArchitect |
| AddFeature | Extending existing project | AgilePm, TestArchitect |
| BugFix | Fixing issues | TestArchitect |
| CodeReview | Pre-merge review | Security, TestArchitect |

## Guardrails (ENFORCEMENT)

These are non-negotiable checkpoints. Development BLOCKS until requirements are met:

| Stage | Requirement | Blocking | Delegated To |
|-------|-------------|----------|--------------|
| 1. Requirements | Spec/PRD exists | YES | AgilePm |
| 2. Security Review | Threat model (new projects) | YES | Security |
| 3. Test Strategy | Test plan exists | YES | TestArchitect |
| 4. Implementation | Stack standards followed | YES | (self) |
| 5. Testing | Tests pass | YES | TestArchitect |
| 6. Security Scan | No critical vulnerabilities | YES | Security |

## Stack Standards (MANDATORY)

All projects MUST use these technologies unless explicitly approved otherwise:

### Backend
| Type | Technology | Package Manager |
|------|------------|-----------------|
| Default | Bun + TypeScript | bun |
| Data/ML | Python 3.11+ | uv |
| CLI Tools | Bun + TypeScript | bun |

### Frontend
| Component | Technology |
|-----------|------------|
| Framework | Next.js 14+ |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui |

### Database & ORM
| Runtime | Database | ORM |
|---------|----------|-----|
| TypeScript | PostgreSQL / SQLite | Drizzle |
| Python | PostgreSQL / SQLite | SQLAlchemy |

### Prohibited
- npm, yarn, pnpm (use bun)
- pip (use uv)
- Create React App (use Next.js)
- Plain CSS/SCSS (use Tailwind)
- Express.js (use Hono or Elysia with Bun)
- Prisma (use Drizzle - better type inference)

## Examples

### Example 1: Starting a new project
```
User: "I want to build a Discord bot"

Development skill activates:
1. "Let's start with requirements. What should this bot do?"
2. → Invokes AgilePm/CreatePrd for requirements
3. → Invokes Security/ThreatModel for security review
4. → Invokes TestArchitect for test strategy
5. Creates project with Bun + TypeScript (stack standard)
6. Implementation proceeds
```

### Example 2: Adding a feature
```
User: "Add a /status command to the bot"

Development skill activates:
1. Checks: Does PRD exist for this project? YES
2. "Let me update the spec with this new requirement"
3. → Updates PRD via AgilePm
4. → Updates test plan via TestArchitect
5. Implements feature following standards
6. Runs tests - must pass before done
```

### Example 3: Attempting to skip spec
```
User: "Just code it, I'll write the spec later"

Development skill responds:
"I understand the urge to dive in, but our guardrails require
a spec before implementation. Let me help you create a quick
one - it'll take 5 minutes and save hours of rework.

What problem are we solving?"
```

## Guardrail Enforcement Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER REQUEST                              │
│            "Build feature X" / "Start project Y"             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  CHECK: SPEC EXISTS?                         │
│                                                              │
│   NO → "Let's create requirements first"                    │
│        → Invoke AgilePm/CreatePrd                           │
│        → BLOCK until spec complete                          │
│                                                              │
│   YES → Continue                                             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              CHECK: NEW PROJECT?                             │
│                                                              │
│   YES → "Security review required for new projects"         │
│         → Invoke Security/ThreatModel                       │
│         → BLOCK until threat model complete                 │
│                                                              │
│   NO → Continue                                              │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              CHECK: TEST PLAN EXISTS?                        │
│                                                              │
│   NO → "Test strategy required before implementation"       │
│        → Invoke TestArchitect                               │
│        → BLOCK until test plan complete                     │
│                                                              │
│   YES → Continue                                             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION                            │
│                                                              │
│   - Follow stack standards (Bun/TS, Next.js, etc.)         │
│   - Write tests as you implement (TDD)                      │
│   - No hardcoded secrets                                    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                CHECK: TESTS PASS?                            │
│                                                              │
│   NO → "Tests must pass before completion"                  │
│        → Fix failing tests                                  │
│        → BLOCK until green                                  │
│                                                              │
│   YES → Continue                                             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    READY FOR DEPLOYMENT                      │
│                                                              │
│   → Hand off to Deployment skill                            │
└─────────────────────────────────────────────────────────────┘
```

## Bypass Protocol

In exceptional circumstances, guardrails may need to be bypassed:

1. **Explicit acknowledgment required:**
   User must say: "I understand the risks and want to bypass [guardrail]"

2. **Logged and tracked:**
   Bypass is logged with timestamp and reason

3. **Remediation required:**
   Follow-up task created to properly address the bypass

Example:
```
User: "Skip the spec, just build it"

Development: "I can bypass the spec requirement, but this creates
technical debt. To proceed, please confirm:

'I understand the risks and want to bypass the spec requirement.'

Note: We'll create a follow-up task to write the spec within 48 hours."
```

## Integration with Other Skills

| Skill | How Development Uses It |
|-------|-------------------------|
| AgilePm | Creates PRDs, epics, stories |
| TestArchitect | Creates test strategies, runs tests |
| Security | Threat modeling, security scans |
| Deployment | Hands off when ready to deploy |
| system-createcli | Generates CLI tools |

## Project Detection

Development looks for `.claude/project.json` to understand project context:

```json
{
  "name": "my-project",
  "type": "service",
  "stack": {
    "runtime": "bun",
    "language": "typescript",
    "framework": "hono"
  },
  "spec": "./docs/PRD.md",
  "tests": "./tests/"
}
```

If this file doesn't exist, Development will help create it during NewProject workflow.

---

**Development skill ensures quality. No shortcuts, no regrets.**
