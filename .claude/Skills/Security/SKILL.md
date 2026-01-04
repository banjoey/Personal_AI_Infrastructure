---
name: Security
description: Shift-left security with CLI scanning tools. USE WHEN user needs threat modeling, dependency auditing, secrets scanning, CMMC compliance, or security-first design. Provides deterministic security scanning tools.
---

# Security

Shift-left security: identify and mitigate threats before code is deployed. Includes CLI tools for automated security scanning.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Security
```

| Workflow | Trigger | File |
|----------|---------|------|
| **ThreatModel** | "threat model", "STRIDE analysis", "security design" | `workflows/ThreatModel.md` |
| **CmmcBaseline** | "CMMC", "compliance baseline", "DoD requirements" | `workflows/CmmcBaseline.md` |
| **SecurityReview** | "security review", "OWASP check", "vulnerability review" | `workflows/SecurityReview.md` |
| **InfrastructureSecurity** | "infrastructure audit", "cloud security", "config audit" | `workflows/InfrastructureSecurity.md` |
| **GenerateAudit** | "generate audit", "compliance audit trail" | `workflows/GenerateAudit.md` |

## Tools

All tools are TypeScript CLIs for deterministic security scanning.

| Tool | Purpose | File |
|------|---------|------|
| **DependencyAudit** | Scan dependencies for CVEs | `tools/DependencyAudit.ts` |
| **SecretsScan** | Detect hardcoded secrets | `tools/SecretsScan.ts` |

## Examples

**Example 1: Scan for vulnerable dependencies**
```
User: "Check this project for vulnerable dependencies"
→ Runs tools/DependencyAudit.ts
→ Returns: 3 critical, 5 high severity vulnerabilities with fix recommendations
```

**Example 2: Scan for hardcoded secrets**
```
User: "Scan for any hardcoded secrets before I push"
→ Runs tools/SecretsScan.ts
→ Returns: 2 API keys found, 1 password in config, with remediation steps
```

**Example 3: Full security review**
```
User: "Do a full security review of the auth module"
→ Invokes SecurityReview workflow
→ Runs tools/DependencyAudit.ts and tools/SecretsScan.ts
→ Performs OWASP Top 10 analysis
→ Returns: Security report with findings and remediation plan
```

**Example 4: Threat model new feature**
```
User: "Threat model the payment processing feature"
→ Invokes ThreatModel workflow
→ Applies STRIDE methodology
→ Returns: Threat model document with mitigations
```

## Integration

- **AgilePm Skill:** Adds security requirements to user stories
- **TestArchitect Skill:** Generates security test cases from threat model
- **Standup Skill:** Multi-agent security reviews
- **Development Skill:** Pre-commit security scanning

## Methodology

| Framework | Purpose |
|-----------|---------|
| STRIDE | Threat modeling (Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation) |
| OWASP Top 10 | Web application security |
| CMMC Level 2 | DoD contractor compliance (110 practices) |
| CIS Benchmarks | Infrastructure hardening |

## Common Operations

### Scan dependencies for vulnerabilities
```bash
bun run tools/DependencyAudit.ts
bun run tools/DependencyAudit.ts ~/src/project --severity=high
bun run tools/DependencyAudit.ts . --json
```

### Scan for hardcoded secrets
```bash
bun run tools/SecretsScan.ts
bun run tools/SecretsScan.ts ~/src/project
bun run tools/SecretsScan.ts . --json
```

### Pre-commit security check
```bash
bun run tools/SecretsScan.ts . && bun run tools/DependencyAudit.ts .
```

## Reference

| Resource | Link |
|----------|------|
| OWASP Top 10 | https://owasp.org/Top10/ |
| STRIDE | https://docs.microsoft.com/en-us/azure/security/develop/threat-modeling-tool |
| CMMC | https://dodcio.defense.gov/CMMC/ |
| CIS Benchmarks | https://www.cisecurity.org/cis-benchmarks |
