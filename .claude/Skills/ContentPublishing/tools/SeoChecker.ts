#!/usr/bin/env bun
/**
 * SeoChecker - Analyze markdown files for SEO best practices
 *
 * Usage:
 *   bun run tools/SeoChecker.ts FILE.md [--json]
 *   bun run tools/SeoChecker.ts --all [--dir=content/]
 *
 * Options:
 *   --json          Output as JSON
 *   --all           Check all markdown files in directory
 *   --dir=PATH      Directory to scan (default: .)
 *
 * Examples:
 *   bun run tools/SeoChecker.ts blog/post.md
 *   bun run tools/SeoChecker.ts --all --dir=content/blog
 */

import { readFileSync, existsSync } from 'fs';
import { Glob } from 'bun';
import { basename, relative } from 'path';

interface SeoCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface SeoReport {
  file: string;
  score: number;
  checks: SeoCheck[];
  summary: {
    errors: number;
    warnings: number;
    passed: number;
  };
}

interface Frontmatter {
  title?: string;
  description?: string;
  keywords?: string[];
  date?: string;
  author?: string;
  image?: string;
  [key: string]: unknown;
}

function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const yaml = match[1];
  const body = match[2];

  // Simple YAML parser for frontmatter
  const frontmatter: Frontmatter = {};
  const lines = yaml.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Handle arrays (basic)
      if (value.startsWith('[') && value.endsWith(']')) {
        frontmatter[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''));
      } else {
        frontmatter[key] = value;
      }
    }
  }

  return { frontmatter, body };
}

function analyzeFile(filePath: string): SeoReport {
  const content = readFileSync(filePath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);

  const checks: SeoCheck[] = [];

  // Check: Title exists
  if (frontmatter.title) {
    const titleLen = frontmatter.title.length;
    if (titleLen >= 30 && titleLen <= 60) {
      checks.push({
        name: 'Title Length',
        passed: true,
        message: `Title is ${titleLen} chars (optimal: 30-60)`,
        severity: 'info'
      });
    } else {
      checks.push({
        name: 'Title Length',
        passed: false,
        message: `Title is ${titleLen} chars (should be 30-60)`,
        severity: 'warning'
      });
    }
  } else {
    checks.push({
      name: 'Title',
      passed: false,
      message: 'Missing title in frontmatter',
      severity: 'error'
    });
  }

  // Check: Meta description
  if (frontmatter.description) {
    const descLen = frontmatter.description.length;
    if (descLen >= 120 && descLen <= 160) {
      checks.push({
        name: 'Meta Description',
        passed: true,
        message: `Description is ${descLen} chars (optimal: 120-160)`,
        severity: 'info'
      });
    } else {
      checks.push({
        name: 'Meta Description',
        passed: false,
        message: `Description is ${descLen} chars (should be 120-160)`,
        severity: 'warning'
      });
    }
  } else {
    checks.push({
      name: 'Meta Description',
      passed: false,
      message: 'Missing description in frontmatter',
      severity: 'error'
    });
  }

  // Check: H1 heading
  const h1Match = body.match(/^#\s+(.+)$/m);
  if (h1Match) {
    checks.push({
      name: 'H1 Heading',
      passed: true,
      message: `H1 found: "${h1Match[1].slice(0, 40)}..."`,
      severity: 'info'
    });
  } else {
    checks.push({
      name: 'H1 Heading',
      passed: false,
      message: 'Missing H1 heading (# Title)',
      severity: 'error'
    });
  }

  // Check: Multiple H1s (bad)
  const h1Count = (body.match(/^#\s+/gm) || []).length;
  if (h1Count > 1) {
    checks.push({
      name: 'Multiple H1s',
      passed: false,
      message: `Found ${h1Count} H1 headings (should be 1)`,
      severity: 'warning'
    });
  }

  // Check: Heading structure (H2, H3)
  const h2Count = (body.match(/^##\s+/gm) || []).length;
  if (h2Count >= 2) {
    checks.push({
      name: 'Content Structure',
      passed: true,
      message: `Good structure with ${h2Count} H2 headings`,
      severity: 'info'
    });
  } else {
    checks.push({
      name: 'Content Structure',
      passed: false,
      message: `Only ${h2Count} H2 headings (recommend 2+)`,
      severity: 'warning'
    });
  }

  // Check: Word count
  const words = body.split(/\s+/).filter(w => w.length > 0).length;
  if (words >= 300) {
    checks.push({
      name: 'Word Count',
      passed: true,
      message: `${words} words (minimum 300)`,
      severity: 'info'
    });
  } else {
    checks.push({
      name: 'Word Count',
      passed: false,
      message: `Only ${words} words (recommend 300+)`,
      severity: 'warning'
    });
  }

  // Check: Images with alt text
  const images = body.match(/!\[([^\]]*)\]\([^)]+\)/g) || [];
  const imagesWithAlt = images.filter(img => {
    const alt = img.match(/!\[([^\]]*)\]/)?.[1];
    return alt && alt.length > 0;
  });

  if (images.length > 0) {
    if (imagesWithAlt.length === images.length) {
      checks.push({
        name: 'Image Alt Text',
        passed: true,
        message: `All ${images.length} images have alt text`,
        severity: 'info'
      });
    } else {
      checks.push({
        name: 'Image Alt Text',
        passed: false,
        message: `${images.length - imagesWithAlt.length} images missing alt text`,
        severity: 'warning'
      });
    }
  }

  // Check: Internal/external links
  const links = body.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
  if (links.length >= 2) {
    checks.push({
      name: 'Links',
      passed: true,
      message: `${links.length} links found`,
      severity: 'info'
    });
  } else {
    checks.push({
      name: 'Links',
      passed: false,
      message: `Only ${links.length} links (recommend 2+)`,
      severity: 'info'
    });
  }

  // Check: Featured image
  if (frontmatter.image) {
    checks.push({
      name: 'Featured Image',
      passed: true,
      message: 'Featured image specified',
      severity: 'info'
    });
  } else {
    checks.push({
      name: 'Featured Image',
      passed: false,
      message: 'No featured image in frontmatter',
      severity: 'warning'
    });
  }

  // Calculate score
  const errors = checks.filter(c => !c.passed && c.severity === 'error').length;
  const warnings = checks.filter(c => !c.passed && c.severity === 'warning').length;
  const passed = checks.filter(c => c.passed).length;

  const score = Math.max(0, 100 - (errors * 20) - (warnings * 10));

  return {
    file: filePath,
    score,
    checks,
    summary: { errors, warnings, passed }
  };
}

function formatReport(report: SeoReport): string {
  let output = `\n${'='.repeat(60)}\n`;
  output += `SEO Report: ${basename(report.file)}\n`;
  output += `${'='.repeat(60)}\n\n`;

  output += `Score: ${report.score}/100\n`;
  output += `Errors: ${report.summary.errors} | Warnings: ${report.summary.warnings} | Passed: ${report.summary.passed}\n\n`;

  for (const check of report.checks) {
    const icon = check.passed ? '✅' : (check.severity === 'error' ? '❌' : '⚠️');
    output += `${icon} ${check.name}: ${check.message}\n`;
  }

  return output;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
SEO Checker - Analyze markdown files for SEO best practices

Usage:
  bun run SeoChecker.ts FILE.md [--json]
  bun run SeoChecker.ts --all [--dir=content/]

Examples:
  bun run SeoChecker.ts blog/post.md
  bun run SeoChecker.ts --all --dir=content/blog
`);
    process.exit(0);
  }

  let outputJson = false;
  let checkAll = false;
  let dir = '.';
  let targetFile: string | undefined;

  for (const arg of args) {
    if (arg === '--json') {
      outputJson = true;
    } else if (arg === '--all') {
      checkAll = true;
    } else if (arg.startsWith('--dir=')) {
      dir = arg.split('=')[1];
    } else if (!arg.startsWith('--')) {
      targetFile = arg;
    }
  }

  const reports: SeoReport[] = [];

  if (checkAll) {
    const glob = new Glob('**/*.md');
    for await (const file of glob.scan({ cwd: dir, absolute: true })) {
      if (file.includes('node_modules')) continue;
      reports.push(analyzeFile(file));
    }
  } else if (targetFile) {
    if (!existsSync(targetFile)) {
      console.error(`❌ File not found: ${targetFile}`);
      process.exit(1);
    }
    reports.push(analyzeFile(targetFile));
  }

  if (outputJson) {
    console.log(JSON.stringify(reports, null, 2));
  } else {
    for (const report of reports) {
      console.log(formatReport(report));
    }

    if (reports.length > 1) {
      const avgScore = reports.reduce((sum, r) => sum + r.score, 0) / reports.length;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Summary: ${reports.length} files, Average Score: ${avgScore.toFixed(0)}/100`);
    }
  }

  // Exit with error if any critical issues
  const hasErrors = reports.some(r => r.summary.errors > 0);
  if (hasErrors) {
    process.exit(1);
  }
}

main();
