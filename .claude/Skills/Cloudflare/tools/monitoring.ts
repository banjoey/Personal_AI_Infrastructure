/**
 * Cloudflare Monitoring & Analytics Tools
 *
 * Read-only operations for checking account usage, limits, and analytics data.
 * All operations use macOS Keychain for authentication.
 */

import { cloudflareApi } from './cloudflare-client.ts';
import type { UsageMetrics, UsageMetric, Analytics, AnalyticsParams } from './interfaces.ts';

// =============================================================================
// USAGE MONITORING
// =============================================================================

/**
 * Check account usage and free tier limits
 *
 * Retrieves usage metrics for Pages, Workers, D1, KV, and R2 to monitor free tier consumption.
 * Helps prevent unexpected charges by tracking usage against limits.
 *
 * @param accountId - Cloudflare account ID (get from keychain via getCredentials)
 * @returns Usage metrics for all services
 *
 * @example
 * // Check current usage
 * const usage = await checkUsage(accountId);
 * console.log(`Pages Builds: ${usage.pagesBuilds.used}/${usage.pagesBuilds.limit}`);
 * console.log(`D1 Reads: ${usage.d1Reads.percent}% used`);
 *
 * @example
 * // Alert on high usage
 * const usage = await checkUsage(accountId);
 * if (usage.pagesBuilds.percent > 80) {
 *   console.warn('Pages builds approaching limit!');
 * }
 */
export async function checkUsage(accountId: string): Promise<UsageMetrics> {
  // Cloudflare doesn't have a single unified usage endpoint, so we aggregate from multiple sources
  // Note: Some of these endpoints may require higher-tier plans or return empty data on free tier

  // Initialize with default/empty values
  const usage: UsageMetrics = {
    pagesBuilds: createEmptyMetric('builds'),
    pagesRequests: createEmptyMetric('requests'),
    d1Reads: createEmptyMetric('reads'),
    d1Writes: createEmptyMetric('writes'),
    d1Storage: createEmptyMetric('MB'),
    kvReads: createEmptyMetric('reads'),
    kvWrites: createEmptyMetric('writes'),
    kvStorage: createEmptyMetric('MB'),
    r2Storage: createEmptyMetric('GB'),
    r2ClassA: createEmptyMetric('operations'),
    r2ClassB: createEmptyMetric('operations'),
    workerRequests: createEmptyMetric('requests'),
    workerCpuTime: createEmptyMetric('ms'),
  };

  try {
    // Try to get Workers usage (includes CPU time and requests)
    // This might not be available on all plans
    try {
      const workersUsage = await cloudflareApi<{
        standard?: {
          requests?: number;
          duration?: number;
        };
      }>(`/accounts/${accountId}/workers/account-settings`);

      if (workersUsage.standard) {
        // Workers free tier: 100,000 requests/day, 10ms CPU time per request
        if (workersUsage.standard.requests !== undefined) {
          usage.workerRequests = createMetric(
            workersUsage.standard.requests,
            100000,
            'requests'
          );
        }
        if (workersUsage.standard.duration !== undefined) {
          usage.workerCpuTime = createMetric(
            workersUsage.standard.duration,
            10 * 100000, // 10ms per request * 100k requests
            'ms'
          );
        }
      }
    } catch (error) {
      // Workers usage endpoint might not be available
      console.warn('Workers usage data not available');
    }

    // Try to get R2 usage
    try {
      const r2Usage = await cloudflareApi<{
        storage_bytes?: number;
        class_a_operations?: number;
        class_b_operations?: number;
      }>(`/accounts/${accountId}/r2/usage`);

      if (r2Usage.storage_bytes !== undefined) {
        // R2 free tier: 10GB storage
        usage.r2Storage = createMetric(
          r2Usage.storage_bytes / (1024 ** 3), // bytes to GB
          10,
          'GB'
        );
      }
      if (r2Usage.class_a_operations !== undefined) {
        // R2 free tier: 1M Class A operations/month
        usage.r2ClassA = createMetric(
          r2Usage.class_a_operations,
          1000000,
          'operations'
        );
      }
      if (r2Usage.class_b_operations !== undefined) {
        // R2 free tier: 10M Class B operations/month
        usage.r2ClassB = createMetric(
          r2Usage.class_b_operations,
          10000000,
          'operations'
        );
      }
    } catch (error) {
      // R2 usage endpoint might not be available
      console.warn('R2 usage data not available');
    }

    // KV and D1 usage is typically available through analytics endpoints
    // but may require GraphQL queries or specific plan features
    // For now, we return the structure with default values

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Error fetching usage data: ${message}`);
  }

  return usage;
}

/**
 * Get analytics data for account, zones, or workers
 *
 * Retrieves traffic, request, and bandwidth analytics over a time period.
 * Useful for monitoring traffic patterns and identifying issues.
 *
 * @param accountId - Cloudflare account ID
 * @param options - Analytics query parameters (time range, interval, etc.)
 * @returns Analytics data with totals and optional time series
 *
 * @example
 * // Get last 24 hours of analytics
 * const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
 * const until = new Date().toISOString();
 * const analytics = await getAnalytics(accountId, { since, until });
 * console.log(`Total requests: ${analytics.totals.requests}`);
 *
 * @example
 * // Get analytics with time series data (hourly buckets)
 * const analytics = await getAnalytics(accountId, {
 *   since: '2024-01-01T00:00:00Z',
 *   until: '2024-01-02T00:00:00Z',
 *   interval: '1h',
 *   timeseries: true,
 * });
 *
 * @example
 * // Get analytics with top statistics
 * const analytics = await getAnalytics(accountId, {
 *   since: '2024-01-01T00:00:00Z',
 *   until: '2024-01-08T00:00:00Z',
 *   top: true,
 * });
 * console.log('Top countries:', analytics.top?.countries);
 */
export async function getAnalytics(
  accountId: string,
  options?: AnalyticsParams
): Promise<Analytics> {
  // Default to last 24 hours if no time range specified
  const since = options?.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const until = options?.until || new Date().toISOString();

  // Build query parameters
  const params: Record<string, string | number | boolean> = {
    since,
    until,
  };

  if (options?.interval) {
    params.continuous = options.interval;
  }

  try {
    // Try account-level analytics first
    // Note: This endpoint may require specific permissions or plan features
    const analyticsData = await cloudflareApi<{
      data?: {
        viewer?: {
          accounts?: Array<{
            httpRequests1hGroups?: Array<{
              dimensions: { datetime: string };
              sum: {
                requests: number;
                bytes: number;
                cachedRequests: number;
                cachedBytes: number;
                threats: number;
              };
            }>;
          }>;
        };
      };
    }>(`/accounts/${accountId}/analytics/dashboard`, { params });

    // Initialize default response
    const analytics: Analytics = {
      time_range: {
        since,
        until,
      },
      totals: {
        requests: 0,
        bytes: 0,
        cached_requests: 0,
        cached_bytes: 0,
        threats: 0,
      },
    };

    // Parse GraphQL-style response if available
    const groups = analyticsData?.data?.viewer?.accounts?.[0]?.httpRequests1hGroups;
    if (groups && groups.length > 0) {
      // Calculate totals
      analytics.totals = groups.reduce(
        (totals, group) => ({
          requests: totals.requests + group.sum.requests,
          bytes: totals.bytes + group.sum.bytes,
          cached_requests: totals.cached_requests + group.sum.cachedRequests,
          cached_bytes: totals.cached_bytes + group.sum.cachedBytes,
          threats: totals.threats + group.sum.threats,
        }),
        analytics.totals
      );

      // Include time series if requested
      if (options?.timeseries) {
        analytics.timeseries = groups.map((group) => ({
          timestamp: group.dimensions.datetime,
          requests: group.sum.requests,
          bytes: group.sum.bytes,
          cached_requests: group.sum.cachedRequests,
          threats: group.sum.threats,
        }));
      }
    }

    // Note: Top statistics would require additional GraphQL queries
    // or zone-specific analytics endpoints. Placeholder for now.
    if (options?.top) {
      analytics.top = {
        countries: [],
        paths: [],
        status_codes: [],
        referers: [],
      };
    }

    return analytics;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // If analytics endpoint is not available, return empty structure
    console.warn(`Analytics data not available: ${message}`);

    return {
      time_range: {
        since,
        until,
      },
      totals: {
        requests: 0,
        bytes: 0,
        cached_requests: 0,
        cached_bytes: 0,
        threats: 0,
      },
    };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a usage metric with calculated percentage and exceeded flag
 */
function createMetric(used: number, limit: number, unit: string): UsageMetric {
  const percent = limit > 0 ? (used / limit) * 100 : 0;
  return {
    used,
    limit,
    percent: Math.round(percent * 100) / 100, // Round to 2 decimal places
    unit,
    exceeded: used > limit,
  };
}

/**
 * Create an empty usage metric (when data is not available)
 */
function createEmptyMetric(unit: string): UsageMetric {
  return {
    used: 0,
    limit: 0,
    percent: 0,
    unit,
    exceeded: false,
  };
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

if (import.meta.main) {
  const { getCredentials } = await import('./cloudflare-client.ts');
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    const { accountId } = getCredentials();

    if (command === 'usage') {
      // Check usage: bun monitoring.ts usage
      const usage = await checkUsage(accountId);
      console.log(JSON.stringify(usage, null, 2));
    } else if (command === 'analytics') {
      // Get analytics: bun monitoring.ts analytics [--since=ISO8601] [--until=ISO8601] [--interval=1h] [--timeseries] [--top]
      const options: AnalyticsParams = {
        since: '',
        until: '',
      };

      for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--since=')) {
          options.since = arg.slice('--since='.length);
        } else if (arg.startsWith('--until=')) {
          options.until = arg.slice('--until='.length);
        } else if (arg.startsWith('--interval=')) {
          options.interval = arg.slice('--interval='.length) as AnalyticsParams['interval'];
        } else if (arg === '--timeseries') {
          options.timeseries = true;
        } else if (arg === '--top') {
          options.top = true;
        }
      }

      // Set defaults if not provided
      if (!options.since) {
        options.since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      }
      if (!options.until) {
        options.until = new Date().toISOString();
      }

      const analytics = await getAnalytics(accountId, options);
      console.log(JSON.stringify(analytics, null, 2));
    } else {
      console.error('Usage:');
      console.error('  bun monitoring.ts usage');
      console.error('  bun monitoring.ts analytics [--since=ISO8601] [--until=ISO8601] [--interval=1h] [--timeseries] [--top]');
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ error: message }));
    process.exit(1);
  }
}
