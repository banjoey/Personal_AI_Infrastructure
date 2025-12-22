---
name: DocGuard
description: Documentation guardrails for infrastructure operations. USE WHEN performing infrastructure changes, deploying services, modifying cluster config, OR any operation that affects production systems. BLOCKS operations until documentation is verified.
---

# DocGuard

Documentation enforcement skill that ensures all infrastructure operations are documented before, during, and after execution. This skill acts as a **guardrail** - it BLOCKS operations until documentation requirements are met.

## Core Principle

```
NO DEPLOY WITHOUT DOCS. NO CHANGE WITHOUT CONTEXT. NO SHORTCUTS.
```

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName DocGuard
```

| Workflow | Trigger | File |
|----------|---------|------|
| **PreOpCheck** | Before ANY infrastructure operation | `workflows/PreOpCheck.md` |
| **DocVerify** | "check docs", "verify documentation" | `workflows/DocVerify.md` |
| **CreateRunbook** | "create runbook", "document procedure" | `workflows/CreateRunbook.md` |
| **PostOpRecord** | After completing operations | `workflows/PostOpRecord.md` |

## Guardrails (ENFORCEMENT)

These are **non-negotiable** checkpoints. Operations BLOCK until requirements are met:

| Stage | Requirement | Blocking | Action If Missing |
|-------|-------------|----------|-------------------|
| 1. Pre-Op | Check Joplin for existing context | YES | "Let me check Joplin for context on this..." |
| 2. Inventory | Verify system inventory is current | YES | Update inventory before proceeding |
| 3. Runbook | Confirm runbook exists (for known ops) | YES | Create runbook or acknowledge first-time op |
| 4. Change Log | Document what's being changed | YES | Write change description before executing |
| 5. Post-Op | Update documentation with results | YES | Document outcomes before closing |

## Documentation Hierarchy (Joplin Source of Truth)

All infrastructure documentation lives in Joplin under this structure:

```
Infrastructure/
├── Sprints/
│   ├── Current/          # Active sprint backlog
│   └── Archive/          # Past sprints
├── Epics/                # Major initiatives
│   ├── E1-Observability/
│   ├── E2-Security/
│   ├── E3-Network/
│   ├── E4-GitOps/
│   ├── E5-DisasterRecovery/
│   └── E6-Operations/
├── ADRs/                 # Architecture Decision Records
├── Inventory/            # System inventory
│   ├── Nodes/
│   ├── Services/
│   └── Network/
├── Runbooks/             # Operational procedures
│   ├── Deployment/
│   ├── Troubleshooting/
│   └── Recovery/
├── Network/              # Network documentation
│   ├── VLANs/
│   ├── Firewall/
│   └── DNS/
└── Security/             # Security baselines
    ├── Policies/
    ├── Incidents/
    └── Compliance/
```

## Pre-Operation Checklist

Before ANY infrastructure operation, DocGuard requires:

### 1. Context Check
```
"Before we proceed, let me check Joplin for context on [operation]..."
```

- Check `Infrastructure/Inventory/` for affected systems
- Check `Infrastructure/Runbooks/` for existing procedures
- Check `Infrastructure/ADRs/` for relevant decisions
- Check `Infrastructure/Sprints/Current/` for related stories

### 2. Inventory Verification
```
"Verifying the inventory is current for [affected systems]..."
```

- Confirm last inventory update date
- If >7 days old: flag for update
- If system missing: add to inventory first

### 3. Runbook Check (for known operations)
```
"Checking if we have a runbook for [operation type]..."
```

- If runbook exists: follow it
- If no runbook: document as first-time operation
- Create runbook after successful operation

### 4. Change Documentation
```
"Documenting the planned changes before execution..."
```

Required before execution:
- What is being changed
- Why it's being changed
- Expected outcome
- Rollback procedure

## Post-Operation Requirements

After ANY infrastructure operation:

### 1. Outcome Recording
```
"Recording the operation outcome..."
```

- Success/failure status
- Actual changes made
- Any unexpected issues
- Time taken

### 2. Inventory Update
```
"Updating inventory with new state..."
```

- Update affected system entries
- Add new systems if created
- Remove decommissioned systems

### 3. Runbook Update (if applicable)
```
"Updating runbook with lessons learned..."
```

- Add any new steps discovered
- Remove outdated steps
- Document edge cases encountered

## Examples

### Example 1: Deploying Prometheus
```
User: "Deploy Prometheus"

DocGuard activates:
1. "Before deploying, let me check Joplin for context..."
   → Checks Infrastructure/Inventory/Services/
   → Checks Infrastructure/Runbooks/Deployment/
   → Checks Infrastructure/Epics/E1-Observability/

2. "I found the E1-Observability epic. Let me verify
   this is the right story to work on..."
   → Confirms Sprint 1 story: "Deploy Prometheus on k3s"

3. "No existing Prometheus runbook found. I'll document
   this as our first deployment and create a runbook after..."
   → Notes first-time operation

4. "Documenting planned changes before execution..."
   → Writes: Deploy Prometheus via ArgoCD to monitoring namespace

5. [Executes deployment]

6. "Recording outcome and updating inventory..."
   → Updates Infrastructure/Inventory/Services/prometheus.md
   → Creates Infrastructure/Runbooks/Deployment/prometheus.md
```

### Example 2: Making ad-hoc change
```
User: "Scale the gitlab-mcp to 2 replicas"

DocGuard activates:
1. "Before scaling, let me check Joplin for context..."
   → Checks Infrastructure/Inventory/Services/gitlab-mcp.md

2. "I see gitlab-mcp is currently 1 replica. Is this
   a temporary test or permanent change?"

   [If permanent]
   → "Let me create an ADR for this scaling decision..."
   → Creates Infrastructure/ADRs/ADR-XXX-gitlab-mcp-scaling.md

   [If temporary]
   → "Documenting as temporary change with revert plan..."

3. [Executes change]

4. "Updating inventory with new configuration..."
```

### Example 3: Emergency operation
```
User: "The cluster is down! Fix it now!"

DocGuard activates (expedited mode):
1. "Emergency acknowledged. Starting incident record..."
   → Creates Infrastructure/Security/Incidents/YYYY-MM-DD-cluster-down.md
   → Timestamps start of incident

2. [Allows immediate troubleshooting with documentation running parallel]

3. "Please describe what you're trying as you go..."
   → Records actions in real-time

4. [After resolution]
   "Creating post-mortem document..."
   → Documents root cause, resolution, prevention
```

## Bypass Protocol

For true emergencies, DocGuard can be bypassed:

1. **Explicit acknowledgment required:**
   ```
   "I understand this is undocumented and want to proceed anyway"
   ```

2. **Logged and tracked:**
   - Bypass is recorded with timestamp and reason
   - Creates follow-up task for documentation

3. **Remediation required:**
   - Within 24 hours: Create missing documentation
   - Add to next sprint if substantial

## Integration with Other Skills

| Skill | How DocGuard Integrates |
|-------|-------------------------|
| **Platform** | Requires docs before deployments |
| **Sre** | Requires runbooks for alerts |
| **NetworkOps** | Requires network docs for changes |
| **Security** | Shares incident documentation |
| **ProjectManagement** | Reports to sprint tracking |
| **Adr** | Delegates decision recording |

## Joplin MCP Integration

DocGuard uses the Joplin MCP for all documentation operations:

```
mcp__joplin__search_notes - Find existing documentation
mcp__joplin__get_note - Read documentation content
mcp__joplin__create_note - Create new documentation
mcp__joplin__update_note - Update existing docs
```

## Enforcement Levels

| Level | When | Behavior |
|-------|------|----------|
| **STRICT** | Production changes | Full checklist, all gates |
| **STANDARD** | Development changes | Pre-op and post-op docs |
| **EXPEDITED** | Emergencies | Parallel documentation |

---

**DocGuard ensures institutional knowledge. Every operation documented. No tribal knowledge.**
