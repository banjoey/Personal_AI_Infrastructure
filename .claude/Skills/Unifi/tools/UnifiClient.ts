#!/usr/bin/env bun
/**
 * UniFi API Client for PAI Skills
 *
 * Provides connection to UniFi controller using credentials from macOS keychain.
 * Imports the core library from unifi-mcp-ts for actual API operations.
 *
 * Keychain setup:
 *   security add-generic-password -s unifi-controller -a host -w '10.0.0.1'
 *   security add-generic-password -s unifi-controller -a username -w 'your-username'
 *   security add-generic-password -s unifi-controller -a password -w 'your-password'
 */

import { execSync } from 'child_process';

// Disable SSL verification for self-signed certificates (UCG Max uses self-signed)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Path to unifi-mcp-ts source (symlinked or absolute)
const UNIFI_MCP_PATH = process.env.UNIFI_MCP_PATH || '/Users/jbarkley/src/mcp-servers/unifi-mcp-ts';

export interface UnifiCredentials {
  host: string;
  username: string;
  password: string;
  port?: number;
  site?: string;
  sslVerify?: boolean;
}

/**
 * Get a single credential from macOS keychain
 */
function getKeychainValue(service: string, account: string): string {
  try {
    const value = execSync(`security find-generic-password -s "${service}" -a "${account}" -w`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return value;
  } catch (error) {
    throw new Error(
      `Failed to get ${account} from keychain service "${service}". ` +
      `Run: security add-generic-password -s ${service} -a ${account} -w YOUR_VALUE`
    );
  }
}

/**
 * Get UniFi credentials from macOS keychain
 */
export function getCredentials(): UnifiCredentials {
  const service = 'unifi-controller';

  return {
    host: getKeychainValue(service, 'host'),
    username: getKeychainValue(service, 'username'),
    password: getKeychainValue(service, 'password'),
    port: 443,
    site: 'default',
    sslVerify: false,
  };
}

/**
 * Initialize the UniFi connection with keychain credentials
 * Returns the connection instance
 */
export async function initConnection() {
  const creds = getCredentials();

  // Dynamic import from the unifi-mcp-ts source
  const { UniFiConnection } = await import(`${UNIFI_MCP_PATH}/src/core/connection.ts`);

  const conn = UniFiConnection.getInstance({
    host: creds.host,
    username: creds.username,
    password: creds.password,
    port: creds.port,
    site: creds.site,
    sslVerify: creds.sslVerify,
  });

  await conn.connect();
  return conn;
}

/**
 * Import a function from the unifi-mcp-ts core library
 */
export async function importCore<T>(moduleName: string): Promise<T> {
  return await import(`${UNIFI_MCP_PATH}/src/core/${moduleName}.ts`);
}

/**
 * Format output as JSON for skill consumption
 */
export function output(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Handle errors consistently
 */
export function handleError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ error: message }));
  process.exit(1);
}
