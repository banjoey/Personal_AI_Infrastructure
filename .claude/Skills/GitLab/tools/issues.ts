/**
 * GitLab Issue Operations
 *
 * Tools for managing issues in GitLab projects:
 * - List issues with filtering
 * - Get specific issue details
 * - Create new issues
 * - Add comments to issues
 */

import { gitlabApi, encodeProjectPath } from './gitlab-client.ts';
import type {
  Issue,
  ListIssuesParams,
  CreateIssueParams,
  CreateIssueNoteParams,
  Note,
} from './interfaces.ts';

/**
 * List issues in a GitLab project
 *
 * @param params - Issue list parameters (project, state, labels, assignee, pagination)
 * @returns Array of matching issues
 */
export async function listIssues(
  params: ListIssuesParams
): Promise<Issue[]> {
  const encodedProjectId = typeof params.project_id === 'string'
    ? encodeProjectPath(params.project_id)
    : params.project_id;

  const queryParams: Record<string, string | number | boolean> = {};

  if (params.state) queryParams.state = params.state;
  if (params.labels && params.labels.length > 0) {
    queryParams.labels = params.labels.join(',');
  }
  if (params.milestone) queryParams.milestone = params.milestone;
  if (params.assignee_id) queryParams.assignee_id = params.assignee_id;
  if (params.author_id) queryParams.author_id = params.author_id;
  if (params.order_by) queryParams.order_by = params.order_by;
  if (params.sort) queryParams.sort = params.sort;
  if (params.page) queryParams.page = params.page;
  if (params.per_page) queryParams.per_page = params.per_page;

  return await gitlabApi<Issue[]>(
    `/projects/${encodedProjectId}/issues`,
    { params: queryParams }
  );
}

/**
 * Get details for a specific issue
 *
 * @param projectId - Project ID or path
 * @param issueIid - Issue IID (internal ID)
 * @returns Issue details
 */
export async function getIssue(
  projectId: string | number,
  issueIid: number
): Promise<Issue> {
  const encodedProjectId = typeof projectId === 'string'
    ? encodeProjectPath(projectId)
    : projectId;

  return await gitlabApi<Issue>(
    `/projects/${encodedProjectId}/issues/${issueIid}`
  );
}

/**
 * Create a new issue in a GitLab project
 *
 * @param params - Issue creation parameters (project, title, description, assignees, etc.)
 * @returns Created issue details
 */
export async function createIssue(
  params: CreateIssueParams
): Promise<Issue> {
  const encodedProjectId = typeof params.project_id === 'string'
    ? encodeProjectPath(params.project_id)
    : params.project_id;

  const body: Record<string, unknown> = {
    title: params.title,
  };

  if (params.description) body.description = params.description;
  if (params.assignee_ids && params.assignee_ids.length > 0) {
    body.assignee_ids = params.assignee_ids;
  }
  if (params.milestone_id) body.milestone_id = params.milestone_id;
  if (params.labels && params.labels.length > 0) {
    body.labels = params.labels.join(',');
  }
  if (params.due_date) body.due_date = params.due_date;
  if (params.confidential !== undefined) {
    body.confidential = params.confidential;
  }

  return await gitlabApi<Issue>(
    `/projects/${encodedProjectId}/issues`,
    { method: 'POST', body }
  );
}

/**
 * Add a comment/note to an existing issue
 *
 * @param params - Comment creation parameters (project, issue IID, comment body)
 * @returns Created note/comment details
 */
export async function createIssueNote(
  params: CreateIssueNoteParams
): Promise<Note> {
  const encodedProjectId = typeof params.project_id === 'string'
    ? encodeProjectPath(params.project_id)
    : params.project_id;

  const body = {
    body: params.body,
  };

  return await gitlabApi<Note>(
    `/projects/${encodedProjectId}/issues/${params.issue_iid}/notes`,
    { method: 'POST', body }
  );
}
