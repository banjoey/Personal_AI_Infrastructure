# CreateTechnicalSpec Workflow

Create a comprehensive technical specification for a skill system, architecture, or technical implementation.

## When to Use

- Designing a new skill system or framework
- Documenting technical architecture decisions
- Creating implementation blueprints
- Technical specifications that go beyond PRD scope

## Difference from PRD

| PRD | Technical Spec |
|-----|----------------|
| WHAT to build | HOW to build it |
| Business value | Technical implementation |
| User-focused | Developer-focused |
| Features & requirements | Architecture & patterns |
| Success metrics | Technical constraints |

**Rule:** Create PRD first for requirements, then Technical Spec for implementation details.

## Workflow Steps

### Step 1: Define Scope and Purpose

**Questions:**
1. What system/component is being specified?
2. What is the goal of this specification?
3. Who is the audience? (developers, architects, etc.)
4. What decisions need to be made?

**Output:** Clear problem statement and scope definition

---

### Step 2: Create Executive Summary

One paragraph answering:
- What is being built?
- What problem does it solve?
- What approach is being taken?

```markdown
## Executive Summary

This specification defines [system/component] that [solves problem] by [approach].
The system uses [key pattern/architecture] to achieve [goals].
```

---

### Step 3: Document Problem Statement

**Template:**
```markdown
## Problem Statement

### Issues Observed
1. [Issue 1]
2. [Issue 2]
3. [Issue 3]

### Goals
- [Goal 1]
- [Goal 2]
- [Goal 3]
```

---

### Step 4: Design Architecture

Create visual architecture diagram:

```markdown
## Architecture Overview

[ASCII diagram or description]

### Component Descriptions

| Component | Purpose | Technology |
|-----------|---------|------------|
| [Name] | [Purpose] | [Tech] |
```

---

### Step 5: Define Interfaces

For each component, define:
- Inputs
- Outputs
- Dependencies
- Integration points

```markdown
## Interfaces

### [Component A]

**Inputs:**
- [Input 1]: [description]

**Outputs:**
- [Output 1]: [description]

**Delegates To:**
- [Other component]: [for what]
```

---

### Step 6: Document Patterns and Standards

```markdown
## Patterns and Standards

### Required
| Category | Standard | Rationale |
|----------|----------|-----------|
| [Category] | [Standard] | [Why] |

### Prohibited
| Pattern | Reason |
|---------|--------|
| [Pattern] | [Why not] |
```

---

### Step 7: Create Implementation Plan

Break down into phases:

```markdown
## Implementation Plan

### Phase 1: [Name] (Week 1)
1. [Task]
2. [Task]

### Phase 2: [Name] (Week 2)
1. [Task]
2. [Task]
```

---

### Step 8: Define Success Criteria

```markdown
## Success Criteria

### For [Component]
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### For System
- [ ] [Criterion 1]
- [ ] [Criterion 2]
```

---

### Step 9: Document Appendices

Include supporting information:
- Decision rationale
- Integration matrices
- Configuration examples
- Edge cases

---

## Technical Spec Template

```markdown
# [System/Component] Technical Specification

**Version:** 1.0
**Date:** [Date]
**Author:** [Name]
**Status:** Draft | Review | Approved

---

## Executive Summary

[1-2 paragraph summary]

---

## Problem Statement

### Issues Observed
1. [Issue]
2. [Issue]

### Goals
- [Goal]
- [Goal]

---

## Architecture Overview

[Diagram]

### Components

| Component | Purpose |
|-----------|---------|
| [Name] | [Purpose] |

---

## Detailed Design

### [Component 1]

**Purpose:** [description]

**Interfaces:**
- Input: [description]
- Output: [description]

**Implementation:**
[Details]

### [Component 2]

[Same structure]

---

## Standards and Patterns

### Required
| Standard | Rationale |
|----------|-----------|
| [Standard] | [Why] |

### Prohibited
| Pattern | Reason |
|---------|--------|
| [Pattern] | [Why] |

---

## Implementation Plan

### Phase 1: [Name]
- [ ] Task 1
- [ ] Task 2

### Phase 2: [Name]
- [ ] Task 1
- [ ] Task 2

---

## Success Criteria

- [ ] [Criterion]
- [ ] [Criterion]

---

## Appendix A: [Topic]

[Supporting information]

---

*End of Specification*
```

---

## Quality Checklist

Before marking spec as complete:

- [ ] Executive summary is clear
- [ ] Problem statement is specific
- [ ] Architecture is diagrammed
- [ ] All components defined
- [ ] Interfaces documented
- [ ] Standards listed
- [ ] Implementation plan realistic
- [ ] Success criteria measurable

---

## Integration with Development Skill

After CreateTechnicalSpec:

1. **Development skill** uses spec to guide implementation
2. **TestArchitect** creates test strategy based on spec
3. **Security skill** reviews spec for security implications

---

**CreateTechnicalSpec ensures technical decisions are documented before code is written.**
