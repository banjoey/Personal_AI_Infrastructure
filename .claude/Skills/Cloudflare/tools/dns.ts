/**
 * Cloudflare DNS Inspection Tools
 *
 * Read-only operations for inspecting DNS records.
 * DNS mutations (create/update/delete) are handled via Cloudflare dashboard or IaC.
 */

import { cloudflareApi } from './cloudflare-client.ts';
import type { DnsRecord, ListDnsRecordsParams } from './interfaces.ts';

// =============================================================================
// DNS RECORD LISTING
// =============================================================================

/**
 * List DNS records for a specific zone
 *
 * @param zoneId - Zone ID (get from listZones)
 * @param params - Optional filtering and pagination parameters
 * @returns Array of DNS records
 *
 * @example
 * // List all DNS records for a zone
 * const records = await listDnsRecords('023e105f4ecef8ad9ca31a8372d0c353');
 *
 * @example
 * // List only A records
 * const aRecords = await listDnsRecords(zoneId, { type: 'A' });
 *
 * @example
 * // List records for specific subdomain
 * const records = await listDnsRecords(zoneId, { name: 'www.example.com' });
 *
 * @example
 * // List only proxied records
 * const proxied = await listDnsRecords(zoneId, { proxied: true });
 *
 * @example
 * // Find records pointing to specific IP
 * const records = await listDnsRecords(zoneId, { content: '192.168.1.1' });
 */
export async function listDnsRecords(
  zoneId: string,
  params?: ListDnsRecordsParams
): Promise<DnsRecord[]> {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params?.page) queryParams.page = params.page;
  if (params?.per_page) queryParams.per_page = params.per_page;
  if (params?.order) queryParams.order = params.order;
  if (params?.direction) queryParams.direction = params.direction;
  if (params?.type) queryParams.type = params.type;
  if (params?.name) queryParams.name = params.name;
  if (params?.content) queryParams.content = params.content;
  if (params?.proxied !== undefined) queryParams.proxied = params.proxied;

  return await cloudflareApi<DnsRecord[]>(`/zones/${zoneId}/dns_records`, {
    params: queryParams,
  });
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

if (import.meta.main) {
  const args = process.argv.slice(2);

  try {
    if (args.length < 1) {
      console.error('Usage:');
      console.error('  bun dns.ts <zone-id> [--type=A] [--name=example.com] [--content=192.168.1.1] [--proxied]');
      console.error('');
      console.error('Options:');
      console.error('  --type=TYPE        Filter by record type (A, AAAA, CNAME, TXT, MX, etc.)');
      console.error('  --name=NAME        Filter by record name (subdomain.example.com)');
      console.error('  --content=CONTENT  Filter by record content (IP, domain, text)');
      console.error('  --proxied          Filter by proxied status (only proxied records)');
      console.error('  --page=N           Page number (default: 1)');
      console.error('  --per-page=N       Items per page (default: 20, max: 100)');
      console.error('');
      console.error('Examples:');
      console.error('  # List all DNS records');
      console.error('  bun dns.ts 023e105f4ecef8ad9ca31a8372d0c353');
      console.error('');
      console.error('  # List only A records');
      console.error('  bun dns.ts 023e105f4ecef8ad9ca31a8372d0c353 --type=A');
      console.error('');
      console.error('  # List records for www subdomain');
      console.error('  bun dns.ts 023e105f4ecef8ad9ca31a8372d0c353 --name=www.example.com');
      process.exit(1);
    }

    const zoneId = args[0];
    const params: ListDnsRecordsParams = {};

    // Parse command line arguments
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith('--type=')) {
        params.type = arg.slice('--type='.length) as DnsRecord['type'];
      } else if (arg.startsWith('--name=')) {
        params.name = arg.slice('--name='.length);
      } else if (arg.startsWith('--content=')) {
        params.content = arg.slice('--content='.length);
      } else if (arg === '--proxied') {
        params.proxied = true;
      } else if (arg.startsWith('--page=')) {
        params.page = parseInt(arg.slice('--page='.length), 10);
      } else if (arg.startsWith('--per-page=')) {
        params.per_page = parseInt(arg.slice('--per-page='.length), 10);
      } else {
        console.error(`Unknown option: ${arg}`);
        process.exit(1);
      }
    }

    const records = await listDnsRecords(zoneId, params);
    console.log(JSON.stringify(records, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ error: message }));
    process.exit(1);
  }
}
