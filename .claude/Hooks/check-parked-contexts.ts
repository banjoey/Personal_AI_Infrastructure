#!/usr/bin/env bun

/**
 * check-parked-contexts.ts
 *
 * SessionStart hook that checks for parked work contexts (RESUME.md files).
 * Notifies the user if there are parked contexts they may want to resume.
 *
 * This hook uses the CaptureIntelligence check-parked.ts tool to scan for
 * RESUME.md files in the workspace.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { homedir } from 'os';

const CAPTURE_TOOLS = process.env.CAPTURE_TOOLS || join(homedir(), 'src/pai/CaptureIntelligence/tools');
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || join(homedir(), 'workshop');

interface ParkedContext {
  path: string;
  domain: string;
  project: string;
  parked: string;
  expired: boolean;
  age: string;
}

interface CheckParkedResult {
  found: boolean;
  count: number;
  contexts: ParkedContext[];
}

async function checkParkedContexts(): Promise<CheckParkedResult | null> {
  const checkParkedPath = join(CAPTURE_TOOLS, 'check-parked.ts');

  // Check if the tool exists
  if (!existsSync(checkParkedPath)) {
    console.error('ℹ️ check-parked.ts not found - skipping parked context check');
    return null;
  }

  // Check if workspace exists
  if (!existsSync(WORKSPACE_ROOT)) {
    return null;
  }

  try {
    // Run check-parked.ts with JSON output
    const result = execSync(`bun run ${checkParkedPath} -w ${WORKSPACE_ROOT} --json`, {
      encoding: 'utf-8',
      timeout: 5000, // 5 second timeout
    });

    return JSON.parse(result) as CheckParkedResult;
  } catch (error: any) {
    // Tool returned exit code 1 (no parked contexts) or other error
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout) as CheckParkedResult;
      } catch {
        // Not valid JSON
      }
    }
    return null;
  }
}

function formatParkedContextsMessage(result: CheckParkedResult): string {
  if (!result.found || result.count === 0) {
    return '';
  }

  const lines: string[] = [];
  lines.push('<system-reminder>');
  lines.push('📌 PARKED CONTEXTS DETECTED');
  lines.push('');
  lines.push(`Found ${result.count} parked context(s) that may need attention:`);
  lines.push('');

  for (const ctx of result.contexts) {
    const expiredNote = ctx.expired ? ' ⚠️ EXPIRED' : '';
    lines.push(`- **${ctx.project}** (${ctx.domain})${expiredNote}`);
    lines.push(`  Parked: ${ctx.age} ago`);
    lines.push(`  Path: ${ctx.path}`);
    lines.push('');
  }

  lines.push('To resume a context, say "resume [project name]" or read the RESUME.md file.');
  lines.push('</system-reminder>');

  return lines.join('\n');
}

async function main() {
  try {
    // Check if this is a subagent session - if so, exit silently
    const claudeProjectDir = process.env.CLAUDE_PROJECT_DIR || '';
    const isSubagent = claudeProjectDir.includes('/.claude/agents/') ||
                      process.env.CLAUDE_AGENT_TYPE !== undefined;

    if (isSubagent) {
      process.exit(0);
    }

    console.error('🔍 Checking for parked contexts...');

    const result = await checkParkedContexts();

    if (result && result.found && result.count > 0) {
      console.error(`📌 Found ${result.count} parked context(s)`);

      // Output the system reminder for Claude to see
      const message = formatParkedContextsMessage(result);
      console.log(message);

      // Also log summary to stderr for hook output
      for (const ctx of result.contexts) {
        const expiredNote = ctx.expired ? ' (EXPIRED)' : '';
        console.error(`   - ${ctx.project}${expiredNote}: ${ctx.age} ago`);
      }
    } else {
      console.error('✓ No parked contexts found');
    }

    process.exit(0);
  } catch (error) {
    console.error('⚠️ Error checking parked contexts:', error);
    process.exit(0); // Don't fail the session start
  }
}

main();
