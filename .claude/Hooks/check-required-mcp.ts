#!/usr/bin/env bun

/**
 * check-required-mcp.ts
 *
 * Validates that required MCP servers are configured for the current project.
 * Runs at SessionStart to warn if critical MCPs (like Joplin) are missing.
 *
 * REQUIRED MCPs:
 * - joplin: Documentation source of truth, must be available in ALL projects
 *
 * This hook checks the project's .mcp.json (or .claude/.mcp.json) and emits
 * a warning to the session context if required MCPs are missing.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Required MCPs that must be present in every project
const REQUIRED_MCPS = ['joplin'];

// Template config for Joplin (to provide fix instructions)
const JOPLIN_CONFIG = {
  command: '/Users/jbarkley/.claude/mcp-venvs/joplin/bin/joplin-mcp-server',
  args: ['--config', '/Users/jbarkley/.claude/mcp-configs/joplin.json'],
  description: 'Joplin note-taking - REQUIRED for all projects. Documentation source of truth.'
};

interface McpConfig {
  mcpServers?: Record<string, unknown>;
}

function findMcpConfig(cwd: string): { path: string; config: McpConfig } | null {
  // Check locations in order of precedence
  const locations = [
    join(cwd, '.mcp.json'),
    join(cwd, '.claude', '.mcp.json'),
  ];

  for (const location of locations) {
    if (existsSync(location)) {
      try {
        const content = readFileSync(location, 'utf-8');
        return { path: location, config: JSON.parse(content) };
      } catch (e) {
        console.error(`Error reading ${location}:`, e);
      }
    }
  }

  return null;
}

function checkRequiredMcps(config: McpConfig): string[] {
  const configured = Object.keys(config.mcpServers || {});
  return REQUIRED_MCPS.filter(mcp => !configured.includes(mcp));
}

async function main() {
  try {
    // Read hook input from stdin
    let input = '';
    try {
      input = await Bun.stdin.text();
    } catch {
      // No stdin, use cwd
    }

    let cwd = process.cwd();
    if (input) {
      try {
        const data = JSON.parse(input);
        cwd = data.cwd || cwd;
      } catch {}
    }

    // Check if this is a subagent session - if so, exit silently
    const claudeProjectDir = process.env.CLAUDE_PROJECT_DIR || '';
    const isSubagent = claudeProjectDir.includes('/.claude/agents/') ||
                      process.env.CLAUDE_AGENT_TYPE !== undefined;

    if (isSubagent) {
      process.exit(0);
    }

    // Find and check MCP config
    const mcpResult = findMcpConfig(cwd);

    if (!mcpResult) {
      // No project-level MCP config found - global config applies
      // Check global config
      const globalConfig = join(process.env.HOME || '', '.claude', '.mcp.json');
      if (existsSync(globalConfig)) {
        const content = readFileSync(globalConfig, 'utf-8');
        const config = JSON.parse(content);
        const missing = checkRequiredMcps(config);

        if (missing.length > 0) {
          emitWarning(missing, globalConfig, 'global');
        }
      }
      process.exit(0);
    }

    const missing = checkRequiredMcps(mcpResult.config);

    if (missing.length > 0) {
      emitWarning(missing, mcpResult.path, 'project');
    }

    process.exit(0);
  } catch (error) {
    console.error('check-required-mcp error:', error);
    process.exit(0); // Don't fail the session
  }
}

function emitWarning(missing: string[], configPath: string, scope: 'global' | 'project') {
  const warnings = missing.map(mcp => {
    if (mcp === 'joplin') {
      return `
⚠️ CRITICAL: Joplin MCP is NOT configured for this ${scope} session!

Joplin is your documentation source of truth and MUST be available.

To fix, add this to ${configPath}:

"joplin": ${JSON.stringify(JOPLIN_CONFIG, null, 2)}

Then restart Claude Code.

IMPORTANT: Project-level .mcp.json REPLACES global config, it does NOT merge.
Always include joplin in project-level configs.
`;
    }
    return `⚠️ Missing required MCP: ${mcp}`;
  });

  // Output warning to stderr (visible in hook debug)
  console.error(warnings.join('\n'));

  // Also output as system reminder format for context injection
  console.log(`<system-reminder>
${warnings.join('\n')}
</system-reminder>`);
}

main();
