/**
 * TypeScript interfaces for Cloudflare Skill Tools
 *
 * All interfaces for read-only inspection and troubleshooting operations.
 * Organized by phase: Zone/DNS, Pages/Workers, Storage, Monitoring.
 *
 * Authentication uses macOS Keychain (keychain-api service).
 * All operations are read-only - deployments happen via CI/CD.
 */

// =============================================================================
// AUTHENTICATION & CREDENTIALS
// =============================================================================

/**
 * Cloudflare credentials retrieved from macOS Keychain
 */
export interface CloudflareCredentials {
  /** API token with read-only permissions */
  token: string;
  /** Cloudflare account ID */
  accountId: string;
}

/**
 * Keychain service and account names for credential retrieval
 */
export interface KeychainConfig {
  service: string;
  tokenAccount: string;
  accountIdAccount: string;
}

// =============================================================================
// COMMON API RESPONSE TYPES
// =============================================================================

/**
 * Standard Cloudflare API response wrapper
 */
export interface CloudflareResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Error objects if request failed */
  errors: CloudflareApiError[];
  /** Informational messages */
  messages: string[];
  /** The actual response data */
  result: T;
  /** Pagination info for list endpoints */
  result_info?: PaginationInfo;
}

/**
 * Cloudflare API error object
 */
export interface CloudflareApiError {
  /** Error code */
  code: number;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  error_chain?: Array<{ code: number; message: string }>;
}

/**
 * Pagination metadata for list endpoints
 */
export interface PaginationInfo {
  /** Current page number */
  page: number;
  /** Items per page */
  per_page: number;
  /** Total number of items */
  count: number;
  /** Total number of pages */
  total_pages: number;
  /** Total items across all pages */
  total_count: number;
}

/**
 * Common query parameters for paginated list requests
 */
export interface PaginationParams {
  /** Page number (default: 1) */
  page?: number;
  /** Items per page (default: 20, max: 100) */
  per_page?: number;
  /** Field to order by */
  order?: string;
  /** Sort direction */
  direction?: 'asc' | 'desc';
}

// =============================================================================
// PHASE 1: ZONE & DNS INSPECTION
// =============================================================================

/**
 * Cloudflare zone (domain) information
 */
export interface Zone {
  /** Zone ID */
  id: string;
  /** Domain name */
  name: string;
  /** Zone status */
  status: 'active' | 'pending' | 'initializing' | 'moved' | 'deleted' | 'deactivated';
  /** Whether zone is paused */
  paused: boolean;
  /** Zone type */
  type: 'full' | 'partial';
  /** Development mode setting (0-7 days remaining) */
  development_mode: number;
  /** Name servers assigned to zone */
  name_servers: string[];
  /** Original name servers before Cloudflare */
  original_name_servers: string[];
  /** Original registrar */
  original_registrar: string | null;
  /** Original DNS host */
  original_dnshost: string | null;
  /** When the zone was created */
  created_on: string;
  /** When the zone was last modified */
  modified_on: string;
  /** When nameservers were activated */
  activated_on: string | null;
  /** Account the zone belongs to */
  account: {
    id: string;
    name: string;
  };
  /** Plan information */
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    frequency: string;
    legacy_id: string;
    is_subscribed: boolean;
    can_subscribe: boolean;
  };
}

/**
 * Zone settings configuration
 */
export interface ZoneSettings {
  /** Always use HTTPS */
  always_use_https: ZoneSetting<'on' | 'off'>;
  /** Automatic HTTPS rewrites */
  automatic_https_rewrites: ZoneSetting<'on' | 'off'>;
  /** Browser cache TTL */
  browser_cache_ttl: ZoneSetting<number>;
  /** Browser check */
  browser_check: ZoneSetting<'on' | 'off'>;
  /** Cache level */
  cache_level: ZoneSetting<'aggressive' | 'basic' | 'simplified'>;
  /** Development mode */
  development_mode: ZoneSetting<'on' | 'off'>;
  /** Email obfuscation */
  email_obfuscation: ZoneSetting<'on' | 'off'>;
  /** Hotlink protection */
  hotlink_protection: ZoneSetting<'on' | 'off'>;
  /** IP geolocation */
  ip_geolocation: ZoneSetting<'on' | 'off'>;
  /** IPv6 */
  ipv6: ZoneSetting<'on' | 'off'>;
  /** Minify settings */
  minify: ZoneSetting<{ css: 'on' | 'off'; html: 'on' | 'off'; js: 'on' | 'off' }>;
  /** Security level */
  security_level: ZoneSetting<'essentially_off' | 'low' | 'medium' | 'high' | 'under_attack'>;
  /** SSL mode */
  ssl: ZoneSetting<'off' | 'flexible' | 'full' | 'strict'>;
  /** TLS 1.3 */
  tls_1_3: ZoneSetting<'on' | 'off' | 'zrt'>;
  /** WAF */
  waf: ZoneSetting<'on' | 'off'>;
}

/**
 * Individual zone setting
 */
export interface ZoneSetting<T> {
  /** Setting ID */
  id: string;
  /** Setting value */
  value: T;
  /** When the setting was last modified */
  modified_on: string | null;
  /** Whether the setting is editable */
  editable: boolean;
}

/**
 * DNS record
 */
export interface DnsRecord {
  /** Record ID */
  id: string;
  /** Zone ID */
  zone_id: string;
  /** Zone name */
  zone_name: string;
  /** Record name (e.g., example.com or subdomain.example.com) */
  name: string;
  /** Record type */
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS' | 'SRV' | 'CAA' | 'PTR' | 'CERT' | 'DNSKEY' | 'DS' | 'NAPTR' | 'SMIMEA' | 'SSHFP' | 'TLSA' | 'URI';
  /** Record content (IP, domain, text, etc.) */
  content: string;
  /** Whether proxy is enabled (orange cloud) */
  proxied: boolean;
  /** TTL in seconds (1 = automatic) */
  ttl: number;
  /** Whether the record is locked */
  locked: boolean;
  /** Priority (for MX, SRV records) */
  priority?: number;
  /** When the record was created */
  created_on: string;
  /** When the record was last modified */
  modified_on: string;
  /** Record metadata */
  meta: {
    auto_added: boolean;
    managed_by_apps: boolean;
    managed_by_argo_tunnel: boolean;
  };
}

/**
 * Parameters for listing DNS records
 */
export interface ListDnsRecordsParams extends PaginationParams {
  /** Filter by record type */
  type?: DnsRecord['type'];
  /** Filter by record name */
  name?: string;
  /** Filter by record content */
  content?: string;
  /** Filter by proxied status */
  proxied?: boolean;
}

// =============================================================================
// PHASE 2: PAGES & WORKERS INSPECTION
// =============================================================================

/**
 * Cloudflare Pages project
 */
export interface PagesProject {
  /** Project ID */
  id: string;
  /** Project name */
  name: string;
  /** Subdomain (e.g., project-name.pages.dev) */
  subdomain: string;
  /** Custom domains */
  domains: string[];
  /** Source repository information */
  source: {
    type: 'github' | 'gitlab';
    config: {
      owner: string;
      repo_name: string;
      production_branch: string;
      pr_comments_enabled: boolean;
      deployments_enabled: boolean;
      production_deployments_enabled: boolean;
      preview_deployment_setting: 'all' | 'none' | 'custom';
      preview_branch_includes?: string[];
      preview_branch_excludes?: string[];
    };
  } | null;
  /** Build configuration */
  build_config: {
    build_command: string;
    destination_dir: string;
    root_dir: string;
    web_analytics_tag?: string;
    web_analytics_token?: string;
  };
  /** Deployment configurations */
  deployment_configs: {
    preview: DeploymentConfig;
    production: DeploymentConfig;
  };
  /** Latest deployment */
  latest_deployment: PagesDeployment | null;
  /** When the project was created */
  created_on: string;
  /** Canonical deployment URL */
  canonical_deployment: {
    id: string;
    url: string;
    environment: 'production' | 'preview';
  };
  /** Production branch */
  production_branch: string;
}

/**
 * Deployment configuration (environment variables, etc.)
 */
export interface DeploymentConfig {
  /** Environment variables - names and types only, values never exposed (read-only) */
  env_vars: Record<string, { type: 'plain_text' | 'secret_text' }>;
  /** KV namespace bindings */
  kv_namespaces: Record<string, { namespace_id: string }>;
  /** Durable Object bindings */
  durable_object_namespaces: Record<string, { namespace_id: string }>;
  /** D1 database bindings */
  d1_databases: Record<string, { id: string }>;
  /** R2 bucket bindings */
  r2_buckets: Record<string, { name: string }>;
  /** Service bindings */
  services: Record<string, { service: string; environment: string }>;
  /** Compatibility date */
  compatibility_date?: string;
  /** Compatibility flags */
  compatibility_flags?: string[];
}

/**
 * Cloudflare Pages deployment
 */
export interface PagesDeployment {
  /** Deployment ID */
  id: string;
  /** Short ID (first 8 chars) */
  short_id: string;
  /** Project ID */
  project_id: string;
  /** Project name */
  project_name: string;
  /** Environment */
  environment: 'production' | 'preview';
  /** Deployment URL */
  url: string;
  /** When the deployment was created */
  created_on: string;
  /** When the deployment was modified */
  modified_on: string;
  /** Deployment source */
  source: {
    type: 'github' | 'gitlab' | 'direct';
    config: {
      owner?: string;
      repo_name?: string;
      branch?: string;
      commit_hash?: string;
      commit_message?: string;
      commit_dirty?: boolean;
      pr_number?: number;
    };
  } | null;
  /** Build configuration used */
  build_config: {
    build_command: string;
    destination_dir: string;
    root_dir: string;
  };
  /** Deployment stages and their status */
  stages: Array<{
    name: 'queued' | 'initialize' | 'clone_repo' | 'build' | 'deploy';
    status: 'idle' | 'active' | 'success' | 'failure' | 'canceled' | 'skipped';
    started_on: string | null;
    ended_on: string | null;
  }>;
  /** Latest deployment stage */
  latest_stage: {
    name: string;
    status: string;
    started_on: string | null;
    ended_on: string | null;
  };
  /** Aliases (custom domains) */
  aliases: string[];
  /** Production branch */
  production_branch: string | null;
  /** Build image major version */
  build_image_major_version: number;
}

/**
 * Deployment status summary
 */
export interface DeploymentStatus {
  /** Deployment ID */
  id: string;
  /** Current status */
  status: 'queued' | 'building' | 'deploying' | 'success' | 'failure' | 'canceled';
  /** Deployment URL if successful */
  url?: string;
  /** Error message if failed */
  error?: string;
  /** Build progress (0-100) */
  progress?: number;
  /** Current stage */
  current_stage?: string;
  /** Started at */
  started_at: string;
  /** Completed at */
  completed_at?: string;
}

/**
 * Parameters for listing Pages deployments
 */
export interface ListPagesDeploymentsParams extends PaginationParams {
  /** Filter by environment */
  env?: 'production' | 'preview';
  /** Filter by branch */
  branch?: string;
}

/**
 * Cloudflare Worker script
 */
export interface Worker {
  /** Worker ID (script name) */
  id: string;
  /** When the worker was created */
  created_on: string;
  /** When the worker was last modified */
  modified_on: string;
  /** ETags for the worker */
  etag: string;
  /** Worker usage model */
  usage_model: 'bundled' | 'unbound';
  /** Environment (e.g., production) */
  environment?: string;
  /** Script size in bytes */
  size?: number;
  /** Whether logpush is enabled */
  logpush: boolean;
  /** Cron triggers */
  cron_triggers?: Array<{
    cron: string;
    created_on: string;
    modified_on: string;
  }>;
  /** Routes the worker is bound to */
  routes?: Array<{
    id: string;
    pattern: string;
    enabled: boolean;
  }>;
}

/**
 * Worker details including bindings
 */
export interface WorkerDetails extends Worker {
  /** Script content (read-only) */
  script?: string;
  /** Bindings configuration */
  bindings: {
    kv_namespaces?: Array<{
      name: string;
      namespace_id: string;
    }>;
    durable_objects?: Array<{
      name: string;
      class_name: string;
      script_name?: string;
      environment?: string;
    }>;
    r2_buckets?: Array<{
      name: string;
      bucket_name: string;
    }>;
    d1_databases?: Array<{
      name: string;
      id: string;
    }>;
    services?: Array<{
      name: string;
      service: string;
      environment?: string;
    }>;
    env_vars?: Array<{
      name: string;
      type: 'plain_text' | 'secret_text';
    }>;
  };
  /** Compatibility date */
  compatibility_date?: string;
  /** Compatibility flags */
  compatibility_flags?: string[];
}

// =============================================================================
// PHASE 3: STORAGE INSPECTION
// =============================================================================

/**
 * D1 database
 */
export interface D1Database {
  /** Database ID */
  uuid: string;
  /** Database name */
  name: string;
  /** When the database was created */
  created_at: string;
  /** Database version */
  version: string;
  /** Number of tables */
  num_tables: number;
  /** Database file size in bytes */
  file_size: number;
}

/**
 * D1 database schema information
 */
export interface D1Schema {
  /** List of tables */
  tables: Array<{
    name: string;
    columns: Array<{
      name: string;
      type: string;
      notnull: boolean;
      dflt_value: string | null;
      pk: number;
    }>;
    indexes: Array<{
      name: string;
      unique: boolean;
      columns: string[];
    }>;
  }>;
  /** List of views */
  views: Array<{
    name: string;
    sql: string;
  }>;
  /** List of triggers */
  triggers: Array<{
    name: string;
    table: string;
    sql: string;
  }>;
}

/**
 * D1 query result
 */
export interface D1QueryResult {
  /** Query results */
  results: Array<Record<string, unknown>>;
  /** Whether the query was successful */
  success: boolean;
  /** Query metadata */
  meta: {
    /** Query duration in milliseconds */
    duration: number;
    /** Number of rows read */
    rows_read: number;
    /** Number of rows written (should be 0 for SELECT) */
    rows_written: number;
    /** Last row ID (for INSERT) */
    last_row_id?: number;
    /** Number of rows changed (for UPDATE/DELETE) */
    changes?: number;
    /** Size served in bytes */
    size_after?: number;
  };
  /** Error messages if query failed */
  errors?: string[];
}

/**
 * Parameters for D1 query
 */
export interface D1QueryParams {
  /** SQL query (SELECT only) */
  sql: string;
  /** Query parameters for parameterized queries */
  params?: Array<string | number | boolean | null>;
}

/**
 * KV namespace
 */
export interface KVNamespace {
  /** Namespace ID */
  id: string;
  /** Namespace title */
  title: string;
  /** When the namespace was created */
  created_on?: string;
  /** When the namespace was last modified */
  modified_on?: string;
  /** Whether this supports local storage */
  supports_url_encoding?: boolean;
}

/**
 * KV key-value pair
 */
export interface KVValue {
  /** Key name */
  name: string;
  /** Value (as string) */
  value: string;
  /** Expiration timestamp (if set) */
  expiration?: number;
  /** Metadata (if set) */
  metadata?: Record<string, unknown>;
}

/**
 * KV key metadata (for listing keys)
 */
export interface KVKey {
  /** Key name */
  name: string;
  /** Expiration timestamp (if set) */
  expiration?: number;
  /** Metadata (if set) */
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for listing KV keys
 */
export interface ListKVKeysParams {
  /** Cursor for pagination */
  cursor?: string;
  /** Number of keys to return (max: 1000) */
  limit?: number;
  /** Filter keys by prefix */
  prefix?: string;
}

/**
 * R2 bucket
 */
export interface R2Bucket {
  /** Bucket name */
  name: string;
  /** When the bucket was created */
  creation_date: string;
  /** Bucket location (optional) */
  location?: string;
}

/**
 * R2 bucket usage statistics
 */
export interface R2BucketUsage {
  /** Bucket name */
  bucket: string;
  /** Storage usage in bytes */
  storage_bytes: number;
  /** Number of objects */
  object_count: number;
  /** Class A operations (list, write) */
  class_a_operations: number;
  /** Class B operations (read) */
  class_b_operations: number;
  /** Infrequent access storage (if applicable) */
  infrequent_access_storage_bytes?: number;
}

// =============================================================================
// PHASE 4: MONITORING & ANALYTICS
// =============================================================================

/**
 * Usage metrics for free tier monitoring
 */
export interface UsageMetrics {
  /** Pages builds usage */
  pagesBuilds: UsageMetric;
  /** Pages requests usage */
  pagesRequests: UsageMetric;
  /** D1 reads usage */
  d1Reads: UsageMetric;
  /** D1 writes usage */
  d1Writes: UsageMetric;
  /** D1 storage usage */
  d1Storage: UsageMetric;
  /** KV reads usage */
  kvReads: UsageMetric;
  /** KV writes usage */
  kvWrites: UsageMetric;
  /** KV storage usage */
  kvStorage: UsageMetric;
  /** R2 storage usage */
  r2Storage: UsageMetric;
  /** R2 Class A operations */
  r2ClassA: UsageMetric;
  /** R2 Class B operations */
  r2ClassB: UsageMetric;
  /** Worker requests usage */
  workerRequests: UsageMetric;
  /** Worker CPU time usage */
  workerCpuTime: UsageMetric;
}

/**
 * Individual usage metric
 */
export interface UsageMetric {
  /** Current usage */
  used: number;
  /** Free tier limit */
  limit: number;
  /** Percentage used (0-100+) */
  percent: number;
  /** Unit of measurement */
  unit: string;
  /** Whether limit is exceeded */
  exceeded: boolean;
}

/**
 * Analytics data for zones and workers
 */
export interface Analytics {
  /** Time range for analytics */
  time_range: {
    since: string;
    until: string;
  };
  /** Aggregated totals */
  totals: {
    /** Total requests */
    requests: number;
    /** Total bandwidth in bytes */
    bytes: number;
    /** Cached requests */
    cached_requests: number;
    /** Cached bandwidth in bytes */
    cached_bytes: number;
    /** Unique visitors */
    unique_visitors?: number;
    /** Page views */
    page_views?: number;
    /** Threats blocked */
    threats: number;
  };
  /** Time series data */
  timeseries?: Array<{
    /** Timestamp */
    timestamp: string;
    /** Requests in this time bucket */
    requests: number;
    /** Bandwidth in this time bucket */
    bytes: number;
    /** Cached requests in this time bucket */
    cached_requests: number;
    /** Threats in this time bucket */
    threats: number;
  }>;
  /** Top statistics */
  top?: {
    /** Top countries by requests */
    countries?: Array<{ country: string; requests: number }>;
    /** Top paths by requests */
    paths?: Array<{ path: string; requests: number }>;
    /** Top status codes */
    status_codes?: Array<{ status: number; requests: number }>;
    /** Top referers */
    referers?: Array<{ referer: string; requests: number }>;
  };
}

/**
 * Parameters for analytics queries
 */
export interface AnalyticsParams {
  /** Start time (ISO 8601) */
  since: string;
  /** End time (ISO 8601) */
  until: string;
  /** Time interval (1m, 15m, 1h, 1d, 1w) */
  interval?: '1m' | '15m' | '1h' | '1d' | '1w';
  /** Whether to include time series data */
  timeseries?: boolean;
  /** Whether to include top statistics */
  top?: boolean;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Rate limit information from API response headers
 */
export interface RateLimitInfo {
  /** Requests limit */
  limit: number;
  /** Requests remaining */
  remaining: number;
  /** When the limit resets (Unix timestamp) */
  reset: number;
}

/**
 * Options for API retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retries */
  maxRetries: number;
  /** Initial backoff delay in ms */
  initialDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Maximum backoff delay in ms */
  maxDelay: number;
}
