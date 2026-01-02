#!/usr/bin/env bun
/**
 * GetSystemInfo - Get UniFi controller system information
 *
 * Usage:
 *   bun run tools/GetSystemInfo.ts
 *
 * Returns controller version, uptime, and site health summary.
 */

import { initConnection, importCore, output, handleError } from './UnifiClient.ts';

interface SystemModule {
  getSystemInfo: () => Promise<{ success: boolean; data?: unknown; error?: unknown }>;
  getSiteHealth: () => Promise<{ success: boolean; data?: unknown; error?: unknown }>;
}

async function main() {
  if (process.argv.includes('--help')) {
    console.log(`
Usage: bun run GetSystemInfo.ts

Returns UniFi controller system information including:
- Controller version
- Uptime
- Site health summary
`);
    process.exit(0);
  }

  try {
    await initConnection();

    const system = await importCore<SystemModule>('system');

    // Get system info
    const infoResult = await system.getSystemInfo();
    if (!infoResult.success) {
      handleError(infoResult.error);
    }

    // Get site health
    const healthResult = await system.getSiteHealth();

    console.log('\n=== UniFi Controller System Info ===\n');

    const info = infoResult.data as Record<string, unknown>;
    console.log(`Version: ${info.version || 'Unknown'}`);
    console.log(`Hostname: ${info.hostname || 'Unknown'}`);

    if (info.uptime) {
      const uptime = Number(info.uptime);
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      console.log(`Uptime: ${days} days, ${hours} hours`);
    }

    if (healthResult.success && healthResult.data) {
      console.log('\n=== Site Health ===\n');
      const health = healthResult.data as Record<string, unknown>[];

      for (const subsystem of health) {
        const name = String(subsystem.subsystem || 'Unknown');
        const status = subsystem.status === 'ok' ? '✓' : '✗';
        console.log(`${status} ${name}`);
      }
    }

    console.log('');
  } catch (error) {
    handleError(error);
  }
}

main();
