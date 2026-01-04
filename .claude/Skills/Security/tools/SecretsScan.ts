#!/usr/bin/env bun
/**
 * SecretsScan - Scan files for hardcoded secrets and credentials
 *
 * Usage:
 *   bun run tools/SecretsScan.ts [path] [--json] [--include=pattern]
 *
 * Options:
 *   path             Directory to scan (defaults to cwd)
 *   --json           Output as JSON
 *   --include=PAT    Glob pattern to include (default: **/*.{ts,js,py,go,env,yaml,yml,json})
 *
 * Examples:
 *   bun run tools/SecretsScan.ts
 *   bun run tools/SecretsScan.ts ~/src/myproject
 *   bun run tools/SecretsScan.ts . --json
 *
 * Detects:
 *   - API keys (AWS, GCP, Azure, OpenAI, etc.)
 *   - Private keys (RSA, SSH)
 *   - Passwords and tokens in code
 *   - Connection strings
 */

import { Glob } from 'bun';
import { readFileSync, existsSync } from 'fs';
import { resolve, relative } from 'path';

interface SecretFinding {
  file: string;
  line: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  snippet: string;
  recommendation: string;
}

interface ScanResult {
  projectPath: string;
  filesScanned: number;
  findings: SecretFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// Secret patterns with severity
const SECRET_PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}> = [
  // AWS
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical',
    recommendation: 'Rotate AWS credentials immediately. Use IAM roles or environment variables.'
  },
  {
    name: 'AWS Secret Key',
    pattern: /(?:aws_secret_access_key|secret_key)\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi,
    severity: 'critical',
    recommendation: 'Rotate AWS credentials immediately. Use AWS Secrets Manager.'
  },
  // OpenAI
  {
    name: 'OpenAI API Key',
    pattern: /sk-[a-zA-Z0-9]{48}/g,
    severity: 'high',
    recommendation: 'Rotate OpenAI API key. Use environment variables.'
  },
  // Generic API keys
  {
    name: 'API Key Assignment',
    pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*['"]([a-zA-Z0-9_\-]{20,})['"]?/gi,
    severity: 'high',
    recommendation: 'Move API key to environment variable or secrets manager.'
  },
  // Private keys
  {
    name: 'RSA Private Key',
    pattern: /-----BEGIN (?:RSA )?PRIVATE KEY-----/g,
    severity: 'critical',
    recommendation: 'Remove private key from code. Use secrets manager or key vault.'
  },
  {
    name: 'SSH Private Key',
    pattern: /-----BEGIN OPENSSH PRIVATE KEY-----/g,
    severity: 'critical',
    recommendation: 'Remove SSH key from code. Use ssh-agent or vault.'
  },
  // Passwords
  {
    name: 'Password Assignment',
    pattern: /(?:password|passwd|pwd)\s*[=:]\s*['"]([^'"]{8,})['"]?/gi,
    severity: 'high',
    recommendation: 'Remove hardcoded password. Use environment variable or secrets manager.'
  },
  // Tokens
  {
    name: 'Bearer Token',
    pattern: /bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi,
    severity: 'high',
    recommendation: 'Remove bearer token from code. Use environment variable.'
  },
  {
    name: 'GitHub Token',
    pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
    severity: 'high',
    recommendation: 'Rotate GitHub token. Use GITHUB_TOKEN environment variable.'
  },
  // Connection strings
  {
    name: 'Database Connection String',
    pattern: /(?:postgres|mysql|mongodb):\/\/[^:]+:[^@]+@/gi,
    severity: 'high',
    recommendation: 'Move connection string to environment variable.'
  },
  // Slack
  {
    name: 'Slack Token',
    pattern: /xox[baprs]-[0-9a-zA-Z\-]{10,}/g,
    severity: 'high',
    recommendation: 'Rotate Slack token. Use environment variable.'
  },
  // Generic secrets
  {
    name: 'Secret Assignment',
    pattern: /(?:secret|token|credential)\s*[=:]\s*['"]([a-zA-Z0-9_\-]{16,})['"]?/gi,
    severity: 'medium',
    recommendation: 'Review if this is a real secret. Move to environment if so.'
  }
];

// Files to skip
const SKIP_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist\//,
  /build\//,
  /\.next/,
  /vendor\//,
  /\.venv/,
  /__pycache__/
];

function shouldSkip(path: string): boolean {
  return SKIP_PATTERNS.some(p => p.test(path));
}

function redact(text: string): string {
  // Redact the middle of the secret
  if (text.length <= 8) return '*'.repeat(text.length);
  return text.slice(0, 4) + '*'.repeat(text.length - 8) + text.slice(-4);
}

async function scanDirectory(basePath: string, includePattern: string): Promise<ScanResult> {
  const findings: SecretFinding[] = [];
  let filesScanned = 0;

  const glob = new Glob(includePattern);

  for await (const file of glob.scan({ cwd: basePath, absolute: true })) {
    if (shouldSkip(file)) continue;

    try {
      const content = readFileSync(file, 'utf-8');
      filesScanned++;

      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const { name, pattern, severity, recommendation } of SECRET_PATTERNS) {
          // Reset regex state
          pattern.lastIndex = 0;

          const match = pattern.exec(line);
          if (match) {
            // Create redacted snippet
            const snippet = line.trim().slice(0, 100);
            const redactedSnippet = snippet.replace(match[0], redact(match[0]));

            findings.push({
              file: relative(basePath, file),
              line: i + 1,
              type: name,
              severity,
              snippet: redactedSnippet,
              recommendation
            });
          }
        }
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return {
    projectPath: basePath,
    filesScanned,
    findings,
    summary: {
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length
    }
  };
}

function formatTable(result: ScanResult): string {
  let output = `
Secrets Scan Report
====================
Project: ${result.projectPath}
Files Scanned: ${result.filesScanned}

`;

  if (result.findings.length === 0) {
    output += 'No secrets or credentials detected.\n';
  } else {
    output += `Potential Secrets Found: ${result.findings.length}\n\n`;

    // Group by severity
    for (const sev of ['critical', 'high', 'medium', 'low'] as const) {
      const sevFindings = result.findings.filter(f => f.severity === sev);
      if (sevFindings.length === 0) continue;

      const icon = { critical: '!!!', high: '!!', medium: '!', low: '-' }[sev];
      output += `\n${icon} ${sev.toUpperCase()} (${sevFindings.length})\n`;
      output += '-'.repeat(40) + '\n';

      for (const f of sevFindings) {
        output += `\nFile: ${f.file}:${f.line}\n`;
        output += `Type: ${f.type}\n`;
        output += `Code: ${f.snippet}\n`;
        output += `Fix:  ${f.recommendation}\n`;
      }
    }
  }

  output += `
Summary
-------
Critical: ${result.summary.critical}
High: ${result.summary.high}
Medium: ${result.summary.medium}
Low: ${result.summary.low}
`;

  return output;
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--help') {
    console.log(`
Usage: bun run SecretsScan.ts [path] [options]

Options:
  path             Directory to scan (defaults to cwd)
  --json           Output as JSON
  --include=PAT    Glob pattern (default: **/*.{ts,js,py,go,env,yaml,yml,json})

Examples:
  bun run SecretsScan.ts
  bun run SecretsScan.ts ~/src/myproject --json
`);
    process.exit(0);
  }

  let projectPath = process.cwd();
  let outputJson = false;
  let includePattern = '**/*.{ts,js,py,go,env,yaml,yml,json,md,txt}';

  for (const arg of args) {
    if (arg === '--json') {
      outputJson = true;
    } else if (arg.startsWith('--include=')) {
      includePattern = arg.split('=')[1];
    } else if (!arg.startsWith('--')) {
      projectPath = resolve(arg);
    }
  }

  if (!existsSync(projectPath)) {
    console.error('Path not found:', projectPath);
    process.exit(1);
  }

  console.error(`Scanning for secrets in ${projectPath}...`);

  const result = await scanDirectory(projectPath, includePattern);

  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatTable(result));
  }

  // Exit with error if critical secrets found
  if (result.summary.critical > 0) {
    process.exit(1);
  }
}

main();
