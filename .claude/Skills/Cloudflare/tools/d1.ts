/**
 * Cloudflare D1 Database Inspection Tools
 *
 * Read-only operations for inspecting D1 databases and executing SELECT queries.
 * All operations use macOS Keychain for authentication.
 *
 * CRITICAL: Only SELECT queries are allowed. Use wrangler CLI for mutations.
 */

import { cloudflareApi, validateReadOnlyQuery } from './cloudflare-client.ts';
import type { D1Database, D1QueryResult, D1QueryParams } from './interfaces.ts';

// =============================================================================
// D1 DATABASE LISTING
// =============================================================================

/**
 * List all D1 databases in the Cloudflare account
 *
 * @param accountId - Cloudflare account ID
 * @returns Array of D1 databases
 *
 * @example
 * // List all D1 databases
 * const databases = await listD1Databases(accountId);
 *
 * @example
 * // Find a database by name
 * const databases = await listD1Databases(accountId);
 * const myDb = databases.find(db => db.name === 'my-database');
 */
export async function listD1Databases(accountId: string): Promise<D1Database[]> {
  return await cloudflareApi<D1Database[]>(`/accounts/${accountId}/d1/database`);
}

// =============================================================================
// D1 SCHEMA INSPECTION
// =============================================================================

/**
 * Get database schema information (tables, columns, indexes)
 *
 * @param accountId - Cloudflare account ID
 * @param databaseId - D1 database UUID (get from listD1Databases)
 * @returns Database schema information
 *
 * @example
 * // Get schema for a database
 * const schema = await getD1Schema(accountId, databaseId);
 *
 * @example
 * // List all tables
 * const schema = await getD1Schema(accountId, databaseId);
 * const tableNames = schema.tables.map(t => t.name);
 *
 * @example
 * // Get columns for a specific table
 * const schema = await getD1Schema(accountId, databaseId);
 * const usersTable = schema.tables.find(t => t.name === 'users');
 * const columns = usersTable?.columns.map(c => `${c.name}: ${c.type}`);
 */
export async function getD1Schema(
  accountId: string,
  databaseId: string
): Promise<{
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
}> {
  // Get all tables using sqlite_master
  const tablesQuery: D1QueryParams = {
    sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  };

  const tablesResult = await cloudflareApi<D1QueryResult[]>(
    `/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      body: tablesQuery,
    }
  );

  const tableNames = tablesResult[0]?.results.map((row: any) => row.name as string) || [];

  // Get schema for each table
  const tables = await Promise.all(
    tableNames.map(async (tableName) => {
      // Get columns using PRAGMA table_info
      const columnsQuery: D1QueryParams = {
        sql: `PRAGMA table_info(${tableName})`,
      };

      const columnsResult = await cloudflareApi<D1QueryResult[]>(
        `/accounts/${accountId}/d1/database/${databaseId}/query`,
        {
          method: 'POST',
          body: columnsQuery,
        }
      );

      const columns = (columnsResult[0]?.results || []).map((col: any) => ({
        name: col.name as string,
        type: col.type as string,
        notnull: Boolean(col.notnull),
        dflt_value: col.dflt_value as string | null,
        pk: col.pk as number,
      }));

      // Get indexes using PRAGMA index_list
      const indexesQuery: D1QueryParams = {
        sql: `PRAGMA index_list(${tableName})`,
      };

      const indexesResult = await cloudflareApi<D1QueryResult[]>(
        `/accounts/${accountId}/d1/database/${databaseId}/query`,
        {
          method: 'POST',
          body: indexesQuery,
        }
      );

      const indexes = await Promise.all(
        (indexesResult[0]?.results || []).map(async (idx: any) => {
          // Get index columns using PRAGMA index_info
          const indexInfoQuery: D1QueryParams = {
            sql: `PRAGMA index_info(${idx.name})`,
          };

          const indexInfoResult = await cloudflareApi<D1QueryResult[]>(
            `/accounts/${accountId}/d1/database/${databaseId}/query`,
            {
              method: 'POST',
              body: indexInfoQuery,
            }
          );

          const indexColumns = (indexInfoResult[0]?.results || []).map(
            (col: any) => col.name as string
          );

          return {
            name: idx.name as string,
            unique: Boolean(idx.unique),
            columns: indexColumns,
          };
        })
      );

      return {
        name: tableName,
        columns,
        indexes,
      };
    })
  );

  return { tables };
}

// =============================================================================
// D1 QUERY EXECUTION (READ-ONLY)
// =============================================================================

/**
 * Execute a SELECT query on a D1 database
 *
 * CRITICAL: Only SELECT queries are allowed. This is enforced by validation.
 * Use wrangler CLI for INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, TRUNCATE.
 *
 * @param accountId - Cloudflare account ID
 * @param databaseId - D1 database UUID (get from listD1Databases)
 * @param sql - SQL SELECT query
 * @param params - Optional query parameters for parameterized queries
 * @returns Query results
 * @throws Error if query contains non-SELECT operations
 *
 * @example
 * // Simple SELECT query
 * const result = await queryD1(accountId, databaseId, 'SELECT * FROM users LIMIT 10');
 * console.log(result.results);
 *
 * @example
 * // Parameterized query
 * const result = await queryD1(
 *   accountId,
 *   databaseId,
 *   'SELECT * FROM users WHERE email = ?',
 *   ['user@example.com']
 * );
 *
 * @example
 * // Query with metadata
 * const result = await queryD1(accountId, databaseId, 'SELECT COUNT(*) as total FROM users');
 * console.log(`Query took ${result.meta.duration}ms`);
 * console.log(`Rows read: ${result.meta.rows_read}`);
 *
 * @example
 * // WITH clause (CTE) - allowed
 * const result = await queryD1(
 *   accountId,
 *   databaseId,
 *   `WITH active_users AS (SELECT * FROM users WHERE active = 1)
 *    SELECT COUNT(*) FROM active_users`
 * );
 */
export async function queryD1(
  accountId: string,
  databaseId: string,
  sql: string,
  params?: Array<string | number | boolean | null>
): Promise<D1QueryResult> {
  // CRITICAL: Validate query is SELECT only
  validateReadOnlyQuery(sql);

  const queryParams: D1QueryParams = { sql };
  if (params && params.length > 0) {
    queryParams.params = params;
  }

  const results = await cloudflareApi<D1QueryResult[]>(
    `/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: 'POST',
      body: queryParams,
    }
  );

  // The API returns an array of results (for batch queries), we only send one
  return results[0];
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === 'list') {
      // List D1 databases: bun d1.ts list <account-id>
      if (args.length < 2) {
        console.error('Usage: bun d1.ts list <account-id>');
        process.exit(1);
      }

      const accountId = args[1];
      const databases = await listD1Databases(accountId);
      console.log(JSON.stringify(databases, null, 2));
    } else if (command === 'schema') {
      // Get database schema: bun d1.ts schema <account-id> <database-id>
      if (args.length < 3) {
        console.error('Usage: bun d1.ts schema <account-id> <database-id>');
        process.exit(1);
      }

      const accountId = args[1];
      const databaseId = args[2];
      const schema = await getD1Schema(accountId, databaseId);
      console.log(JSON.stringify(schema, null, 2));
    } else if (command === 'query') {
      // Execute query: bun d1.ts query <account-id> <database-id> "<sql>"
      if (args.length < 4) {
        console.error('Usage: bun d1.ts query <account-id> <database-id> "<sql>"');
        console.error('Example: bun d1.ts query acc123 db456 "SELECT * FROM users LIMIT 10"');
        process.exit(1);
      }

      const accountId = args[1];
      const databaseId = args[2];
      const sql = args[3];

      const result = await queryD1(accountId, databaseId, sql);
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('Usage:');
      console.error('  bun d1.ts list <account-id>');
      console.error('  bun d1.ts schema <account-id> <database-id>');
      console.error('  bun d1.ts query <account-id> <database-id> "<sql>"');
      console.error('');
      console.error('Note: Only SELECT queries are allowed for security.');
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ error: message }));
    process.exit(1);
  }
}
