# Review Workflow

**Purpose:** Evaluate whether a system, service, or process is necessary and optimal.

## Execution Steps

### Step 1: Identify the Subject

What are we reviewing?
- A service?
- A process?
- An architecture decision?

### Step 2: Map Value Stream

Document the flow:
```
Input → Step 1 → Step 2 → ... → Output
```

Mark each step as:
- Value-Add (V): Transforms the output
- Non-Value-Add (N): Waiting, handoffs, approval

### Step 3: Ask Lean Questions

1. **Does this add value?** Who benefits?
2. **Is this the simplest solution?** What's simpler?
3. **Are we duplicating effort?** What overlaps?
4. **What if we removed this?** Impact?

### Step 4: Identify Waste (Muda)

| Waste Type | Present? | Details |
|------------|----------|---------|
| Defects | | |
| Overproduction | | |
| Waiting | | |
| Non-utilized talent | | |
| Transportation | | |
| Inventory | | |
| Motion | | |
| Extra processing | | |

### Step 5: Recommendation

- **Keep as-is:** Justified value, minimal waste
- **Optimize:** Value exists but waste can be reduced
- **Consolidate:** Merge with another system
- **Eliminate:** No value, remove entirely

### Step 6: Document Decision

Create ADR if significant change:
```markdown
# ADR: [Decision Title]

## Status
Proposed

## Context
[Why we're reviewing this]

## Decision
[What we decided]

## Consequences
[What changes as a result]
```

## Output

Recommendation with justification and next steps.
