# ADR-001: Cloudflare MCP to Skill Migration

## Status
Accepted

## Date
2026-01-03

## Context

### The Problem
The Cloudflare MCP server was deployed on k3s with 51+ tools but showed **ZERO direct invocations** in session history. Analysis of actual Cloudflare operations (Dec 2025 - Jan 2026) revealed:

| Operation | Count | Interface Used |
|-----------|-------|----------------|
| Pages Deploy | 100+ | wrangler CLI (GitLab CI/CD) ✅ |
| D1 Create/Query | 20+ | wrangler CLI ✅ |
| KV Operations | 10+ | wrangler CLI ✅ |
| Workers Deploy | 15+ | wrangler CLI (GitLab CI/CD) ✅ |
| DNS Changes | 5+ | Manual dashboard |
| **MCP Tools** | **0** | **Not used** ❌ |
| Status Checking | Manual | Dashboard (slow, reactive) |
| Usage Monitoring | Manual | Dashboard (reactive) |

### Why MCP Failed
1. **CI/CD workflow already perfect** - GitLab pipelines handle all deployments with audit trail, consistent environment, automated testing, and git-based rollback
2. **Infrastructure overhead** - k3s deployment, mTLS, Traefik ingress, Infisical secrets - all for unused functionality
3. **Wrong focus** - 51+ mutation tools when deployments via CLI/CI/CD were already working flawlessly
4. **Missing inspection capabilities** - Couldn't easily check deployment status, inspect D1 data for debugging, verify KV values, or monitor free tier usage

### What Was Actually Needed
Not deployment tools, but **inspection and troubleshooting capabilities** that complement (not replace) the existing CI/CD workflow:
- ✅ Check deployment status from CLI
- ✅ Inspect D1 database data for debugging (SELECT only)
- ✅ Verify KV values during troubleshooting
- ✅ Monitor usage vs free tier limits (proactive alerts)
- ✅ Query zone/DNS configuration quickly

## Decision

**Replace Cloudflare MCP with native TypeScript skill tools focused exclusively on read-only inspection and monitoring.**

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Operations                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DEPLOYMENTS (Mutations)        INSPECTION (Read-Only)     │
│  ├─ GitLab CI/CD Pipeline   │   ├─ Skill TypeScript Tools │
│  ├─ wrangler CLI            │   ├─ Direct Cloudflare API  │
│  ├─ Audit Trail in Git      │   ├─ macOS Keychain Auth    │
│  ├─ Automated Testing       │   └─ JSON Output            │
│  └─ Git-based Rollback      │                             │
│                              │                             │
│         (Unchanged)          │          (New!)             │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles
1. **Read-only by design** - No mutation operations to prevent accidental infrastructure changes
2. **D1 SELECT-only enforcement** - Even with valid credentials, can't modify database data
3. **Deployments via GitLab CI/CD** - All mutations go through pipeline with review and testing
4. **Keychain authentication** - Secure local credential storage (never environment variables)
5. **Complement, don't replace** - Fill inspection gaps, don't duplicate working deployment flow

## Implementation

### Tool Inventory (18 READ-ONLY Tools Across 9 Files)

| File | Tool Count | Tools | Purpose |
|------|------------|-------|---------|
| **cloudflare-client.ts** | 0 | `getCredentials()`, `cloudflareApi()`, `validateReadOnlyQuery()` | Shared API client with keychain auth and validation |
| **zones.ts** | 2 | `listZones()`, `getZoneSettings()` | List domains and inspect configuration |
| **dns.ts** | 1 | `listDnsRecords()` | List DNS records for debugging |
| **pages.ts** | 4 | `listPagesProjects()`, `getPagesProject()`, `listPagesDeployments()`, `getDeploymentStatus()` | Inspect Pages deployments and status |
| **workers.ts** | 2 | `listWorkers()`, `getWorker()` | List Workers and view details |
| **d1.ts** | 3 | `listD1Databases()`, `getD1Schema()`, `queryD1()` | List databases, view schema, SELECT-only queries |
| **kv.ts** | 3 | `listKVNamespaces()`, `listKVKeys()`, `getKVValue()` | List namespaces/keys, read values for debugging |
| **r2.ts** | 1 | `listR2Buckets()` | List R2 storage buckets |
| **monitoring.ts** | 2 | `checkUsage()`, `getAnalytics()` | Monitor free tier usage and traffic analytics |
| **Total** | **18** | | **Complete read-only inspection suite** |

### Security Features

#### 1. macOS Keychain Authentication
**Replaced:** Environment variables in MCP
**With:** Encrypted keychain storage

```bash
# Setup (one-time)
security add-generic-password \
  -s "cloudflare-api" \
  -a "cloudflare-token" \
  -w "your-token-here"

security add-generic-password \
  -s "cloudflare-api" \
  -a "cloudflare-account-id" \
  -w "your-account-id"
```

**Benefits:**
- Encrypted at rest by macOS
- Not exposed in process list or environment dumps
- Consistent with Joplin skill pattern
- Backed up with Time Machine
- No secrets in config files or git

#### 2. D1 SELECT-only Enforcement

```typescript
export function validateReadOnlyQuery(sql: string): void {
  const normalized = sql.trim().toUpperCase();

  // Allow SELECT, WITH (CTEs), and EXPLAIN
  const readOnlyPatterns = /^(SELECT|WITH|EXPLAIN)/;

  if (!readOnlyPatterns.test(normalized)) {
    throw new Error(
      'Only SELECT queries allowed. Use wrangler CLI for mutations.'
    );
  }

  // Block dangerous keywords even in comments
  const dangerousPatterns = /(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\s/i;
  if (dangerousPatterns.test(sql)) {
    throw new Error('Query contains mutation keywords. Only SELECT allowed.');
  }
}
```

**Blocks:** INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE
**Allows:** SELECT, WITH (CTEs), EXPLAIN

#### 3. DeploymentConfig Type Safety

**Fixed security issue** in `interfaces.ts`:

```typescript
// BEFORE (leaked secret values)
export interface DeploymentConfig {
  env_vars: Record<string, { type: string; value: string }>;
  //                                         ^^^^^ REMOVED
}

// AFTER (read-only metadata)
export interface DeploymentConfig {
  env_vars: Record<string, { type: 'plain_text' | 'secret_text' }>;
  //                         ^^^ Only type, never value
}
```

This prevents accidental secret exposure when inspecting deployment configurations.

#### 4. Read-only Operations
- **NO** create, update, or delete operations
- **NO** deployment triggers
- **NO** DNS mutations
- **NO** resource creation
- **YES** inspection only

## Consequences

### Positive
1. **Zero infrastructure overhead** - No k3s deployment, mTLS, or ingress required
2. **Better security** - Keychain authentication, no env var exposure, type-safe interfaces prevent secret leakage
3. **Fills actual gaps** - Provides inspection capabilities that were missing
4. **Faster execution** - Direct API calls without network hop to cluster
5. **Prevents accidents** - Read-only enforcement can't damage infrastructure
6. **Proactive monitoring** - Usage tracking enables alerts before hitting free tier limits
7. **Focused scope** - 18 tools that solve real problems vs 51 unused tools
8. **Simpler maintenance** - Native TypeScript vs containerized MCP server
9. **Lower latency** - No cluster network hop
10. **Clear separation** - Deployments via CI/CD (audited), inspection via skill tools (fast)

### Negative
1. **Can't deploy through skill** - By design; deployments stay in CI/CD pipeline
2. **No deployment rollback** - Must use `git revert` + CI/CD (acceptable tradeoff for audit trail)
3. **Can't create resources** - Must use wrangler CLI or dashboard (acceptable, rare operations)
4. **Can't purge cache** - Must use dashboard (rare operation, acceptable manual step)
5. **Can't modify DNS** - Must use dashboard or IaC (acceptable for change control)
6. **Requires keychain setup** - One-time manual step per machine

### Neutral
1. **Different auth mechanism** - Keychain vs environment variables (both work, keychain more secure)
2. **Deployment flow unchanged** - CI/CD continues to work exactly as before
3. **Tool count reduced** - 51 → 18 tools (fewer but more focused)
4. **API rate limits apply** - 1200 requests per 5 minutes (generous for inspection use)

### Tradeoff Analysis

| Aspect | MCP Server | Skill Tools (This ADR) | Winner |
|--------|------------|------------------------|--------|
| **Deployments** | Could do (unused) | Cannot do (by design) | N/A (CI/CD handles) |
| **Inspection** | Could do (unused) | Does all ✅ | **Skill Tools** |
| **Infrastructure** | k3s, mTLS, ingress | None | **Skill Tools** |
| **Latency** | Network hop | Direct API | **Skill Tools** |
| **Security** | Infisical + env vars | Keychain | **Skill Tools** |
| **Maintenance** | Container updates | `bun upgrade` | **Skill Tools** |
| **Monitoring** | None | Usage tracking ✅ | **Skill Tools** |

## Design Decisions

### 1. Read-only by Design
**Decision:** No mutation operations in skill tools
**Rationale:** CI/CD workflow provides audit trail, testing, and rollback. Bypassing it removes these benefits for no gain.
**Impact:** Deployments continue via GitLab pipelines (unchanged), skill tools only for inspection

### 2. D1 SELECT-only Queries
**Decision:** Block all SQL mutations, allow only SELECT/WITH/EXPLAIN
**Rationale:** Even with valid credentials, prevent accidental data corruption during debugging
**Impact:** Must use `wrangler d1 execute` for INSERT/UPDATE/DELETE/CREATE (acceptable, rare operations)

### 3. Deployments via GitLab CI/CD
**Decision:** Keep existing deployment workflow, don't replicate in skill
**Rationale:** Current flow has 100+ successful deployments, provides audit trail and automated testing
**Impact:** Zero changes to deployment process, skill tools complement (not replace)

### 4. Keychain Authentication
**Decision:** Store credentials in macOS Keychain instead of environment variables
**Rationale:** Encrypted at rest, not exposed in process list, consistent with Joplin pattern
**Impact:** One-time setup per machine, more secure than env vars

### 5. DeploymentConfig Type Safety
**Decision:** Remove `value` field from `env_vars` interface, keep only type metadata
**Rationale:** Read-only tools should never expose secret values
**Impact:** Cannot view environment variable values (correct behavior for security)

### 6. Tool Selection Strategy
**Decision:** Implement 18 focused inspection tools vs all 51 MCP tools
**Rationale:** Focus on operations that fill gaps (inspection/monitoring), exclude operations handled by CI/CD
**Impact:** Smaller, more maintainable codebase solving actual problems

## Migration Checklist

- [x] **Spec approved** (CLOUDFLARE-001-replace-mcp-with-skill-tools.md)
- [x] **Interfaces designed** (tools/interfaces.ts - comprehensive TypeScript types)
- [x] **Shared client implemented** (cloudflare-client.ts with keychain auth)
- [x] **Phase 1: Zone & DNS** (zones.ts, dns.ts - 3 tools)
- [x] **Phase 2: Pages & Workers** (pages.ts, workers.ts - 6 tools)
- [x] **Phase 3: Storage** (d1.ts, kv.ts, r2.ts - 7 tools)
- [x] **Phase 4: Monitoring** (monitoring.ts - 2 tools)
- [x] **D1 SELECT-only enforcement** (validateReadOnlyQuery in cloudflare-client.ts)
- [x] **Integration tests** (all tools tested and verified)
- [x] **Security type fix** (DeploymentConfig.env_vars.value removed)
- [x] **Total: 18 READ-ONLY tools** (across 9 files)
- [ ] **MCP removed from ~/.claude/.mcp.json** (pending skill tools validation)
- [ ] **MCP removed from k8s cluster** (pending skill tools validation)
- [ ] **SKILL.md updated** with new tool documentation
- [ ] **Infrastructure decommission** (k3s deployment, ingress, secrets)

## Implementation Examples

### Example 1: Check Deployment Status
```bash
# Before (Manual dashboard visit)
# 1. Open https://dash.cloudflare.com
# 2. Navigate to Pages project
# 3. Check deployment status
# Time: ~30-60 seconds

# After (Skill tool)
bun pages.ts deployments my-account-id my-project | jq '.[-1] | {status, url, created_on}'
# Time: ~2 seconds
```

### Example 2: Debug D1 Database
```bash
# Before (wrangler CLI)
wrangler d1 execute my-db --command "SELECT * FROM users WHERE email = 'user@example.com'"
# Requires wrangler.toml, project context

# After (Skill tool - works from anywhere)
bun d1.ts query my-account-id db-uuid "SELECT * FROM users WHERE email = ?" '["user@example.com"]'
# Parameterized, SELECT-only enforced
```

### Example 3: Monitor Free Tier Usage
```bash
# Before (No capability)
# Manual dashboard check, reactive only

# After (Skill tool - proactive monitoring)
bun monitoring.ts usage my-account-id | jq '.pagesBuilds, .d1Reads, .workerRequests'
# {used: 234, limit: 500, percent: 46.8, exceeded: false}
# Can be scripted for alerts
```

## Validation Results

### Integration Testing
All 18 tools successfully tested against live Cloudflare API:

| Category | Tools | Status |
|----------|-------|--------|
| Zone & DNS | 3 | ✅ All passing |
| Pages & Workers | 6 | ✅ All passing |
| Storage (D1, KV, R2) | 7 | ✅ All passing |
| Monitoring | 2 | ✅ All passing |

### Security Testing
- ✅ D1 SELECT-only enforcement blocks INSERT/UPDATE/DELETE/DROP/CREATE/ALTER/TRUNCATE
- ✅ D1 SELECT-only allows SELECT, WITH (CTEs), EXPLAIN
- ✅ Keychain authentication retrieves credentials correctly
- ✅ API token never logged or exposed in error messages
- ✅ DeploymentConfig.env_vars.value removed (type metadata only)
- ✅ All operations read-only (no mutation endpoints called)

### Performance Testing
- ✅ Average latency: 200-500ms (direct API, no cluster hop)
- ✅ Rate limit handling: 1200 requests per 5 minutes (generous)
- ✅ Concurrent requests: Supported (Promise.all for parallel queries)

## Next Steps

### Immediate (Post-ADR)
1. **Update SKILL.md** - Document all 18 tools with examples and use cases
2. **User validation** - Verify tools meet inspection/troubleshooting needs in real scenarios
3. **Monitoring setup** - Create alerts for free tier usage thresholds (e.g., >80%)

### Short-term (1-2 weeks)
4. **Remove MCP from config** - Delete Cloudflare MCP from `~/.claude/.mcp.json`
5. **Decommission k8s resources** - Remove mcp-cloudflare deployment, ingress, secrets
6. **Update documentation** - Remove MCP references, add skill tool examples

### Long-term (Future)
7. **Analytics enhancement** - Add more detailed analytics queries if needed
8. **Caching layer** - Consider caching API responses to reduce rate limit usage (if needed)
9. **Error recovery** - Add retry logic with exponential backoff for transient API errors

## References

- **Spec:** `~/PAI/.claude/Skills/Cloudflare/stories/CLOUDFLARE-001-replace-mcp-with-skill-tools.md`
- **Interfaces:** `~/PAI/.claude/Skills/Cloudflare/tools/interfaces.ts`
- **Client:** `~/PAI/.claude/Skills/Cloudflare/tools/cloudflare-client.ts`
- **D1 Tools:** `~/PAI/.claude/Skills/Cloudflare/tools/d1.ts`
- **Pages Tools:** `~/PAI/.claude/Skills/Cloudflare/tools/pages.ts`
- **Monitoring Tools:** `~/PAI/.claude/Skills/Cloudflare/tools/monitoring.ts`
- **Cloudflare API Docs:** https://developers.cloudflare.com/api/
- **Keychain Pattern Reference:** Joplin skill (`~/PAI/.claude/Skills/Joplin/tools/joplin-client.ts`)

## Lessons Learned

### 1. "We have the tool" ≠ "We need the tool"
The Cloudflare MCP provided 51+ capabilities, but **usage data showed zero adoption**. The real need was inspection, not deployment.

**Lesson:** Validate actual usage patterns before building infrastructure. Tools should solve proven problems, not hypothetical ones.

### 2. Don't Compete with Working Workflows
GitLab CI/CD handled 100+ successful Cloudflare deployments. Building duplicate deployment capability in MCP/skill would have:
- Created competing deployment paths (confusion)
- Bypassed audit trail and testing (risk)
- Required maintenance of two systems (overhead)

**Lesson:** Complement working workflows, don't replace them. Find gaps and fill those.

### 3. Read-only ≠ Useless
Some might argue "read-only tools are limited." But analysis showed:
- Can't check deployment status without dashboard
- Can't debug D1 data without wrangler context
- Can't monitor free tier usage proactively
- Can't inspect KV values during troubleshooting

**Lesson:** Read-only inspection tools fill critical gaps in troubleshooting and monitoring workflows.

### 4. Security Through Constraint
D1 SELECT-only enforcement and removal of mutation operations aren't limitations—they're features:
- Prevents accidental infrastructure damage
- Prevents accidental data corruption
- Forces proper change management through CI/CD
- Provides safe debugging capabilities

**Lesson:** Sometimes the best security feature is not being able to do something dangerous.

### 5. Infrastructure Overhead vs Value
MCP deployment required:
- k3s pod resources
- mTLS configuration
- Traefik ingress
- Infisical secret management
- Network hop latency

For **zero direct invocations**.

**Lesson:** Infrastructure overhead is only justified by proportional value. Zero usage = zero justification.

## Conclusion

The migration from Cloudflare MCP to skill-based inspection tools represents a **strategic realignment** from "what's possible" to "what's actually needed."

By focusing exclusively on read-only inspection and monitoring, we:
- ✅ Filled real gaps in troubleshooting workflow
- ✅ Eliminated infrastructure overhead (k3s deployment)
- ✅ Improved security (keychain auth, read-only enforcement)
- ✅ Maintained proven deployment workflow (CI/CD unchanged)
- ✅ Reduced tool count from 51 unused to 18 focused tools
- ✅ Enabled proactive monitoring (free tier usage alerts)

This ADR documents a successful migration that **solves actual problems** rather than providing hypothetical capabilities.

---

**Approved by:** Joey Barkley (PAI Owner)
**Implemented by:** Claude (PAI Engineer)
**Review Date:** 2026-01-03
**Next Review:** After 30 days of skill tool usage (Feb 2026)
