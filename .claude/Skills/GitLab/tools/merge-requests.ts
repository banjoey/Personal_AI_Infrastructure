/**
 * GitLab Merge Request Operations
 *
 * Tools for managing merge requests in GitLab projects:
 * - Create merge requests
 * - List merge requests with filtering
 * - Get specific merge request details
 * - Approve merge requests (requires Maintainer+)
 * - Merge approved merge requests
 */

import { gitlabApi, encodeProjectPath } from './gitlab-client.ts';
import type {
  MergeRequest,
  ListMergeRequestsParams,
  CreateMergeRequestParams,
  ApproveMergeRequestParams,
  MergeMergeRequestParams,
  MergeRequestApproval,
  ApprovalResult,
  MergeResult,
} from './interfaces.ts';

/**
 * Create a new merge request
 *
 * @param params - MR creation parameters (project, source/target branches, title, description)
 * @returns Created merge request details
 */
export async function createMergeRequest(
  params: CreateMergeRequestParams
): Promise<MergeRequest> {
  const encodedProjectId = typeof params.project_id === 'string'
    ? encodeProjectPath(params.project_id)
    : params.project_id;

  const body: Record<string, unknown> = {
    source_branch: params.source_branch,
    target_branch: params.target_branch,
    title: params.title,
  };

  if (params.description) body.description = params.description;
  if (params.assignee_ids && params.assignee_ids.length > 0) {
    body.assignee_ids = params.assignee_ids;
  }
  if (params.reviewer_ids && params.reviewer_ids.length > 0) {
    body.reviewer_ids = params.reviewer_ids;
  }
  if (params.milestone_id) body.milestone_id = params.milestone_id;
  if (params.labels && params.labels.length > 0) {
    body.labels = params.labels.join(',');
  }
  if (params.remove_source_branch !== undefined) {
    body.remove_source_branch = params.remove_source_branch;
  }
  if (params.squash !== undefined) body.squash = params.squash;

  return await gitlabApi<MergeRequest>(
    `/projects/${encodedProjectId}/merge_requests`,
    { method: 'POST', body }
  );
}

/**
 * List merge requests in a GitLab project
 *
 * @param params - MR list parameters (project, state, labels, assignee, pagination)
 * @returns Array of matching merge requests
 */
export async function listMergeRequests(
  params: ListMergeRequestsParams
): Promise<MergeRequest[]> {
  const encodedProjectId = typeof params.project_id === 'string'
    ? encodeProjectPath(params.project_id)
    : params.project_id;

  const queryParams: Record<string, string | number | boolean> = {};

  if (params.state) queryParams.state = params.state;
  if (params.order_by) queryParams.order_by = params.order_by;
  if (params.sort) queryParams.sort = params.sort;
  if (params.milestone) queryParams.milestone = params.milestone;
  if (params.labels && params.labels.length > 0) {
    queryParams.labels = params.labels.join(',');
  }
  if (params.author_id) queryParams.author_id = params.author_id;
  if (params.assignee_id) queryParams.assignee_id = params.assignee_id;
  if (params.reviewer_id) queryParams.reviewer_id = params.reviewer_id;
  if (params.page) queryParams.page = params.page;
  if (params.per_page) queryParams.per_page = params.per_page;

  return await gitlabApi<MergeRequest[]>(
    `/projects/${encodedProjectId}/merge_requests`,
    { params: queryParams }
  );
}

/**
 * Get details for a specific merge request
 *
 * @param projectId - Project ID or path
 * @param mrIid - Merge request IID (internal ID)
 * @returns Merge request details
 */
export async function getMergeRequest(
  projectId: string | number,
  mrIid: number
): Promise<MergeRequest> {
  const encodedProjectId = typeof projectId === 'string'
    ? encodeProjectPath(projectId)
    : projectId;

  return await gitlabApi<MergeRequest>(
    `/projects/${encodedProjectId}/merge_requests/${mrIid}`
  );
}

/**
 * Approve a merge request
 *
 * IMPORTANT: This should only be called when user explicitly commands approval.
 * Requires token with Maintainer+ access on the project.
 *
 * @param params - Approval parameters (project, MR IID, optional SHA)
 * @returns Approval result with approved-by list
 */
export async function approveMergeRequest(
  params: ApproveMergeRequestParams
): Promise<ApprovalResult> {
  const encodedProjectId = typeof params.project_id === 'string'
    ? encodeProjectPath(params.project_id)
    : params.project_id;

  const body: Record<string, unknown> = {};
  if (params.sha) body.sha = params.sha;

  const response = await gitlabApi<MergeRequestApproval>(
    `/projects/${encodedProjectId}/merge_requests/${params.merge_request_iid}/approve`,
    { method: 'POST', body }
  );

  return {
    approved: response.approved,
    approved_by: response.approved_by,
    message: `MR !${params.merge_request_iid} approved successfully`,
  };
}

/**
 * Merge an approved merge request
 *
 * IMPORTANT: This should only be called when user explicitly commands merge.
 * The merge request must be approved and mergeable.
 *
 * @param params - Merge parameters (project, MR IID, commit messages, options)
 * @returns Merge result with commit SHA
 */
export async function mergeMergeRequest(
  params: MergeMergeRequestParams
): Promise<MergeResult> {
  const encodedProjectId = typeof params.project_id === 'string'
    ? encodeProjectPath(params.project_id)
    : params.project_id;

  const body: Record<string, unknown> = {};

  if (params.merge_commit_message) {
    body.merge_commit_message = params.merge_commit_message;
  }
  if (params.squash_commit_message) {
    body.squash_commit_message = params.squash_commit_message;
  }
  if (params.squash !== undefined) body.squash = params.squash;
  if (params.should_remove_source_branch !== undefined) {
    body.should_remove_source_branch = params.should_remove_source_branch;
  }
  if (params.merge_when_pipeline_succeeds !== undefined) {
    body.merge_when_pipeline_succeeds = params.merge_when_pipeline_succeeds;
  }
  if (params.sha) body.sha = params.sha;

  const response = await gitlabApi<MergeRequest>(
    `/projects/${encodedProjectId}/merge_requests/${params.merge_request_iid}/merge`,
    { method: 'PUT', body }
  );

  return {
    merged: response.state === 'merged',
    merge_commit_sha: response.merge_commit_sha,
    message: response.state === 'merged'
      ? `MR !${params.merge_request_iid} merged successfully`
      : `MR !${params.merge_request_iid} merge initiated (state: ${response.state})`,
  };
}
