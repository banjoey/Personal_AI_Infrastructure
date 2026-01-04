/**
 * Cloudflare API Client
 *
 * Provides authentication via macOS Keychain and common API request functionality.
 * All operations are read-only - deployments happen via CI/CD.
 */

import { execSync } from 'child_process';
import type {
  CloudflareCredentials,
  CloudflareResponse,
  CloudflareApiError,
  RateLimitInfo,
} from './interfaces.ts';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Cloudflare API base URL */
const CF_API_URL = 'https://api.cloudflare.com/client/v4';

/** Keychain service name */
const KEYCHAIN_SERVICE = 'cloudflare-api';

/** Keychain account name for API token */
const KEYCHAIN_ACCOUNT_TOKEN = 'cloudflare-token';

/** Keychain account name for account ID */
const KEYCHAIN_ACCOUNT_ID = 'cloudflare-account-id';

// =============================================================================
// CUSTOM ERROR CLASSES
// =============================================================================

/**
 * Custom error class for Cloudflare API errors
 */
export class CloudflareError extends Error {
  constructor(
    public errors: CloudflareApiError[],
    public statusCode?: number
  ) {
    const errorMessages = errors
      .map((e) => `[${e.code}] ${e.message}`)
      .join(', ');
    super(`Cloudflare API Error: ${errorMessages}`);
    this.name = 'CloudflareError';
  }
}

/**
 * Custom error class for keychain retrieval errors
 */
export class KeychainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeychainError';
  }
}

// =============================================================================
// KEYCHAIN AUTHENTICATION
// =============================================================================

/**
 * Retrieve Cloudflare credentials from macOS Keychain
 *
 * @returns Cloudflare API token and account ID
 * @throws KeychainError if credentials cannot be retrieved
 *
 * @example
 * const { token, accountId } = getCredentials();
 */
export function getCredentials(): CloudflareCredentials {
  try {
    const token = execSync(
      `security find-generic-password -a "${KEYCHAIN_ACCOUNT_TOKEN}" -s "${KEYCHAIN_SERVICE}" -w`,
      { encoding: 'utf-8' }
    ).trim();

    const accountId = execSync(
      `security find-generic-password -a "${KEYCHAIN_ACCOUNT_ID}" -s "${KEYCHAIN_SERVICE}" -w`,
      { encoding: 'utf-8' }
    ).trim();

    if (!token || !accountId) {
      throw new Error('Empty credentials retrieved from keychain');
    }

    return { token, accountId };
  } catch (error) {
    const setupInstructions = `
Cloudflare credentials not found in keychain. Run these commands to set up:

  # Store API token
  security add-generic-password \\
    -s "${KEYCHAIN_SERVICE}" \\
    -a "${KEYCHAIN_ACCOUNT_TOKEN}" \\
    -w "your-token-here"

  # Store account ID
  security add-generic-password \\
    -s "${KEYCHAIN_SERVICE}" \\
    -a "${KEYCHAIN_ACCOUNT_ID}" \\
    -w "your-account-id-here"

  # Verify
  security find-generic-password -s "${KEYCHAIN_SERVICE}" -a "${KEYCHAIN_ACCOUNT_TOKEN}" -w
  security find-generic-password -s "${KEYCHAIN_SERVICE}" -a "${KEYCHAIN_ACCOUNT_ID}" -w
    `.trim();

    throw new KeychainError(setupInstructions);
  }
}

// =============================================================================
// API CLIENT
// =============================================================================

/**
 * Make a request to the Cloudflare API
 *
 * @param endpoint - API endpoint (e.g., '/zones', '/accounts/:id/pages/projects')
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns The result data from the Cloudflare response
 * @throws CloudflareError on API errors
 * @throws KeychainError if credentials cannot be retrieved
 *
 * @example
 * const zones = await cloudflareApi<Zone[]>('/zones');
 * const project = await cloudflareApi<PagesProject>(
 *   `/accounts/${accountId}/pages/projects/my-project`
 * );
 */
export async function cloudflareApi<T>(
  endpoint: string,
  options?: {
    params?: Record<string, string | number | boolean>;
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
): Promise<T> {
  const { token } = getCredentials();

  // Build URL with query parameters
  const url = new URL(`${CF_API_URL}${endpoint}`);
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  // Make request
  const response = await fetch(url.toString(), {
    method: options?.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  // Parse response
  const data: CloudflareResponse<T> = await response.json();

  // Check for errors
  if (!data.success) {
    throw new CloudflareError(data.errors || [], response.status);
  }

  return data.result;
}

/**
 * Extract rate limit information from response headers
 *
 * @param headers - Fetch response headers
 * @returns Rate limit information or null if not present
 *
 * @example
 * const response = await fetch(url, options);
 * const rateLimit = getRateLimitInfo(response.headers);
 * if (rateLimit && rateLimit.remaining < 10) {
 *   console.warn('Low rate limit remaining:', rateLimit.remaining);
 * }
 */
export function getRateLimitInfo(
  headers: Headers
): RateLimitInfo | null {
  const limit = headers.get('x-ratelimit-limit');
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');

  if (!limit || !remaining || !reset) {
    return null;
  }

  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    reset: parseInt(reset, 10),
  };
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate D1 query is SELECT only (read-only enforcement)
 *
 * @param sql - SQL query to validate
 * @throws Error if query contains non-SELECT operations
 *
 * @example
 * validateReadOnlyQuery('SELECT * FROM users'); // OK
 * validateReadOnlyQuery('DELETE FROM users'); // Throws error
 */
export function validateReadOnlyQuery(sql: string): void {
  const normalized = sql.trim().toUpperCase();

  // Allow SELECT, WITH (CTEs), and EXPLAIN
  const readOnlyPatterns = /^(SELECT|WITH|EXPLAIN)/;

  if (!readOnlyPatterns.test(normalized)) {
    throw new Error(
      'Only SELECT queries allowed. Use wrangler CLI for mutations (INSERT/UPDATE/DELETE/CREATE/DROP).'
    );
  }

  // Block dangerous keywords even in comments
  const dangerousPatterns = /(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\s/i;
  if (dangerousPatterns.test(sql)) {
    throw new Error(
      'Query contains mutation keywords. Only SELECT queries allowed.'
    );
  }
}
