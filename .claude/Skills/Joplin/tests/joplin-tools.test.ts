/**
 * Joplin Tools Integration Tests
 *
 * These tests verify all Joplin TypeScript tools work correctly against a running Joplin instance.
 *
 * Prerequisites:
 *   - Joplin Desktop running with Web Clipper service enabled
 *   - API token stored in macOS Keychain:
 *     security add-generic-password -s "joplin-token" -a "claude-code" -w "<your-token>"
 *
 * Run tests:
 *   cd /Users/jbarkley/PAI/.claude/skills/Joplin/tools
 *   bun test ../tests/joplin-tools.test.ts
 */

import { describe, test, expect, beforeAll, afterAll, setDefaultTimeout } from 'bun:test';

// Increase test timeout for API calls
setDefaultTimeout(15000);
import { $ } from 'bun';

const TOOLS_DIR = '/Users/jbarkley/PAI/.claude/skills/Joplin/tools';

// Helper to run a tool and parse JSON output
async function runTool(toolFile: string, ...args: string[]): Promise<unknown> {
  const result = await $`bun run ${TOOLS_DIR}/${toolFile} ${args}`.text();
  return JSON.parse(result);
}

// Test notebook and note created during tests
let testNotebookId: string | null = null;
let testNoteId: string | null = null;
let testTagId: string | null = null;

describe('Joplin Tools Integration Tests', () => {
  describe('ping.ts', () => {
    test('should connect to Joplin successfully', async () => {
      const result = (await runTool('ping.ts')) as { status: string; message: string };
      expect(result.status).toBe('ok');
      expect(result.message).toContain('running and accessible');
    });
  });

  describe('notebooks.ts', () => {
    test('should list notebooks', async () => {
      const result = (await runTool('notebooks.ts', 'list')) as { count: number; notebooks: unknown[] };
      expect(result.count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.notebooks)).toBe(true);
    });

    test('should create a notebook', async () => {
      const testName = `Test Notebook ${Date.now()}`;
      const result = (await runTool('notebooks.ts', 'create', testName)) as { success: boolean; id: string; title: string };
      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^[a-f0-9]{32}$/i);
      expect(result.title).toBe(testName);
      testNotebookId = result.id;
    });

    test('should get a notebook by ID', async () => {
      if (!testNotebookId) throw new Error('No test notebook created');
      const result = (await runTool('notebooks.ts', 'get', testNotebookId)) as { id: string; title: string };
      expect(result.id).toBe(testNotebookId);
    });

    test('should rename a notebook', async () => {
      if (!testNotebookId) throw new Error('No test notebook created');
      const newName = `Renamed Notebook ${Date.now()}`;
      const result = (await runTool('notebooks.ts', 'rename', testNotebookId, newName)) as { success: boolean; title: string };
      expect(result.success).toBe(true);
      expect(result.title).toBe(newName);
    });
  });

  describe('notes.ts', () => {
    test('should create a note', async () => {
      if (!testNotebookId) throw new Error('No test notebook created');

      // First get the notebook name
      const notebook = (await runTool('notebooks.ts', 'get', testNotebookId)) as { title: string };

      const testTitle = `Test Note ${Date.now()}`;
      const testBody = 'This is test content for the note.';

      const result = (await runTool(
        'notes.ts',
        'create',
        testTitle,
        '--notebook',
        notebook.title,
        '--body',
        testBody
      )) as { success: boolean; id: string; title: string };

      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^[a-f0-9]{32}$/i);
      expect(result.title).toBe(testTitle);
      testNoteId = result.id;
    });

    test('should get a note by ID', async () => {
      if (!testNoteId) throw new Error('No test note created');
      const result = (await runTool('notes.ts', 'get', testNoteId)) as { id: string; content: string };
      expect(result.id).toBe(testNoteId);
      expect(result.content).toContain('test content');
    });

    test('should update a note', async () => {
      if (!testNoteId) throw new Error('No test note created');
      const newBody = 'Updated content for the test note.';
      const result = (await runTool('notes.ts', 'update', testNoteId, '--body', newBody)) as { success: boolean };
      expect(result.success).toBe(true);

      // Verify the update
      const updated = (await runTool('notes.ts', 'get', testNoteId)) as { content: string };
      expect(updated.content).toContain('Updated content');
    });

    test('should rename a note', async () => {
      if (!testNoteId) throw new Error('No test note created');
      const newTitle = `Renamed Note ${Date.now()}`;
      const result = (await runTool('notes.ts', 'rename', testNoteId, newTitle)) as { success: boolean; title: string };
      expect(result.success).toBe(true);
      expect(result.title).toBe(newTitle);
    });

    test('should find notes in notebook', async () => {
      if (!testNotebookId) throw new Error('No test notebook created');

      // Get notebook name
      const notebook = (await runTool('notebooks.ts', 'get', testNotebookId)) as { title: string };

      const result = (await runTool('notes.ts', 'find_in_notebook', notebook.title)) as {
        notebook: { id: string };
        notes: unknown[];
      };
      expect(result.notebook.id).toBe(testNotebookId);
      expect(Array.isArray(result.notes)).toBe(true);
    });
  });

  describe('tags.ts', () => {
    test('should list tags', async () => {
      const result = (await runTool('tags.ts', 'list')) as { count: number; tags: unknown[] };
      expect(result.count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.tags)).toBe(true);
    });

    test('should create a tag', async () => {
      const testTagName = `test-tag-${Date.now()}`;
      const result = (await runTool('tags.ts', 'create', testTagName)) as {
        success: boolean;
        id: string;
        title: string;
      };
      expect(result.success).toBe(true);
      expect(result.id).toMatch(/^[a-f0-9]{32}$/i);
      testTagId = result.id;
    });

    test('should tag a note', async () => {
      if (!testNoteId || !testTagId) throw new Error('No test note or tag created');

      // Get tag name
      const tags = (await runTool('tags.ts', 'list')) as { tags: Array<{ id: string; title: string }> };
      const testTag = tags.tags.find((t) => t.id === testTagId);
      if (!testTag) throw new Error('Test tag not found');

      const result = (await runTool('tags.ts', 'tag', testNoteId, testTag.title)) as { success: boolean };
      expect(result.success).toBe(true);
    });

    test('should get tags by note', async () => {
      if (!testNoteId) throw new Error('No test note created');
      const result = (await runTool('tags.ts', 'get_by_note', testNoteId)) as {
        note: { id: string };
        count: number;
        tags: unknown[];
      };
      expect(result.note.id).toBe(testNoteId);
      expect(result.count).toBeGreaterThan(0);
    });

    test('should untag a note', async () => {
      if (!testNoteId || !testTagId) throw new Error('No test note or tag created');

      // Get tag name
      const tags = (await runTool('tags.ts', 'list')) as { tags: Array<{ id: string; title: string }> };
      const testTag = tags.tags.find((t) => t.id === testTagId);
      if (!testTag) throw new Error('Test tag not found');

      const result = (await runTool('tags.ts', 'untag', testNoteId, testTag.title)) as { success: boolean };
      expect(result.success).toBe(true);
    });
  });

  describe('search.ts', () => {
    test('should find all notes', async () => {
      const result = (await runTool('search.ts', 'find_notes', '*', '--limit', '5')) as {
        query: string;
        notes: unknown[];
      };
      expect(result.query).toBe('(all notes)');
      expect(Array.isArray(result.notes)).toBe(true);
    });

    test('should search notes by query', async () => {
      const result = (await runTool('search.ts', 'find_notes', 'test', '--limit', '5')) as {
        query: string;
        notes: unknown[];
      };
      expect(result.query).toBe('test');
      expect(Array.isArray(result.notes)).toBe(true);
    });

    test('should search in note with regex', async () => {
      if (!testNoteId) throw new Error('No test note created');
      const result = (await runTool('search.ts', 'find_in_note', testNoteId, 'Updated')) as {
        note: { id: string };
        pattern: string;
        matches: unknown[];
      };
      expect(result.note.id).toBe(testNoteId);
      expect(result.pattern).toBe('Updated');
    });
  });

  describe('links.ts', () => {
    test('should get links for a note', async () => {
      if (!testNoteId) throw new Error('No test note created');
      const result = (await runTool('links.ts', 'get_links', testNoteId)) as {
        note: { id: string };
        outgoing_links: { count: number };
        backlinks: { count: number };
      };
      expect(result.note.id).toBe(testNoteId);
      expect(result.outgoing_links).toBeDefined();
      expect(result.backlinks).toBeDefined();
    });
  });

  // Cleanup
  describe('Cleanup', () => {
    test('should delete test note', async () => {
      if (!testNoteId) throw new Error('No test note to delete');
      const result = (await runTool('notes.ts', 'delete', testNoteId)) as { success: boolean };
      expect(result.success).toBe(true);
    });

    test('should delete test tag', async () => {
      if (!testTagId) throw new Error('No test tag to delete');
      const result = (await runTool('tags.ts', 'delete', testTagId)) as { success: boolean };
      expect(result.success).toBe(true);
    });

    test('should delete test notebook', async () => {
      if (!testNotebookId) throw new Error('No test notebook to delete');
      const result = (await runTool('notebooks.ts', 'delete', testNotebookId)) as { success: boolean };
      expect(result.success).toBe(true);
    });
  });
});
