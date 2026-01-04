# Spec: Replace GitLab MCP with Skill-Based Tools

**Story:** GITLAB-001
**Author:** Charles (PAI)
**Date:** 2026-01-03
**Status:** Draft

---

## Problem Statement

The GitLab MCP server is deployed on k3s with mTLS authentication overhead, yet it's minimally used (~28 invocations over 2 weeks). The majority of GitLab CI/CD work uses the `glab` CLI, not MCP tools. This creates unnecessary infrastructure complexity while the MCP lacks critical operations like pipeline management, schedules, and CI/CD variables.

---

## Goals

1. **Replace MCP with TypeScript tools** - Implement all 13 MCP operations as skill-based tools
2. **Add missing operations** - CI/CD variables, schedules, pipeline management (not in current MCP)
3. **Reduce infrastructure** - Remove k3s deployment, mTLS certificate management overhead
4. **Maintain CLI integration** - Keep `glab` CLI as primary interface for pipeline operations

---

## Non-Goals

| Item | Rationale |
|------|-----------|
| Full GitLab API coverage | Focus on operations actually used in workflows |
| Replace glab CLI entirely | CLI is superior for interactive pipeline work |
| Container registry tools | Handled by CI/CD pipelines, not skill tools |
| Self-hosted GitLab support | Joey uses gitlab.com exclusively |

---

## Background

### Current State
- GitLab MCP deployed at `mcp-gitlab.op.barkleyfarm.com` on k3s
- mTLS authentication via Infisical PKI (ADR-001)
- 13 tools available, only 4 used in practice
- `glab` CLI is the primary interface for CI/CD operations

### Usage Analysis (Dec 2025 - Jan 2026)
| Operation | Count | Interface |
|-----------|-------|-----------|
| `list_projects` | 7 | MCP |
| `get_pipeline` | 7 | MCP |
| `mr_list` | 7 | MCP |
| `create_issue` | 7 | MCP |
| Pipeline status | 50+ | glab CLI |
| Pipeline trigger | 20+ | glab CLI |
| Job logs | 30+ | glab CLI |

### Target State
- GitLab MCP removed from k3s cluster
- TypeScript tools in skill directory using `GITLAB_TOKEN` env var
- CLI wrappers for pipeline operations (delegating to glab)
- New operations for schedules and CI/CD variables

---

## Acceptance Criteria

- [ ] 17 Phase 1 tools implemented (MCP parity + MR approval workflow)
- [ ] 9 Phase 2 tools implemented (pipelines, jobs, artifacts)
- [ ] 8 Phase 3 tools implemented (schedules, variables with auto-masking)
- [ ] Each tool retrieves token from `GITLAB_TOKEN` env var
- [ ] Each tool handles errors gracefully with clear messages
- [ ] All tools return JSON output for easy parsing
- [ ] MR approval requires explicit user command (safety check)
- [ ] CI/CD variable creation auto-detects and warns for sensitive patterns
- [ ] Artifact download supports both full zip and single file extraction
- [ ] SKILL.md updated with new tool documentation
- [ ] Integration tests verify each operation works
- [ ] MCP server can be decommissioned from k3s

---

## Functions to Implement

### Phase 1: Core Replacement (MCP Parity)

| # | Function | Purpose | Priority |
|---|----------|---------|----------|
| 1 | `search_repositories` | Search GitLab projects | High |
| 2 | `get_project` | Get project details | High |
| 3 | `create_repository` | Create new project | Medium |
| 4 | `get_file_contents` | Read file from repo | High |
| 5 | `create_or_update_file` | Write file to repo | High |
| 6 | `push_files` | Batch file push | Medium |
| 7 | `create_branch` | Create new branch | Medium |
| 8 | `fork_repository` | Fork a project | Low |
| 9 | `create_issue` | Create issue | Medium |
| 10 | `list_issues` | List project issues | Medium |
| 11 | `get_issue` | Get issue details | Low |
| 12 | `create_issue_note` | Comment on issue | Low |
| 13 | `create_merge_request` | Create MR | Medium |
| 14 | `list_merge_requests` | List MRs (open/merged/all) | High |
| 15 | `get_merge_request` | Get MR details | Medium |
| 16 | `approve_merge_request` | Approve MR (requires Maintainer+) | High |
| 17 | `merge_merge_request` | Merge approved MR | High |

### Phase 2: Pipeline Operations (CLI Wrappers + API)

| # | Function | Purpose | Priority |
|---|----------|---------|----------|
| 18 | `get_pipeline_status` | Check pipeline status | High |
| 19 | `list_pipelines` | List recent pipelines | High |
| 20 | `trigger_pipeline` | Manually trigger pipeline | High |
| 21 | `get_job_log` | Get job output | High |
| 22 | `retry_pipeline` | Retry failed pipeline | Medium |
| 23 | `cancel_pipeline` | Cancel running pipeline | Medium |
| 24 | `list_jobs` | List jobs in a pipeline | Medium |
| 25 | `list_artifacts` | List artifacts for a job | High |
| 26 | `download_artifact` | Download job artifact (zip or single file) | High |

### Phase 3: Enhanced Operations (New Capabilities)

| # | Function | Purpose | Priority |
|---|----------|---------|----------|
| 27 | `list_schedules` | List pipeline schedules | High |
| 28 | `create_schedule` | Create scheduled pipeline | High |
| 29 | `update_schedule` | Update schedule settings | Medium |
| 30 | `delete_schedule` | Remove schedule | Medium |
| 31 | `list_variables` | List CI/CD variables | High |
| 32 | `create_variable` | Create CI/CD variable (auto-mask secrets) | High |
| 33 | `update_variable` | Update variable value | Medium |
| 34 | `delete_variable` | Remove variable | Medium |

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid GITLAB_TOKEN | Clear error: "Invalid or expired GitLab token" |
| Project not found | Return error with project path, suggest search |
| Rate limit hit | Retry with exponential backoff, then error |
| glab not installed | Clear error: "glab CLI required for pipeline ops" |
| Network timeout | Retry once, then error with timeout message |
| Empty search results | Return empty array, not error |
| File too large | Paginate or stream, max 10MB |
| Branch doesn't exist | Create if create_or_update_file, error otherwise |
| MR already approved | Return success with "already approved" status |
| MR has conflicts | Error with conflict details, suggest resolution |
| MR not approved | Error on merge attempt: "MR requires approval first" |
| Insufficient permissions | Clear error: "Token lacks Maintainer+ access for approval" |
| Artifact expired | Error with expiration date, suggest re-run pipeline |
| Artifact too large | Stream download, report progress for files >50MB |
| Sensitive variable pattern | Warn: "Detected potential secret, enabling masked flag" |

---

## Constraints

| Type | Constraint |
|------|------------|
| Technical | Must use Bun runtime (PAI standard) |
| Technical | Token from GITLAB_TOKEN env var |
| Technical | REST API at https://gitlab.com/api/v4 |
| Technical | glab CLI required for pipeline operations |
| Security | Never log or expose API token |
| Compatibility | JSON output matching MCP format where possible |

---

## Security Considerations

| Category | Consideration |
|----------|---------------|
| Credential Storage | Token in env var, never in code or logs |
| API Access | HTTPS only to gitlab.com |
| Input Validation | Sanitize project paths, branch names |
| Output Filtering | Don't expose token in error messages |
| CI/CD Variables | Support masked/protected variable options |

### Data Sensitivity
- [x] Confidential - PII or credentials (CI/CD variables may contain secrets)

### Threat Categories
- [x] Injection - Sanitize shell commands for glab CLI
- [x] Data exposure - CI/CD variables may contain secrets

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| GitLab API | External | Available |
| glab CLI | External | Installed |
| Bun runtime | Internal | Available |
| GITLAB_TOKEN | Environment | Configured |

---

## Decisions (Resolved)

1. **Variable masking** - Should we enforce masked variables for secrets?
   - **DECISION:** Yes, auto-detect and warn for sensitive patterns (API_KEY, TOKEN, SECRET, PASSWORD, etc.)

2. **Pipeline artifact download** - Should we add artifact retrieval?
   - **DECISION:** Yes, include in Phase 2 (added `list_artifacts`, `download_artifact`)

3. **Protected branch handling** - How to handle protected branch pushes?
   - **DECISION:** Support MR approval workflow - add `approve_merge_request` and `merge_merge_request` tools to allow Charles to approve and merge MRs on Joey's command

---

## Technical Design Notes

### File Structure

```text
~/PAI/.claude/Skills/GitLab/
├── SKILL.md                    # Updated skill documentation
├── METHODOLOGY.md              # Existing methodology (keep)
├── stories/
│   └── GITLAB-001-*.md         # This spec
├── tools/
│   ├── gitlab-client.ts        # Shared API client + sensitive pattern detection
│   ├── repositories.ts         # search, get, create, fork
│   ├── files.ts                # get, create/update, push
│   ├── branches.ts             # create
│   ├── issues.ts               # list, get, create, comment
│   ├── merge-requests.ts       # create, list, get, approve, merge
│   ├── pipelines.ts            # status, list, trigger, retry, cancel
│   ├── jobs.ts                 # list, log
│   ├── artifacts.ts            # list, download (zip or single file)
│   ├── schedules.ts            # list, create, update, delete
│   └── variables.ts            # list, create (auto-mask), update, delete
├── tests/
│   └── gitlab-tools.test.ts    # Integration tests
└── workflows/                  # Existing workflows (keep)
```

### Shared Client Pattern
```typescript
// gitlab-client.ts
const GITLAB_API_URL = 'https://gitlab.com/api/v4';

export function getToken(): string {
  const token = process.env.GITLAB_TOKEN;
  if (!token) throw new Error('GITLAB_TOKEN environment variable not set');
  return token;
}

export async function gitlabApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(`${GITLAB_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) throw new GitLabError(response.status, await response.text());
  return response.json();
}

// CLI wrapper for glab
export async function glabCommand(args: string[]): Promise<string> {
  const result = await $`glab ${args}`.text();
  return result.trim();
}
```

### Pipeline Operations (glab CLI)
```bash
# These use glab CLI under the hood
bun run pipelines.ts status                    # glab ci status
bun run pipelines.ts list                      # glab ci list
bun run pipelines.ts trigger --branch main     # glab ci trigger -b main
bun run jobs.ts log <job-id>                   # glab ci trace <job-id>
```

---

## Infrastructure Decommission

After skill tools are validated:

1. Remove from k3s cluster:
   - Delete `mcp-gitlab` deployment
   - Remove Traefik ingress
   - Remove Infisical certificate binding

2. Update PAI configuration:
   - Remove from `~/.claude/.mcp.json`
   - Update skill documentation
   - Create ADR documenting migration

---

## Appendix

### GitLab REST API Reference

- Base URL: `https://gitlab.com/api/v4`
- Auth: `PRIVATE-TOKEN` header
- Projects use URL-encoded paths (e.g., `foo%2Fbar`)
- Pagination via `page` and `per_page` params

**MR Approval Endpoints:**
- `POST /projects/:id/merge_requests/:iid/approve` - Approve MR
- `PUT /projects/:id/merge_requests/:iid/merge` - Merge MR
- Requires token with Maintainer+ access on the project

**Artifact Endpoints:**
- `GET /projects/:id/jobs/:job_id/artifacts` - Download artifact zip
- `GET /projects/:id/jobs/:job_id/artifacts/:artifact_path` - Download single file
- Artifacts expire based on project settings (default: 30 days)

### glab CLI Reference

- `glab ci status` - Current pipeline status
- `glab ci view` - Detailed pipeline view
- `glab ci list` - List recent pipelines
- `glab ci trigger` - Trigger pipeline
- `glab ci trace <job-id>` - Job logs
- `glab ci artifact <job-id>` - Download job artifacts
- `glab mr list` - List merge requests
- `glab mr approve <mr-id>` - Approve merge request
- `glab mr merge <mr-id>` - Merge merge request
- `glab auth status` - Verify authentication

### Estimated Effort

- Phase 1 (MCP Parity + MR Workflow): 3-5 hours (17 tools)
- Phase 2 (Pipelines + Artifacts): 3-4 hours (9 tools)
- Phase 3 (Schedules + Variables): 3-4 hours (8 tools)
- Total: 9-13 hours (34 tools)

### Sensitive Pattern Detection

```typescript
// gitlab-client.ts - auto-mask sensitive variables
const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /token/i,
  /secret/i,
  /password/i,
  /credential/i,
  /private[_-]?key/i,
  /auth/i,
];

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

export function warnIfSensitive(key: string): void {
  if (isSensitiveKey(key)) {
    console.warn(`[WARN] Detected potential secret in "${key}". Enabling masked flag.`);
  }
}
```

### MR Approval Workflow

```typescript
// merge-requests.ts - approval requires explicit user command
export async function approveMergeRequest(
  projectId: string,
  mrIid: number
): Promise<ApprovalResult> {
  // Safety: This should only be called when user explicitly commands approval
  const response = await gitlabApi<MergeRequestApproval>(
    `/projects/${encodeURIComponent(projectId)}/merge_requests/${mrIid}/approve`,
    { method: 'POST' }
  );
  return {
    approved: true,
    approvedBy: response.approved_by,
    message: `MR !${mrIid} approved successfully`
  };
}
```
