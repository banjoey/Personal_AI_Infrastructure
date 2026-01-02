#!/usr/bin/env bun
/**
 * ListDevices - List UniFi network devices (APs, switches, gateways)
 *
 * Usage:
 *   bun run tools/ListDevices.ts [options]
 *
 * Options:
 *   --json            Output raw JSON (default: formatted table)
 *
 * Examples:
 *   bun run tools/ListDevices.ts
 *   bun run tools/ListDevices.ts --json
 */

import { initConnection, importCore, output, handleError } from './UnifiClient.ts';

interface DevicesModule {
  listDevices: () => Promise<{ success: boolean; data?: unknown[]; error?: unknown }>;
}

async function main() {
  const args = process.argv.slice(2);
  const rawJson = args.includes('--json');

  if (args.includes('--help')) {
    console.log(`
Usage: bun run ListDevices.ts [options]

Options:
  --json            Output raw JSON

Examples:
  bun run ListDevices.ts
  bun run ListDevices.ts --json
`);
    process.exit(0);
  }

  try {
    await initConnection();

    const devices = await importCore<DevicesModule>('devices');
    const result = await devices.listDevices();

    if (!result.success) {
      handleError(result.error);
    }

    const deviceList = result.data || [];

    if (rawJson) {
      output(deviceList);
    } else {
      console.log(`\nUniFi Devices (${deviceList.length}):\n`);
      console.log('Name                     | Model            | IP              | MAC               | Status');
      console.log('-'.repeat(100));

      for (const device of deviceList as Array<Record<string, unknown>>) {
        const name = String(device.name || 'Unknown').slice(0, 23).padEnd(23);
        const model = String(device.model || '-').slice(0, 16).padEnd(16);
        const ip = String(device.ip || '-').padEnd(15);
        const mac = String(device.mac || '-').padEnd(17);
        const status = device.state === 1 ? 'Online' : 'Offline';

        console.log(`${name} | ${model} | ${ip} | ${mac} | ${status}`);
      }
    }
  } catch (error) {
    handleError(error);
  }
}

main();
