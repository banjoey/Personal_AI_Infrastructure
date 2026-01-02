#!/usr/bin/env bun
/**
 * StaticDNS - Manage UniFi static DNS records
 *
 * Usage:
 *   bun run tools/StaticDNS.ts list                          # List all records
 *   bun run tools/StaticDNS.ts get <hostname>                # Get specific record
 *   bun run tools/StaticDNS.ts create <hostname> <ip>        # Create record
 *   bun run tools/StaticDNS.ts update <hostname> <new-ip>    # Update record IP
 *   bun run tools/StaticDNS.ts delete <hostname>             # Delete record
 *   bun run tools/StaticDNS.ts bulk-update <pattern> <ip>    # Bulk update matching records
 *
 * Options:
 *   --json            Output raw JSON
 *   --confirm         Confirm destructive operations (required for create/update/delete)
 *
 * Examples:
 *   bun run tools/StaticDNS.ts list
 *   bun run tools/StaticDNS.ts list --json
 *   bun run tools/StaticDNS.ts get secrets.op.barkleyfarm.com
 *   bun run tools/StaticDNS.ts create test.local 192.168.1.100 --confirm
 *   bun run tools/StaticDNS.ts update secrets.op.barkleyfarm.com 10.0.20.22 --confirm
 *   bun run tools/StaticDNS.ts bulk-update "*.op.barkleyfarm.com" 10.0.20.22 --confirm
 */

import { initConnection, importCore, output, handleError } from './UnifiClient.ts';

interface StaticDNSModule {
  listStaticDNS: () => Promise<{ success: boolean; data?: StaticDNSRecord[]; error?: { message: string } }>;
  findStaticDNSByHostname: (hostname: string) => Promise<{ success: boolean; data?: StaticDNSRecord | null; error?: { message: string } }>;
  createStaticDNS: (input: { hostname: string; ip: string }) => Promise<{ success: boolean; data?: StaticDNSRecord; error?: { message: string } }>;
  updateStaticDNSByHostname: (hostname: string, updates: { ip?: string }) => Promise<{ success: boolean; data?: StaticDNSRecord; error?: { message: string } }>;
  deleteStaticDNSByHostname: (hostname: string) => Promise<{ success: boolean; error?: { message: string } }>;
  bulkUpdateIP: (pattern: string | RegExp, newIP: string) => Promise<{ success: boolean; data?: { updated: string[]; failed: string[] }; error?: { message: string } }>;
}

interface StaticDNSRecord {
  _id: string;
  key: string;
  value: string;
  record_type: string;
  enabled: boolean;
  ttl: number;
}

function showHelp() {
  console.log(`
Static DNS Management Tool

Usage:
  bun run StaticDNS.ts <command> [args] [options]

Commands:
  list                          List all static DNS records
  get <hostname>                Get a specific record by hostname
  create <hostname> <ip>        Create a new DNS record
  update <hostname> <new-ip>    Update an existing record's IP
  delete <hostname>             Delete a record
  bulk-update <pattern> <ip>    Update all records matching pattern

Options:
  --json            Output raw JSON instead of formatted table
  --confirm         Confirm destructive operations (required)

Examples:
  StaticDNS.ts list
  StaticDNS.ts get secrets.op.barkleyfarm.com
  StaticDNS.ts create myapp.local 10.0.1.50 --confirm
  StaticDNS.ts update secrets.op.barkleyfarm.com 10.0.20.22 --confirm
  StaticDNS.ts delete old-record.local --confirm
  StaticDNS.ts bulk-update "mcp-.*\\.op\\.barkleyfarm\\.com" 10.0.20.22 --confirm
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const rawJson = args.includes('--json');
  const confirmed = args.includes('--confirm');

  if (!command || command === '--help' || command === '-h') {
    showHelp();
    process.exit(0);
  }

  try {
    await initConnection();
    const staticDns = await importCore<StaticDNSModule>('staticDns');

    switch (command) {
      case 'list': {
        const result = await staticDns.listStaticDNS();
        if (!result.success) {
          handleError(result.error);
        }

        const records = result.data || [];

        if (rawJson) {
          output(records);
        } else {
          // Filter to show only A/AAAA records by default
          const aRecords = records.filter(r => r.record_type === 'A' || r.record_type === 'AAAA');

          console.log(`\nStatic DNS Records (${aRecords.length} A/AAAA records):\n`);
          console.log('Hostname                                      | IP              | Type | Enabled');
          console.log('-'.repeat(90));

          for (const record of aRecords) {
            const hostname = record.key.slice(0, 44).padEnd(44);
            const ip = record.value.padEnd(15);
            const type = record.record_type.padEnd(4);
            const enabled = record.enabled ? 'Yes' : 'No';
            console.log(`${hostname} | ${ip} | ${type} | ${enabled}`);
          }

          // Show count of other record types
          const otherTypes = records.filter(r => r.record_type !== 'A' && r.record_type !== 'AAAA');
          if (otherTypes.length > 0) {
            console.log(`\n(+ ${otherTypes.length} other records: TXT, CNAME, etc. Use --json to see all)`);
          }
        }
        break;
      }

      case 'get': {
        const hostname = args[1];
        if (!hostname) {
          console.error('Error: hostname required');
          console.error('Usage: StaticDNS.ts get <hostname>');
          process.exit(1);
        }

        const result = await staticDns.findStaticDNSByHostname(hostname);
        if (!result.success) {
          handleError(result.error);
        }

        if (!result.data) {
          console.log(`No record found for: ${hostname}`);
          process.exit(1);
        }

        if (rawJson) {
          output(result.data);
        } else {
          const r = result.data;
          console.log(`\nDNS Record: ${r.key}`);
          console.log(`  Type:    ${r.record_type}`);
          console.log(`  Value:   ${r.value}`);
          console.log(`  Enabled: ${r.enabled ? 'Yes' : 'No'}`);
          console.log(`  TTL:     ${r.ttl || 'default'}`);
          console.log(`  ID:      ${r._id}`);
        }
        break;
      }

      case 'create': {
        const hostname = args[1];
        const ip = args[2];

        if (!hostname || !ip) {
          console.error('Error: hostname and ip required');
          console.error('Usage: StaticDNS.ts create <hostname> <ip> --confirm');
          process.exit(1);
        }

        if (!confirmed) {
          console.log('\nPreview: Create DNS record');
          console.log(`  Hostname: ${hostname}`);
          console.log(`  IP:       ${ip}`);
          console.log('\nRun with --confirm to execute');
          process.exit(0);
        }

        const result = await staticDns.createStaticDNS({ hostname, ip });
        if (!result.success) {
          handleError(result.error);
        }

        console.log(`\nCreated: ${hostname} -> ${ip}`);
        if (rawJson && result.data) {
          output(result.data);
        }
        break;
      }

      case 'update': {
        const hostname = args[1];
        const newIP = args[2];

        if (!hostname || !newIP) {
          console.error('Error: hostname and new-ip required');
          console.error('Usage: StaticDNS.ts update <hostname> <new-ip> --confirm');
          process.exit(1);
        }

        // Show current record first
        const existing = await staticDns.findStaticDNSByHostname(hostname);
        if (!existing.success) {
          handleError(existing.error);
        }
        if (!existing.data) {
          console.error(`Error: No record found for ${hostname}`);
          process.exit(1);
        }

        if (!confirmed) {
          console.log('\nPreview: Update DNS record');
          console.log(`  Hostname:   ${hostname}`);
          console.log(`  Current IP: ${existing.data.value}`);
          console.log(`  New IP:     ${newIP}`);
          console.log('\nRun with --confirm to execute');
          process.exit(0);
        }

        const result = await staticDns.updateStaticDNSByHostname(hostname, { ip: newIP });
        if (!result.success) {
          handleError(result.error);
        }

        console.log(`\nUpdated: ${hostname}`);
        console.log(`  ${existing.data.value} -> ${newIP}`);
        break;
      }

      case 'delete': {
        const hostname = args[1];

        if (!hostname) {
          console.error('Error: hostname required');
          console.error('Usage: StaticDNS.ts delete <hostname> --confirm');
          process.exit(1);
        }

        // Show current record first
        const existing = await staticDns.findStaticDNSByHostname(hostname);
        if (!existing.success) {
          handleError(existing.error);
        }
        if (!existing.data) {
          console.error(`Error: No record found for ${hostname}`);
          process.exit(1);
        }

        if (!confirmed) {
          console.log('\nPreview: Delete DNS record');
          console.log(`  Hostname: ${hostname}`);
          console.log(`  IP:       ${existing.data.value}`);
          console.log('\nRun with --confirm to execute');
          process.exit(0);
        }

        const result = await staticDns.deleteStaticDNSByHostname(hostname);
        if (!result.success) {
          handleError(result.error);
        }

        console.log(`\nDeleted: ${hostname}`);
        break;
      }

      case 'bulk-update': {
        const pattern = args[1];
        const newIP = args[2];

        if (!pattern || !newIP) {
          console.error('Error: pattern and new-ip required');
          console.error('Usage: StaticDNS.ts bulk-update <pattern> <ip> --confirm');
          console.error('Example: StaticDNS.ts bulk-update "mcp-.*\\.op\\.barkleyfarm\\.com" 10.0.20.22 --confirm');
          process.exit(1);
        }

        // Find matching records first
        const listResult = await staticDns.listStaticDNS();
        if (!listResult.success) {
          handleError(listResult.error);
        }

        const regex = new RegExp(pattern, 'i');
        const matching = (listResult.data || []).filter(
          r => r.record_type === 'A' && regex.test(r.key)
        );

        if (matching.length === 0) {
          console.log(`No A records matching pattern: ${pattern}`);
          process.exit(0);
        }

        if (!confirmed) {
          console.log(`\nPreview: Bulk update ${matching.length} records to ${newIP}\n`);
          for (const r of matching) {
            console.log(`  ${r.key}: ${r.value} -> ${newIP}`);
          }
          console.log('\nRun with --confirm to execute');
          process.exit(0);
        }

        const result = await staticDns.bulkUpdateIP(regex, newIP);
        if (!result.success) {
          handleError(result.error);
        }

        console.log(`\nBulk update complete:`);
        console.log(`  Updated: ${result.data?.updated.length || 0}`);
        console.log(`  Failed:  ${result.data?.failed.length || 0}`);

        if (result.data?.updated.length) {
          console.log('\nUpdated records:');
          for (const hostname of result.data.updated) {
            console.log(`  ${hostname} -> ${newIP}`);
          }
        }

        if (result.data?.failed.length) {
          console.log('\nFailed records:');
          for (const hostname of result.data.failed) {
            console.log(`  ${hostname}`);
          }
        }
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    handleError(error);
  }
}

main();
