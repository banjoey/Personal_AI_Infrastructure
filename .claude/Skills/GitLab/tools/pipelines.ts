/**
 * GitLab Pipeline Operations
 *
 * Tools for managing GitLab CI/CD pipelines:
 * - List pipelines with filtering
 * - Get pipeline details
 * - Trigger new pipelines
 * - Retry failed pipelines
 * - Cancel running pipelines
 */

import { gitlabApi, encodeProjectPath } from './gitlab-client.ts';
import type {
  Pipeline,
  DetailedPipeline,
  ListPipelinesParams,
  TriggerPipelineParams,
  RetryPipelineParams,
  CancelPipelineParams,
} from './interfaces.ts';

/**
 * List pipelines for a project with optional filtering
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param options - Filter and pagination options (status, ref, page, per_page, etc.)
 * @returns Array of pipelines
 */
export async function listPipelines(
  projectPath: string | number,
  options?: Omit<ListPipelinesParams, 'project_id'>
): Promise<Pipeline[]> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  const queryParams: Record<string, string | number | boolean> = {};

  if (options?.status) queryParams.status = options.status;
  if (options?.ref) queryParams.ref = options.ref;
  if (options?.sha) queryParams.sha = options.sha;
  if (options?.source) queryParams.source = options.source;
  if (options?.order_by) queryParams.order_by = options.order_by;
  if (options?.sort) queryParams.sort = options.sort;
  if (options?.username) queryParams.username = options.username;
  if (options?.updated_after) queryParams.updated_after = options.updated_after;
  if (options?.updated_before) queryParams.updated_before = options.updated_before;
  if (options?.page) queryParams.page = options.page;
  if (options?.per_page) queryParams.per_page = options.per_page;

  return await gitlabApi<Pipeline[]>(`/projects/${encodedId}/pipelines`, {
    params: queryParams,
  });
}

/**
 * Get detailed information about a specific pipeline
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param pipelineId - Pipeline ID
 * @returns Detailed pipeline information
 */
export async function getPipeline(
  projectPath: string | number,
  pipelineId: number
): Promise<DetailedPipeline> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  return await gitlabApi<DetailedPipeline>(
    `/projects/${encodedId}/pipelines/${pipelineId}`
  );
}

/**
 * Trigger a new pipeline on a specific ref (branch/tag)
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param ref - Branch or tag name to run pipeline on
 * @param variables - Optional CI/CD variables (key-value pairs)
 * @returns Created pipeline details
 */
export async function triggerPipeline(
  projectPath: string | number,
  ref: string,
  variables?: Record<string, string>
): Promise<Pipeline> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  const body: Record<string, unknown> = {
    ref,
  };

  // Convert variables object to GitLab's expected format
  if (variables && Object.keys(variables).length > 0) {
    body.variables = Object.entries(variables).map(([key, value]) => ({
      key,
      value,
    }));
  }

  return await gitlabApi<Pipeline>(`/projects/${encodedId}/pipeline`, {
    method: 'POST',
    body,
  });
}

/**
 * Retry a failed pipeline
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param pipelineId - Pipeline ID to retry
 * @returns Retried pipeline details
 */
export async function retryPipeline(
  projectPath: string | number,
  pipelineId: number
): Promise<Pipeline> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  return await gitlabApi<Pipeline>(
    `/projects/${encodedId}/pipelines/${pipelineId}/retry`,
    {
      method: 'POST',
    }
  );
}

/**
 * Cancel a running pipeline
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param pipelineId - Pipeline ID to cancel
 * @returns Canceled pipeline details
 */
export async function cancelPipeline(
  projectPath: string | number,
  pipelineId: number
): Promise<Pipeline> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  return await gitlabApi<Pipeline>(
    `/projects/${encodedId}/pipelines/${pipelineId}/cancel`,
    {
      method: 'POST',
    }
  );
}
