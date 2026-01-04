/**
 * GitLab Branch Operations
 *
 * Tools for managing branches in GitLab repositories:
 * - Create new branch from existing ref
 */

import { gitlabApi, encodeProjectPath } from './gitlab-client.ts';
import type {
  Branch,
  CreateBranchParams,
} from './interfaces.ts';

/**
 * Create a new branch in a GitLab repository
 *
 * @param params - Branch creation parameters (project, branch name, source ref)
 * @returns Created branch details
 */
export async function createBranch(
  params: CreateBranchParams
): Promise<Branch> {
  const encodedProjectId = typeof params.project_id === 'string'
    ? encodeProjectPath(params.project_id)
    : params.project_id;

  const body = {
    branch: params.branch,
    ref: params.ref,
  };

  return await gitlabApi<Branch>(
    `/projects/${encodedProjectId}/repository/branches`,
    { method: 'POST', body }
  );
}
