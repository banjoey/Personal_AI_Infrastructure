---
name: Joplin
description: Extended Joplin operations beyond MCP. USE WHEN user needs to move notes between notebooks, rename notebooks, rename notes, OR when MCP tools are insufficient. Provides direct API access for operations the MCP doesn't support. (user)
---

# Joplin Skill - Extended Operations

This skill provides Joplin operations that the MCP server doesn't support, using direct REST API calls via TypeScript tools.

## Quick Reference

| Operation | Tool | Command |
|-----------|------|---------|
| **Test connection** | ping.ts | `bun run ping.ts` |
| **List notebooks** | notebooks.ts | `bun run notebooks.ts list` |
| **Create notebook** | notebooks.ts | `bun run notebooks.ts create "Name" [--parent <id>]` |
| **Rename notebook** | notebooks.ts | `bun run notebooks.ts rename <id> "New Name"` |
| **Move notebook** | notebooks.ts | `bun run notebooks.ts move <id> <parent_id>` |
| **Delete notebook** | notebooks.ts | `bun run notebooks.ts delete <id>` |
| **Get note** | notes.ts | `bun run notes.ts get <id> [options]` |
| **Create note** | notes.ts | `bun run notes.ts create "Title" --notebook "Name"` |
| **Rename note** | notes.ts | `bun run notes.ts rename <id> "New Title"` |
| **Move note** | notes.ts | `bun run notes.ts move <id> <notebook_id>` |
| **Update note** | notes.ts | `bun run notes.ts update <id> [options]` |
| **Delete note** | notes.ts | `bun run notes.ts delete <id>` |
| **Find in notebook** | notes.ts | `bun run notes.ts find_in_notebook "Notebook"` |
| **List tags** | tags.ts | `bun run tags.ts list` |
| **Create tag** | tags.ts | `bun run tags.ts create "Name"` |
| **Tag note** | tags.ts | `bun run tags.ts tag <note_id> "Tag Name"` |
| **Untag note** | tags.ts | `bun run tags.ts untag <note_id> "Tag Name"` |
| **Get note tags** | tags.ts | `bun run tags.ts get_by_note <note_id>` |
| **Delete tag** | tags.ts | `bun run tags.ts delete <tag_id>` |
| **Find notes** | search.ts | `bun run search.ts find_notes "query"` |
| **Find by tag** | search.ts | `bun run search.ts find_notes_with_tag "tag"` |
| **Regex search** | search.ts | `bun run search.ts find_in_note <id> "pattern"` |
| **Get links** | links.ts | `bun run links.ts get_links <note_id>` |

## Tool Details

### ping.ts - Connection Test

Test connectivity to Joplin server.

```bash
cd /Users/jbarkley/PAI/.claude/skills/Joplin/tools
bun run ping.ts
```

Returns JSON with connection status.

### notebooks.ts - Notebook Management

Manage Joplin notebooks (folders).

```bash
cd /Users/jbarkley/PAI/.claude/skills/Joplin/tools

# List all notebooks with hierarchy
bun run notebooks.ts list

# Get single notebook details
bun run notebooks.ts get <notebook_id>

# Create top-level notebook
bun run notebooks.ts create "Project Notes"

# Create sub-notebook
bun run notebooks.ts create "2025 Projects" --parent <parent_id>

# Rename notebook
bun run notebooks.ts rename <notebook_id> "New Name"

# Move notebook to different parent
bun run notebooks.ts move <notebook_id> <parent_id>

# Move notebook to root level
bun run notebooks.ts move <notebook_id> ""

# Delete notebook
bun run notebooks.ts delete <notebook_id>
```

### notes.ts - Note Management

Manage individual notes with smart content display.

```bash
cd /Users/jbarkley/PAI/.claude/skills/Joplin/tools

# Get note (smart display - full if short, TOC if long)
bun run notes.ts get <note_id>

# Get TOC only
bun run notes.ts get <note_id> --toc-only

# Force full content
bun run notes.ts get <note_id> --force-full

# Get specific section
bun run notes.ts get <note_id> --section "1"  # by number
bun run notes.ts get <note_id> --section "introduction"  # by slug

# Sequential reading (pagination)
bun run notes.ts get <note_id> --start-line 1
bun run notes.ts get <note_id> --start-line 51 --line-count 30

# Create note
bun run notes.ts create "Meeting Notes" --notebook "Work" --body "# Meeting\nNotes here"

# Create todo
bun run notes.ts create "Task" --notebook "Tasks" --is-todo --body "Do the thing"

# Rename note
bun run notes.ts rename <note_id> "New Title"

# Move note to different notebook
bun run notes.ts move <note_id> <notebook_id>

# Update note content
bun run notes.ts update <note_id> --title "Updated" --body "New content"

# Mark todo complete
bun run notes.ts update <note_id> --todo-completed

# Delete note
bun run notes.ts delete <note_id>

# Find notes in specific notebook
bun run notes.ts find_in_notebook "Work Projects"
bun run notes.ts find_in_notebook "Tasks" --task --completed false
```

### tags.ts - Tag Management

Manage tags and note tagging.

```bash
cd /Users/jbarkley/PAI/.claude/skills/Joplin/tools

# List all tags with note counts
bun run tags.ts list

# Create tag
bun run tags.ts create "important"

# Add tag to note
bun run tags.ts tag <note_id> "important"

# Remove tag from note
bun run tags.ts untag <note_id> "important"

# Get all tags for a note
bun run tags.ts get_by_note <note_id>

# Delete tag
bun run tags.ts delete <tag_id>
```

### search.ts - Search & Filter

Search notes by various criteria.

```bash
cd /Users/jbarkley/PAI/.claude/skills/Joplin/tools

# Find notes by text (searches title and body)
bun run search.ts find_notes "meeting"

# List all notes
bun run search.ts find_notes "*"

# Filter by task status
bun run search.ts find_notes "*" --task --completed false

# Pagination
bun run search.ts find_notes "project" --limit 10 --offset 20

# Find notes with specific tag
bun run search.ts find_notes_with_tag "important"
bun run search.ts find_notes_with_tag "work" --task

# Regex search within a note
bun run search.ts find_in_note <note_id> "TODO:.*"
bun run search.ts find_in_note <note_id> "pattern" --case-sensitive
bun run search.ts find_in_note <note_id> "pattern" --multiline --dotall
```

### links.ts - Link Analysis

Extract outgoing links and backlinks from notes.

```bash
cd /Users/jbarkley/PAI/.claude/skills/Joplin/tools

# Get all links for a note (outgoing and backlinks)
bun run links.ts get_links <note_id>
```

Returns:
- **Outgoing links**: Links from this note to other notes
- **Backlinks**: Links from other notes to this note
- Supports section links: `[text](:/noteId#section-slug)`

## Configuration

### API Token Storage

The Joplin API token is stored in macOS Keychain:
- **Service**: `joplin-token`
- **Account**: `claude-code`

All TypeScript tools automatically retrieve the token from keychain via `joplin-client.ts`.

### Base URL

All tools connect to: `http://localhost:41184`

## When to Use This vs MCP

| Operation | Use MCP | Use This Skill |
|-----------|---------|----------------|
| Create note | Yes | **Yes** (both work) |
| Read note | Yes | **Yes** (skill has smart display) |
| Search notes | Yes | **Yes** (skill has more filters) |
| Create notebook | Yes | **Yes** (both work) |
| **Rename notebook** | No | **Yes** |
| **Rename note** | No | **Yes** |
| **Move note** | No | **Yes** |
| **Move notebook** | No | **Yes** |
| **Find in notebook** | Limited | **Yes** |
| **Regex search** | No | **Yes** |
| **Link analysis** | No | **Yes** |

## Legacy Shell Scripts

The following shell scripts are kept for backward compatibility but are superseded by TypeScript tools:

- `joplin-rename-notebook.sh` → Use `notebooks.ts rename`
- `joplin-rename-note.sh` → Use `notes.ts rename`
- `joplin-move-note.sh` → Use `notes.ts move`
- `joplin-move-notebook.sh` → Use `notebooks.ts move`

**Prefer TypeScript tools for:**
- Consistent JSON output
- Better error handling
- Type safety
- Easier to extend

## Common Patterns

### Workshop Context Loading

```bash
# Find the "📍 Current" note in a workshop notebook
cd /Users/jbarkley/PAI/.claude/skills/Joplin/tools
bun run notes.ts find_in_notebook "finances"
bun run notes.ts get <note_id>
```

### Tag-Based Organization

```bash
# Find all notes tagged "time-slip"
bun run search.ts find_notes_with_tag "time-slip"

# Tag a note for follow-up
bun run tags.ts tag <note_id> "follow-up"
```

### Sequential Reading

```bash
# Start reading long note
bun run notes.ts get <note_id> --start-line 1

# Continue reading
bun run notes.ts get <note_id> --start-line 51
```

## API Reference

- **Base URL**: `http://localhost:41184`
- **Notebooks**: Called "folders" in the API
- **IDs**: 32-character hex strings
- **Updates**: PUT requests perform partial updates

All tools output structured JSON for easy parsing and integration.
