/**
 * GitLab API TypeScript Interfaces
 *
 * Comprehensive type definitions for all 34 GitLab skill tools covering:
 * - Phase 1: Core operations (MCP parity + MR approval workflow)
 * - Phase 2: Pipeline operations (CI/CD + artifacts)
 * - Phase 3: Advanced operations (schedules + variables)
 *
 * Based on GitLab REST API v4: https://docs.gitlab.com/ee/api/
 */

// ============================================================================
// AUTHENTICATION & CLIENT TYPES
// ============================================================================

/**
 * Environment variable for GitLab authentication
 */
export const GITLAB_TOKEN_ENV = 'GITLAB_TOKEN';

/**
 * GitLab API base URL
 */
export const GITLAB_API_URL = 'https://gitlab.com/api/v4';

/**
 * Custom error class for GitLab API errors
 */
export class GitLabError extends Error {
  constructor(
    public statusCode: number,
    public statusText: string,
    public responseBody?: string
  ) {
    super(`GitLab API Error (${statusCode}): ${statusText}${responseBody ? ` - ${responseBody}` : ''}`);
    this.name = 'GitLabError';
  }
}

/**
 * Options for GitLab API calls
 */
export interface GitLabApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}

// ============================================================================
// SHARED TYPES (Pagination, Common Fields, etc.)
// ============================================================================

/**
 * Pagination parameters for list operations
 */
export interface PaginationParams {
  /** Page number (default: 1) */
  page?: number;
  /** Items per page (default: 20, max: 100) */
  per_page?: number;
}

/**
 * Pagination metadata returned by GitLab API
 */
export interface PaginationMeta {
  total: number;
  total_pages: number;
  per_page: number;
  page: number;
  next_page: number | null;
  previous_page: number | null;
}

/**
 * Common user reference object
 */
export interface UserReference {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
  web_url: string;
}

/**
 * Visibility levels for projects
 */
export type ProjectVisibility = 'private' | 'internal' | 'public';

/**
 * Merge request states
 */
export type MergeRequestState = 'opened' | 'closed' | 'merged' | 'locked';

/**
 * Issue states
 */
export type IssueState = 'opened' | 'closed';

/**
 * Pipeline status values
 */
export type PipelineStatus =
  | 'created'
  | 'waiting_for_resource'
  | 'preparing'
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'skipped'
  | 'manual';

/**
 * Job status values
 */
export type JobStatus = PipelineStatus;

/**
 * Schedule status (active/inactive)
 */
export type ScheduleStatus = 'active' | 'inactive';

// ============================================================================
// PHASE 1: CORE OPERATIONS (Repositories, Files, Branches, Issues, MRs)
// ============================================================================

// --- REPOSITORIES ---

/**
 * Project/Repository object
 */
export interface Project {
  id: number;
  name: string;
  path: string;
  path_with_namespace: string;
  description: string | null;
  visibility: ProjectVisibility;
  default_branch: string;
  web_url: string;
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  readme_url: string | null;
  star_count: number;
  forks_count: number;
  created_at: string;
  last_activity_at: string;
  namespace: {
    id: number;
    name: string;
    path: string;
    kind: string;
    full_path: string;
  };
  owner?: UserReference;
  archived: boolean;
  empty_repo: boolean;
}

/**
 * Parameters for searching repositories
 */
export interface SearchRepositoriesParams extends PaginationParams {
  /** Search query string */
  search?: string;
  /** Filter by visibility */
  visibility?: ProjectVisibility;
  /** Order by field (default: created_at) */
  order_by?: 'id' | 'name' | 'path' | 'created_at' | 'updated_at' | 'last_activity_at';
  /** Sort direction */
  sort?: 'asc' | 'desc';
  /** Show only owned projects */
  owned?: boolean;
  /** Show starred projects */
  starred?: boolean;
  /** Show archived projects */
  archived?: boolean;
}

/**
 * Parameters for creating a repository
 */
export interface CreateRepositoryParams {
  /** Project name (required) */
  name: string;
  /** URL-friendly path */
  path?: string;
  /** Namespace ID (user or group) */
  namespace_id?: number;
  /** Project description */
  description?: string;
  /** Visibility level */
  visibility?: ProjectVisibility;
  /** Initialize with README */
  initialize_with_readme?: boolean;
  /** Default branch name */
  default_branch?: string;
}

/**
 * Parameters for forking a repository
 */
export interface ForkRepositoryParams {
  /** Source project ID or path */
  project_id: string | number;
  /** Target namespace ID (optional) */
  namespace_id?: number;
  /** Custom name for fork */
  name?: string;
  /** Custom path for fork */
  path?: string;
}

// --- FILES ---

/**
 * File object returned by GitLab API
 */
export interface RepositoryFile {
  file_name: string;
  file_path: string;
  size: number;
  encoding: 'base64' | 'text';
  content: string;
  content_sha256: string;
  ref: string;
  blob_id: string;
  commit_id: string;
  last_commit_id: string;
}

/**
 * Parameters for getting file contents
 */
export interface GetFileParams {
  /** Project ID or path */
  project_id: string | number;
  /** File path in repository */
  file_path: string;
  /** Branch, tag, or commit SHA (default: default_branch) */
  ref?: string;
}

/**
 * Parameters for creating or updating a file
 */
export interface CreateOrUpdateFileParams {
  /** Project ID or path */
  project_id: string | number;
  /** File path in repository */
  file_path: string;
  /** Branch to commit to */
  branch: string;
  /** File content */
  content: string;
  /** Commit message */
  commit_message: string;
  /** Author email (optional) */
  author_email?: string;
  /** Author name (optional) */
  author_name?: string;
  /** Encoding (default: text) */
  encoding?: 'text' | 'base64';
}

/**
 * File change for batch push
 */
export interface FileChange {
  /** Action to perform */
  action: 'create' | 'update' | 'delete';
  /** File path */
  file_path: string;
  /** File content (required for create/update) */
  content?: string;
  /** Encoding (default: text) */
  encoding?: 'text' | 'base64';
  /** Previous path (for move/rename) */
  previous_path?: string;
}

/**
 * Parameters for batch file push
 */
export interface PushFilesParams {
  /** Project ID or path */
  project_id: string | number;
  /** Branch to commit to */
  branch: string;
  /** Commit message */
  commit_message: string;
  /** Array of file changes */
  actions: FileChange[];
  /** Author email (optional) */
  author_email?: string;
  /** Author name (optional) */
  author_name?: string;
}

/**
 * Commit response from file operations
 */
export interface CommitResponse {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committer_email: string;
  committed_date: string;
  web_url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

// --- BRANCHES ---

/**
 * Branch object
 */
export interface Branch {
  name: string;
  merged: boolean;
  protected: boolean;
  default: boolean;
  developers_can_push: boolean;
  developers_can_merge: boolean;
  can_push: boolean;
  web_url: string;
  commit: {
    id: string;
    short_id: string;
    title: string;
    author_name: string;
    author_email: string;
    authored_date: string;
    committer_name: string;
    committer_email: string;
    committed_date: string;
    message: string;
    web_url: string;
  };
}

/**
 * Parameters for creating a branch
 */
export interface CreateBranchParams {
  /** Project ID or path */
  project_id: string | number;
  /** Branch name */
  branch: string;
  /** Source branch, tag, or commit SHA */
  ref: string;
}

// --- ISSUES ---

/**
 * Issue object
 */
export interface Issue {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  state: IssueState;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  closed_by: UserReference | null;
  labels: string[];
  milestone: {
    id: number;
    iid: number;
    title: string;
    description: string;
    state: string;
    web_url: string;
  } | null;
  author: UserReference;
  assignees: UserReference[];
  assignee: UserReference | null;
  user_notes_count: number;
  merge_requests_count: number;
  upvotes: number;
  downvotes: number;
  due_date: string | null;
  confidential: boolean;
  web_url: string;
  time_stats: {
    time_estimate: number;
    total_time_spent: number;
    human_time_estimate: string | null;
    human_total_time_spent: string | null;
  };
}

/**
 * Parameters for listing issues
 */
export interface ListIssuesParams extends PaginationParams {
  /** Project ID or path */
  project_id: string | number;
  /** Filter by state */
  state?: IssueState | 'all';
  /** Filter by labels */
  labels?: string[];
  /** Filter by milestone */
  milestone?: string;
  /** Filter by assignee ID */
  assignee_id?: number;
  /** Filter by author ID */
  author_id?: number;
  /** Order by field */
  order_by?: 'created_at' | 'updated_at';
  /** Sort direction */
  sort?: 'asc' | 'desc';
}

/**
 * Parameters for creating an issue
 */
export interface CreateIssueParams {
  /** Project ID or path */
  project_id: string | number;
  /** Issue title */
  title: string;
  /** Issue description */
  description?: string;
  /** Assignee user IDs */
  assignee_ids?: number[];
  /** Milestone ID */
  milestone_id?: number;
  /** Labels */
  labels?: string[];
  /** Due date (YYYY-MM-DD) */
  due_date?: string;
  /** Confidential flag */
  confidential?: boolean;
}

/**
 * Note/Comment object
 */
export interface Note {
  id: number;
  body: string;
  attachment: string | null;
  author: UserReference;
  created_at: string;
  updated_at: string;
  system: boolean;
  noteable_id: number;
  noteable_type: string;
  resolvable: boolean;
  confidential: boolean;
}

/**
 * Parameters for creating an issue note
 */
export interface CreateIssueNoteParams {
  /** Project ID or path */
  project_id: string | number;
  /** Issue IID */
  issue_iid: number;
  /** Comment body */
  body: string;
}

// --- MERGE REQUESTS ---

/**
 * Merge Request object
 */
export interface MergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  state: MergeRequestState;
  created_at: string;
  updated_at: string;
  merged_by: UserReference | null;
  merged_at: string | null;
  closed_by: UserReference | null;
  closed_at: string | null;
  target_branch: string;
  source_branch: string;
  upvotes: number;
  downvotes: number;
  author: UserReference;
  assignees: UserReference[];
  assignee: UserReference | null;
  reviewers: UserReference[];
  source_project_id: number;
  target_project_id: number;
  labels: string[];
  draft: boolean;
  work_in_progress: boolean;
  milestone: {
    id: number;
    iid: number;
    title: string;
  } | null;
  merge_when_pipeline_succeeds: boolean;
  merge_status: 'can_be_merged' | 'cannot_be_merged' | 'checking';
  sha: string;
  merge_commit_sha: string | null;
  squash_commit_sha: string | null;
  user_notes_count: number;
  changes_count: string;
  should_remove_source_branch: boolean;
  force_remove_source_branch: boolean;
  web_url: string;
  has_conflicts: boolean;
  blocking_discussions_resolved: boolean;
  approvals_before_merge: number | null;
}

/**
 * Parameters for listing merge requests
 */
export interface ListMergeRequestsParams extends PaginationParams {
  /** Project ID or path */
  project_id: string | number;
  /** Filter by state */
  state?: MergeRequestState | 'all';
  /** Order by field */
  order_by?: 'created_at' | 'updated_at';
  /** Sort direction */
  sort?: 'asc' | 'desc';
  /** Filter by milestone */
  milestone?: string;
  /** Filter by labels */
  labels?: string[];
  /** Filter by author ID */
  author_id?: number;
  /** Filter by assignee ID */
  assignee_id?: number;
  /** Filter by reviewer ID */
  reviewer_id?: number;
}

/**
 * Parameters for creating a merge request
 */
export interface CreateMergeRequestParams {
  /** Project ID or path */
  project_id: string | number;
  /** Source branch */
  source_branch: string;
  /** Target branch */
  target_branch: string;
  /** MR title */
  title: string;
  /** MR description */
  description?: string;
  /** Assignee user IDs */
  assignee_ids?: number[];
  /** Reviewer user IDs */
  reviewer_ids?: number[];
  /** Milestone ID */
  milestone_id?: number;
  /** Labels */
  labels?: string[];
  /** Remove source branch after merge */
  remove_source_branch?: boolean;
  /** Squash commits on merge */
  squash?: boolean;
}

/**
 * Merge request approval response
 */
export interface MergeRequestApproval {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  state: MergeRequestState;
  approved: boolean;
  approved_by: UserReference[];
  approvals_required: number;
  approvals_left: number;
}

/**
 * Parameters for approving a merge request
 */
export interface ApproveMergeRequestParams {
  /** Project ID or path */
  project_id: string | number;
  /** Merge request IID */
  merge_request_iid: number;
  /** Optional approval SHA */
  sha?: string;
}

/**
 * Approval result
 */
export interface ApprovalResult {
  approved: boolean;
  approved_by: UserReference[];
  message: string;
}

/**
 * Parameters for merging a merge request
 */
export interface MergeMergeRequestParams {
  /** Project ID or path */
  project_id: string | number;
  /** Merge request IID */
  merge_request_iid: number;
  /** Merge commit message */
  merge_commit_message?: string;
  /** Squash commit message */
  squash_commit_message?: string;
  /** Squash commits */
  squash?: boolean;
  /** Remove source branch after merge */
  should_remove_source_branch?: boolean;
  /** Merge when pipeline succeeds */
  merge_when_pipeline_succeeds?: boolean;
  /** SHA must match to merge */
  sha?: string;
}

/**
 * Merge result
 */
export interface MergeResult {
  merged: boolean;
  merge_commit_sha: string | null;
  message: string;
}

// ============================================================================
// PHASE 2: PIPELINE OPERATIONS (Pipelines, Jobs, Artifacts)
// ============================================================================

// --- PIPELINES ---

/**
 * Pipeline object
 */
export interface Pipeline {
  id: number;
  iid: number;
  project_id: number;
  status: PipelineStatus;
  source: string;
  ref: string;
  sha: string;
  web_url: string;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
  duration: number | null;
  queued_duration: number | null;
  coverage: string | null;
  user: UserReference;
}

/**
 * Detailed pipeline with stages and jobs
 */
export interface DetailedPipeline extends Pipeline {
  before_sha: string;
  tag: boolean;
  yaml_errors: string | null;
  detailed_status: {
    icon: string;
    text: string;
    label: string;
    group: string;
    tooltip: string;
    has_details: boolean;
    details_path: string;
    illustration: unknown | null;
    favicon: string;
  };
}

/**
 * Parameters for listing pipelines
 */
export interface ListPipelinesParams extends PaginationParams {
  /** Project ID or path */
  project_id: string | number;
  /** Filter by status */
  status?: PipelineStatus;
  /** Filter by ref (branch/tag) */
  ref?: string;
  /** Filter by SHA */
  sha?: string;
  /** Filter by source */
  source?: string;
  /** Order by field */
  order_by?: 'id' | 'status' | 'ref' | 'updated_at' | 'user_id';
  /** Sort direction */
  sort?: 'asc' | 'desc';
  /** Filter by username */
  username?: string;
  /** Updated after (ISO 8601) */
  updated_after?: string;
  /** Updated before (ISO 8601) */
  updated_before?: string;
}

/**
 * Parameters for triggering a pipeline
 */
export interface TriggerPipelineParams {
  /** Project ID or path */
  project_id: string | number;
  /** Branch or tag to run pipeline on */
  ref: string;
  /** Pipeline variables */
  variables?: Record<string, string>;
}

/**
 * Parameters for retrying a pipeline
 */
export interface RetryPipelineParams {
  /** Project ID or path */
  project_id: string | number;
  /** Pipeline ID */
  pipeline_id: number;
}

/**
 * Parameters for canceling a pipeline
 */
export interface CancelPipelineParams {
  /** Project ID or path */
  project_id: string | number;
  /** Pipeline ID */
  pipeline_id: number;
}

// --- JOBS ---

/**
 * Job object
 */
export interface Job {
  id: number;
  status: JobStatus;
  stage: string;
  name: string;
  ref: string;
  tag: boolean;
  coverage: string | null;
  allow_failure: boolean;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  duration: number | null;
  queued_duration: number | null;
  user: UserReference;
  commit: {
    id: string;
    short_id: string;
    title: string;
    author_name: string;
    author_email: string;
    created_at: string;
    message: string;
  };
  pipeline: {
    id: number;
    project_id: number;
    ref: string;
    sha: string;
    status: PipelineStatus;
  };
  web_url: string;
  artifacts: {
    file_type: string;
    size: number;
    filename: string;
    file_format: string | null;
  }[];
  runner: {
    id: number;
    description: string;
    active: boolean;
    is_shared: boolean;
  } | null;
  artifacts_expire_at: string | null;
}

/**
 * Parameters for listing jobs
 */
export interface ListJobsParams extends PaginationParams {
  /** Project ID or path */
  project_id: string | number;
  /** Pipeline ID */
  pipeline_id: number;
}

/**
 * Parameters for getting job log
 */
export interface GetJobLogParams {
  /** Project ID or path */
  project_id: string | number;
  /** Job ID */
  job_id: number;
}

// --- ARTIFACTS ---

/**
 * Artifact file metadata
 */
export interface ArtifactFile {
  filename: string;
  size: number;
}

/**
 * Parameters for listing artifacts
 */
export interface ListArtifactsParams {
  /** Project ID or path */
  project_id: string | number;
  /** Job ID */
  job_id: number;
}

/**
 * Parameters for downloading artifacts
 */
export interface DownloadArtifactParams {
  /** Project ID or path */
  project_id: string | number;
  /** Job ID */
  job_id: number;
  /** Specific artifact path (optional, downloads all if omitted) */
  artifact_path?: string;
  /** Output file path */
  output_path: string;
}

/**
 * Artifact download result
 */
export interface ArtifactDownloadResult {
  success: boolean;
  output_path: string;
  size: number;
  message: string;
}

// ============================================================================
// PHASE 3: ADVANCED OPERATIONS (Schedules, Variables)
// ============================================================================

// --- SCHEDULES ---

/**
 * Pipeline schedule object
 */
export interface PipelineSchedule {
  id: number;
  description: string;
  ref: string;
  cron: string;
  cron_timezone: string;
  next_run_at: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  owner: UserReference;
  last_pipeline: Pipeline | null;
  variables: PipelineScheduleVariable[];
}

/**
 * Schedule variable
 */
export interface PipelineScheduleVariable {
  key: string;
  value: string;
  variable_type: 'env_var' | 'file';
}

/**
 * Parameters for listing schedules
 */
export interface ListSchedulesParams extends PaginationParams {
  /** Project ID or path */
  project_id: string | number;
}

/**
 * Parameters for creating a schedule
 */
export interface CreateScheduleParams {
  /** Project ID or path */
  project_id: string | number;
  /** Schedule description */
  description: string;
  /** Branch or tag to run on */
  ref: string;
  /** Cron expression (e.g., "0 2 * * *") */
  cron: string;
  /** Cron timezone (default: UTC) */
  cron_timezone?: string;
  /** Active flag (default: true) */
  active?: boolean;
}

/**
 * Parameters for updating a schedule
 */
export interface UpdateScheduleParams {
  /** Project ID or path */
  project_id: string | number;
  /** Schedule ID */
  schedule_id: number;
  /** Schedule description */
  description?: string;
  /** Branch or tag to run on */
  ref?: string;
  /** Cron expression */
  cron?: string;
  /** Cron timezone */
  cron_timezone?: string;
  /** Active flag */
  active?: boolean;
}

/**
 * Parameters for deleting a schedule
 */
export interface DeleteScheduleParams {
  /** Project ID or path */
  project_id: string | number;
  /** Schedule ID */
  schedule_id: number;
}

// --- CI/CD VARIABLES ---

/**
 * CI/CD variable object
 */
export interface CiVariable {
  key: string;
  value: string;
  variable_type: 'env_var' | 'file';
  protected: boolean;
  masked: boolean;
  raw: boolean;
  environment_scope: string;
}

/**
 * Parameters for listing CI/CD variables
 */
export interface ListVariablesParams {
  /** Project ID or path */
  project_id: string | number;
}

/**
 * Parameters for creating a CI/CD variable
 */
export interface CreateVariableParams {
  /** Project ID or path */
  project_id: string | number;
  /** Variable key */
  key: string;
  /** Variable value */
  value: string;
  /** Variable type (default: env_var) */
  variable_type?: 'env_var' | 'file';
  /** Protected flag (default: false) */
  protected?: boolean;
  /** Masked flag (default: false, auto-detected for sensitive keys) */
  masked?: boolean;
  /** Raw flag - don't expand variable references (default: false) */
  raw?: boolean;
  /** Environment scope (default: *) */
  environment_scope?: string;
}

/**
 * Parameters for updating a CI/CD variable
 */
export interface UpdateVariableParams {
  /** Project ID or path */
  project_id: string | number;
  /** Variable key */
  key: string;
  /** Variable value */
  value?: string;
  /** Variable type */
  variable_type?: 'env_var' | 'file';
  /** Protected flag */
  protected?: boolean;
  /** Masked flag */
  masked?: boolean;
  /** Raw flag */
  raw?: boolean;
  /** Environment scope */
  environment_scope?: string;
}

/**
 * Parameters for deleting a CI/CD variable
 */
export interface DeleteVariableParams {
  /** Project ID or path */
  project_id: string | number;
  /** Variable key */
  key: string;
  /** Environment scope filter */
  filter?: {
    environment_scope?: string;
  };
}

// ============================================================================
// UTILITY TYPES & HELPERS
// ============================================================================

/**
 * Sensitive variable key patterns for auto-masking detection
 */
export const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /token/i,
  /secret/i,
  /password/i,
  /credential/i,
  /private[_-]?key/i,
  /auth/i,
] as const;

/**
 * Check if a variable key contains sensitive patterns
 */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Result wrapper for operations
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Generic list response
 */
export interface ListResponse<T> {
  items: T[];
  pagination?: PaginationMeta;
}

/**
 * URL encode GitLab project paths
 */
export function encodeProjectPath(path: string): string {
  return encodeURIComponent(path);
}

/**
 * Validate cron expression format (basic validation)
 */
export function isValidCron(cron: string): boolean {
  const parts = cron.trim().split(/\s+/);
  return parts.length === 5;
}
