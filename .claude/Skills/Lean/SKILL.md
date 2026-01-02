---
name: Lean
description: Continuous improvement and waste elimination mindset. USE WHEN reviewing architecture, optimizing processes, questioning necessity of services, simplifying systems, OR proactively improving efficiency. Applies Muda/Kaizen principles to PAI operations.
---

# Lean - Continuous Improvement

**Proactive optimization through waste elimination and continuous improvement.**

This skill applies Toyota Production System principles (Muda, Muri, Mura, Kaizen) to PAI operations. Unlike Utp (reactive troubleshooting), Lean is PROACTIVE.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Review** | "review architecture", "is this necessary?", "can we simplify?" | `workflows/Review.md` |
| **Optimize** | "make this more efficient", "reduce waste", "streamline" | `workflows/Optimize.md` |
| **Kaizen** | "continuous improvement", "retrospective", "what can we do better?" | `workflows/Kaizen.md` |

## Examples

**Example 1: Architecture Review**
```
User: "We have 3 different services doing similar things. Is this necessary?"
→ Invokes Review workflow
→ Map value streams for each service
→ Identify overlap (Muda - waste)
→ Recommend consolidation or elimination
→ Document decision in ADR
```

**Example 2: Process Optimization**
```
User: "Deployments take too long"
→ Invokes Optimize workflow
→ Map the deployment value stream
→ Identify waiting time (Muda - waiting)
→ Identify overprocessing (Muda - extra processing)
→ Propose parallel steps, caching, or elimination
```

**Example 3: Session Improvement**
```
User: "What could we do better?"
→ Invokes Kaizen workflow
→ Review session patterns
→ Identify recurring friction
→ Propose small incremental improvements
→ Implement one improvement immediately
```

---

## Core Principles

### The Three M's

| Japanese | Meaning | In PAI Context |
|----------|---------|----------------|
| **Muda** | Waste | Services, steps, or code that don't add value |
| **Muri** | Overburden | Too many tasks, cognitive overload, unrealistic scope |
| **Mura** | Unevenness | Inconsistent processes, varying quality |

### Kaizen (Continuous Improvement)

> "Small, incremental improvements every day."

- Don't wait for big changes
- Improve something in EVERY session
- Compound effect over time

---

## Seven Wastes (Muda) in Software/Infrastructure

| Waste | Manufacturing | Software/Infra Example |
|-------|--------------|------------------------|
| **Defects** | Bad parts | Bugs, misconfigurations, security holes |
| **Overproduction** | Too many parts | Features nobody uses, over-engineering |
| **Waiting** | Idle time | CI/CD queues, approval delays, slow builds |
| **Non-utilized talent** | Unused skills | Manual work that should be automated |
| **Transportation** | Moving parts | Unnecessary data transfers, extra hops |
| **Inventory** | Excess stock | Stale branches, unused dependencies, old images |
| **Motion** | Excess movement | Context switching, unnecessary meetings |
| **Extra processing** | Over-work | Redundant validation, unnecessary abstraction |

---

## Lean Questions to Ask

### When Reviewing Systems

1. **Does this add value?** (If not, it's Muda)
2. **Is this the simplest solution?** (Complexity is waste)
3. **Are we doing the same thing twice?** (Duplication is waste)
4. **What would happen if we removed this?** (Test necessity)
5. **Who is this for?** (No customer = no value)

### When Reviewing Processes

1. **Where do we wait?** (Waiting is waste)
2. **What do we do manually that could be automated?** (Motion is waste)
3. **What do we repeat?** (Extra processing is waste)
4. **What breaks often?** (Defects are waste)

---

## Value Stream Mapping

**Technique for visualizing waste in a process.**

```
Request → [Wait 2h] → Review → [Wait 1d] → Approve → Build → [Wait 30m] → Deploy → Done
          ^^^^^^^^         ^^^^^^^^                ^^^^^^^^
          WAITING          WAITING                 WAITING
          (MUDA)           (MUDA)                  (MUDA)
```

**Value-Add vs Non-Value-Add:**
- Value-add: Steps that transform the output (build, test, deploy)
- Non-value-add: Steps that don't transform (waiting, approval, handoffs)

**Goal:** Maximize value-add time, minimize/eliminate non-value-add time.

---

## Applying Lean to PAI

### Service Consolidation

Before adding a new service, ask:
1. Can an existing service do this?
2. Can we extend rather than create?
3. What's the maintenance cost?

### Skill Efficiency

Before creating a new skill, ask:
1. Does an existing skill cover this?
2. Can we extend an existing skill?
3. Is this common enough to warrant a skill?

### Architecture Simplification

Periodically review:
1. What services are unused?
2. What dependencies are stale?
3. What can be consolidated?

---

## Quick Wins for Every Session

Apply Kaizen by making at least one small improvement per session:

| Type | Example |
|------|---------|
| Remove | Delete unused code/config |
| Simplify | Reduce a 10-step process to 5 |
| Automate | Create script for manual step |
| Document | Add missing runbook entry |
| Consolidate | Merge duplicate functionality |

---

## Anti-Patterns

### Premature Optimization
**WRONG:** "Let me optimize this before it's even working"
**RIGHT:** "Get it working first, then optimize if needed"

### Over-Abstraction
**WRONG:** "Let me create a generic framework for this one-time task"
**RIGHT:** "YAGNI - You Ain't Gonna Need It. Keep it simple."

### Complexity for Complexity's Sake
**WRONG:** "This microservice architecture is more modern"
**RIGHT:** "A monolith is fine until you have a reason to split"

---

## Integration with Other Skills

| Skill | How Lean Interacts |
|-------|-------------------|
| Utp | After fixing, ask "How do we prevent this waste?" |
| Development | Before building, ask "Is this necessary?" |
| Deployment | Review for waiting, motion, extra processing |
| Infra | Look for unused resources, over-provisioning |

---

## Key Takeaway

> "The most dangerous kind of waste is the waste we do not recognize." — Shigeo Shingo

Apply Lean thinking proactively. Don't just build and deploy — continuously question whether what you're building adds value.
