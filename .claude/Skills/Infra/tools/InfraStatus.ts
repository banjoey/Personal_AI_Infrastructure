#!/usr/bin/env bun
/**
 * InfraStatus - Check infrastructure component status
 *
 * Usage:
 *   bun run tools/InfraStatus.ts [--component=COMP] [--json]
 *
 * Options:
 *   --component=COMP  Check specific component: unraid, gitlab, cloudflare, all (default: all)
 *   --json            Output as JSON
 *
 * Examples:
 *   bun run tools/InfraStatus.ts
 *   bun run tools/InfraStatus.ts --component=unraid
 *   bun run tools/InfraStatus.ts --json
 */

interface ComponentStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  latency?: number;
  details?: string;
  lastCheck: string;
}

interface InfraStatusReport {
  overall: 'healthy' | 'degraded' | 'critical';
  components: ComponentStatus[];
  timestamp: string;
}

// Configuration for home infrastructure
const INFRA_CONFIG = {
  unraid: {
    host: '10.0.20.21',
    port: 22,
    healthEndpoint: 'http://10.0.20.21:8080/graphql'
  },
  gitlab: {
    host: 'gitlab.com',
    api: 'https://gitlab.com/api/v4'
  },
  cloudflare: {
    api: 'https://api.cloudflare.com/client/v4'
  }
};

async function checkTcp(host: string, port: number, timeout: number = 5000): Promise<{ success: boolean; latency?: number }> {
  const start = Date.now();
  try {
    const socket = await Bun.connect({
      hostname: host,
      port,
      socket: {
        data() {},
        open() {},
        close() {},
        error() {},
        connectError() {}
      }
    });
    socket.end();
    return { success: true, latency: Date.now() - start };
  } catch {
    return { success: false };
  }
}

async function checkHttp(url: string, timeout: number = 5000): Promise<{ success: boolean; latency?: number; status?: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return {
      success: response.ok,
      latency: Date.now() - start,
      status: response.status
    };
  } catch {
    return { success: false };
  }
}

async function checkUnraid(): Promise<ComponentStatus> {
  const config = INFRA_CONFIG.unraid;

  // Check SSH connectivity
  const sshCheck = await checkTcp(config.host, config.port);

  if (!sshCheck.success) {
    return {
      name: 'Unraid',
      status: 'offline',
      details: 'SSH connection failed',
      lastCheck: new Date().toISOString()
    };
  }

  // Check GraphQL API
  const apiCheck = await checkHttp(config.healthEndpoint);

  if (!apiCheck.success) {
    return {
      name: 'Unraid',
      status: 'degraded',
      latency: sshCheck.latency,
      details: 'SSH OK, but GraphQL API unavailable',
      lastCheck: new Date().toISOString()
    };
  }

  return {
    name: 'Unraid',
    status: 'online',
    latency: sshCheck.latency,
    details: `SSH: ${config.host}:${config.port}, API: OK`,
    lastCheck: new Date().toISOString()
  };
}

async function checkGitlab(): Promise<ComponentStatus> {
  const config = INFRA_CONFIG.gitlab;

  const apiCheck = await checkHttp(`${config.api}/version`);

  if (!apiCheck.success) {
    return {
      name: 'GitLab',
      status: 'offline',
      details: 'API unreachable',
      lastCheck: new Date().toISOString()
    };
  }

  return {
    name: 'GitLab',
    status: 'online',
    latency: apiCheck.latency,
    details: `API: ${config.api}`,
    lastCheck: new Date().toISOString()
  };
}

async function checkCloudflare(): Promise<ComponentStatus> {
  const config = INFRA_CONFIG.cloudflare;

  // Check API without auth (will return 400 but proves connectivity)
  const apiCheck = await checkHttp(`${config.api}/user`);

  // 400 means API is reachable but needs auth
  if (!apiCheck.success && apiCheck.status !== 400 && apiCheck.status !== 401 && apiCheck.status !== 403) {
    return {
      name: 'Cloudflare',
      status: 'offline',
      details: 'API unreachable',
      lastCheck: new Date().toISOString()
    };
  }

  return {
    name: 'Cloudflare',
    status: 'online',
    latency: apiCheck.latency,
    details: `API: ${config.api}`,
    lastCheck: new Date().toISOString()
  };
}

function formatReport(report: InfraStatusReport): string {
  const overallIcon = {
    healthy: '✅',
    degraded: '⚠️',
    critical: '❌'
  }[report.overall];

  let output = `\n${'='.repeat(60)}\n`;
  output += `INFRASTRUCTURE STATUS - ${overallIcon} ${report.overall.toUpperCase()}\n`;
  output += `${'='.repeat(60)}\n`;
  output += `Timestamp: ${report.timestamp}\n\n`;

  for (const comp of report.components) {
    const icon = {
      online: '✅',
      degraded: '⚠️',
      offline: '❌',
      unknown: '❓'
    }[comp.status];

    output += `${icon} ${comp.name.padEnd(15)} ${comp.status.padEnd(10)}`;
    if (comp.latency) {
      output += ` (${comp.latency}ms)`;
    }
    output += '\n';

    if (comp.details) {
      output += `   ${comp.details}\n`;
    }
  }

  return output;
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--help') {
    console.log(`
Infrastructure Status - Check infrastructure component health

Usage:
  bun run InfraStatus.ts [--component=COMP] [--json]

Options:
  --component=COMP  unraid, gitlab, cloudflare, all (default: all)
  --json            Output as JSON

Examples:
  bun run InfraStatus.ts
  bun run InfraStatus.ts --component=unraid
`);
    process.exit(0);
  }

  let component = 'all';
  let outputJson = false;

  for (const arg of args) {
    if (arg.startsWith('--component=')) {
      component = arg.split('=')[1];
    } else if (arg === '--json') {
      outputJson = true;
    }
  }

  console.error('Checking infrastructure status...\n');

  const components: ComponentStatus[] = [];

  if (component === 'all' || component === 'unraid') {
    components.push(await checkUnraid());
  }

  if (component === 'all' || component === 'gitlab') {
    components.push(await checkGitlab());
  }

  if (component === 'all' || component === 'cloudflare') {
    components.push(await checkCloudflare());
  }

  // Determine overall status
  const offline = components.filter(c => c.status === 'offline').length;
  const degraded = components.filter(c => c.status === 'degraded').length;

  let overall: 'healthy' | 'degraded' | 'critical';
  if (offline >= 2 || (offline >= 1 && components.length <= 2)) {
    overall = 'critical';
  } else if (offline > 0 || degraded > 0) {
    overall = 'degraded';
  } else {
    overall = 'healthy';
  }

  const report: InfraStatusReport = {
    overall,
    components,
    timestamp: new Date().toISOString()
  };

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatReport(report));
  }

  if (overall === 'critical') {
    process.exit(1);
  }
}

main();
