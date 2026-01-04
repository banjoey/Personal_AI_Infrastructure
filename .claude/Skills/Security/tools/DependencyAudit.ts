#!/usr/bin/env bun
/**
 * DependencyAudit - Scan project dependencies for known vulnerabilities
 *
 * Usage:
 *   bun run tools/DependencyAudit.ts [path] [--json] [--severity=low|medium|high|critical]
 *
 * Options:
 *   path             Project directory (defaults to cwd)
 *   --json           Output as JSON
 *   --severity=LVL   Minimum severity to report (default: medium)
 *
 * Examples:
 *   bun run tools/DependencyAudit.ts
 *   bun run tools/DependencyAudit.ts ~/src/myproject --severity=high
 *   bun run tools/DependencyAudit.ts . --json
 *
 * Supported package managers:
 *   - npm/bun (package-lock.json, bun.lockb)
 *   - Python (requirements.txt, pyproject.toml)
 */

import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

interface Vulnerability {
  package: string;
  version: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  cve?: string;
  recommendation: string;
}

interface AuditResult {
  projectPath: string;
  packageManager: string;
  totalDependencies: number;
  vulnerabilities: Vulnerability[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

function detectPackageManager(path: string): string | null {
  if (existsSync(join(path, 'package-lock.json')) || existsSync(join(path, 'bun.lockb'))) {
    return 'npm';
  }
  if (existsSync(join(path, 'requirements.txt')) || existsSync(join(path, 'pyproject.toml'))) {
    return 'pip';
  }
  if (existsSync(join(path, 'go.mod'))) {
    return 'go';
  }
  return null;
}

async function auditNpm(path: string): Promise<AuditResult> {
  const proc = Bun.spawn(['npm', 'audit', '--json'], {
    cwd: path,
    stdout: 'pipe',
    stderr: 'pipe'
  });

  const output = await new Response(proc.stdout).text();
  await proc.exited;

  const vulnerabilities: Vulnerability[] = [];
  let totalDeps = 0;

  try {
    const audit = JSON.parse(output);
    totalDeps = audit.metadata?.dependencies || 0;

    if (audit.vulnerabilities) {
      for (const [pkg, info] of Object.entries(audit.vulnerabilities as Record<string, any>)) {
        vulnerabilities.push({
          package: pkg,
          version: info.range || 'unknown',
          severity: info.severity || 'medium',
          title: info.name || 'Vulnerability detected',
          cve: info.via?.[0]?.cve,
          recommendation: info.fixAvailable ? `Update to ${info.fixAvailable.version || 'latest'}` : 'Review manually'
        });
      }
    }
  } catch {
    // npm audit may return non-JSON on error
  }

  return {
    projectPath: path,
    packageManager: 'npm',
    totalDependencies: totalDeps,
    vulnerabilities,
    summary: {
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      medium: vulnerabilities.filter(v => v.severity === 'medium').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length
    }
  };
}

async function auditPip(path: string): Promise<AuditResult> {
  // Try using pip-audit if available
  const proc = Bun.spawn(['pip-audit', '--format=json'], {
    cwd: path,
    stdout: 'pipe',
    stderr: 'pipe'
  });

  const output = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;

  const vulnerabilities: Vulnerability[] = [];

  if (exitCode === 0) {
    try {
      const audits = JSON.parse(output);
      for (const vuln of audits) {
        vulnerabilities.push({
          package: vuln.name,
          version: vuln.version,
          severity: vuln.fix_versions?.length ? 'high' : 'medium',
          title: vuln.id,
          cve: vuln.id.startsWith('CVE-') ? vuln.id : undefined,
          recommendation: vuln.fix_versions?.length
            ? `Update to ${vuln.fix_versions[0]}`
            : 'Review manually'
        });
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Count requirements
  let totalDeps = 0;
  const reqFile = join(path, 'requirements.txt');
  if (existsSync(reqFile)) {
    const content = readFileSync(reqFile, 'utf-8');
    totalDeps = content.split('\n').filter(l => l.trim() && !l.startsWith('#')).length;
  }

  return {
    projectPath: path,
    packageManager: 'pip',
    totalDependencies: totalDeps,
    vulnerabilities,
    summary: {
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      medium: vulnerabilities.filter(v => v.severity === 'medium').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length
    }
  };
}

function formatTable(result: AuditResult, minSeverity: string): string {
  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const minIndex = severityOrder.indexOf(minSeverity);

  const filtered = result.vulnerabilities.filter(v =>
    severityOrder.indexOf(v.severity) <= minIndex
  );

  let output = `
Dependency Audit Report
========================
Project: ${result.projectPath}
Package Manager: ${result.packageManager}
Total Dependencies: ${result.totalDependencies}

`;

  if (filtered.length === 0) {
    output += 'No vulnerabilities found at or above the specified severity level.\n';
  } else {
    output += `Vulnerabilities Found: ${filtered.length}\n\n`;

    output += `| Severity | Package | Version | CVE | Recommendation |\n`;
    output += `|----------|---------|---------|-----|----------------|\n`;

    for (const vuln of filtered) {
      const sevIcon = {
        critical: '!!!',
        high: '!!',
        medium: '!',
        low: '-'
      }[vuln.severity];

      output += `| ${sevIcon} ${vuln.severity} | ${vuln.package} | ${vuln.version} | ${vuln.cve || 'N/A'} | ${vuln.recommendation} |\n`;
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
Usage: bun run DependencyAudit.ts [path] [options]

Options:
  path             Project directory (defaults to cwd)
  --json           Output as JSON
  --severity=LVL   Minimum severity: low, medium, high, critical

Examples:
  bun run DependencyAudit.ts
  bun run DependencyAudit.ts ~/src/myproject --severity=high
`);
    process.exit(0);
  }

  let projectPath = process.cwd();
  let outputJson = false;
  let minSeverity = 'medium';

  for (const arg of args) {
    if (arg === '--json') {
      outputJson = true;
    } else if (arg.startsWith('--severity=')) {
      minSeverity = arg.split('=')[1];
    } else if (!arg.startsWith('--')) {
      projectPath = resolve(arg);
    }
  }

  const pm = detectPackageManager(projectPath);

  if (!pm) {
    console.error('No supported package manager detected in', projectPath);
    console.error('Supported: npm (package-lock.json), pip (requirements.txt)');
    process.exit(1);
  }

  console.error(`Auditing ${pm} dependencies in ${projectPath}...`);

  let result: AuditResult;

  if (pm === 'npm') {
    result = await auditNpm(projectPath);
  } else if (pm === 'pip') {
    result = await auditPip(projectPath);
  } else {
    console.error('Package manager not yet supported:', pm);
    process.exit(1);
  }

  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatTable(result, minSeverity));
  }

  // Exit with error if critical vulnerabilities found
  if (result.summary.critical > 0) {
    process.exit(1);
  }
}

main();
