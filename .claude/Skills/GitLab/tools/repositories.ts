/**
 * GitLab Repository Operations
 *
 * Tools for managing GitLab projects/repositories:
 * - Search/list repositories
 * - Get repository details
 * - Create new repositories
 * - Fork existing repositories
 */

import { gitlabApi, encodeProjectPath } from './gitlab-client.ts';
import type {
  Project,
  SearchRepositoriesParams,
  CreateRepositoryParams,
  ForkRepositoryParams,
} from './interfaces.ts';

/**
 * Search or list GitLab repositories
 *
 * @param params - Search parameters (search query, visibility, ordering, pagination)
 * @returns Array of matching projects
 */
export async function searchRepositories(
  params?: SearchRepositoriesParams
): Promise<Project[]> {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params?.search) queryParams.search = params.search;
  if (params?.visibility) queryParams.visibility = params.visibility;
  if (params?.order_by) queryParams.order_by = params.order_by;
  if (params?.sort) queryParams.sort = params.sort;
  if (params?.owned !== undefined) queryParams.owned = params.owned;
  if (params?.starred !== undefined) queryParams.starred = params.starred;
  if (params?.archived !== undefined) queryParams.archived = params.archived;
  if (params?.page) queryParams.page = params.page;
  if (params?.per_page) queryParams.per_page = params.per_page;

  return await gitlabApi<Project[]>('/projects', { params: queryParams });
}

/**
 * Get details for a specific repository
 *
 * @param projectId - Project ID or path (e.g., "namespace/project")
 * @returns Project details
 */
export async function getRepository(
  projectId: string | number
): Promise<Project> {
  const encodedId = typeof projectId === 'string'
    ? encodeProjectPath(projectId)
    : projectId;

  return await gitlabApi<Project>(`/projects/${encodedId}`);
}

/**
 * Create a new GitLab repository
 *
 * @param params - Repository creation parameters (name, path, description, etc.)
 * @returns Created project details
 */
export async function createRepository(
  params: CreateRepositoryParams
): Promise<Project> {
  const body: Record<string, unknown> = {
    name: params.name,
  };

  if (params.path) body.path = params.path;
  if (params.namespace_id) body.namespace_id = params.namespace_id;
  if (params.description) body.description = params.description;
  if (params.visibility) body.visibility = params.visibility;
  if (params.initialize_with_readme !== undefined) {
    body.initialize_with_readme = params.initialize_with_readme;
  }
  if (params.default_branch) body.default_branch = params.default_branch;

  return await gitlabApi<Project>('/projects', {
    method: 'POST',
    body,
  });
}

/**
 * Fork an existing GitLab repository
 *
 * @param params - Fork parameters (source project, target namespace, name)
 * @returns Forked project details
 */
export async function forkRepository(
  params: ForkRepositoryParams
): Promise<Project> {
  const encodedId = typeof params.project_id === 'string'
    ? encodeProjectPath(params.project_id)
    : params.project_id;

  const body: Record<string, unknown> = {};

  if (params.namespace_id) body.namespace_id = params.namespace_id;
  if (params.name) body.name = params.name;
  if (params.path) body.path = params.path;

  return await gitlabApi<Project>(`/projects/${encodedId}/fork`, {
    method: 'POST',
    body,
  });
}
