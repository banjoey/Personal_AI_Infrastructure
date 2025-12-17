# NewProject Workflow

Initialize a new project with all required artifacts: spec, security review, test strategy, and proper project structure.

## When to Use

- Starting a completely new project
- Creating a new service or application
- Building something from scratch

## Prerequisites

None - this workflow creates everything needed.

## Workflow Steps

### Step 1: Gather Requirements

Ask the user about the project:

**Questions:**
1. What problem does this solve?
2. Who is the primary user?
3. What are the must-have features for MVP?
4. Any technical constraints (existing systems, APIs)?
5. Timeline expectations?

**Output:** Clear understanding of project goals

---

### Step 2: Create PRD

**Delegate to:** AgilePm/CreatePrd

```
Invoke: AgilePm skill → CreatePrd workflow
Input: Requirements gathered in Step 1
Output: PRD.md with executive summary, architecture, features, checklist
```

**BLOCK until:** PRD is complete and approved by user

---

### Step 3: Security Review (Threat Model)

**Delegate to:** Security/ThreatModel

```
Invoke: Security skill → ThreatModel workflow
Input: PRD from Step 2, system architecture
Output: threat-model.md with risks, mitigations, security requirements
```

**BLOCK until:** Threat model complete

---

### Step 4: Test Strategy

**Delegate to:** TestArchitect

```
Invoke: TestArchitect skill
Input: PRD features, architecture from Step 2
Output: test-strategy.md with unit/integration/e2e plan
```

**BLOCK until:** Test strategy defined

---

### Step 5: Initialize Project Structure

Based on stack standards, create project:

**For Backend (Bun + TypeScript):**
```bash
mkdir -p {src,tests,docs,config}
bun init
# Create tsconfig.json, .gitignore, etc.
```

**For Frontend (Next.js):**
```bash
bunx create-next-app@latest --typescript --tailwind --eslint
# Add shadcn/ui
bunx shadcn@latest init
```

**Create `.claude/project.json`:**
```json
{
  "name": "[project-name]",
  "type": "[service|frontend|cli|library]",
  "stack": {
    "runtime": "bun",
    "language": "typescript",
    "framework": "[hono|next|none]"
  },
  "spec": "./docs/PRD.md",
  "tests": "./tests/"
}
```

---

### Step 6: Create CI/CD Pipeline

**Delegate to:** Deployment/PipelineCreate

```
Invoke: Deployment skill → PipelineCreate workflow
Input: Project type, stack from Step 5
Output: .gitlab-ci.yml (or equivalent)
```

---

### Step 7: Set Up Secrets

**Delegate to:** Secrets skill

```
Invoke: Secrets skill → AddSecret workflow
Input: Required secrets from PRD
Output: CI/CD variables configured, .env.example created
```

---

### Step 8: Verify Setup

Run checklist verification:

- [ ] PRD exists at docs/PRD.md
- [ ] Threat model exists at docs/threat-model.md
- [ ] Test strategy exists at docs/test-strategy.md
- [ ] Project builds: `bun run build`
- [ ] Tests pass: `bun test`
- [ ] CI/CD pipeline exists
- [ ] .claude/project.json exists
- [ ] .gitignore configured properly
- [ ] README.md created

---

## Output Files

After NewProject workflow:

```
project/
├── .claude/
│   └── project.json          # Project metadata
├── .gitlab-ci.yml            # CI/CD pipeline
├── docs/
│   ├── PRD.md               # Product requirements
│   ├── threat-model.md      # Security analysis
│   └── test-strategy.md     # Test plan
├── src/                      # Source code
├── tests/                    # Test files
├── .env.example             # Environment template
├── .gitignore
├── README.md
├── package.json / pyproject.toml
└── tsconfig.json / etc.
```

---

## Time Estimate

| Step | Time |
|------|------|
| Requirements | 5-10 min |
| PRD | 10-15 min |
| Security Review | 5-10 min |
| Test Strategy | 5-10 min |
| Project Init | 2-5 min |
| CI/CD Setup | 5 min |
| Secrets | 2-5 min |
| Verification | 2 min |
| **Total** | **35-60 min** |

This investment prevents hours of technical debt and rework.

---

## Next Steps

After NewProject completes:

1. **Start implementing:** Use AddFeature workflow for each feature
2. **Track progress:** Use AgilePm/SprintPlanning
3. **When ready:** Use Deployment skill to deploy

---

**NewProject workflow ensures every project starts right.**
