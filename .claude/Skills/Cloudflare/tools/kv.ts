/**
 * Cloudflare KV Namespace Inspection Tools
 *
 * Read-only operations for inspecting KV namespaces and reading key-value pairs.
 * All operations use macOS Keychain for authentication.
 */

import { cloudflareApi } from './cloudflare-client.ts';
import type { KVNamespace, KVKey, ListKVKeysParams } from './interfaces.ts';

// =============================================================================
// KV NAMESPACE LISTING
// =============================================================================

/**
 * List all KV namespaces in the Cloudflare account
 *
 * @param accountId - Cloudflare account ID
 * @returns Array of KV namespaces
 *
 * @example
 * // List all KV namespaces
 * const namespaces = await listKVNamespaces(accountId);
 *
 * @example
 * // Find a namespace by title
 * const namespaces = await listKVNamespaces(accountId);
 * const myKv = namespaces.find(ns => ns.title === 'my-kv-store');
 */
export async function listKVNamespaces(accountId: string): Promise<KVNamespace[]> {
  return await cloudflareApi<KVNamespace[]>(
    `/accounts/${accountId}/storage/kv/namespaces`
  );
}

// =============================================================================
// KV KEY LISTING
// =============================================================================

/**
 * List keys in a KV namespace with pagination and filtering
 *
 * @param accountId - Cloudflare account ID
 * @param namespaceId - KV namespace ID (get from listKVNamespaces)
 * @param options - Optional pagination and filtering parameters
 * @returns Array of keys with metadata and cursor for pagination
 *
 * @example
 * // List all keys in a namespace
 * const result = await listKVKeys(accountId, namespaceId);
 * console.log(result.keys);
 *
 * @example
 * // List keys with prefix filter
 * const result = await listKVKeys(accountId, namespaceId, {
 *   prefix: 'user:',
 *   limit: 100
 * });
 *
 * @example
 * // Paginate through all keys
 * let cursor: string | undefined;
 * do {
 *   const result = await listKVKeys(accountId, namespaceId, {
 *     cursor,
 *     limit: 1000
 *   });
 *   console.log(`Got ${result.keys.length} keys`);
 *   cursor = result.cursor;
 * } while (cursor);
 *
 * @example
 * // Filter keys by prefix and limit
 * const result = await listKVKeys(accountId, namespaceId, {
 *   prefix: 'cache:api:',
 *   limit: 50
 * });
 */
export async function listKVKeys(
  accountId: string,
  namespaceId: string,
  options?: ListKVKeysParams
): Promise<{
  keys: KVKey[];
  cursor?: string;
  list_complete: boolean;
}> {
  const params: Record<string, string | number> = {};

  if (options?.cursor) params.cursor = options.cursor;
  if (options?.limit) params.limit = options.limit;
  if (options?.prefix) params.prefix = options.prefix;

  const result = await cloudflareApi<{
    result: KVKey[];
    result_info: {
      cursor?: string;
      count: number;
    };
  }>(`/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys`, {
    params,
  });

  return {
    keys: result.result,
    cursor: result.result_info.cursor,
    list_complete: !result.result_info.cursor,
  };
}

// =============================================================================
// KV VALUE RETRIEVAL
// =============================================================================

/**
 * Get the value for a specific key in a KV namespace
 *
 * @param accountId - Cloudflare account ID
 * @param namespaceId - KV namespace ID (get from listKVNamespaces)
 * @param key - Key name
 * @returns Key value as string
 *
 * @example
 * // Get a single key value
 * const value = await getKVValue(accountId, namespaceId, 'user:123');
 * console.log(value);
 *
 * @example
 * // Get and parse JSON value
 * const jsonStr = await getKVValue(accountId, namespaceId, 'config:app');
 * const config = JSON.parse(jsonStr);
 *
 * @example
 * // Handle missing keys
 * try {
 *   const value = await getKVValue(accountId, namespaceId, 'missing-key');
 *   console.log(value);
 * } catch (error) {
 *   console.error('Key not found or other error:', error);
 * }
 */
export async function getKVValue(
  accountId: string,
  namespaceId: string,
  key: string
): Promise<string> {
  // Note: This endpoint returns the raw value, not wrapped in Cloudflare response format
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`,
    {
      headers: {
        Authorization: `Bearer ${await getToken()}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Key "${key}" not found in namespace ${namespaceId}`);
    }
    throw new Error(`Failed to get KV value: ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Helper to get API token from keychain (imported from cloudflare-client)
 */
async function getToken(): Promise<string> {
  const { getCredentials } = await import('./cloudflare-client.ts');
  return getCredentials().token;
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === 'list-namespaces') {
      // List KV namespaces: bun kv.ts list-namespaces <account-id>
      if (args.length < 2) {
        console.error('Usage: bun kv.ts list-namespaces <account-id>');
        process.exit(1);
      }

      const accountId = args[1];
      const namespaces = await listKVNamespaces(accountId);
      console.log(JSON.stringify(namespaces, null, 2));
    } else if (command === 'list-keys') {
      // List keys: bun kv.ts list-keys <account-id> <namespace-id> [--prefix=...] [--limit=...]
      if (args.length < 3) {
        console.error('Usage: bun kv.ts list-keys <account-id> <namespace-id> [--prefix=...] [--limit=...]');
        process.exit(1);
      }

      const accountId = args[1];
      const namespaceId = args[2];
      const options: ListKVKeysParams = {};

      for (let i = 3; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--prefix=')) {
          options.prefix = arg.slice('--prefix='.length);
        } else if (arg.startsWith('--limit=')) {
          options.limit = parseInt(arg.slice('--limit='.length), 10);
        } else if (arg.startsWith('--cursor=')) {
          options.cursor = arg.slice('--cursor='.length);
        }
      }

      const result = await listKVKeys(accountId, namespaceId, options);
      console.log(JSON.stringify(result, null, 2));
    } else if (command === 'get') {
      // Get value: bun kv.ts get <account-id> <namespace-id> <key>
      if (args.length < 4) {
        console.error('Usage: bun kv.ts get <account-id> <namespace-id> <key>');
        process.exit(1);
      }

      const accountId = args[1];
      const namespaceId = args[2];
      const key = args[3];

      const value = await getKVValue(accountId, namespaceId, key);
      console.log(value);
    } else {
      console.error('Usage:');
      console.error('  bun kv.ts list-namespaces <account-id>');
      console.error('  bun kv.ts list-keys <account-id> <namespace-id> [--prefix=...] [--limit=...]');
      console.error('  bun kv.ts get <account-id> <namespace-id> <key>');
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ error: message }));
    process.exit(1);
  }
}
