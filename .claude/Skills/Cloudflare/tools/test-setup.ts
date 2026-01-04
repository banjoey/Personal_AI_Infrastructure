#!/usr/bin/env bun
/**
 * Test script for Cloudflare tools setup verification
 *
 * This script tests:
 * 1. Keychain credential retrieval
 * 2. API connectivity
 * 3. Basic tool functionality
 */

import { getCredentials, CloudflareError, KeychainError } from './cloudflare-client.ts';
import { listZones } from './zones.ts';

console.log('🔍 Cloudflare Tools Setup Verification\n');

// Step 1: Check keychain credentials
console.log('Step 1: Checking keychain credentials...');
try {
  const { token, accountId } = getCredentials();

  // Mask token for security
  const maskedToken = token.slice(0, 8) + '...' + token.slice(-4);
  const maskedAccountId = accountId.slice(0, 8) + '...' + accountId.slice(-4);

  console.log(`✅ Token found: ${maskedToken}`);
  console.log(`✅ Account ID found: ${maskedAccountId}`);
} catch (error) {
  if (error instanceof KeychainError) {
    console.error('❌ Keychain credentials not found\n');
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}

// Step 2: Test API connectivity
console.log('\nStep 2: Testing API connectivity...');
try {
  const zones = await listZones({ per_page: 1 });

  if (zones.length === 0) {
    console.log('⚠️  No zones found in account (this might be expected)');
  } else {
    console.log(`✅ Successfully retrieved zones (${zones.length} zone(s))`);
    console.log(`   First zone: ${zones[0].name}`);
  }
} catch (error) {
  if (error instanceof CloudflareError) {
    console.error('❌ Cloudflare API error:', error.message);
    console.error('   Check that your API token has the correct permissions:');
    console.error('   - Zone:Zone:Read');
    console.error('   - Zone:Zone Settings:Read');
    console.error('   - Zone:DNS Records:Read');
    process.exit(1);
  }
  throw error;
}

// Step 3: Summary
console.log('\n✅ Setup verification complete!');
console.log('\nAvailable commands:');
console.log('  bun zones.ts list                    # List all zones');
console.log('  bun zones.ts settings <zone-id>      # Get zone settings');
console.log('  bun dns.ts <zone-id>                 # List DNS records');
console.log('\nFor more information, see README.md and SETUP.md');
