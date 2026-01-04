/**
 * Cloudflare Workers Inspection Tools
 *
 * Read-only operations for inspecting Cloudflare Workers scripts and their configurations.
 * All operations use macOS Keychain for authentication.
 * Worker deployments happen via wrangler CLI - no manual deployment tools.
 */

import { cloudflareApi } from './cloudflare-client.ts';
import type { Worker, WorkerDetails } from './interfaces.ts';

// =============================================================================
// WORKERS LISTING
// =============================================================================

/**
 * List all Workers scripts in a Cloudflare account
 *
 * @param accountId - Cloudflare account ID
 * @returns Array of Worker scripts
 *
 * @example
 * // List all Workers
 * const workers = await listWorkers('your-account-id');
 *
 * @example
 * // Check Worker usage models
 * const workers = await listWorkers(accountId);
 * workers.forEach(w => {
 *   console.log(`${w.id}: ${w.usage_model}`);
 * });
 *
 * @example
 * // Find Workers with cron triggers
 * const workers = await listWorkers(accountId);
 * const cronWorkers = workers.filter(w => w.cron_triggers && w.cron_triggers.length > 0);
 * cronWorkers.forEach(w => {
 *   console.log(`${w.id} crons:`, w.cron_triggers?.map(c => c.cron).join(', '));
 * });
 */
export async function listWorkers(accountId: string): Promise<Worker[]> {
  return await cloudflareApi<Worker[]>(
    `/accounts/${accountId}/workers/scripts`
  );
}

// =============================================================================
// WORKER DETAILS
// =============================================================================

/**
 * Get detailed information about a specific Worker script
 *
 * Includes bindings (KV, D1, R2, Durable Objects, service bindings, env vars),
 * routes, cron triggers, and compatibility settings.
 *
 * @param accountId - Cloudflare account ID
 * @param scriptName - Worker script name
 * @returns Worker details including bindings and configuration
 *
 * @example
 * // Get Worker details
 * const worker = await getWorkerDetails('account-id', 'my-worker');
 *
 * @example
 * // Check KV namespace bindings
 * const worker = await getWorkerDetails(accountId, scriptName);
 * if (worker.bindings.kv_namespaces) {
 *   worker.bindings.kv_namespaces.forEach(kv => {
 *     console.log(`KV binding: ${kv.name} -> ${kv.namespace_id}`);
 *   });
 * }
 *
 * @example
 * // Check D1 database bindings
 * const worker = await getWorkerDetails(accountId, scriptName);
 * if (worker.bindings.d1_databases) {
 *   worker.bindings.d1_databases.forEach(db => {
 *     console.log(`D1 binding: ${db.name} -> ${db.id}`);
 *   });
 * }
 *
 * @example
 * // Check R2 bucket bindings
 * const worker = await getWorkerDetails(accountId, scriptName);
 * if (worker.bindings.r2_buckets) {
 *   worker.bindings.r2_buckets.forEach(r2 => {
 *     console.log(`R2 binding: ${r2.name} -> ${r2.bucket_name}`);
 *   });
 * }
 *
 * @example
 * // Check service bindings
 * const worker = await getWorkerDetails(accountId, scriptName);
 * if (worker.bindings.services) {
 *   worker.bindings.services.forEach(svc => {
 *     console.log(`Service binding: ${svc.name} -> ${svc.service}@${svc.environment}`);
 *   });
 * }
 *
 * @example
 * // Check environment variables (names only, values are never exposed)
 * const worker = await getWorkerDetails(accountId, scriptName);
 * if (worker.bindings.env_vars) {
 *   worker.bindings.env_vars.forEach(env => {
 *     console.log(`Env var: ${env.name} (type: ${env.type})`);
 *   });
 * }
 *
 * @example
 * // Check routes
 * const worker = await getWorkerDetails(accountId, scriptName);
 * if (worker.routes) {
 *   worker.routes.forEach(route => {
 *     console.log(`Route: ${route.pattern} (enabled: ${route.enabled})`);
 *   });
 * }
 *
 * @example
 * // Check compatibility settings
 * const worker = await getWorkerDetails(accountId, scriptName);
 * console.log(`Compatibility date: ${worker.compatibility_date}`);
 * console.log(`Compatibility flags: ${worker.compatibility_flags?.join(', ')}`);
 */
export async function getWorkerDetails(
  accountId: string,
  scriptName: string
): Promise<WorkerDetails> {
  // Get the worker script metadata
  const worker = await cloudflareApi<Worker>(
    `/accounts/${accountId}/workers/scripts/${scriptName}`
  );

  // Get the worker settings (bindings, etc.)
  // Note: The API may return settings in a different structure
  // We'll attempt to get settings and merge with the worker data
  try {
    const settings = await cloudflareApi<{
      bindings?: WorkerDetails['bindings'];
      compatibility_date?: string;
      compatibility_flags?: string[];
    }>(`/accounts/${accountId}/workers/scripts/${scriptName}/settings`);

    return {
      ...worker,
      bindings: settings.bindings || {},
      compatibility_date: settings.compatibility_date,
      compatibility_flags: settings.compatibility_flags,
    };
  } catch (error) {
    // If settings endpoint fails, return worker with empty bindings
    return {
      ...worker,
      bindings: {},
    };
  }
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === 'list') {
      // List Workers: bun workers.ts list <account-id>
      if (args.length < 2) {
        console.error('Usage: bun workers.ts list <account-id>');
        process.exit(1);
      }

      const accountId = args[1];
      const workers = await listWorkers(accountId);
      console.log(JSON.stringify(workers, null, 2));
    } else if (command === 'get') {
      // Get Worker details: bun workers.ts get <account-id> <script-name>
      if (args.length < 3) {
        console.error(
          'Usage: bun workers.ts get <account-id> <script-name>'
        );
        process.exit(1);
      }

      const accountId = args[1];
      const scriptName = args[2];
      const worker = await getWorkerDetails(accountId, scriptName);
      console.log(JSON.stringify(worker, null, 2));
    } else {
      console.error('Usage:');
      console.error('  bun workers.ts list <account-id>');
      console.error('  bun workers.ts get <account-id> <script-name>');
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ error: message }));
    process.exit(1);
  }
}
