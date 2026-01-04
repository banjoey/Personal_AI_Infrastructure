# Cloudflare Inspection Tools

TypeScript tools for read-only inspection and troubleshooting of Cloudflare resources. All deployments happen via CI/CD - these tools are for verification and debugging only.

## Quick Start

### 1. Set up credentials (one-time)

```bash
# Store API token
security add-generic-password \
  -s "cloudflare-api" \
  -a "cloudflare-token" \
  -w "your-token-here"

# Store account ID
security add-generic-password \
  -s "cloudflare-api" \
  -a "cloudflare-account-id" \
  -w "your-account-id-here"
```

See [SETUP.md](./SETUP.md) for detailed instructions.

### 2. Use the tools

```bash
# List zones
bun zones.ts list

# Get zone settings
bun zones.ts settings <zone-id>

# List DNS records
bun dns.ts <zone-id>
```

## Phase 1: Zone & DNS Inspection ✅

**Status**: Implemented

| Tool | Function | Description |
|------|----------|-------------|
| `zones.ts` | `listZones()` | List all zones in account |
| `zones.ts` | `getZoneSettings()` | Get zone configuration settings |
| `dns.ts` | `listDnsRecords()` | List DNS records for a zone |

## Phase 2: Pages & Workers (Planned)

- List Pages projects
- Get Pages project details
- List Pages deployments
- Get deployment status
- List Workers
- Get Worker details

## Phase 3: Storage (Planned)

- List D1 databases
- Get D1 schema
- Query D1 database (SELECT only)
- List KV namespaces
- Get KV value
- List R2 buckets
- Get R2 bucket usage

## Phase 4: Monitoring (Planned)

- Check usage vs free tier limits
- Get analytics data

## Architecture

```
cloudflare-client.ts    Core API client with keychain auth
  ├── getCredentials()      Retrieve from macOS Keychain
  ├── cloudflareApi()       Generic API caller
  └── validateReadOnlyQuery() Enforce SELECT-only for D1

zones.ts                Zone inspection
  ├── listZones()          List all zones
  └── getZoneSettings()    Get zone configuration

dns.ts                  DNS inspection
  └── listDnsRecords()     List DNS records

interfaces.ts           TypeScript interfaces (all types)
```

## Design Principles

1. **Read-only only** - No mutations (deployments via CI/CD)
2. **Keychain auth** - Secure credential storage (no env vars)
3. **Structured output** - JSON output for easy parsing
4. **CLI interface** - Each tool usable from command line
5. **Type safety** - Full TypeScript with interfaces

## Usage Patterns

### As a CLI tool

```bash
bun zones.ts list --status=active
bun dns.ts <zone-id> --type=A --proxied
```

### As a TypeScript library

```typescript
import { listZones, getZoneSettings } from './zones.ts';
import { listDnsRecords } from './dns.ts';

// List all zones
const zones = await listZones();

// Get settings for first zone
const settings = await getZoneSettings(zones[0].id);

// List A records
const aRecords = await listDnsRecords(zones[0].id, { type: 'A' });
```

### Error handling

```typescript
import { CloudflareError, KeychainError } from './cloudflare-client.ts';

try {
  const zones = await listZones();
} catch (error) {
  if (error instanceof KeychainError) {
    console.error('Credentials not set up:', error.message);
  } else if (error instanceof CloudflareError) {
    console.error('API error:', error.errors);
  }
}
```

## Links

- [Setup Guide](./SETUP.md) - Detailed setup and troubleshooting
- [Interfaces](./interfaces.ts) - All TypeScript type definitions
- [Cloudflare API Docs](https://developers.cloudflare.com/api/)
