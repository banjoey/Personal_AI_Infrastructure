---
name: Joplin
description: Extended Joplin operations beyond MCP. USE WHEN user needs to move notes between notebooks, rename notebooks, rename notes, OR when MCP tools are insufficient. Provides direct API access for operations the MCP doesn't support.
---

# Joplin Skill - Extended Operations

This skill provides Joplin operations that the MCP server doesn't support, using direct REST API calls.

## Available Tools

Located in `/Users/jbarkley/PAI/.claude/Skills/Joplin/tools/`:

| Tool | Purpose |
|------|---------|
| `joplin-rename-notebook.sh` | Rename a notebook |
| `joplin-rename-note.sh` | Rename a note |
| `joplin-move-note.sh` | Move a note to a different notebook |
| `joplin-move-notebook.sh` | Move a notebook under a different parent |

## Usage

### Rename a Notebook
```bash
~/.claude/Skills/Joplin/tools/joplin-rename-notebook.sh <notebook_id> "New Name"
```

### Rename a Note
```bash
~/.claude/Skills/Joplin/tools/joplin-rename-note.sh <note_id> "New Title"
```

### Move a Note to Different Notebook
```bash
~/.claude/Skills/Joplin/tools/joplin-move-note.sh <note_id> <target_notebook_id>
```

### Move a Notebook Under Different Parent
```bash
~/.claude/Skills/Joplin/tools/joplin-move-notebook.sh <notebook_id> <parent_notebook_id>
# Use empty string "" for parent_id to move to root level
```

## Configuration

The Joplin API token is stored in macOS Keychain:
- Service: `joplin-token`
- Account: `claude-code`

All tools automatically retrieve the token from keychain.

## When to Use This vs MCP

| Operation | Use MCP | Use This Skill |
|-----------|---------|----------------|
| Create note | Yes | No |
| Read note | Yes | No |
| Search notes | Yes | No |
| Create notebook | Yes | No |
| **Rename notebook** | No | **Yes** |
| **Rename note** | No | **Yes** |
| **Move note** | No | **Yes** |
| **Move notebook** | No | **Yes** |

## API Reference

All tools use the Joplin REST API at `http://localhost:41184`.

- Notebooks are called "folders" in the API
- IDs are 32-character hex strings
- PUT requests perform partial updates (only specified fields change)
