# PreOpCheck Workflow

**Trigger:** Before ANY infrastructure operation (deploy, scale, modify, delete)

## Purpose

Ensure documentation exists and is reviewed before making changes to production systems. This workflow is the primary enforcement mechanism for DocGuard.

## Activation

This workflow activates automatically when:
- User requests deployment of any service
- User requests scaling/modification of existing service
- User requests infrastructure changes (network, storage, security)
- User requests cluster configuration changes

## Workflow Steps

### Step 1: Announce Documentation Check

Always start with:
```
"Before proceeding, let me check our documentation in Joplin..."
```

### Step 2: Check Joplin for Context

Use Joplin MCP to search for relevant documentation:

```
# Search for related documentation
mcp__joplin__search_notes("query": "[service/operation name]")

# Check inventory
mcp__joplin__search_notes("query": "notebook:Infrastructure/Inventory")

# Check runbooks
mcp__joplin__search_notes("query": "notebook:Infrastructure/Runbooks")

# Check ADRs
mcp__joplin__search_notes("query": "notebook:Infrastructure/ADRs")

# Check current sprint
mcp__joplin__search_notes("query": "notebook:Infrastructure/Sprints/Current")
```

### Step 3: Report Findings

Report what was found:

**If documentation exists:**
```
"I found documentation for [service]:
- Inventory entry: [location]
- Runbook: [if exists]
- Related ADRs: [if any]
- Sprint story: [if applicable]

Proceeding with documented context..."
```

**If no documentation:**
```
"No existing documentation found for [service].
This will be documented as a first-time operation.

I'll create:
- Inventory entry after deployment
- Runbook from this operation
- Update sprint tracking

Proceeding with documentation on completion..."
```

### Step 4: Document Planned Changes

Before executing, document:

```markdown
## Change Record: [Date] - [Operation]

**Target:** [Service/System name]
**Action:** [Deploy/Scale/Modify/Delete]
**Reason:** [Why this change]
**Expected Outcome:** [What success looks like]
**Rollback Plan:** [How to undo if needed]
**Sprint Story:** [Link if applicable]
```

### Step 5: Execute with Awareness

During execution, maintain awareness of:
- What was expected vs actual
- Any errors or warnings
- Configuration decisions made
- Time taken

### Step 6: Post-Operation Documentation

After completion, trigger PostOpRecord workflow:
- Update inventory
- Create/update runbook
- Record in sprint tracking
- Note any lessons learned

## Decision Points

### If Joplin MCP is unavailable:
```
"Joplin MCP is not available. Documentation enforcement requires
documentation access. Options:

1. Wait for Joplin MCP to be available
2. Bypass with explicit acknowledgment (creates follow-up task)
3. Use alternative documentation method temporarily
```

### If operation contradicts existing documentation:
```
"Warning: This operation contradicts existing documentation:
- [What the docs say]
- [What you're requesting]

Should I:
1. Update the documentation and proceed
2. Stop and discuss the discrepancy
3. Proceed and flag for ADR review
```

### If operation is not in current sprint:
```
"This operation is not in the current sprint backlog.
Is this:

1. Emergency/unplanned work (will document as such)
2. Should be added to sprint (will update sprint)
3. Exploratory/research (will document findings)
```

## Example Execution

```
User: "Deploy Prometheus via ArgoCD"

PreOpCheck activates:

[Step 1]
"Before deploying Prometheus, let me check our documentation in Joplin..."

[Step 2]
mcp__joplin__search_notes("Prometheus")
mcp__joplin__search_notes("E1-Observability")
mcp__joplin__search_notes("Sprint 1")

[Step 3]
"Found documentation:
- Epic: E1-Observability (Infrastructure/Epics/E1-Observability/)
- Sprint Story: Deploy Prometheus on k3s (Infrastructure/Sprints/Current/)
- No existing runbook (first deployment)

This is a planned Sprint 1 story. Proceeding..."

[Step 4]
"Documenting planned changes:
- Target: Prometheus
- Action: Deploy via ArgoCD to monitoring namespace
- Reason: Sprint 1 E1-Observability foundation
- Expected: Prometheus pods running, scraping targets
- Rollback: Delete ArgoCD Application resource

[Step 5]
[Executes deployment via ArgoCD]

[Step 6]
"Deployment complete. Updating documentation:
- Created: Infrastructure/Inventory/Services/prometheus.md
- Created: Infrastructure/Runbooks/Deployment/prometheus.md
- Updated: Sprint 1 story status to DONE"
```

## Metrics Tracked

- Operations with full pre-documentation: target 100%
- Runbooks created from operations: target 100% for repeatable ops
- Average documentation lag: target <1 hour post-operation
- Bypass rate: target <5% (emergencies only)

---

**This workflow ensures every infrastructure operation is documented. No tribal knowledge.**
