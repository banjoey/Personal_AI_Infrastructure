#!/usr/bin/env bun
/**
 * ListClients - List connected clients on the UniFi network
 *
 * Usage:
 *   bun run tools/ListClients.ts [options]
 *
 * Options:
 *   --type=TYPE       Filter by type: all, wired, wireless (default: all)
 *   --limit=N         Limit results (default: 50)
 *   --offline         Include offline clients
 *   --json            Output raw JSON (default: formatted table)
 *
 * Examples:
 *   bun run tools/ListClients.ts
 *   bun run tools/ListClients.ts --type=wireless --limit=10
 *   bun run tools/ListClients.ts --offline
 */

import { initConnection, importCore, output, handleError } from './UnifiClient.ts';

interface ClientsModule {
  listClients: (options?: {
    type?: 'all' | 'wired' | 'wireless';
    includeOffline?: boolean;
    limit?: number;
  }) => Promise<{ success: boolean; data?: unknown[]; error?: unknown }>;
}

async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let type: 'all' | 'wired' | 'wireless' = 'all';
  let limit = 50;
  let includeOffline = false;
  let rawJson = false;

  for (const arg of args) {
    if (arg.startsWith('--type=')) {
      const t = arg.split('=')[1];
      if (t === 'wired' || t === 'wireless' || t === 'all') {
        type = t;
      }
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--offline') {
      includeOffline = true;
    } else if (arg === '--json') {
      rawJson = true;
    } else if (arg === '--help') {
      console.log(`
Usage: bun run ListClients.ts [options]

Options:
  --type=TYPE       Filter by type: all, wired, wireless (default: all)
  --limit=N         Limit results (default: 50)
  --offline         Include offline clients
  --json            Output raw JSON

Examples:
  bun run ListClients.ts
  bun run ListClients.ts --type=wireless --limit=10
`);
      process.exit(0);
    }
  }

  try {
    // Initialize connection
    await initConnection();

    // Import and call the core function
    const clients = await importCore<ClientsModule>('clients');
    const result = await clients.listClients({
      type,
      includeOffline,
      limit,
    });

    if (!result.success) {
      handleError(result.error);
    }

    const clientList = result.data || [];

    if (rawJson) {
      output(clientList);
    } else {
      // Format as table
      console.log(`\nConnected Clients (${clientList.length}):\n`);
      console.log('Name                          | IP              | MAC               | Type     | Signal');
      console.log('-'.repeat(95));

      for (const client of clientList as Array<Record<string, unknown>>) {
        const name = String(client.name || client.hostname || 'Unknown').slice(0, 28).padEnd(28);
        const ip = String(client.ip || '-').padEnd(15);
        const mac = String(client.mac || '-').padEnd(17);
        const clientType = client.is_wired ? 'Wired' : 'WiFi';
        const signal = client.signal ? `${client.signal} dBm` : '-';

        console.log(`${name} | ${ip} | ${mac} | ${clientType.padEnd(8)} | ${signal}`);
      }
    }
  } catch (error) {
    handleError(error);
  }
}

main();
