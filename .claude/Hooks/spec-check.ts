#!/usr/bin/env bun

/**
 * spec-check.ts - PreToolUse Development Guardrail Hook
 *
 * Warns when writing code without a spec/PRD file present.
 * Does NOT block - just adds context reminding about spec-first development.
 *
 * Checks for:
 * - docs/PRD.md
 * - docs/SPEC.md
 * - .claude/project.json
 * - README.md with "## Requirements" section
 *
 * Design: Warn, don't block. Encourage spec-first without breaking flow.
 */

import { existsSync, readFileSync } from 'fs';
import { join, extname } from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

// File extensions that count as "code" - when writing these, check for spec
const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.pyw',
  '.go',
  '.rs',
  '.java', '.kt', '.scala',
  '.c', '.cpp', '.h', '.hpp',
  '.rb',
  '.php',
  '.swift',
  '.cs',
]);

// Paths that indicate a spec exists
const SPEC_PATHS = [
  'docs/PRD.md',
  'docs/prd.md',
  'docs/SPEC.md',
  'docs/spec.md',
  'PRD.md',
  'SPEC.md',
  '.claude/project.json',
];

// Directories to ignore (don't warn for these)
const IGNORE_DIRECTORIES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.claude/Hooks',  // Don't warn when editing hooks themselves
  '.claude/Tools',
];

// ============================================================================
// TYPES
// ============================================================================

interface HookInput {
  session_id: string;
  tool_name: string;
  tool_input: Record<string, unknown> | string;
}

interface HookOutput {
  permissionDecision: 'allow' | 'deny';
  additionalContext?: string;
  feedback?: string;
}

// ============================================================================
// DETECTION LOGIC
// ============================================================================

function isCodeFile(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return CODE_EXTENSIONS.has(ext);
}

function isIgnoredPath(filePath: string): boolean {
  return IGNORE_DIRECTORIES.some(dir => filePath.includes(dir));
}

function getProjectRoot(filePath: string): string {
  // Try to find project root by looking for common markers
  let current = filePath;
  const markers = ['package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', '.git'];

  for (let i = 0; i < 10; i++) {
    const parent = join(current, '..');
    if (parent === current) break;

    for (const marker of markers) {
      if (existsSync(join(parent, marker))) {
        return parent;
      }
    }
    current = parent;
  }

  // Fall back to cwd
  return process.cwd();
}

function hasSpec(projectRoot: string): { found: boolean; path?: string } {
  // Check explicit spec files
  for (const specPath of SPEC_PATHS) {
    const fullPath = join(projectRoot, specPath);
    if (existsSync(fullPath)) {
      return { found: true, path: specPath };
    }
  }

  // Check README for requirements section
  const readmePath = join(projectRoot, 'README.md');
  if (existsSync(readmePath)) {
    try {
      const content = readFileSync(readmePath, 'utf-8');
      if (content.includes('## Requirements') || content.includes('## Specification')) {
        return { found: true, path: 'README.md (has Requirements section)' };
      }
    } catch {
      // Ignore read errors
    }
  }

  return { found: false };
}

// ============================================================================
// MAIN HOOK LOGIC
// ============================================================================

async function main(): Promise<void> {
  let input: HookInput;

  try {
    const text = await Promise.race([
      Bun.stdin.text(),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 100))
    ]);

    if (!text.trim()) {
      console.log(JSON.stringify({ permissionDecision: 'allow' }));
      return;
    }

    input = JSON.parse(text);
  } catch {
    // Parse error or timeout - fail open
    console.log(JSON.stringify({ permissionDecision: 'allow' }));
    return;
  }

  // Only check Write and Edit tools
  if (input.tool_name !== 'Write' && input.tool_name !== 'Edit') {
    console.log(JSON.stringify({ permissionDecision: 'allow' }));
    return;
  }

  // Extract file path
  const toolInput = typeof input.tool_input === 'string'
    ? JSON.parse(input.tool_input)
    : input.tool_input;

  const filePath = (toolInput?.file_path as string) || '';

  if (!filePath) {
    console.log(JSON.stringify({ permissionDecision: 'allow' }));
    return;
  }

  // Skip non-code files
  if (!isCodeFile(filePath)) {
    console.log(JSON.stringify({ permissionDecision: 'allow' }));
    return;
  }

  // Skip ignored directories
  if (isIgnoredPath(filePath)) {
    console.log(JSON.stringify({ permissionDecision: 'allow' }));
    return;
  }

  // Check for spec
  const projectRoot = getProjectRoot(filePath);
  const specCheck = hasSpec(projectRoot);

  if (specCheck.found) {
    // Spec exists - allow silently
    console.log(JSON.stringify({ permissionDecision: 'allow' }));
    return;
  }

  // No spec found - WARN but allow
  const output: HookOutput = {
    permissionDecision: 'allow',  // Allow, don't block
    additionalContext: `⚠️ SPEC-FIRST: No PRD/spec found in ${projectRoot}. Consider creating docs/PRD.md first.`,
  };

  console.log(JSON.stringify(output));
}

// ============================================================================
// RUN
// ============================================================================

main().catch(() => {
  // On any error, fail open
  console.log(JSON.stringify({ permissionDecision: 'allow' }));
});
