/**
 * Cloudflare Zone Inspection Tools
 *
 * Read-only operations for inspecting Cloudflare zones (domains) and their settings.
 * All operations use macOS Keychain for authentication.
 */

import { cloudflareApi } from './cloudflare-client.ts';
import type { Zone, ZoneSettings, PaginationParams } from './interfaces.ts';

// =============================================================================
// ZONE LISTING
// =============================================================================

/**
 * List all zones in the Cloudflare account
 *
 * @param params - Optional pagination and filtering parameters
 * @returns Array of zones
 *
 * @example
 * // List all zones
 * const zones = await listZones();
 *
 * @example
 * // List zones with pagination
 * const zones = await listZones({ page: 1, per_page: 50 });
 *
 * @example
 * // List zones sorted by name
 * const zones = await listZones({ order: 'name', direction: 'asc' });
 */
export async function listZones(
  params?: PaginationParams & {
    /** Filter by zone name */
    name?: string;
    /** Filter by zone status */
    status?: 'active' | 'pending' | 'initializing' | 'moved' | 'deleted' | 'deactivated';
    /** Only match zones with exact name (not substring) */
    match?: 'all' | 'any';
  }
): Promise<Zone[]> {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params?.page) queryParams.page = params.page;
  if (params?.per_page) queryParams.per_page = params.per_page;
  if (params?.order) queryParams.order = params.order;
  if (params?.direction) queryParams.direction = params.direction;
  if (params?.name) queryParams.name = params.name;
  if (params?.status) queryParams.status = params.status;
  if (params?.match) queryParams.match = params.match;

  return await cloudflareApi<Zone[]>('/zones', {
    params: queryParams,
  });
}

// =============================================================================
// ZONE SETTINGS
// =============================================================================

/**
 * Get configuration settings for a specific zone
 *
 * @param zoneId - Zone ID (get from listZones)
 * @returns Zone settings configuration
 *
 * @example
 * // Get settings for a zone
 * const settings = await getZoneSettings('023e105f4ecef8ad9ca31a8372d0c353');
 *
 * @example
 * // Check if Always Use HTTPS is enabled
 * const settings = await getZoneSettings(zoneId);
 * const alwaysHttps = settings.always_use_https.value === 'on';
 *
 * @example
 * // Get SSL mode
 * const settings = await getZoneSettings(zoneId);
 * const sslMode = settings.ssl.value; // 'off' | 'flexible' | 'full' | 'strict'
 */
export async function getZoneSettings(zoneId: string): Promise<ZoneSettings> {
  // The API returns an array of settings, but we transform it to the ZoneSettings interface
  const settingsArray = await cloudflareApi<Array<{
    id: string;
    value: unknown;
    modified_on: string | null;
    editable: boolean;
  }>>(`/zones/${zoneId}/settings`);

  // Transform array to keyed object matching ZoneSettings interface
  const settings: Partial<ZoneSettings> = {};

  for (const setting of settingsArray) {
    // @ts-ignore - Dynamic key assignment
    settings[setting.id] = setting;
  }

  return settings as ZoneSettings;
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === 'list') {
      // List zones: bun zones.ts list [--name=example.com] [--status=active]
      const params: Parameters<typeof listZones>[0] = {};

      for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--name=')) {
          params.name = arg.slice('--name='.length);
        } else if (arg.startsWith('--status=')) {
          params.status = arg.slice('--status='.length) as Zone['status'];
        } else if (arg.startsWith('--page=')) {
          params.page = parseInt(arg.slice('--page='.length), 10);
        } else if (arg.startsWith('--per-page=')) {
          params.per_page = parseInt(arg.slice('--per-page='.length), 10);
        }
      }

      const zones = await listZones(params);
      console.log(JSON.stringify(zones, null, 2));
    } else if (command === 'settings') {
      // Get zone settings: bun zones.ts settings <zone-id>
      if (args.length < 2) {
        console.error('Usage: bun zones.ts settings <zone-id>');
        process.exit(1);
      }

      const zoneId = args[1];
      const settings = await getZoneSettings(zoneId);
      console.log(JSON.stringify(settings, null, 2));
    } else {
      console.error('Usage:');
      console.error('  bun zones.ts list [--name=example.com] [--status=active] [--page=1] [--per-page=50]');
      console.error('  bun zones.ts settings <zone-id>');
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ error: message }));
    process.exit(1);
  }
}
