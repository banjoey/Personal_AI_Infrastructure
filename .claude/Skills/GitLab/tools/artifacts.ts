/**
 * GitLab Artifact Operations
 *
 * Tools for managing GitLab CI/CD job artifacts:
 * - List artifacts for a job
 * - Download specific artifacts
 */

import { gitlabApi, encodeProjectPath } from './gitlab-client.ts';
import type {
  Job,
  ArtifactDownloadResult,
} from './interfaces.ts';

/**
 * List artifacts for a specific job
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param jobId - Job ID
 * @returns Job details including artifact metadata
 */
export async function listArtifacts(
  projectPath: string | number,
  jobId: number
): Promise<Job> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  // Get job details which includes artifact information
  return await gitlabApi<Job>(`/projects/${encodedId}/jobs/${jobId}`);
}

/**
 * Download a specific artifact from a job
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param jobId - Job ID
 * @param artifactPath - Optional specific artifact path within the archive
 * @returns Download result with file path and metadata
 */
export async function downloadArtifact(
  projectPath: string | number,
  jobId: number,
  artifactPath?: string
): Promise<ArtifactDownloadResult> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  const token = process.env.GITLAB_TOKEN;
  if (!token) {
    throw new Error('GITLAB_TOKEN environment variable not set');
  }

  // Build URL for artifact download
  let url = `https://gitlab.com/api/v4/projects/${encodedId}/jobs/${jobId}/artifacts`;

  // If specific artifact path is provided, append it
  if (artifactPath) {
    url += `/${encodeURIComponent(artifactPath)}`;
  }

  const response = await fetch(url, {
    headers: {
      'PRIVATE-TOKEN': token,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download artifact: ${response.status} ${response.statusText}`
    );
  }

  // Get the artifact content as ArrayBuffer
  const arrayBuffer = await response.arrayBuffer();
  const size = arrayBuffer.byteLength;

  // Determine output filename
  const outputFilename = artifactPath
    ? artifactPath.split('/').pop() || 'artifact'
    : `job-${jobId}-artifacts.zip`;

  // Write to file system
  const outputPath = `/tmp/${outputFilename}`;
  await Bun.write(outputPath, arrayBuffer);

  return {
    success: true,
    output_path: outputPath,
    size,
    message: `Downloaded ${size} bytes to ${outputPath}`,
  };
}
