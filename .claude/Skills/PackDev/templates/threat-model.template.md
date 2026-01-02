# Threat Model: [Story Title]

**Story:** [PROJ-XXX]
**Author:** [Name]
**Date:** [YYYY-MM-DD]
**Status:** Draft | Review | Approved

---

## Overview

Brief description of what this story implements and why threat modeling is needed.

**Scope:** [What's included in this threat model]
**Out of Scope:** [What's explicitly excluded]

---

## Assets

What are we protecting? List data, systems, or capabilities that have value.

| Asset | Description | Sensitivity |
|-------|-------------|-------------|
| [Asset name] | [What it is] | Public / Internal / Confidential / Restricted |

---

## Threat Actors

Who might attack? Consider both external and internal actors.

| Actor | Motivation | Capability |
|-------|------------|------------|
| External attacker | Financial gain, disruption | Medium - automated tools, known exploits |
| Malicious insider | Data theft, sabotage | High - has legitimate access |
| Compromised agent | Prompt injection victim | Variable - depends on agent permissions |

*Remove actors that don't apply to your story.*

---

## Trust Boundaries

Where does trust level change? These are key points to secure.

```
[Diagram or list showing trust boundaries]

Example:
┌─────────────────────────────────────────┐
│  Untrusted: External Input              │
└─────────────────────────────────────────┘
                    │
                    ▼ [BOUNDARY: Input Validation]
┌─────────────────────────────────────────┐
│  Semi-trusted: Validated Input          │
└─────────────────────────────────────────┘
                    │
                    ▼ [BOUNDARY: Authentication]
┌─────────────────────────────────────────┐
│  Trusted: Authenticated Session         │
└─────────────────────────────────────────┘
```

---

## Threats and Mitigations

Analyze each potential threat. Use the severity guide below.

### Severity Guide

| Rating | Likelihood | Impact |
|--------|------------|--------|
| **High** | Likely; known patterns | Breach, compromise, significant downtime |
| **Medium** | Possible with effort | Limited exposure, partial degradation |
| **Low** | Unlikely; requires expertise | Minimal impact, recoverable |

### Threat Analysis

| ID | Threat | Attack Vector | L | I | Mitigation | Status |
|----|--------|---------------|---|---|------------|--------|
| T1 | [Name] | [How attack works] | H/M/L | H/M/L | [Control to prevent/detect] | Planned/Done |
| T2 | | | | | | |

### Common Threats Checklist

Review these common threats. Mark N/A if not applicable.

- [ ] **INJ-1: Command Injection** - User input executed as commands
- [ ] **INJ-2: Prompt Injection** - Malicious content influences agent behavior
- [ ] **AUTH-1: Credential Theft** - Secrets exposed in logs, errors, or storage
- [ ] **AUTH-2: Session Hijacking** - Session tokens stolen or reused
- [ ] **AUTHZ-1: Privilege Escalation** - User gains unauthorized access
- [ ] **DATA-1: Sensitive Data Exposure** - PII or secrets leaked
- [ ] **DATA-2: Insufficient Logging** - Attacks go undetected
- [ ] **CTX-1: Context Poisoning** - Malicious content in loaded files
- [ ] **DOS-1: Resource Exhaustion** - System overwhelmed by requests

---

## Residual Risks

What risks remain after mitigations? Document acceptance rationale.

| Risk | Severity | Acceptance Rationale |
|------|----------|---------------------|
| [Remaining risk] | H/M/L | [Why this is acceptable] |

---

## Review

- [ ] Threat model reviewed by: _______________
- [ ] Review date: _______________
- [ ] Approved for implementation: Yes / No

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| [Date] | [Name] | Initial threat model |
