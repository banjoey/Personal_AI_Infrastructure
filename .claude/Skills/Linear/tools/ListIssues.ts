#!/usr/bin/env bun
/**
 * ListIssues - List Linear issues with optional filters
 * 
 * Usage:
 *   bun run tools/ListIssues.ts [options]
 * 
 * Options:
 *   --state=STATE    Filter by state (backlog, todo, inProgress, done, all)
 *   --limit=N        Max issues to return (default: 20)
 *   --format=FORMAT  Output format (table, json, simple)
 * 
 * Examples:
 *   bun run tools/ListIssues.ts
 *   bun run tools/ListIssues.ts --state=backlog
 *   bun run tools/ListIssues.ts --state=inProgress --format=json
 */

import { linearQuery, BF_INFRA } from './LinearClient.ts';

interface Issue {
  id: string;
  identifier: string;
  title: string;
  state: { name: string };
  priority: number;
  project: { name: string } | null;
}

interface ListIssuesResponse {
  issues: {
    nodes: Issue[];
  };
}

const LIST_ISSUES_QUERY = `
  query ListIssues($filter: IssueFilter, $first: Int) {
    issues(filter: $filter, first: $first, orderBy: updatedAt) {
      nodes {
        id
        identifier
        title
        state { name }
        priority
        project { name }
      }
    }
  }
`;

function priorityLabel(priority: number): string {
  switch (priority) {
    case 1: return 'Urgent';
    case 2: return 'High';
    case 3: return 'Medium';
    case 4: return 'Low';
    default: return '-';
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  let stateFilter: string | undefined;
  let limit = 20;
  let format = 'table';

  for (const arg of args) {
    if (arg === '--help') {
      console.log(`
Usage: bun run ListIssues.ts [options]

Options:
  --state=STATE    Filter: backlog, todo, inProgress, done, all (default: all)
  --limit=N        Max results (default: 20)
  --format=FORMAT  Output: table, json, simple (default: table)
`);
      process.exit(0);
    }
    if (arg.startsWith('--state=')) {
      const state = arg.split('=')[1];
      if (state !== 'all') {
        stateFilter = BF_INFRA.states[state as keyof typeof BF_INFRA.states];
      }
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--format=')) {
      format = arg.split('=')[1];
    }
  }

  const filter: Record<string, unknown> = {
    team: { id: { eq: BF_INFRA.teamId } },
  };

  if (stateFilter) {
    filter.state = { id: { eq: stateFilter } };
  }

  try {
    const result = await linearQuery<ListIssuesResponse>(LIST_ISSUES_QUERY, {
      filter,
      first: limit,
    });

    const issues = result.issues.nodes;

    if (format === 'json') {
      console.log(JSON.stringify(issues, null, 2));
    } else if (format === 'simple') {
      for (const issue of issues) {
        console.log(`${issue.identifier}: ${issue.title} [${issue.state.name}]`);
      }
    } else {
      // Table format
      console.log('');
      console.log('ID       | State       | Priority | Title');
      console.log('---------|-------------|----------|' + '-'.repeat(50));
      for (const issue of issues) {
        const state = issue.state.name.padEnd(11);
        const priority = priorityLabel(issue.priority).padEnd(8);
        const title = issue.title.length > 48 ? issue.title.slice(0, 45) + '...' : issue.title;
        console.log(`${issue.identifier} | ${state} | ${priority} | ${title}`);
      }
      console.log('');
      console.log(`Total: ${issues.length} issues`);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
