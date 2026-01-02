#!/usr/bin/env bun
/**
 * ProbeServicesAPI - Explore the /services endpoint structure
 *
 * This is a diagnostic tool to understand the UniFi API structure
 * for static DNS records (dnsForwarder.hostRecords).
 */

import { initConnection, importCore, handleError } from './UnifiClient.ts';

async function main() {
  try {
    const conn = await initConnection();

    // Use the requestV2 method from connection.ts
    console.log('=== Trying V2 API endpoints ===\n');

    // Try static-dns endpoint (Network 8.x+)
    try {
      console.log('Trying: /static-dns');
      const result = await conn.requestV2('get', '/static-dns');
      console.log('SUCCESS:', JSON.stringify(result, null, 2));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`Failed: ${msg.split('\n')[0]}`);
    }

    // Try dns-records endpoint
    try {
      console.log('\nTrying: /dns-records');
      const result = await conn.requestV2('get', '/dns-records');
      console.log('SUCCESS:', JSON.stringify(result, null, 2));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`Failed: ${msg.split('\n')[0]}`);
    }

    // Try setting/dns
    try {
      console.log('\nTrying: /setting (looking for DNS config)');
      const site = conn.getSite();
      // @ts-ignore - accessing raw settings
      const settings = await site.settings?.list?.() || [];
      const dnsSettings = settings.filter((s: Record<string, unknown>) =>
        String(s.key || '').toLowerCase().includes('dns')
      );
      console.log('DNS-related settings:', JSON.stringify(dnsSettings, null, 2));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`Failed: ${msg.split('\n')[0]}`);
    }

    // Check site settings for DNS info
    try {
      console.log('\n=== Checking system module for DNS info ===');
      const system = await importCore<{ getSiteSettings: () => Promise<{ success: boolean; data?: unknown }> }>('system');
      const settings = await system.getSiteSettings();
      if (settings.success && settings.data) {
        const data = settings.data as Record<string, unknown>[];
        const dnsRelated = data.filter(item =>
          JSON.stringify(item).toLowerCase().includes('dns')
        );
        console.log('DNS-related site settings:', JSON.stringify(dnsRelated, null, 2));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`Failed: ${msg.split('\n')[0]}`);
    }

  } catch (error) {
    handleError(error);
  }
}

main();
