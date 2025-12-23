# Optimize Workflow

**Purpose:** Reduce waste in an existing process or system.

## Execution Steps

### Step 1: Map Current State

Document the process with timings:
```
Step 1 (5m) → Wait (2h) → Step 2 (10m) → Wait (1d) → Step 3 (5m)
```

### Step 2: Calculate Efficiency

- Total time: End-to-end duration
- Value-add time: Sum of actual work
- Efficiency: Value-add / Total time

Example:
- Total: 26 hours
- Value-add: 20 minutes
- Efficiency: 1.3%

### Step 3: Identify Bottlenecks

Where is time wasted?
- Waiting for approvals?
- Sequential steps that could be parallel?
- Manual steps that could be automated?

### Step 4: Propose Improvements

| Current | Waste Type | Proposed | Savings |
|---------|------------|----------|---------|
| Wait for approval | Waiting | Auto-approve for low-risk | 2h |
| Manual deploy | Motion | CI/CD automation | 30m |
| Sequential tests | Extra processing | Parallel tests | 10m |

### Step 5: Implement ONE Change

Don't try to fix everything. Pick the highest-impact, lowest-effort improvement.

### Step 6: Measure

After implementation:
- New total time?
- New value-add time?
- New efficiency?

## Output

Before/after comparison with measured improvement.
