# Design: [Story Title]

**Story:** [PROJ-XXX]  
**Author:** [Name]  
**Date:** [YYYY-MM-DD]  
**Status:** Draft | Review | Approved

---

## Overview

[2-3 sentences summarizing the approach. What are we building and how?]

---

## Architecture

### System Context

[Where does this fit in the larger system?]

```
[Diagram showing how this component relates to others]
```

### Components

| Component | Responsibility |
|-----------|----------------|
| [Name] | [What it does] |
| [Name] | [What it does] |

### Data Flow

1. [Step 1: What happens first]
2. [Step 2: What happens next]
3. [Step 3: How it completes]

---

## Interfaces

See `interfaces.ts` for complete type definitions.

### Key Interfaces

```typescript
// Primary interface for [purpose]
interface [Name] {
  // ... see interfaces.ts for full definition
}
```

### API Endpoints (if applicable)

| Method | Path | Purpose |
|--------|------|---------|
| [METHOD] | [/path] | [Purpose] |

---

## Data Model

### Entities

| Entity | Description | Storage |
|--------|-------------|---------|
| [Name] | [What it represents] | [Where stored] |

---

## Dependencies

### External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| [Library] | [x.y.z] | [Why needed] |

### Internal Dependencies

| Dependency | Purpose |
|------------|---------|
| [Service/Module] | [Why needed] |

---

## Error Handling

| Error Scenario | Handling Strategy |
|----------------|-------------------|
| [What could fail] | [How we handle it] |

---

## Security Considerations

- [ ] Input validation: [approach]
- [ ] Authentication: [approach]
- [ ] Authorization: [approach]
- [ ] Data protection: [approach]

---

## Testing Strategy

See `tests.plan.md` for detailed test plan.

| Test Type | Coverage |
|-----------|----------|
| Unit | [What's covered] |
| Integration | [What's covered] |

---

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| [What could go wrong] | High/Med/Low | High/Med/Low | [How we prevent/handle] |

---

## Decisions

| Decision | Options Considered | Choice | Rationale |
|----------|-------------------|--------|-----------|
| [What we decided] | A, B, C | [Choice] | [Why] |

---

## Open Items

- [ ] [Item needing resolution before BUILD]
