#!/usr/bin/env bun
/**
 * UpdateIssue - Update a Linear issue
 * 
 * Usage:
 *   bun run tools/UpdateIssue.ts IDENTIFIER [options]
 * 
 * Options:
 *   --state=STATE      New state (backlog, todo, inProgress, done, canceled)
 *   --priority=N       New priority (1=Urgent, 2=High, 3=Medium, 4=Low, 0=None)
 *   --title="Title"    New title
 *   --description="D"  New description
 * 
 * Examples:
 *   bun run tools/UpdateIssue.ts MML-14 --state=done
 *   bun run tools/UpdateIssue.ts MML-15 --priority=1 --state=inProgress
 *   bun run tools/UpdateIssue.ts MML-16 --title="Updated title"
 */

import { linearQuery, linearMutation, BF_INFRA } from './LinearClient.ts';

interface Issue {
  id: string;
  identifier: string;
  title: string;
  state: { name: string };
}

interface GetIssueResponse {
  issue: Issue;
}

interface UpdateIssueResponse {
  issueUpdate: {
    success: boolean;
    issue: Issue;
  };
}

const GET_ISSUE_QUERY = `
  query GetIssue($identifier: String!) {
    issue(id: $identifier) {
      id
      identifier
      title
      state { name }
    }
  }
`;

const UPDATE_ISSUE_MUTATION = `
  mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
    issueUpdate(id: $id, input: $input) {
      success
      issue {
        id
        identifier
        title
        state { name }
      }
    }
  }
`;

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Usage: bun run UpdateIssue.ts IDENTIFIER [options]

Options:
  --state=STATE      backlog, todo, inProgress, done, canceled
  --priority=N       1=Urgent, 2=High, 3=Medium, 4=Low, 0=None
  --title="Title"    New title
  --description="D"  New description

Examples:
  bun run UpdateIssue.ts MML-14 --state=done
  bun run UpdateIssue.ts MML-15 --priority=1
`);
    process.exit(0);
  }

  const identifier = args[0];
  const input: Record<string, unknown> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--state=')) {
      const state = arg.split('=')[1] as keyof typeof BF_INFRA.states;
      if (BF_INFRA.states[state]) {
        input.stateId = BF_INFRA.states[state];
      } else {
        console.error(`Unknown state: ${state}`);
        process.exit(1);
      }
    } else if (arg.startsWith('--priority=')) {
      input.priority = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--title=')) {
      input.title = arg.split('=')[1];
    } else if (arg.startsWith('--description=')) {
      input.description = arg.split('=')[1];
    }
  }

  if (Object.keys(input).length === 0) {
    console.error('No updates specified. Use --state, --priority, --title, or --description.');
    process.exit(1);
  }

  try {
    // First, get the issue ID from the identifier
    const getResult = await linearQuery<GetIssueResponse>(GET_ISSUE_QUERY, { 
      identifier 
    });
    
    if (!getResult.issue) {
      console.error(`Issue not found: ${identifier}`);
      process.exit(1);
    }

    const issueId = getResult.issue.id;

    // Now update the issue
    const updateResult = await linearMutation<UpdateIssueResponse>(UPDATE_ISSUE_MUTATION, {
      id: issueId,
      input,
    });

    if (updateResult.issueUpdate.success) {
      const issue = updateResult.issueUpdate.issue;
      console.log(`Updated: ${issue.identifier} - ${issue.title}`);
      console.log(`State: ${issue.state.name}`);
    } else {
      console.error('Failed to update issue');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
