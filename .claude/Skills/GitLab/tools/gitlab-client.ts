/**
 * GitLab API Client - Core authentication and HTTP utilities
 *
 * Provides shared functionality for all GitLab API operations:
 * - Token retrieval from environment
 * - Generic API request handler with error handling
 * - URL encoding for project paths
 * - Sensitive pattern detection for CI/CD variables
 */

import {
  GITLAB_API_URL,
  GITLAB_TOKEN_ENV,
  GitLabError,
  type GitLabApiOptions,
  SENSITIVE_PATTERNS,
} from './interfaces.ts';

/**
 * Retrieves GitLab API token from environment variable
 * @throws {Error} If GITLAB_TOKEN environment variable is not set
 * @returns GitLab API token
 */
export function getToken(): string {
  const token = process.env[GITLAB_TOKEN_ENV];
  if (!token) {
    throw new Error(`${GITLAB_TOKEN_ENV} environment variable not set`);
  }
  return token;
}

/**
 * Generic GitLab API request handler
 *
 * @param endpoint - API endpoint path (e.g., "/projects")
 * @param options - Request options (method, body, params, timeout)
 * @returns Parsed JSON response
 * @throws {GitLabError} If request fails or returns non-2xx status
 */
export async function gitlabApi<T>(
  endpoint: string,
  options?: GitLabApiOptions
): Promise<T> {
  const token = getToken();
  const url = new URL(`${GITLAB_API_URL}${endpoint}`);

  // Add query parameters
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  // Build request options
  const requestInit: RequestInit = {
    method: options?.method || 'GET',
    headers: {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json',
    },
    signal: options?.timeout
      ? AbortSignal.timeout(options.timeout)
      : undefined,
  };

  // Add body for POST/PUT requests
  if (options?.body && (options?.method === 'POST' || options?.method === 'PUT')) {
    requestInit.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url.toString(), requestInit);

    if (!response.ok) {
      const responseText = await response.text();
      throw new GitLabError(
        response.status,
        response.statusText,
        responseText
      );
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof GitLabError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Error(`GitLab API request failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * URL-encodes a GitLab project path for use in API endpoints
 *
 * @param path - Project path (e.g., "namespace/project")
 * @returns URL-encoded path (e.g., "namespace%2Fproject")
 */
export function encodeProjectPath(path: string): string {
  return encodeURIComponent(path);
}

/**
 * Checks if a variable key matches sensitive patterns
 * Used for auto-masking CI/CD variables that likely contain secrets
 *
 * @param key - Variable key to check
 * @returns True if key matches sensitive patterns
 */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Warns if a variable key appears to contain sensitive data
 * Used when creating CI/CD variables to suggest masking
 *
 * @param key - Variable key to check
 * @returns Warning message if sensitive, null otherwise
 */
export function checkSensitiveKey(key: string): string | null {
  if (isSensitiveKey(key)) {
    return `Detected potential secret in "${key}". Consider enabling masked flag.`;
  }
  return null;
}
