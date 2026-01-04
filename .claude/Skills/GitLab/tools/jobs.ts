/**
 * GitLab Job Operations
 *
 * Tools for managing GitLab CI/CD jobs:
 * - List jobs in a pipeline
 * - Get job trace/log output
 */

import { gitlabApi, encodeProjectPath } from './gitlab-client.ts';
import type {
  Job,
  ListJobsParams,
  GetJobLogParams,
} from './interfaces.ts';

/**
 * List all jobs in a specific pipeline
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param pipelineId - Pipeline ID
 * @param options - Pagination options
 * @returns Array of jobs
 */
export async function listJobs(
  projectPath: string | number,
  pipelineId: number,
  options?: Pick<ListJobsParams, 'page' | 'per_page'>
): Promise<Job[]> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  const queryParams: Record<string, string | number | boolean> = {};

  if (options?.page) queryParams.page = options.page;
  if (options?.per_page) queryParams.per_page = options.per_page;

  return await gitlabApi<Job[]>(
    `/projects/${encodedId}/pipelines/${pipelineId}/jobs`,
    {
      params: queryParams,
    }
  );
}

/**
 * Get the raw trace/log output for a specific job
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param jobId - Job ID
 * @returns Raw job trace as text
 */
export async function getJobLog(
  projectPath: string | number,
  jobId: number
): Promise<string> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  // The trace endpoint returns raw text, not JSON
  const token = process.env.GITLAB_TOKEN;
  if (!token) {
    throw new Error('GITLAB_TOKEN environment variable not set');
  }

  const url = `https://gitlab.com/api/v4/projects/${encodedId}/jobs/${jobId}/trace`;
  const response = await fetch(url, {
    headers: {
      'PRIVATE-TOKEN': token,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get job log: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}
