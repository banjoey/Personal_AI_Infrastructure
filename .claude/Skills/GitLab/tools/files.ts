/**
 * GitLab File Operations
 *
 * Tools for managing files in GitLab repositories:
 * - Get file contents from repository
 * - Create or update single file
 * - Push multiple files in a single commit
 */

import { gitlabApi, encodeProjectPath } from './gitlab-client.ts';
import type {
  RepositoryFile,
  GetFileParams,
  CreateOrUpdateFileParams,
  PushFilesParams,
  CommitResponse,
} from './interfaces.ts';

/**
 * Get file contents from a GitLab repository
 *
 * @param params - File retrieval parameters (project, file path, ref)
 * @returns File metadata and contents
 */
export async function getFileContents(
  params: GetFileParams
): Promise<RepositoryFile> {
  const encodedProjectId = typeof params.project_id === 'string'
    ? encodeProjectPath(params.project_id)
    : params.project_id;

  const encodedFilePath = encodeURIComponent(params.file_path);

  const queryParams: Record<string, string> = {};
  if (params.ref) queryParams.ref = params.ref;

  return await gitlabApi<RepositoryFile>(
    `/projects/${encodedProjectId}/repository/files/${encodedFilePath}`,
    { params: queryParams }
  );
}

/**
 * Create or update a single file in a GitLab repository
 *
 * @param params - File creation/update parameters (project, file path, content, commit message)
 * @returns Commit details
 */
export async function createOrUpdateFile(
  params: CreateOrUpdateFileParams
): Promise<CommitResponse> {
  const encodedProjectId = typeof params.project_id === 'string'
    ? encodeProjectPath(params.project_id)
    : params.project_id;

  const encodedFilePath = encodeURIComponent(params.file_path);

  // Check if file exists to determine create vs update
  let fileExists = false;
  try {
    await getFileContents({
      project_id: params.project_id,
      file_path: params.file_path,
      ref: params.branch,
    });
    fileExists = true;
  } catch (error) {
    // File doesn't exist, will create
    fileExists = false;
  }

  const body: Record<string, unknown> = {
    branch: params.branch,
    content: params.content,
    commit_message: params.commit_message,
  };

  if (params.author_email) body.author_email = params.author_email;
  if (params.author_name) body.author_name = params.author_name;
  if (params.encoding) body.encoding = params.encoding;

  const method = fileExists ? 'PUT' : 'POST';

  return await gitlabApi<CommitResponse>(
    `/projects/${encodedProjectId}/repository/files/${encodedFilePath}`,
    { method, body }
  );
}

/**
 * Push multiple files in a single commit (batch operation)
 *
 * @param params - Batch push parameters (project, branch, commit message, file changes)
 * @returns Commit details
 */
export async function pushFiles(
  params: PushFilesParams
): Promise<CommitResponse> {
  const encodedProjectId = typeof params.project_id === 'string'
    ? encodeProjectPath(params.project_id)
    : params.project_id;

  const body: Record<string, unknown> = {
    branch: params.branch,
    commit_message: params.commit_message,
    actions: params.actions,
  };

  if (params.author_email) body.author_email = params.author_email;
  if (params.author_name) body.author_name = params.author_name;

  return await gitlabApi<CommitResponse>(
    `/projects/${encodedProjectId}/repository/commits`,
    { method: 'POST', body }
  );
}
