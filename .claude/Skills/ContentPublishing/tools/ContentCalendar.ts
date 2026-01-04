#!/usr/bin/env bun
/**
 * ContentCalendar - Manage content planning and scheduling
 *
 * Usage:
 *   bun run tools/ContentCalendar.ts list [--month=YYYY-MM]
 *   bun run tools/ContentCalendar.ts add "Title" --date=YYYY-MM-DD [--status=draft|scheduled|published]
 *   bun run tools/ContentCalendar.ts update ID --status=STATUS
 *   bun run tools/ContentCalendar.ts init
 *
 * Options:
 *   --month=YYYY-MM   Filter by month
 *   --date=YYYY-MM-DD Publish date
 *   --status=STATUS   draft, scheduled, published
 *
 * Examples:
 *   bun run tools/ContentCalendar.ts init
 *   bun run tools/ContentCalendar.ts list --month=2025-01
 *   bun run tools/ContentCalendar.ts add "Best Cameras 2025" --date=2025-01-15 --status=scheduled
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ContentItem {
  id: string;
  title: string;
  date: string;
  status: 'draft' | 'scheduled' | 'published';
  type: 'blog' | 'tutorial' | 'newsletter' | 'announcement';
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContentCalendarData {
  items: ContentItem[];
  lastUpdated: string;
}

const CALENDAR_FILE = 'content-calendar.json';

function loadCalendar(): ContentCalendarData {
  const calendarPath = join(process.cwd(), CALENDAR_FILE);

  if (!existsSync(calendarPath)) {
    return {
      items: [],
      lastUpdated: new Date().toISOString()
    };
  }

  return JSON.parse(readFileSync(calendarPath, 'utf-8'));
}

function saveCalendar(data: ContentCalendarData): void {
  const calendarPath = join(process.cwd(), CALENDAR_FILE);
  data.lastUpdated = new Date().toISOString();
  writeFileSync(calendarPath, JSON.stringify(data, null, 2));
}

function generateId(): string {
  return `content-${Date.now().toString(36)}`;
}

function listItems(month?: string): void {
  const calendar = loadCalendar();

  let items = calendar.items;

  if (month) {
    items = items.filter(item => item.date.startsWith(month));
  }

  // Sort by date
  items.sort((a, b) => a.date.localeCompare(b.date));

  if (items.length === 0) {
    console.log('\nNo content items found.\n');
    console.log('Use "bun run ContentCalendar.ts add" to add items.');
    return;
  }

  console.log('\n' + '='.repeat(80));
  console.log('CONTENT CALENDAR');
  if (month) console.log(`Showing: ${month}`);
  console.log('='.repeat(80) + '\n');

  // Group by status
  const byStatus = {
    draft: items.filter(i => i.status === 'draft'),
    scheduled: items.filter(i => i.status === 'scheduled'),
    published: items.filter(i => i.status === 'published')
  };

  for (const [status, statusItems] of Object.entries(byStatus)) {
    if (statusItems.length === 0) continue;

    const icon = { draft: '📝', scheduled: '📅', published: '✅' }[status];
    console.log(`${icon} ${status.toUpperCase()} (${statusItems.length})`);
    console.log('-'.repeat(40));

    for (const item of statusItems) {
      console.log(`  ${item.date} | ${item.title}`);
      console.log(`           ID: ${item.id} | Type: ${item.type}`);
      if (item.tags?.length) {
        console.log(`           Tags: ${item.tags.join(', ')}`);
      }
      console.log();
    }
  }

  console.log(`Total: ${items.length} items`);
}

function addItem(
  title: string,
  date: string,
  status: ContentItem['status'] = 'draft',
  type: ContentItem['type'] = 'blog'
): void {
  const calendar = loadCalendar();

  const newItem: ContentItem = {
    id: generateId(),
    title,
    date,
    status,
    type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  calendar.items.push(newItem);
  saveCalendar(calendar);

  console.log(`\n✅ Added: ${newItem.title}`);
  console.log(`   ID: ${newItem.id}`);
  console.log(`   Date: ${newItem.date}`);
  console.log(`   Status: ${newItem.status}`);
}

function updateItem(id: string, status: ContentItem['status']): void {
  const calendar = loadCalendar();

  const item = calendar.items.find(i => i.id === id);

  if (!item) {
    console.error(`\n❌ Item not found: ${id}`);
    process.exit(1);
  }

  const oldStatus = item.status;
  item.status = status;
  item.updatedAt = new Date().toISOString();

  saveCalendar(calendar);

  console.log(`\n✅ Updated: ${item.title}`);
  console.log(`   Status: ${oldStatus} → ${status}`);
}

function initCalendar(): void {
  const calendarPath = join(process.cwd(), CALENDAR_FILE);

  if (existsSync(calendarPath)) {
    console.log('\n⚠️  content-calendar.json already exists');
    process.exit(1);
  }

  const template: ContentCalendarData = {
    items: [
      {
        id: 'content-example1',
        title: 'Example: Getting Started Guide',
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
        type: 'tutorial',
        tags: ['getting-started', 'tutorial'],
        notes: 'Replace with your actual content items',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    lastUpdated: new Date().toISOString()
  };

  saveCalendar(template);

  console.log('\n✅ Created content-calendar.json');
  console.log('   Edit this file or use the CLI to manage your content calendar.');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help') {
    console.log(`
Content Calendar - Manage content planning and scheduling

Usage:
  bun run ContentCalendar.ts list [--month=YYYY-MM]
  bun run ContentCalendar.ts add "Title" --date=YYYY-MM-DD [--status=draft|scheduled|published]
  bun run ContentCalendar.ts update ID --status=STATUS
  bun run ContentCalendar.ts init

Examples:
  bun run ContentCalendar.ts init
  bun run ContentCalendar.ts list
  bun run ContentCalendar.ts list --month=2025-01
  bun run ContentCalendar.ts add "Best Cameras 2025" --date=2025-01-15
  bun run ContentCalendar.ts update content-abc123 --status=published
`);
    process.exit(0);
  }

  if (command === 'init') {
    initCalendar();
  } else if (command === 'list') {
    let month: string | undefined;
    for (const arg of args) {
      if (arg.startsWith('--month=')) {
        month = arg.split('=')[1];
      }
    }
    listItems(month);
  } else if (command === 'add') {
    const title = args[1];
    if (!title) {
      console.error('❌ Title required: add "Title" --date=YYYY-MM-DD');
      process.exit(1);
    }

    let date = new Date().toISOString().split('T')[0];
    let status: ContentItem['status'] = 'draft';

    for (const arg of args) {
      if (arg.startsWith('--date=')) {
        date = arg.split('=')[1];
      } else if (arg.startsWith('--status=')) {
        status = arg.split('=')[1] as ContentItem['status'];
      }
    }

    addItem(title, date, status);
  } else if (command === 'update') {
    const id = args[1];
    if (!id) {
      console.error('❌ ID required: update ID --status=STATUS');
      process.exit(1);
    }

    let status: ContentItem['status'] | undefined;
    for (const arg of args) {
      if (arg.startsWith('--status=')) {
        status = arg.split('=')[1] as ContentItem['status'];
      }
    }

    if (!status) {
      console.error('❌ Status required: --status=draft|scheduled|published');
      process.exit(1);
    }

    updateItem(id, status);
  } else {
    console.error(`❌ Unknown command: ${command}`);
    process.exit(1);
  }
}

main();
