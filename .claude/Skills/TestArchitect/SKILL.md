---
name: TestArchitect
description: Test-first development with CLI enforcement tools. USE WHEN user needs test strategy, coverage analysis, ATDD workflows, risk-based testing, or quality gates. Provides CLI tools for ATDD enforcement and risk scoring.
---

# TestArchitect

Test strategy before code: prevent defects through acceptance test-driven development (ATDD). Includes CLI tools for automated enforcement.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName TestArchitect
```

| Workflow | Trigger | File |
|----------|---------|------|
| **CreateTestStrategy** | "test strategy", "test plan", "testing approach" | `workflows/CreateTestStrategy.md` |
| **DefineCoverage** | "coverage analysis", "coverage gaps", "quality gates" | `workflows/DefineCoverage.md` |
| **AcceptanceTestDrivenDevelopment** | "ATDD", "acceptance tests", "Given-When-Then" | `workflows/AcceptanceTestDrivenDevelopment.md` |
| **RiskBasedTesting** | "risk matrix", "test prioritization", "risk assessment" | `workflows/RiskBasedTesting.md` |
| **CiCdQualityGates** | "CI/CD gates", "pipeline quality", "test automation" | `workflows/CiCdQualityGates.md` |

## Tools

All tools are TypeScript CLIs for deterministic test enforcement.

| Tool | Purpose | File |
|------|---------|------|
| **atdd-enforcer** | Ensure acceptance tests exist before code | `tools/atdd-enforcer.ts` |
| **risk-scorer** | Calculate risk scores and coverage targets | `tools/risk-scorer.ts` |

## Examples

**Example 1: Check ATDD compliance for a story**
```
User: "Check if US-42 has all required tests"
→ Runs tools/atdd-enforcer.ts check --story US-42
→ Returns: 4/5 scenarios tested (80%), 1 missing test for "password expired" scenario
```

**Example 2: Generate risk matrix for sprint**
```
User: "What should we focus testing on this sprint?"
→ Runs tools/risk-scorer.ts matrix --hours 40
→ Returns: Risk matrix with 2 critical (auth, payment), 3 high, test hour allocation
```

**Example 3: Pre-commit ATDD enforcement**
```
User: "Set up ATDD pre-commit hooks"
→ Runs tools/atdd-enforcer.ts init
→ Configures .atddrc.json and husky pre-commit
→ Returns: All commits now require acceptance tests
```

**Example 4: Get coverage recommendation for feature**
```
User: "What coverage do we need for the cart feature?"
→ Runs tools/risk-scorer.ts recommend --feature cart
→ Returns: Medium risk (2.8), 70-80% coverage, Unit + Integration + E2E tests
```

## Integration

- **AgilePm Skill:** Adds test requirements to user stories
- **Security Skill:** Security test scenarios from threat model
- **Development Skill:** Pre-commit test enforcement
- **Linear Skill:** Track test coverage issues

## Methodology

| Framework | Purpose |
|-----------|---------|
| ATDD | Acceptance Test-Driven Development (tests before code) |
| Test Pyramid | 70% Unit, 20% Integration, 10% E2E |
| Risk-Based Testing | Coverage targets by risk level (ISO 29119) |
| Given-When-Then | BDD scenario format |

## Risk Levels & Coverage Targets

| Risk Level | Score | Coverage | Test Types |
|------------|-------|----------|------------|
| Critical | 4.5-5.0 | 90-100% | Unit, Integration, E2E, Security, Perf, Pen |
| High | 3.5-4.4 | 80-90% | Unit, Integration, E2E, Security |
| Medium | 2.5-3.4 | 70-80% | Unit, Integration, E2E |
| Low | 1.5-2.4 | 50-70% | Unit, Integration |
| Very Low | 1.0-1.4 | 30-50% | Unit |

## Common Operations

### Check ATDD compliance for a story
```bash
npx ts-node tools/atdd-enforcer.ts check --story US-42
```

### Run ATDD pre-commit check
```bash
npx ts-node tools/atdd-enforcer.ts pre-commit
```

### Initialize ATDD config
```bash
npx ts-node tools/atdd-enforcer.ts init
```

### Generate risk matrix
```bash
npx ts-node tools/risk-scorer.ts matrix
npx ts-node tools/risk-scorer.ts matrix --hours 40
```

### Get coverage recommendation
```bash
npx ts-node tools/risk-scorer.ts recommend --feature auth
```

### Initialize risk assessments
```bash
npx ts-node tools/risk-scorer.ts init
```

## Configuration Files

| File | Purpose |
|------|---------|
| `.atddrc.json` | ATDD enforcer config (story glob, test glob, coverage %) |
| `risk-assessments.json` | Feature risk factors and justifications |
