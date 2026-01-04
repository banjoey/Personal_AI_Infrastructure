#!/usr/bin/env bun
/**
 * SyncToLinear - Sync agile artifacts (epics, stories) to Linear issues
 *
 * Usage:
 *   bun run tools/SyncToLinear.ts epics.md [--project=ID] [--dry-run]
 *   bun run tools/SyncToLinear.ts stories.md --parent=MML-123 [--dry-run]
 *
 * Options:
 *   --project=ID    Linear project ID (defaults to BF Infrastructure)
 *   --parent=ID     Parent issue for sub-issues (e.g., MML-123)
 *   --dry-run       Preview what would be created without making changes
 *
 * Examples:
 *   bun run tools/SyncToLinear.ts docs/epics.md --dry-run
 *   bun run tools/SyncToLinear.ts docs/stories.md --parent=MML-50
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';

// Import Linear client from the Linear skill
const LINEAR_SKILL_PATH = resolve(dirname(import.meta.dir), '../../Linear/tools');

interface Epic {
  title: string;
  description: string;
  priority: number;
}

interface Story {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: number;
}

function parseEpicsFile(content: string): Epic[] {
  const epics: Epic[] = [];
  const lines = content.split('\n');

  let currentEpic: Partial<Epic> | null = null;
  let inDescription = false;

  for (const line of lines) {
    // Match epic headers like "## Epic 1: User Authentication"
    const epicMatch = line.match(/^##\s+Epic\s+\d+:\s+(.+)/i);
    if (epicMatch) {
      if (currentEpic?.title) {
        epics.push({
          title: currentEpic.title,
          description: currentEpic.description || '',
          priority: currentEpic.priority || 3
        });
      }
      currentEpic = {
        title: epicMatch[1].trim(),
        description: '',
        priority: 3
      };
      inDescription = true;
      continue;
    }

    // Check for priority
    const priorityMatch = line.match(/priority:\s*(urgent|high|medium|low)/i);
    if (priorityMatch && currentEpic) {
      const priorityMap: Record<string, number> = {
        urgent: 1, high: 2, medium: 3, low: 4
      };
      currentEpic.priority = priorityMap[priorityMatch[1].toLowerCase()] || 3;
      continue;
    }

    // Accumulate description
    if (currentEpic && inDescription && line.trim() && !line.startsWith('#')) {
      currentEpic.description = (currentEpic.description || '') + line.trim() + '\n';
    }
  }

  // Add last epic
  if (currentEpic?.title) {
    epics.push({
      title: currentEpic.title,
      description: currentEpic.description || '',
      priority: currentEpic.priority || 3
    });
  }

  return epics;
}

function parseStoriesFile(content: string): Story[] {
  const stories: Story[] = [];
  const lines = content.split('\n');

  let currentStory: Partial<Story> | null = null;
  let inAcceptanceCriteria = false;

  for (const line of lines) {
    // Match story headers like "### Story 1.1: Login form"
    const storyMatch = line.match(/^###\s+Story\s+[\d.]+:\s+(.+)/i);
    if (storyMatch) {
      if (currentStory?.title) {
        stories.push({
          title: currentStory.title,
          description: currentStory.description || '',
          acceptanceCriteria: currentStory.acceptanceCriteria || [],
          storyPoints: currentStory.storyPoints || 3
        });
      }
      currentStory = {
        title: storyMatch[1].trim(),
        description: '',
        acceptanceCriteria: [],
        storyPoints: 3
      };
      inAcceptanceCriteria = false;
      continue;
    }

    // Check for acceptance criteria section
    if (line.match(/acceptance\s+criteria/i)) {
      inAcceptanceCriteria = true;
      continue;
    }

    // Check for story points
    const pointsMatch = line.match(/story\s+points?:\s*(\d+)/i);
    if (pointsMatch && currentStory) {
      currentStory.storyPoints = parseInt(pointsMatch[1], 10);
      continue;
    }

    // Parse acceptance criteria (bullet points)
    if (inAcceptanceCriteria && line.match(/^[-*]\s+/) && currentStory) {
      currentStory.acceptanceCriteria = currentStory.acceptanceCriteria || [];
      currentStory.acceptanceCriteria.push(line.replace(/^[-*]\s+/, '').trim());
      continue;
    }

    // Accumulate description
    if (currentStory && !inAcceptanceCriteria && line.trim() && !line.startsWith('#')) {
      currentStory.description = (currentStory.description || '') + line.trim() + '\n';
    }
  }

  // Add last story
  if (currentStory?.title) {
    stories.push({
      title: currentStory.title,
      description: currentStory.description || '',
      acceptanceCriteria: currentStory.acceptanceCriteria || [],
      storyPoints: currentStory.storyPoints || 3
    });
  }

  return stories;
}

async function createLinearIssue(
  title: string,
  description: string,
  priority: number,
  parentId?: string,
  dryRun: boolean = false
): Promise<string> {
  if (dryRun) {
    console.log(`[DRY RUN] Would create: "${title}" (priority: ${priority})`);
    return 'DRY-RUN';
  }

  // Call Linear CLI tool
  const args = [
    'run',
    `${LINEAR_SKILL_PATH}/CreateIssue.ts`,
    title,
    description,
    `--priority=${priority}`
  ];

  if (parentId) {
    args.push(`--parent=${parentId}`);
  }

  const proc = Bun.spawn(['bun', ...args], {
    cwd: LINEAR_SKILL_PATH,
    stdout: 'pipe',
    stderr: 'pipe'
  });

  const output = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`Failed to create issue: ${stderr}`);
  }

  // Extract issue ID from output (e.g., "Created: MML-123 - Title")
  const match = output.match(/Created:\s+(MML-\d+)/);
  return match ? match[1] : 'UNKNOWN';
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Usage: bun run SyncToLinear.ts FILE [options]

Options:
  --project=ID    Linear project ID
  --parent=ID     Parent issue for sub-issues (e.g., MML-123)
  --dry-run       Preview without making changes

Examples:
  bun run SyncToLinear.ts docs/epics.md --dry-run
  bun run SyncToLinear.ts docs/stories.md --parent=MML-50
`);
    process.exit(0);
  }

  const filePath = args[0];
  let parentId: string | undefined;
  let dryRun = false;

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--parent=')) {
      parentId = args[i].split('=')[1];
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const content = readFileSync(filePath, 'utf-8');

  // Detect file type by content
  const isEpics = content.includes('## Epic');
  const isStories = content.includes('### Story');

  if (isEpics) {
    console.log('Detected epics file...\n');
    const epics = parseEpicsFile(content);

    console.log(`Found ${epics.length} epics:\n`);
    for (const epic of epics) {
      const issueId = await createLinearIssue(
        `[Epic] ${epic.title}`,
        epic.description,
        epic.priority,
        undefined,
        dryRun
      );
      console.log(`  ${issueId}: ${epic.title}`);
    }
  } else if (isStories) {
    console.log('Detected stories file...\n');
    const stories = parseStoriesFile(content);

    if (!parentId) {
      console.warn('Warning: No --parent specified. Stories will be created as top-level issues.\n');
    }

    console.log(`Found ${stories.length} stories:\n`);
    for (const story of stories) {
      const description = story.description +
        '\n\n**Acceptance Criteria:**\n' +
        story.acceptanceCriteria.map(ac => `- [ ] ${ac}`).join('\n') +
        `\n\n**Story Points:** ${story.storyPoints}`;

      const issueId = await createLinearIssue(
        story.title,
        description,
        3, // Stories default to medium priority
        parentId,
        dryRun
      );
      console.log(`  ${issueId}: ${story.title} (${story.storyPoints} pts)`);
    }
  } else {
    console.error('Could not detect file type. Expected epics (## Epic) or stories (### Story) format.');
    process.exit(1);
  }

  console.log('\nDone!');
}

main();
