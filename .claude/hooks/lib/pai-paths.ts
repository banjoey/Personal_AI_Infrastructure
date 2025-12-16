/**
 * PAI Path Resolution - Single Source of Truth
 *
 * This module provides consistent path resolution across all PAI hooks.
 *
 * CONVENTION: PAI_DIR = Repository root (e.g., ~/PAI)
 *             All PAI resources live in ${PAI_DIR}/.claude/
 *
 * Usage in hooks:
 *   import { PAI_DIR, CLAUDE_DIR, HOOKS_DIR, SKILLS_DIR } from './lib/pai-paths';
 */

import { homedir } from 'os';
import { resolve, join } from 'path';
import { existsSync } from 'fs';

/**
 * Smart PAI_DIR detection with fallback
 * PAI_DIR = REPO ROOT (containing .claude/ subdirectory)
 * Priority:
 * 1. PAI_DIR environment variable (if set)
 * 2. ~/PAI (standard location for PAI repository)
 */
export const PAI_DIR = process.env.PAI_DIR
  ? resolve(process.env.PAI_DIR)
  : resolve(homedir(), 'PAI');

/**
 * PAI_DIR is the REPO ROOT (e.g., ~/PAI)
 * All PAI resources live in the .claude subdirectory
 */
export const CLAUDE_DIR = join(PAI_DIR, '.claude');

/**
 * Common PAI directories (all under .claude/)
 */
export const HOOKS_DIR = join(CLAUDE_DIR, 'hooks');
export const SKILLS_DIR = join(CLAUDE_DIR, 'skills');
export const AGENTS_DIR = join(CLAUDE_DIR, 'agents');
export const HISTORY_DIR = join(CLAUDE_DIR, 'history');
export const COMMANDS_DIR = join(CLAUDE_DIR, 'commands');
export const SCRIPTS_DIR = join(CLAUDE_DIR, 'scripts');

/**
 * Validate PAI directory structure on first import
 * This fails fast with a clear error if PAI is misconfigured
 */
function validatePAIStructure(): void {
  if (!existsSync(PAI_DIR)) {
    console.error(`❌ PAI_DIR does not exist: ${PAI_DIR}`);
    console.error(`   Set PAI_DIR to your PAI repository root (e.g., ~/PAI)`);
    process.exit(1);
  }

  if (!existsSync(CLAUDE_DIR)) {
    console.error(`❌ .claude directory not found: ${CLAUDE_DIR}`);
    console.error(`   PAI_DIR should point to repo root containing .claude/`);
    console.error(`   Current PAI_DIR: ${PAI_DIR}`);
    process.exit(1);
  }

  if (!existsSync(HOOKS_DIR)) {
    console.error(`❌ PAI hooks directory not found: ${HOOKS_DIR}`);
    console.error(`   Your PAI installation may be incomplete`);
    console.error(`   Current PAI_DIR: ${PAI_DIR}`);
    process.exit(1);
  }
}

// Run validation on module import
// This ensures any hook that imports this module will fail fast if paths are wrong
validatePAIStructure();

/**
 * Helper to get history file path with date-based organization
 */
export function getHistoryFilePath(subdir: string, filename: string): string {
  const now = new Date();
  const pstDate = new Date(now.toLocaleString('en-US', { timeZone: process.env.TIME_ZONE || 'America/Los_Angeles' }));
  const year = pstDate.getFullYear();
  const month = String(pstDate.getMonth() + 1).padStart(2, '0');

  return join(HISTORY_DIR, subdir, `${year}-${month}`, filename);
}
