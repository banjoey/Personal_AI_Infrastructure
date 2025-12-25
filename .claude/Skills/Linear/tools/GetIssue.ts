#!/usr/bin/env bun
/**
 * GetIssue - Get details of a single Linear issue
 * 
 * Usage:
 *   bun run tools/GetIssue.ts IDENTIFIER [--format=json|text]
 * 
 * Examples:
 *   bun run tools/GetIssue.ts MML-14
 *   bun run tools/GetIssue.ts MML-14 --format=json
 */

import { linearQuery } from './LinearClient.ts';

interface Issue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  state: { name: string };
  priority: number;
  project: { name: string } | null;
  parent: { identifier: string; title: string } | null;
  children: { nodes: Array<{ identifier: string; title: string; state: { name: string } }> };
  url: string;
  createdAt: string;
  updatedAt: string;
}

interface GetIssueResponse {
  issue: Issue;
}

const GET_ISSUE_QUERY = `
  query GetIssue($identifier: String!) {
    issue(id: $identifier) {
      id
      identifier
      title
      description
      state { name }
      priority
      project { name }
      parent { identifier title }
      children { nodes { identifier title state { name } } }
      url
      createdAt
      updatedAt
    }
  }
`;

function priorityLabel(priority: number): string {
  switch (priority) {
    case 1: return 'Urgent';
    case 2: return 'High';
    case 3: return 'Medium';
    case 4: return 'Low';
    default: return 'None';
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Usage: bun run GetIssue.ts IDENTIFIER [--format=json|text]

Examples:
  bun run GetIssue.ts MML-14
  bun run GetIssue.ts MML-14 --format=json
`);
    process.exit(0);
  }

  const identifier = args[0];
  let format = 'text';

  for (const arg of args.slice(1)) {
    if (arg.startsWith('--format=')) {
      format = arg.split('=')[1];
    }
  }

  try {
    const result = await linearQuery<GetIssueResponse>(GET_ISSUE_QUERY, { identifier });
    
    if (!result.issue) {
      console.error(`Issue not found: ${identifier}`);
      process.exit(1);
    }

    const issue = result.issue;

    if (format === 'json') {
      console.log(JSON.stringify(issue, null, 2));
    } else {
      console.log('');
      console.log(`${issue.identifier}: ${issue.title}`);
      console.log('='.repeat(60));
      console.log(`State:    ${issue.state.name}`);
      console.log(`Priority: ${priorityLabel(issue.priority)}`);
      console.log(`Project:  ${issue.project?.name || 'None'}`);
      console.log(`URL:      ${issue.url}`);
      console.log(`Created:  ${new Date(issue.createdAt).toLocaleString()}`);
      console.log(`Updated:  ${new Date(issue.updatedAt).toLocaleString()}`);
      
      if (issue.parent) {
        console.log(`Parent:   ${issue.parent.identifier} - ${issue.parent.title}`);
      }
      
      if (issue.description) {
        console.log('');
        console.log('Description:');
        console.log('-'.repeat(40));
        console.log(issue.description);
      }
      
      if (issue.children.nodes.length > 0) {
        console.log('');
        console.log('Sub-issues:');
        for (const child of issue.children.nodes) {
          console.log(`  - ${child.identifier}: ${child.title} [${child.state.name}]`);
        }
      }
      console.log('');
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
