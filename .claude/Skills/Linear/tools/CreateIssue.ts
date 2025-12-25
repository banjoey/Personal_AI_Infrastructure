#!/usr/bin/env bun
/**
 * CreateIssue - Create a new Linear issue
 * 
 * Usage:
 *   bun run tools/CreateIssue.ts "Issue title" ["Description"] [--priority=1-4] [--state=backlog|todo|inProgress]
 * 
 * Examples:
 *   bun run tools/CreateIssue.ts "Fix login bug"
 *   bun run tools/CreateIssue.ts "Add dark mode" "User requested dark theme support" --priority=3
 *   bun run tools/CreateIssue.ts "Urgent security fix" --priority=1 --state=todo
 */

import { linearMutation, BF_INFRA } from './LinearClient.ts';

interface CreateIssueResponse {
  issueCreate: {
    success: boolean;
    issue: {
      id: string;
      identifier: string;
      title: string;
      url: string;
    };
  };
}

const CREATE_ISSUE_MUTATION = `
  mutation CreateIssue($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue {
        id
        identifier
        title
        url
      }
    }
  }
`;

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Usage: bun run CreateIssue.ts "Title" ["Description"] [options]

Options:
  --priority=N     Priority (1=Urgent, 2=High, 3=Medium, 4=Low)
  --state=STATE    Initial state (backlog, todo, inProgress)
  --parent=ID      Parent issue ID for sub-issues

Examples:
  bun run CreateIssue.ts "Fix login bug"
  bun run CreateIssue.ts "Add feature" "Detailed description" --priority=2
`);
    process.exit(0);
  }

  // Parse arguments
  const title = args[0];
  let description: string | undefined;
  let priority: number | undefined;
  let stateId: string = BF_INFRA.states.backlog;
  let parentId: string | undefined;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--priority=')) {
      priority = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--state=')) {
      const state = arg.split('=')[1] as keyof typeof BF_INFRA.states;
      if (BF_INFRA.states[state]) {
        stateId = BF_INFRA.states[state];
      }
    } else if (arg.startsWith('--parent=')) {
      parentId = arg.split('=')[1];
    } else if (!arg.startsWith('--')) {
      description = arg;
    }
  }

  const input: Record<string, unknown> = {
    title,
    teamId: BF_INFRA.teamId,
    projectId: BF_INFRA.projectId,
    stateId,
  };

  if (description) input.description = description;
  if (priority) input.priority = priority;
  if (parentId) input.parentId = parentId;

  try {
    const result = await linearMutation<CreateIssueResponse>(CREATE_ISSUE_MUTATION, { input });
    
    if (result.issueCreate.success) {
      const issue = result.issueCreate.issue;
      console.log(`Created: ${issue.identifier} - ${issue.title}`);
      console.log(`URL: ${issue.url}`);
    } else {
      console.error('Failed to create issue');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
