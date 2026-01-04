# Cloudflare Skill Tools - Setup Guide

## Phase 1: Zone & DNS Inspection (READ-ONLY)

These TypeScript tools provide read-only inspection capabilities for Cloudflare zones and DNS records. All deployments continue to happen via CI/CD pipelines.

### Authentication Setup

These tools use **macOS Keychain** for secure credential storage (following the Joplin skill pattern).

#### Required Credentials

You need two pieces of information from Cloudflare:

1. **API Token** - Create at: https://dash.cloudflare.com/profile/api-tokens
   - Required permissions: `Zone:Zone:Read`, `Zone:Zone Settings:Read`, `Zone:DNS Records:Read`
   - Token scope: All zones (or specific zones you want to inspect)

2. **Account ID** - Find at: https://dash.cloudflare.com/ (right sidebar under "Account ID")

#### Store Credentials in Keychain

```bash
# Store API token
security add-generic-password \
  -s "cloudflare-api" \
  -a "cloudflare-token" \
  -w "your-cloudflare-api-token-here"

# Store account ID
security add-generic-password \
  -s "cloudflare-api" \
  -a "cloudflare-account-id" \
  -w "your-cloudflare-account-id-here"
```

#### Verify Credentials

```bash
# Should return your API token
security find-generic-password -s "cloudflare-api" -a "cloudflare-token" -w

# Should return your account ID
security find-generic-password -s "cloudflare-api" -a "cloudflare-account-id" -w
```

### Available Tools

#### 1. List Zones (`zones.ts`)

```bash
# List all zones
bun zones.ts list

# Filter by name
bun zones.ts list --name=example.com

# Filter by status
bun zones.ts list --status=active

# Pagination
bun zones.ts list --page=1 --per-page=50
```

#### 2. Get Zone Settings (`zones.ts`)

```bash
# Get settings for a specific zone (use zone ID from list command)
bun zones.ts settings 023e105f4ecef8ad9ca31a8372d0c353
```

#### 3. List DNS Records (`dns.ts`)

```bash
# List all DNS records for a zone
bun dns.ts 023e105f4ecef8ad9ca31a8372d0c353

# Filter by record type
bun dns.ts 023e105f4ecef8ad9ca31a8372d0c353 --type=A

# Filter by record name
bun dns.ts 023e105f4ecef8ad9ca31a8372d0c353 --name=www.example.com

# Filter by content (IP address, etc.)
bun dns.ts 023e105f4ecef8ad9ca31a8372d0c353 --content=192.168.1.1

# Show only proxied records
bun dns.ts 023e105f4ecef8ad9ca31a8372d0c353 --proxied

# Combine filters
bun dns.ts 023e105f4ecef8ad9ca31a8372d0c353 --type=CNAME --proxied
```

### File Structure

```
~/PAI/.claude/Skills/Cloudflare/tools/
├── cloudflare-client.ts    # Core API client with keychain auth
├── interfaces.ts            # TypeScript interfaces (all types)
├── zones.ts                 # Zone inspection tools
├── dns.ts                   # DNS inspection tools
└── SETUP.md                 # This file
```

### Implementation Details

- **Runtime**: Bun (PAI standard)
- **Authentication**: macOS Keychain (secure, no environment variables)
- **Operations**: Read-only only (no mutations)
- **API Base**: `https://api.cloudflare.com/client/v4`
- **Error Handling**: Structured error messages with setup instructions

### Security Notes

1. **No mutations** - These tools are read-only by design
2. **Keychain storage** - Credentials encrypted by macOS
3. **No logging** - API tokens never logged or printed
4. **HTTPS only** - All API communication over HTTPS
5. **Minimal permissions** - Only read permissions required

### Troubleshooting

#### Error: "Cloudflare credentials not found in keychain"

You need to set up your credentials. See "Store Credentials in Keychain" above.

#### Error: "Empty credentials retrieved from keychain"

Your credentials exist but are empty. Delete and re-add them:

```bash
# Delete existing (empty) credentials
security delete-generic-password -s "cloudflare-api" -a "cloudflare-token"
security delete-generic-password -s "cloudflare-api" -a "cloudflare-account-id"

# Re-add with correct values (see "Store Credentials in Keychain" above)
```

#### Error: "Cloudflare API Error: [10000] Authentication error"

Your API token is invalid or expired. Generate a new one at https://dash.cloudflare.com/profile/api-tokens and update keychain:

```bash
# Update token
security delete-generic-password -s "cloudflare-api" -a "cloudflare-token"
security add-generic-password -s "cloudflare-api" -a "cloudflare-token" -w "new-token-here"
```

#### Error: "Zone not found"

The zone ID is incorrect or you don't have access. List zones first:

```bash
bun zones.ts list
```

### Next Steps

Phase 2 will add:
- Pages project inspection
- Pages deployment status checking
- Workers listing and details

Phase 3 will add:
- D1 database inspection (read-only queries)
- KV namespace inspection
- R2 bucket inspection

Phase 4 will add:
- Usage monitoring vs free tier limits
- Analytics data
