---
name: Utp
description: Universal Troubleshooting Process based on Steve Litt's methodology. USE WHEN anything is broken, not working, failing, erroring, debugging, troubleshooting, OR diagnosing issues. Prevents fix spiral by enforcing systematic diagnosis before repair.
---

# Utp - Universal Troubleshooting Process

**Based on Steve Litt's methodology from troubleshooters.com**

This skill enforces systematic troubleshooting discipline. It MUST be invoked before attempting ANY fix to infrastructure, code, or systems.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Utp
```

| Workflow | Trigger | File |
|----------|---------|------|
| **Diagnose** | "something is broken", "not working", "debug" | `workflows/Diagnose.md` |
| **PostMortem** | "what went wrong", "root cause analysis", "incident review" | `workflows/PostMortem.md` |

## Examples

**Example 1: Service not responding**
```
User: "Grafana isn't loading"
→ Invokes Diagnose workflow
→ Step 1-4: Gather symptoms, verify reproducible
→ Step 5: Check obvious issues (disk, certs, DNS)
→ Step 6: Divide-and-conquer to isolate root cause
→ Step 7: Fix ONLY the identified component
→ Step 8-10: Test, document, prevent recurrence
```

**Example 2: Pod crashing**
```
User: "The prometheus pod keeps restarting"
→ Invokes Diagnose workflow
→ READ LOGS FIRST (Step 3)
→ Identify exact error message
→ Narrow down: Is it OOM? Config? Storage? Network?
→ Fix the ONE root cause identified
```

**Example 3: Post-incident analysis**
```
User: "What caused the outage yesterday?"
→ Invokes PostMortem workflow
→ Timeline reconstruction
→ 5 Whys analysis
→ Document lessons learned
→ Create prevention measures
```

---

## Core Principle

> **"Don't try to fix it, just try to narrow it down."**
> — Steve Litt

The UTP reduces troubleshooting to mathematical certainty through repeated division of the problem space. Each test rules out part of the system until the root cause becomes obvious.

**Key Attitude:** "It's not magic — there's always an explanation."

---

## The 10 Steps (MANDATORY SEQUENCE)

### Step 1: Prepare

**Purpose:** Establish readiness before beginning troubleshooting work.

**Mental Preparation:**
- Clear your mind of assumptions about the cause
- Accept that you CAN solve this — it's not magic
- Commit to following ALL steps without skipping

**Technical Preparation:**
- Gather documentation (system docs, runbooks, architecture diagrams)
- Ensure access to all test points (logs, metrics, shells, dashboards)
- Identify who to contact if escalation is needed

**For Kubernetes/Infrastructure:**
```bash
# Verify access
kubectl cluster-info
kubectl config current-context

# Ensure you can see logs
kubectl auth can-i get pods --all-namespaces

# Have documentation ready
# - Architecture diagram of the system
# - Recent changes (git log, ArgoCD history)
# - Previous incident reports
```

**Checklist:**
- [ ] I have access to all systems involved
- [ ] I have documentation available
- [ ] I have cleared my assumptions
- [ ] I am ready to follow ALL 10 steps

---

### Step 2: Make a Damage Control Plan

**Purpose:** Plan to prevent making anything worse during diagnosis and repair.

**Before ANY action, identify:**

| Question | Answer Required |
|----------|-----------------|
| What could break if I do X? | Specific components at risk |
| How do I roll back? | Exact rollback procedure |
| What's the blast radius? | Users/services affected |
| Is this reversible? | Yes/No — if No, get approval first |

**Example Damage Control Plan:**
```markdown
## Damage Control Plan - Prometheus Not Scraping

Current state: Prometheus not collecting metrics
Proposed action: Restart Prometheus pod

What could break:
- Lose in-flight metrics (30s-2min worth)
- Alert rules may re-fire during restart

How to roll back:
- N/A (restart is idempotent)

Blast radius:
- 1 pod
- 30-60s of metrics gap
- Dashboards may show gap

Approval needed: No (low risk, reversible)
```

**HIGH RISK actions requiring explicit approval:**
- Deleting PVCs or StatefulSets
- Modifying production databases
- Changing network/firewall rules
- Force-pushing to git
- Scaling to zero

**Checklist:**
- [ ] I have identified what could go wrong
- [ ] I know how to roll back
- [ ] I understand the blast radius
- [ ] High-risk actions have approval

---

### Step 3: Get Complete Symptom Description

**Purpose:** Gather thorough information about the problem from all sources.

**Questions to Answer:**

| Question | Why It Matters |
|----------|----------------|
| What exactly isn't working? | Specific behavior, not vague "it's broken" |
| What IS working? | Helps narrow scope |
| When did it last work? | Establishes timeline |
| What changed since then? | Prime suspects |
| Is it intermittent or constant? | Affects diagnosis strategy |
| Who/what reported the problem? | Source reliability |
| What error messages exist? | Often contains the answer |

**For Infrastructure — RUN THESE FIRST:**
```bash
# What's not running?
kubectl get pods -A | grep -v Running | grep -v Completed

# What are the actual errors?
kubectl describe pod <unhealthy-pod> | tail -30

# What do the LOGS say? (MOST IMPORTANT)
kubectl logs <unhealthy-pod> --tail=100

# What events happened?
kubectl get events -A --sort-by='.lastTimestamp' | tail -30

# What changed recently?
# - Git commits
# - ArgoCD sync history
# - Helm release history
helm history <release> -n <namespace>
```

**CRITICAL:** The logs often contain the EXACT error. Read them BEFORE theorizing.

**Checklist:**
- [ ] I have read the logs of the failing component
- [ ] I can describe the EXACT symptom (not just "broken")
- [ ] I know when it last worked
- [ ] I know what changed since then

---

### Step 4: Reproduce the Symptom

**Purpose:** Verify the issue occurs as described before proceeding.

**Why This Matters:**
- Confirms you understand the problem
- Proves it's not a transient/resolved issue
- Gives you a baseline to test fixes against

**Reproduction Steps:**
1. Attempt the action that's failing
2. Observe the EXACT behavior
3. Note any error messages
4. Confirm it fails consistently (or note intermittence)

**For Infrastructure:**
```bash
# Can you see the failure?
curl -v https://failing-service.example.com

# Does the pod show the error in real-time?
kubectl logs -f <pod>

# Can you trigger the failure on demand?
kubectl exec -it debug-pod -- wget http://service:port
```

**STOP if you cannot reproduce:**
- Intermittent issues require different techniques
- May need to add monitoring/logging first
- Don't proceed until you can reliably see the failure

**Checklist:**
- [ ] I can reproduce the symptom on demand
- [ ] I have observed the failure myself
- [ ] I understand the failure pattern (constant vs intermittent)

---

### Step 5: Do Appropriate Corrective Maintenance

**Purpose:** Fix obvious issues that should be fixed anyway, even if not the root cause.

**Check for obvious issues:**

| Check | Command | Fix If Found |
|-------|---------|--------------|
| Disk space | `df -h` | Clear space |
| Memory pressure | `kubectl top nodes` | Scale or restart |
| Certificate expiry | `kubectl get cert -A` | Renew certs |
| Resource limits | `kubectl describe pod` | Adjust limits |
| Known CVEs | Check advisories | Patch |
| Pending updates | `helm list -A` | Consider upgrading |

**For Kubernetes:**
```bash
# Quick health checks
kubectl top nodes
kubectl top pods -A | sort -k3 -h | tail -10  # Top CPU
kubectl top pods -A | sort -k4 -h | tail -10  # Top memory

# Check for resource pressure
kubectl describe nodes | grep -A5 "Conditions:"

# Check storage
kubectl get pvc -A | grep -v Bound

# Check events for warnings
kubectl get events -A --field-selector type=Warning | tail -20
```

**Important:** These fixes are "while you're here" maintenance. They may or may not be the root cause. Don't assume fixing one of these solved your problem — verify in Step 8.

**Checklist:**
- [ ] I have checked disk space
- [ ] I have checked memory/CPU pressure
- [ ] I have checked for expired certificates
- [ ] I have addressed any obvious issues found

---

### Step 6: Narrow Down to Root Cause

**Purpose:** Use divide-and-conquer diagnostic testing to isolate the ONE defective component.

**THIS IS THE CRITICAL STEP I HAVE HISTORICALLY FAILED.**

> **"Don't try to fix it, just try to narrow it down."**

**The Divide-and-Conquer Method:**

```
1. List all components in the failure path
2. Find a test point in the MIDDLE
3. Test: Does data/requests flow correctly to this point?
4. If YES: Problem is DOWNSTREAM — repeat on downstream half
5. If NO: Problem is UPSTREAM — repeat on upstream half
6. Continue until root cause is isolated to ONE component
```

**Example: "Grafana shows no data"**

```
Component chain:
User → Grafana → Prometheus → ServiceMonitors → Target Pods → App Metrics

Step 1: Test the MIDDLE (Prometheus)
  kubectl port-forward svc/prometheus 9090:9090
  curl localhost:9090/api/v1/targets

Step 2: Targets empty?
  YES → Problem is ServiceMonitors or Target discovery
  NO  → Problem is Grafana → Prometheus connection

Step 3: If targets empty, test ServiceMonitors
  kubectl get servicemonitors -A
  kubectl describe servicemonitor <name>

Step 4: Continue dividing until ONE component is identified
```

**Binary Questions to Ask:**

| Question | Yes/No | Narrows To |
|----------|--------|------------|
| Is the pod running? | | Container vs scheduling |
| Are logs showing errors? | | Code vs config |
| Is the service endpoint reachable? | | Network vs app |
| Is the PVC mounted? | | Storage vs app |
| Is DNS resolving? | | DNS vs connectivity |
| Is the config correct? | | Config vs runtime |

**Diagnostic Commands (Reversible, No Side Effects):**
```bash
# Test connectivity
kubectl run debug --rm -it --image=busybox -- wget -qO- http://service:port

# Test DNS
kubectl run debug --rm -it --image=busybox -- nslookup service.namespace

# Test storage
kubectl exec -it <pod> -- ls -la /data

# Test config
kubectl get configmap <name> -o yaml

# Test secrets exist (don't print values)
kubectl get secret <name> -o jsonpath='{.data}' | jq 'keys'
```

**CRITICAL RULES:**
1. Each test should be REVERSIBLE (no side effects)
2. Each test should ELIMINATE half the problem space
3. Do NOT attempt fixes until ONE component is identified
4. If you feel the urge to "try something" — STOP. You're skipping Step 6.

**Checklist:**
- [ ] I have listed all components in the failure path
- [ ] I have tested the MIDDLE of the chain
- [ ] I have narrowed to ONE specific component
- [ ] I have NOT attempted any fixes yet

---

### Step 7: Repair or Replace the Defective Component

**Purpose:** Fix the ONE component identified in Step 6.

**ONLY NOW do you make changes.**

**Rules for Repair:**
1. Fix the ONE component identified — not multiple things
2. Make the MINIMUM change necessary
3. Document EXACTLY what you changed
4. Make changes through proper channels (GitOps, not kubectl apply)

**Document Your Fix:**
```markdown
## Fix Applied

Component: longhorn-manager DaemonSet
Root Cause: Version mismatch (chart 1.7.2, cluster data 1.10.1)
Change Made: Updated targetRevision from 1.7.2 to 1.10.1 in longhorn.yaml
Method: Git commit → ArgoCD sync
Timestamp: 2025-12-22 21:45 UTC
```

**GitOps Fix Pattern:**
```bash
# 1. Edit the source file
vim k8s/apps/children/<app>.yaml

# 2. Commit with clear message
git add . && git commit -m "fix(<app>): <what> - <why>"

# 3. Push and let ArgoCD sync
git push

# 4. Verify sync
argocd app sync <app>
argocd app wait <app>
```

**Emergency Direct Fix (Only if GitOps is broken):**
```bash
# Document that you're bypassing GitOps
echo "EMERGENCY FIX: $(date) - <reason>" >> /tmp/emergency-fixes.log

# Make the fix
kubectl <fix-command>

# IMMEDIATELY create Git commit to match
# (Don't leave cluster and Git out of sync)
```

**Checklist:**
- [ ] I am fixing ONLY the component identified in Step 6
- [ ] I am making the MINIMUM change necessary
- [ ] I have documented what I changed
- [ ] I used GitOps (or documented why I couldn't)

---

### Step 8: Test

**Purpose:** Verify the symptom is eliminated and no new problems were created.

**Test the Original Symptom:**
```bash
# Whatever failed in Step 4 should now work
curl -v https://service.example.com
# Expected: 200 OK

# The logs should be clean
kubectl logs <pod> --tail=50 | grep -i error
# Expected: No errors (or expected errors only)
```

**Test for Regression:**
```bash
# Check overall cluster health
kubectl get pods -A | grep -v Running | grep -v Completed
# Expected: Same or fewer issues than before

# Check related services
kubectl get endpoints <service>
# Expected: Endpoints populated

# Check metrics/monitoring
curl localhost:9090/api/v1/query?query=up
# Expected: Targets showing up{...}=1
```

**Verification Checklist:**
- [ ] Original symptom is gone
- [ ] No new errors introduced
- [ ] Related services still working
- [ ] Monitoring shows healthy state

**If Test Fails:**
- Roll back the change from Step 7
- Return to Step 6 and continue narrowing
- You may have fixed a symptom, not the root cause

---

### Step 9: Take Pride

**Purpose:** Celebrate the victory to cement the learning.

**Why This Matters:**
Steve Litt emphasizes: "Delaying pride allows victories to fade; immediate acknowledgment creates lasting motivation."

**What to Capture:**
```markdown
## Victory Log

Date: 2025-12-22
Problem: Grafana showing no data
Root Cause: Longhorn version mismatch (1.7.2 in Git vs 1.10.1 in cluster)
How Found: Step 6 divide-and-conquer led to Prometheus → PVCs → Longhorn → logs showed version error
Time to Resolution: 45 minutes (following UTP)
Key Learning: Always verify helm chart versions match installed versions before troubleshooting
```

**Checklist:**
- [ ] I have documented the root cause
- [ ] I have noted how I found it
- [ ] I have captured key learnings

---

### Step 10: Prevent Future Occurrence

**Purpose:** Implement measures to prevent this problem from happening again.

**Prevention Categories:**

| Category | Example Actions |
|----------|-----------------|
| Monitoring | Add alert for this failure mode |
| Documentation | Update runbook with this scenario |
| Automation | Create drift detection script |
| Process | Add check to deployment checklist |
| Architecture | Eliminate single point of failure |

**For Infrastructure:**
```bash
# Add a PrometheusRule for this failure mode
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: longhorn-version-drift
  namespace: monitoring
spec:
  groups:
  - name: longhorn
    rules:
    - alert: LonghornVersionDrift
      expr: |
        # Alert if installed version differs from expected
        longhorn_manager_info{version!="v1.10.1"}
      labels:
        severity: warning
EOF
```

**Documentation Update:**
```markdown
## Runbook Addition: Longhorn Version Mismatch

**Symptom:** Longhorn-manager in CrashLoopBackOff with "downgrade not supported"

**Cause:** Git chart version doesn't match installed data version

**Check:**
kubectl logs -n longhorn-system -l app=longhorn-manager | grep -i version

**Fix:**
Update targetRevision in longhorn.yaml to match installed version
```

**Checklist:**
- [ ] I have added monitoring/alerting for this failure mode
- [ ] I have updated documentation/runbooks
- [ ] I have considered automation to prevent recurrence
- [ ] I have shared learnings with the team (if applicable)

---

## Anti-Patterns (Constitutional Violations)

### The Fix Spiral
```
WRONG:
1. Something broken
2. Maybe it's X? → Change X
3. Still broken → Maybe it's Y? → Change Y
4. Still broken → Maybe restart Z?
5. [Hours later, many changes, no understanding]

RIGHT:
1. Something broken
2. Read logs → Exact error identified
3. Narrow down → Component identified
4. Fix ONE thing
5. Done
```

### The "Just Try It" Mentality
```
WRONG:
"Let me just restart the pod and see if that helps"
"Let me just change this setting and see"
"Let me just delete and recreate"

RIGHT:
"Let me read the logs first"
"Let me narrow down which component is failing"
"Let me understand WHY before changing anything"
```

### Trusting Status Over Logs
```
WRONG:
- ArgoCD says "Synced" → Must be working!
- Pod shows "Running" → Must be healthy!
- Helm says "deployed" → Must be correct version!

RIGHT:
- Check LOGS for actual behavior
- Check ENDPOINTS for actual connectivity
- Check VERSIONS for actual installed software
```

### Blaming External Systems First
```
WRONG:
"The MCP must be buggy"
"ArgoCD is broken"
"Kubernetes has a bug"

RIGHT:
"Let me verify my configuration first"
"Let me check my deployment is correct"
"Let me read the logs before assuming external fault"
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│              UNIVERSAL TROUBLESHOOTING PROCESS          │
├─────────────────────────────────────────────────────────┤
│ PREPARE          │ Clear mind, gather docs, verify access│
│ DAMAGE CONTROL   │ What could break? How to roll back?  │
│ SYMPTOMS         │ READ LOGS FIRST. What exactly fails? │
│ REPRODUCE        │ Can you see the failure yourself?    │
│ MAINTENANCE      │ Disk? Memory? Certs? Obvious issues? │
│ NARROW DOWN      │ Divide-and-conquer to ONE component  │
│ REPAIR           │ Fix ONLY the identified component    │
│ TEST             │ Symptom gone? No new problems?       │
│ PRIDE            │ Document the victory                 │
│ PREVENT          │ Add monitoring, update runbooks      │
├─────────────────────────────────────────────────────────┤
│ KEY RULE: Complete Steps 1-6 BEFORE attempting Step 7   │
└─────────────────────────────────────────────────────────┘
```

---

## Activation Gate

**Before taking ANY troubleshooting action, verify:**

- [ ] I have read the logs of the failing component
- [ ] I can describe the EXACT symptom
- [ ] I have a damage control plan
- [ ] I have identified the component chain
- [ ] I have NOT attempted any fixes yet
- [ ] My next action is DIAGNOSTIC, not REPAIR

**If any checkbox is unchecked, complete it before proceeding.**

---

## Attribution

This methodology is based on Steve Litt's Universal Troubleshooting Process.
Source: https://www.troubleshooters.com/tuni.htm

> "No problem can stand the assault of sustained thinking." — Voltaire
