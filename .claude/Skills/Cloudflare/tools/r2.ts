/**
 * Cloudflare R2 Storage Inspection Tools
 *
 * Read-only operations for inspecting R2 buckets.
 * All operations use macOS Keychain for authentication.
 */

import { cloudflareApi } from './cloudflare-client.ts';
import type { R2Bucket } from './interfaces.ts';

// =============================================================================
// R2 BUCKET LISTING
// =============================================================================

/**
 * List all R2 buckets in the Cloudflare account
 *
 * @param accountId - Cloudflare account ID
 * @returns Array of R2 buckets
 *
 * @example
 * // List all R2 buckets
 * const buckets = await listR2Buckets(accountId);
 *
 * @example
 * // Find a bucket by name
 * const buckets = await listR2Buckets(accountId);
 * const myBucket = buckets.find(b => b.name === 'my-bucket');
 *
 * @example
 * // Show bucket creation dates
 * const buckets = await listR2Buckets(accountId);
 * buckets.forEach(bucket => {
 *   console.log(`${bucket.name}: created ${bucket.creation_date}`);
 * });
 */
export async function listR2Buckets(accountId: string): Promise<R2Bucket[]> {
  const response = await cloudflareApi<{ buckets: R2Bucket[] }>(
    `/accounts/${accountId}/r2/buckets`
  );

  return response.buckets;
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === 'list') {
      // List R2 buckets: bun r2.ts list <account-id>
      if (args.length < 2) {
        console.error('Usage: bun r2.ts list <account-id>');
        process.exit(1);
      }

      const accountId = args[1];
      const buckets = await listR2Buckets(accountId);
      console.log(JSON.stringify(buckets, null, 2));
    } else {
      console.error('Usage:');
      console.error('  bun r2.ts list <account-id>');
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ error: message }));
    process.exit(1);
  }
}
