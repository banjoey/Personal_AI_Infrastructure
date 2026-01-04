# Spec: Cloudflare Inspection & Troubleshooting Tools

**Story:** CLOUDFLARE-001
**Author:** Charles (PAI)
**Date:** 2026-01-03
**Status:** Draft - Revised for Inspection-Only Scope

---

## Problem Statement

The Cloudflare MCP server has 51+ tools deployed on k3s but **ZERO direct invocations** recorded. ALL Cloudflare deployments happen via `wrangler` CLI in GitLab CI/CD pipelines, and this workflow is working perfectly. The MCP creates infrastructure overhead without providing value.

**Key Finding:** We don't need deployment tools - we need inspection and troubleshooting capabilities that aren't easily accessible from the command line.

---

## Goals

1. **Provide inspection/troubleshooting tools** - Read-only operations for debugging and monitoring
2. **Monitor usage vs free tier limits** - Proactive awareness of resource consumption
3. **Enable status checking** - Verify deployment health and configuration
4. **Reduce infrastructure overhead** - Remove k3s deployment of unused MCP
5. **Use keychain authentication** - Secure credential storage following Joplin pattern

---

## Non-Goals

| Item | Rationale |
|------|-----------|
| Deployment operations | Handled perfectly by CI/CD pipelines |
| Creating/modifying resources | All mutations via wrangler in GitLab |
| Replacing wrangler CLI | CLI is the correct deployment path |
| All 51 MCP tools | Focus on inspection tools that fill gaps |
| Environment variable auth | Use macOS Keychain for security |

---

## Why Inspection Only?

**Current Deployment Flow (Working Perfectly):**
```
Git Push → GitLab CI/CD → wrangler deploy → Cloudflare
```

This workflow:
- ✅ Has audit trail in GitLab
- ✅ Runs in consistent CI environment
- ✅ Has rollback via git revert
- ✅ Integrates with existing pipelines
- ✅ ZERO recorded issues

**What's Missing:**
- ❌ Can't easily check deployment status from CLI
- ❌ Can't inspect D1 data for debugging
- ❌ Can't verify KV values during troubleshooting
- ❌ Can't monitor usage vs free tier limits
- ❌ Can't quickly check zone/DNS configuration

**Solution:** Read-only inspection tools that complement (not replace) the CI/CD workflow.

---

## Background

### Current State
- Cloudflare MCP deployed at `mcp-cloudflare.op.barkleyfarm.com` on k3s
- 51+ tools available across 11 categories
- **ZERO** direct MCP tool invocations in session history
- All deployments via `wrangler` CLI in GitLab CI/CD pipelines
- MCP authentication via environment variables (insecure)

### Usage Analysis (Dec 2025 - Jan 2026)
| Operation | Count | Interface |
|-----------|-------|-----------|
| Pages Deploy | 100+ | wrangler CLI (CI/CD) ✅ |
| D1 Create/Query | 20+ | wrangler CLI ✅ |
| KV Operations | 10+ | wrangler CLI ✅ |
| DNS Changes | 5+ | Manual dashboard |
| Workers Deploy | 15+ | wrangler CLI (CI/CD) ✅ |
| MCP Tools | **0** | Not used ❌ |
| Status Checking | Manual | Dashboard (slow) |
| Usage Monitoring | Manual | Dashboard (reactive) |

### Target State
- Cloudflare MCP removed from k3s cluster
- TypeScript tools for inspection and monitoring
- Keychain-based authentication (secure, local)
- Read-only operations only
- Deployments continue via CI/CD (unchanged)

---

## Acceptance Criteria

- [ ] Inspection tools implemented (15-18 read-only tools)
- [ ] Keychain authentication working (no env vars)
- [ ] All tools return JSON output
- [ ] D1 queries restricted to SELECT only
- [ ] No mutation capabilities (no create/update/delete)
- [ ] Usage monitoring tools for free tier limits
- [ ] Deployment status checking tools
- [ ] Each tool handles errors with clear messages
- [ ] SKILL.md updated with tool documentation
- [ ] Integration tests verify read-only operations
- [ ] MCP server can be decommissioned from k3s

---

## Functions to Implement

### Phase 1: Zone & DNS Inspection (Read-Only)

| # | Function | Purpose | Priority |
|---|----------|---------|----------|
| 1 | `list_zones` | List account zones | High |
| 2 | `get_zone_settings` | Get zone configuration | Medium |
| 3 | `list_dns_records` | List DNS records | High |

**Note:** DNS mutations (create/update/delete) are non-goals - use dashboard or Infrastructure as Code.

---

### Phase 2: Pages & Workers Inspection (Read-Only)

| # | Function | Purpose | Priority |
|---|----------|---------|----------|
| 4 | `list_pages_projects` | List Pages projects | High |
| 5 | `get_pages_project` | Get project details | High |
| 6 | `list_pages_deployments` | List deployments | High |
| 7 | `get_deployment_status` | Check specific deployment | High |
| 8 | `list_workers` | List Workers | Medium |
| 9 | `get_worker` | Get Worker details | Medium |

**Note:** Deployment creation happens in CI/CD. These tools are for verification.

---

### Phase 3: Storage Inspection (Read-Only)

| # | Function | Purpose | Priority |
|---|----------|---------|----------|
| 10 | `list_d1_databases` | List D1 databases | High |
| 11 | `get_d1_schema` | Get database schema | Medium |
| 12 | `query_d1_database` | Execute SELECT queries only | High |
| 13 | `list_kv_namespaces` | List KV namespaces | Medium |
| 14 | `get_kv_value` | Read KV value for debugging | Medium |
| 15 | `list_r2_buckets` | List R2 buckets | Low |
| 16 | `get_r2_bucket_usage` | Check storage usage | Medium |

**Note:** D1 queries restricted to SELECT. Use wrangler for mutations.

---

### Phase 4: Monitoring & Analytics

| # | Function | Purpose | Priority |
|---|----------|---------|----------|
| 17 | `check_usage` | Usage vs free tier limits | High |
| 18 | `get_analytics` | Traffic/performance data | Medium |

---

## Explicitly REMOVED (Mutations - Handled by CI/CD)

The following operations will NOT be implemented:

### Deployment Operations
- ❌ `create_pages_project` - Use wrangler in CI/CD
- ❌ `create_pages_deployment` - Use wrangler in CI/CD
- ❌ `add_pages_domain` - Use dashboard or IaC

### DNS Mutations
- ❌ `create_dns_record` - Use dashboard or IaC
- ❌ `update_dns_record` - Use dashboard or IaC
- ❌ `delete_dns_record` - Use dashboard or IaC

### Storage Mutations
- ❌ `create_d1_database` - Use wrangler in CI/CD
- ❌ `create_kv_namespace` - Use wrangler in CI/CD
- ❌ `put_kv_value` - Use wrangler in CI/CD
- ❌ `create_r2_bucket` - Use wrangler in CI/CD

### Workflow Operations
- ❌ `create_fullstack_app` - Use CI/CD templates
- ❌ `rollback_deployment` - Use git revert + CI/CD
- ❌ `setup_custom_domain` - Use dashboard or IaC
- ❌ `purge_cache` - Rare operation, use dashboard

**Rationale:** Deployments via CI/CD provide:
- Audit trail in GitLab
- Consistent build environment
- Automated testing before deploy
- Git-based rollback
- Integration with existing pipelines

Implementing these in skill tools would bypass these benefits for no gain.

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid keychain credentials | Clear error: "Cloudflare credentials not found in keychain. Run: security add-generic-password -s cloudflare-api -a claude-code-token -w <token>" |
| Zone not found | Return error with zone name, list available zones |
| Rate limit hit | Retry with exponential backoff, then error |
| D1 non-SELECT query | Block with error: "Only SELECT queries allowed. Use wrangler for mutations." |
| KV key not found | Return null with clear message |
| Deployment still in progress | Return status with percentage, don't block |
| Missing account ID | Error: "Account ID not found in keychain" |
| API token expired | Clear error with refresh instructions |

---

## Constraints

| Type | Constraint |
|------|------------|
| Technical | Must use Bun runtime (PAI standard) |
| Technical | Token from macOS Keychain (never env vars) |
| Technical | Account ID from macOS Keychain |
| Technical | REST API at https://api.cloudflare.com/client/v4 |
| Technical | HTTPS only, no plaintext transmission |
| Security | Never log or expose API token |
| Security | No mutation operations (read-only) |
| Security | D1 queries: SELECT only, parameterized |
| Operational | Rate limit: 1200 requests per 5 minutes |
| Operational | Deployments stay in CI/CD (don't change) |

---

## Security Considerations

### Authentication (CRITICAL CHANGE)

**OLD (MCP):** Environment variables
**NEW (Skill Tools):** macOS Keychain

**Why Keychain:**
- Encrypted at rest by macOS
- Not exposed in process list or env dumps
- Consistent with Joplin pattern
- Can be backed up with Time Machine
- Supports multiple credentials (token + account ID)

### Setup Instructions

```bash
# Store API token
security add-generic-password \
  -s cloudflare-api \
  -a claude-code-token \
  -w "your-token-here"

# Store account ID
security add-generic-password \
  -s cloudflare-api \
  -a claude-code-account \
  -w "your-account-id-here"

# Verify
security find-generic-password -s cloudflare-api -a claude-code-token -w
security find-generic-password -s cloudflare-api -a claude-code-account -w
```

### Other Security Considerations

| Category | Consideration |
|----------|---------------|
| API Access | HTTPS only to api.cloudflare.com |
| Input Validation | Sanitize zone names, database names |
| Output Filtering | Don't expose token in error messages |
| D1 Queries | SELECT only, parameterized (no string interpolation) |
| Read-Only | No write operations prevent accidental damage |

### Data Sensitivity
- [x] Confidential - DNS configuration, database schemas

### Threat Categories
- [x] Injection - SQL injection in D1 queries (mitigated by SELECT-only + parameterization)
- [x] Data exposure - DNS records may reveal infrastructure (acceptable for troubleshooting)
- [x] Credential theft - Keychain protection prevents plaintext exposure

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| Cloudflare API | External | Available |
| Bun runtime | Internal | Available |
| macOS Keychain | System | Available |

**Removed Dependencies:**
- ❌ CF_API_TOKEN env var - Using keychain instead
- ❌ CF_ACCOUNT_ID env var - Using keychain instead
- ❌ wrangler CLI - Not needed for read-only operations

---

## Open Questions

1. **Analytics scope** - Which analytics endpoints are most useful for troubleshooting?
   - *Recommendation:* Start with basic traffic metrics, expand if needed

2. **Caching** - Should we cache API responses to reduce rate limit usage?
   - *Recommendation:* Non-goal for v1, API rate limits are generous

3. **Zone selection** - Multiple zones - how to select which one?
   - *Recommendation:* Pass zone ID/name as parameter

---

## Technical Design Notes

### File Structure
```
~/PAI/.claude/Skills/Cloudflare/
├── SKILL.md                    # Updated skill documentation
├── METHODOLOGY.md              # Existing methodology (keep)
├── knowledge/                  # Existing knowledge (keep)
│   └── api-reference.md
├── stories/
│   └── CLOUDFLARE-001-*.md     # This spec
├── tools/
│   ├── cloudflare-client.ts    # Shared API client with keychain auth
│   ├── zones.ts                # list, get_settings (read-only)
│   ├── dns.ts                  # list (read-only)
│   ├── pages.ts                # list, get, deployments, status (read-only)
│   ├── workers.ts              # list, get (read-only)
│   ├── d1.ts                   # list, schema, query (SELECT only)
│   ├── kv.ts                   # list, get (read-only)
│   ├── r2.ts                   # list, usage (read-only)
│   └── monitoring.ts           # check_usage, analytics
└── tests/
    └── cloudflare-tools.test.ts
```

### Shared Client Pattern (with Keychain Auth)

```typescript
// cloudflare-client.ts - keychain auth (like Joplin)
import { $ } from 'bun';

const CF_API_URL = 'https://api.cloudflare.com/client/v4';
const KEYCHAIN_SERVICE = 'cloudflare-api';
const KEYCHAIN_ACCOUNT_TOKEN = 'claude-code-token';
const KEYCHAIN_ACCOUNT_ID = 'claude-code-account';

/**
 * Retrieve Cloudflare credentials from macOS Keychain
 * @throws Error if credentials cannot be retrieved
 */
export async function getCredentials(): Promise<{ token: string; accountId: string }> {
  try {
    const tokenResult = await $`security find-generic-password -s ${KEYCHAIN_SERVICE} -a ${KEYCHAIN_ACCOUNT_TOKEN} -w`.text();
    const accountResult = await $`security find-generic-password -s ${KEYCHAIN_SERVICE} -a ${KEYCHAIN_ACCOUNT_ID} -w`.text();

    const token = tokenResult.trim();
    const accountId = accountResult.trim();

    if (!token || !accountId) {
      throw new Error('Empty credentials retrieved from keychain');
    }

    return { token, accountId };
  } catch (error) {
    throw new Error(
      `Failed to retrieve Cloudflare credentials from keychain. Setup instructions:\n` +
      `  security add-generic-password -s "${KEYCHAIN_SERVICE}" -a "${KEYCHAIN_ACCOUNT_TOKEN}" -w "<your-token>"\n` +
      `  security add-generic-password -s "${KEYCHAIN_SERVICE}" -a "${KEYCHAIN_ACCOUNT_ID}" -w "<your-account-id>"`
    );
  }
}

/**
 * Custom error class for Cloudflare API errors
 */
export class CloudflareError extends Error {
  constructor(
    public errors: Array<{ code: number; message: string }>,
    public statusCode?: number
  ) {
    const errorMessages = errors.map(e => `[${e.code}] ${e.message}`).join(', ');
    super(`Cloudflare API Error: ${errorMessages}`);
    this.name = 'CloudflareError';
  }
}

/**
 * Make a request to the Cloudflare API
 * @param endpoint - API endpoint (e.g., '/zones', '/accounts/:id/pages/projects')
 * @param options - Request options
 * @returns Parsed JSON response
 * @throws CloudflareError on API errors
 */
export async function cloudflareApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const { token } = await getCredentials();

  const response = await fetch(`${CF_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!data.success) {
    throw new CloudflareError(data.errors || [], response.status);
  }

  return data.result as T;
}

/**
 * Validate D1 query is SELECT only (read-only enforcement)
 * @throws Error if query contains non-SELECT operations
 */
export function validateReadOnlyQuery(sql: string): void {
  const normalized = sql.trim().toUpperCase();

  // Allow SELECT, WITH (CTEs), and EXPLAIN
  const readOnlyPatterns = /^(SELECT|WITH|EXPLAIN)/;

  if (!readOnlyPatterns.test(normalized)) {
    throw new Error(
      'Only SELECT queries allowed. Use wrangler CLI for mutations (INSERT/UPDATE/DELETE/CREATE/DROP).'
    );
  }

  // Block dangerous keywords even in comments
  const dangerousPatterns = /(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\s/i;
  if (dangerousPatterns.test(sql)) {
    throw new Error(
      'Query contains mutation keywords. Only SELECT queries allowed.'
    );
  }
}

/**
 * Output result as JSON to stdout
 */
export function outputJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Output error as JSON to stdout and exit
 */
export function outputError(error: unknown, exitCode = 1): never {
  const message = error instanceof Error ? error.message : String(error);
  console.log(JSON.stringify({ error: message }));
  process.exit(exitCode);
}
```

### Example Tool: D1 Query (with SELECT-only enforcement)

```typescript
// d1.ts - query_d1_database
import { cloudflareApi, validateReadOnlyQuery, getCredentials, outputJson, outputError } from './cloudflare-client.ts';

interface D1QueryResult {
  results: Array<Record<string, unknown>>;
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

/**
 * Execute read-only SQL query on D1 database
 * @param databaseId - D1 database ID
 * @param sql - SQL query (SELECT only)
 * @returns Query results
 */
export async function queryD1Database(
  databaseId: string,
  sql: string
): Promise<D1QueryResult> {
  // Enforce read-only
  validateReadOnlyQuery(sql);

  const { accountId } = await getCredentials();

  return await cloudflareApi<D1QueryResult>(
    `/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      body: JSON.stringify({ sql }),
    }
  );
}

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    outputError('Usage: bun query-d1.ts <database-id> <sql-query>');
  }

  const [databaseId, sql] = args;

  try {
    const result = await queryD1Database(databaseId, sql);
    outputJson(result);
  } catch (error) {
    outputError(error);
  }
}
```

### Example Tool: Check Usage (Monitoring)

```typescript
// monitoring.ts - check_usage
import { cloudflareApi, getCredentials, outputJson } from './cloudflare-client.ts';

interface UsageMetrics {
  pagesBuilds: { used: number; limit: number; percent: number };
  pagesRequests: { used: number; limit: number; percent: number };
  d1Reads: { used: number; limit: number; percent: number };
  d1Writes: { used: number; limit: number; percent: number };
  kvReads: { used: number; limit: number; percent: number };
  kvWrites: { used: number; limit: number; percent: number };
  r2Storage: { used: number; limit: number; percent: number };
  workerRequests: { used: number; limit: number; percent: number };
}

/**
 * Check current usage vs free tier limits
 * @returns Usage metrics with percentage of free tier consumed
 */
export async function checkUsage(): Promise<UsageMetrics> {
  const { accountId } = await getCredentials();

  // Fetch usage data from Cloudflare Analytics API
  const analytics = await cloudflareApi<any>(
    `/accounts/${accountId}/analytics/usage`
  );

  // Free tier limits (as of 2026)
  const FREE_TIER_LIMITS = {
    pagesBuilds: 500,
    pagesRequests: 100000,
    d1Reads: 5000000,
    d1Writes: 100000,
    kvReads: 100000,
    kvWrites: 1000,
    r2Storage: 10737418240, // 10GB
    workerRequests: 100000,
  };

  // Calculate percentages
  return {
    pagesBuilds: {
      used: analytics.pages?.builds || 0,
      limit: FREE_TIER_LIMITS.pagesBuilds,
      percent: Math.round((analytics.pages?.builds || 0) / FREE_TIER_LIMITS.pagesBuilds * 100),
    },
    // ... similar for other metrics
  } as UsageMetrics;
}
```

---

## Infrastructure Decommission

After skill tools are validated:

1. Remove from k3s cluster:
   - Delete `mcp-cloudflare` deployment
   - Remove Traefik ingress
   - Remove Infisical certificate binding

2. Update PAI configuration:
   - Remove from `~/.claude/.mcp.json`
   - Update Cloudflare skill documentation
   - Create ADR documenting migration to inspection-only tools

3. Document keychain setup:
   - Add credential setup to skill README
   - Update METHODOLOGY.md with new workflow

---

## Appendix

### Cloudflare REST API Reference
- Base URL: `https://api.cloudflare.com/client/v4`
- Auth: `Authorization: Bearer <token>` header
- Response format: `{ success, errors, messages, result }`
- Rate limit: 1200 requests per 5 minutes
- Docs: https://developers.cloudflare.com/api/

### Keychain Integration Reference
See Joplin skill for proven keychain pattern:
- `~/PAI/.claude/Skills/Joplin/tools/joplin-client.ts`
- Lines 10-45 demonstrate keychain retrieval
- Error handling for missing credentials

### Token Permissions Required (Read-Only)
- Zone:Zone:Read
- Zone:Zone Settings:Read
- Zone:DNS Records:Read
- Cloudflare Pages:Read
- Workers Scripts:Read
- D1:Read
- Workers KV Storage:Read
- Workers R2 Storage:Read
- Account Analytics:Read

**Note:** No write permissions needed - all mutations via CI/CD.

### Estimated Effort (Revised for Inspection-Only)

- Phase 1 (Zone & DNS Inspection): 1-2 hours (3 tools)
- Phase 2 (Pages & Workers Inspection): 2-3 hours (6 tools)
- Phase 3 (Storage Inspection): 2-3 hours (7 tools)
- Phase 4 (Monitoring): 1-2 hours (2 tools)
- Total: 6-10 hours (vs 9-13 hours for mutation tools)

**Reduction rationale:** Read-only tools are simpler (no validation, no error rollback, no state management).

### Comparison: MCP vs Skill Tools vs CI/CD

| Aspect | MCP Server | Skill Tools (This Spec) | CI/CD (Current) |
|--------|------------|------------------------|-----------------|
| **Infrastructure** | k3s deployment, mTLS | None | GitLab runners |
| **Tools** | 51+ (unused) | 18 (read-only) | wrangler CLI |
| **Auth** | Infisical PKI | macOS Keychain | GitLab secrets |
| **Latency** | Network hop to cluster | Direct API | N/A |
| **Deployments** | Could do (unused) | Cannot do (by design) | Does all ✅ |
| **Inspection** | Could do (unused) | Does all ✅ | Cannot do |
| **Troubleshooting** | Limited | Excellent | N/A |
| **Monitoring** | None | Yes (usage tracking) | N/A |

**Key Insight:** CI/CD handles deployments perfectly. Skill tools fill the inspection gap.
