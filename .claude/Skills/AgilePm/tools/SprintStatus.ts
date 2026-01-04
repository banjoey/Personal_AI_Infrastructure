#!/usr/bin/env bun
/**
 * SprintStatus - Get current sprint status from Linear issues
 *
 * Usage:
 *   bun run tools/SprintStatus.ts [--project=ID] [--format=table|yaml]
 *
 * Options:
 *   --project=ID    Linear project ID (defaults to BF Infrastructure)
 *   --format=FMT    Output format: table (default) or yaml
 *
 * Examples:
 *   bun run tools/SprintStatus.ts
 *   bun run tools/SprintStatus.ts --format=yaml
 */

import { resolve, dirname } from 'path';

const LINEAR_SKILL_PATH = resolve(dirname(import.meta.dir), '../../Linear/tools');

interface Issue {
  identifier: string;
  title: string;
  state: string;
  priority: string;
}

async function getIssues(state: string): Promise<Issue[]> {
  const proc = Bun.spawn(['bun', 'run', `${LINEAR_SKILL_PATH}/ListIssues.ts`, `--state=${state}`], {
    cwd: LINEAR_SKILL_PATH,
    stdout: 'pipe',
    stderr: 'pipe'
  });

  const output = await new Response(proc.stdout).text();
  await proc.exited;

  // Parse table output from ListIssues
  const issues: Issue[] = [];
  const lines = output.split('\n').slice(2); // Skip header lines

  for (const line of lines) {
    if (!line.trim() || line.startsWith('Total:')) continue;

    const parts = line.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 4) {
      issues.push({
        identifier: parts[0],
        state: parts[1],
        priority: parts[2],
        title: parts[3]
      });
    }
  }

  return issues;
}

function formatTable(sections: Record<string, Issue[]>): string {
  let output = '';

  for (const [section, issues] of Object.entries(sections)) {
    output += `\n${section} (${issues.length})\n`;
    output += '='.repeat(50) + '\n';

    if (issues.length === 0) {
      output += '  (none)\n';
    } else {
      for (const issue of issues) {
        const priorityIcon = {
          'Urgent': '!!!',
          'High': '!!',
          'Medium': '!',
          'Low': '-'
        }[issue.priority] || '-';

        output += `  ${priorityIcon} ${issue.identifier}: ${issue.title}\n`;
      }
    }
  }

  return output;
}

function formatYaml(sections: Record<string, Issue[]>): string {
  let output = `# Sprint Status - ${new Date().toISOString().split('T')[0]}\n\n`;

  for (const [section, issues] of Object.entries(sections)) {
    const key = section.toLowerCase().replace(/\s+/g, '_');
    output += `${key}:\n`;

    if (issues.length === 0) {
      output += '  []\n';
    } else {
      for (const issue of issues) {
        output += `  - id: ${issue.identifier}\n`;
        output += `    title: "${issue.title}"\n`;
        output += `    priority: ${issue.priority.toLowerCase()}\n`;
      }
    }
    output += '\n';
  }

  return output;
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--help') {
    console.log(`
Usage: bun run SprintStatus.ts [options]

Options:
  --project=ID    Linear project ID
  --format=FMT    Output format: table (default) or yaml

Examples:
  bun run SprintStatus.ts
  bun run SprintStatus.ts --format=yaml
`);
    process.exit(0);
  }

  let format = 'table';

  for (const arg of args) {
    if (arg.startsWith('--format=')) {
      format = arg.split('=')[1];
    }
  }

  console.log('Fetching sprint status from Linear...\n');

  // Get issues by state
  const [inProgress, todo, backlog, done] = await Promise.all([
    getIssues('inProgress'),
    getIssues('todo'),
    getIssues('backlog'),
    getIssues('done')
  ]);

  const sections = {
    'In Progress': inProgress,
    'Todo': todo,
    'Backlog': backlog,
    'Done (recent)': done.slice(0, 5) // Only show last 5 done
  };

  if (format === 'yaml') {
    console.log(formatYaml(sections));
  } else {
    console.log(formatTable(sections));
  }

  // Summary stats
  const totalActive = inProgress.length + todo.length;
  const velocity = done.length; // Simplified - would track per sprint

  console.log('\n--- Summary ---');
  console.log(`Active work: ${totalActive} issues`);
  console.log(`In progress: ${inProgress.length}`);
  console.log(`Backlog: ${backlog.length}`);
  console.log(`Completed: ${done.length}`);
}

main();
