---
name: DevGuard
description: Pre-coding guardrail that enforces research-before-implementation. USE WHEN writing new code, adding dependencies, implementing features, upgrading libraries, OR making architectural decisions. MANDATORY activation before significant code changes.
---

# DevGuard - Software Development Guardrail

**Prevents outdated code and missed improvements by enforcing research BEFORE implementation.**

This skill applies the same "research before action" principle from InfraGuard to software development. It exists because:

1. **Training data has a cutoff** - My knowledge may be outdated
2. **Libraries update constantly** - Security fixes, new APIs, deprecations
3. **Best practices evolve** - What was right in 2023 may be wrong in 2025
4. **Memory is not documentation** - Official docs are the source of truth

## Activation Gate

**STOP. Before ANY significant code change, this skill MUST be invoked.**

Triggers:
- Adding new dependencies/libraries
- Implementing authentication/security
- Database queries or ORM usage
- API integrations
- Framework-specific patterns
- Performance-critical code
- Any code you're "pretty sure" about

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **PreCode** | Before implementing a feature | `workflows/PreCode.md` |
| **DependencyCheck** | Before adding/upgrading packages | `workflows/DependencyCheck.md` |
| **SecurityReview** | Before auth, crypto, or sensitive code | `workflows/SecurityReview.md` |

---

## The Memory Trap

This skill exists because of patterns like this:

```
Problem: Wrote authentication code from memory
Result: Used deprecated bcrypt API, missed timing-safe comparison
Why: Training data was from 2023, library updated in 2024
Fix: 5 minutes if docs were checked first
```

**The pattern:**
1. "I know how to do this" (from training data)
2. Code written without checking current docs
3. Works, but uses outdated patterns
4. Security vulnerability or tech debt introduced
5. Could have been avoided with 2 minutes of research

---

## Core Principle: Verify, Then Code

> "Trust, but verify." - Applied to my own knowledge

Before writing ANY significant code:

1. **Check official documentation** for current version
2. **Verify library version** and its current API
3. **Look for recent changes** - changelog, migration guides
4. **Search for security advisories** related to what you're implementing
5. **Check if better alternatives exist** - the ecosystem evolves

---

## Pre-Coding Checklist

### For New Features

| Check | Action | Why |
|-------|--------|-----|
| Framework docs current? | WebFetch official docs | APIs change between versions |
| Best practices updated? | Search "best practice [topic] 2025" | Patterns evolve |
| Security considerations? | Check OWASP for the domain | Security is non-negotiable |
| Dependencies latest? | Check npm/pypi for versions | May have critical fixes |
| Breaking changes? | Read changelog/migration guide | Avoid deprecated patterns |

### For Dependencies

| Check | Action | Why |
|-------|--------|-----|
| Is it maintained? | Check GitHub activity, issues | Abandoned = risk |
| Security vulnerabilities? | Check npm audit / snyk / GitHub advisories | Known CVEs? |
| License compatible? | Verify license type | Legal compliance |
| Bundle size acceptable? | Check bundlephobia (JS) | Performance impact |
| Better alternatives? | Search "[library] vs alternatives 2025" | Ecosystem evolves |

### For Security-Sensitive Code

| Check | Action | Why |
|-------|--------|-----|
| OWASP guidance? | Check OWASP cheatsheets | Industry standard |
| Library's security docs? | Read security section | May have specific guidance |
| Known vulnerabilities? | Search CVE database | Don't reintroduce known issues |
| Crypto primitives correct? | Verify algorithm recommendations | Standards change |

---

## Research Sources (Priority Order)

1. **Official Documentation** - The vendor's current docs for your version
2. **Changelog/Release Notes** - What changed recently
3. **GitHub Issues/Discussions** - Known problems, workarounds
4. **Security Advisories** - CVEs, npm audit, Snyk
5. **Recent Blog Posts** - Search with current year for fresh perspectives

---

## Anti-Patterns This Skill Prevents

### 1. Code From Memory
```
BAD:  "I know how to implement JWT authentication"
      [writes code from training data]

GOOD: "Let me check the current jose/jsonwebtoken docs"
      [verifies current API, checks for security updates]
      [then writes code]
```

### 2. Assume Library Unchanged
```
BAD:  npm install lodash
      [uses API from memory]

GOOD: npm install lodash
      [checks lodash docs for current version]
      [verifies function signatures haven't changed]
```

### 3. Skip Security Research
```
BAD:  "I'll hash the password with bcrypt"
      [uses bcrypt.hash() from memory]

GOOD: "Let me check current bcrypt best practices"
      [verifies work factor recommendations for 2025]
      [checks for timing-safe comparison guidance]
```

### 4. Ignore Ecosystem Evolution
```
BAD:  "I'll use moment.js for dates"
      [adds deprecated library]

GOOD: "Let me check current date library recommendations"
      [discovers day.js or date-fns are now preferred]
      [uses modern, maintained alternative]
```

---

## Mandatory Research for Common Domains

### Authentication
- Check OWASP Authentication Cheatsheet
- Verify password hashing work factors
- Check session management best practices
- Verify JWT implementation guidance

### Database/ORM
- Check ORM docs for query syntax
- Verify connection pooling best practices
- Check for SQL injection prevention patterns
- Review transaction handling

### API Development
- Check REST/GraphQL best practices
- Verify rate limiting recommendations
- Check error handling patterns
- Review pagination approaches

### Frontend
- Check framework's current patterns (React hooks, Vue 3 composition, etc.)
- Verify accessibility requirements
- Check bundle optimization techniques
- Review state management current best practices

---

## Integration with Development Workflow

### Before Starting Any Feature

```
DEVGUARD CHECKPOINT:
[ ] Have I checked the official docs for libraries I'll use?
[ ] Do I know the current best practice for this domain?
[ ] Have I searched for security considerations?
[ ] Am I writing code I verified, or code I "remember"?

If any box is unchecked: RESEARCH FIRST.
```

### During Implementation

If you find yourself thinking:
- "I'm pretty sure this is how you do it..."
- "I've done this before..."
- "This should work..."

**STOP and VERIFY.** These phrases indicate you're about to code from memory.

---

## Key Takeaway

> "The documentation is smarter than your training data."

The 2 minutes spent verifying current best practices saves:
- Hours debugging subtle issues
- Security vulnerabilities
- Technical debt from deprecated patterns
- Embarrassment when code review catches outdated approaches

**DevGuard is not optional.** It's the difference between professional software development and hoping your memory is accurate.
