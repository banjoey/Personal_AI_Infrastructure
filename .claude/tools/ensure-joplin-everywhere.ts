#!/usr/bin/env bun

/**
 * ensure-joplin-everywhere.ts
 *
 * Scans all project .mcp.json files and ensures Joplin is configured in each.
 * Run this whenever you suspect Joplin is missing from projects.
 *
 * Usage:
 *   bun ~/.claude/tools/ensure-joplin-everywhere.ts [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be changed without modifying files
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

const JOPLIN_CONFIG = {
  command: '/Users/jbarkley/.claude/mcp-venvs/joplin/bin/joplin-mcp-server',
  args: ['--config', '/Users/jbarkley/.claude/mcp-configs/joplin.json'],
  description: 'Joplin note-taking - REQUIRED for all projects. Documentation source of truth.'
};

const SEARCH_ROOTS = [
  '/Users/jbarkley/src',
  '/Users/jbarkley/Projects',
];

const IGNORE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.cache',
  'venv',
  '.venv',
];

interface McpConfig {
  mcpServers: Record<string, unknown>;
}

function findMcpConfigs(dir: string, results: string[] = []): string[] {
  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      if (IGNORE_DIRS.includes(entry)) continue;

      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Check for .mcp.json in this directory
          const mcpPath = join(fullPath, '.mcp.json');
          const claudeMcpPath = join(fullPath, '.claude', '.mcp.json');

          if (existsSync(mcpPath)) results.push(mcpPath);
          if (existsSync(claudeMcpPath)) results.push(claudeMcpPath);

          // Recurse (but not too deep)
          const depth = fullPath.split('/').length;
          if (depth < 10) {
            findMcpConfigs(fullPath, results);
          }
        }
      } catch (e) {
        // Skip inaccessible directories
      }
    }
  } catch (e) {
    // Skip inaccessible directories
  }

  return results;
}

function ensureJoplin(configPath: string, dryRun: boolean): { modified: boolean; error?: string } {
  try {
    const content = readFileSync(configPath, 'utf-8');
    const config: McpConfig = JSON.parse(content);

    if (!config.mcpServers) {
      config.mcpServers = {};
    }

    if (config.mcpServers.joplin) {
      return { modified: false };
    }

    // Add Joplin at the beginning (it's most important)
    const newServers: Record<string, unknown> = {
      joplin: JOPLIN_CONFIG,
      ...config.mcpServers,
    };
    config.mcpServers = newServers;

    if (!dryRun) {
      writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    }

    return { modified: true };
  } catch (e) {
    return { modified: false, error: String(e) };
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('🔍 Scanning for .mcp.json files...\n');

  const allConfigs: string[] = [];

  for (const root of SEARCH_ROOTS) {
    if (existsSync(root)) {
      console.log(`  Scanning ${root}...`);
      findMcpConfigs(root, allConfigs);
    }
  }

  console.log(`\n📋 Found ${allConfigs.length} project MCP configs\n`);

  let modified = 0;
  let alreadyHas = 0;
  let errors = 0;

  for (const configPath of allConfigs) {
    const result = ensureJoplin(configPath, dryRun);

    if (result.error) {
      console.log(`❌ ${configPath}`);
      console.log(`   Error: ${result.error}`);
      errors++;
    } else if (result.modified) {
      console.log(`✅ ${dryRun ? '[DRY RUN] Would add' : 'Added'} Joplin to: ${configPath}`);
      modified++;
    } else {
      console.log(`✓  Already has Joplin: ${configPath}`);
      alreadyHas++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ${alreadyHas} already have Joplin`);
  console.log(`   ${modified} ${dryRun ? 'would be' : 'were'} modified`);
  console.log(`   ${errors} errors`);

  if (dryRun && modified > 0) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }

  if (modified > 0 && !dryRun) {
    console.log('\n⚠️  Restart Claude Code to pick up changes');
  }
}

main();
