# JOPLIN-001: Replace MCP Server with Direct REST API Tools

| Field | Value |
|-------|-------|
| **Story ID** | JOPLIN-001 |
| **Author** | Charles (PAI) |
| **Date** | 2026-01-02 |
| **Status** | SPEC |

---

## Problem Statement

The Joplin MCP server loads 20+ tool definitions into Claude's context at startup, consuming significant tokens even when Joplin isn't used. This contributes to the skill visibility limit (only 41/75 skills visible). Joey needs full Joplin functionality without the constant token overhead.

---

## Goals

1. **Replace MCP with direct API** - Implement all Joplin operations as TypeScript tools using REST API calls
2. **Reduce token overhead** - Remove Joplin MCP from always-loaded context
3. **Maintain full functionality** - All 18 Joplin operations available when the skill is invoked

---

## Non-Goals

| Item | Rationale |
|------|-----------|
| Changing Joplin's API | We work with existing REST API at localhost:41184 |
| Adding new Joplin features | Parity with MCP, not enhancement |
| Modifying keychain storage | Existing pattern works, keep it |

---

## Background

### Current State
- Joplin MCP defined in `~/.claude/.mcp.json`
- Loads at Claude Code startup
- 20+ tool definitions always in context
- Existing Joplin skill has 4 shell scripts for operations MCP doesn't support

### Usage Analysis (from session research)
704 total invocations analyzed:
- `create_note` (21.6%), `get_note` (19.6%), `find_notes_in_notebook` (13.9%)
- `update_note` (13.1%), `find_notes` (9.4%)
- Remaining operations: <8% each

### Target State
- Joplin MCP removed from `.mcp.json`
- All operations available via TypeScript tools in skill directory
- Tools invoked only when Joplin skill is used
- Zero token overhead when Joplin not in use

---

## Acceptance Criteria

- [ ] All 18 Joplin operations implemented as TypeScript tools
- [ ] Each tool retrieves API token from macOS Keychain
- [ ] Each tool handles errors gracefully with clear messages
- [ ] All tools return JSON output for easy parsing
- [ ] Joplin MCP removed from `~/.claude/.mcp.json`
- [ ] SKILL.md updated with new tool documentation
- [ ] Existing shell scripts either removed or migrated to TypeScript
- [ ] Integration tests verify each operation works

---

## Functions to Implement

| # | Function | Purpose | Priority |
|---|----------|---------|----------|
| 1 | `ping_joplin` | Health check | High |
| 2 | `list_notebooks` | List all notebooks | High |
| 3 | `create_notebook` | Create notebook | High |
| 4 | `delete_notebook` | Delete notebook | Medium |
| 5 | `find_notes` | Search all notes | High |
| 6 | `find_notes_in_notebook` | Search within notebook | High |
| 7 | `find_notes_with_tag` | Search by tag | Medium |
| 8 | `find_in_note` | Regex search in note | Low |
| 9 | `get_note` | Read note content | High |
| 10 | `create_note` | Create new note | High |
| 11 | `update_note` | Update note | High |
| 12 | `delete_note` | Delete note | Medium |
| 13 | `list_tags` | List all tags | Medium |
| 14 | `create_tag` | Create tag | Medium |
| 15 | `delete_tag` | Delete tag | Low |
| 16 | `tag_note` | Add tag to note | Medium |
| 17 | `untag_note` | Remove tag from note | Low |
| 18 | `get_tags_by_note` | Get tags for note | Medium |
| 19 | `get_links` | Get note links/backlinks | Low |
| 20 | `rename_notebook` | Rename notebook (existing) | Medium |
| 21 | `rename_note` | Rename note (existing) | Medium |
| 22 | `move_note` | Move note (existing) | Medium |
| 23 | `move_notebook` | Move notebook (existing) | Medium |

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Joplin not running | Clear error: "Joplin not running at localhost:41184" |
| Invalid API token | Clear error: "Invalid Joplin API token" |
| Note not found | Return error with note ID, suggest search |
| Notebook not found | Return error with notebook name, list available |
| Network timeout | Retry once, then error with timeout message |
| Empty search results | Return empty array, not error |
| Note content too large | Handle gracefully, consider chunking for get_note |

---

## Constraints

| Type | Constraint |
|------|------------|
| Technical | Must use Bun runtime (PAI standard) |
| Technical | API token from macOS Keychain only |
| Technical | REST API at http://localhost:41184 |
| Security | Never log or expose API token |
| Compatibility | Output format should match MCP tool output where possible |

---

## Security Considerations

| Category | Consideration |
|----------|---------------|
| Credential Storage | Token in Keychain, never in code or logs |
| API Access | Local only (localhost), no remote access |
| Input Validation | Sanitize note IDs, notebook names |
| Output Filtering | Don't expose token in error messages |

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| Joplin Desktop | External | Running locally |
| macOS Keychain | External | Token stored |
| Bun runtime | Internal | Available |
| security CLI | External | macOS built-in |

---

## Open Questions

1. **Output format parity** - Should output exactly match MCP format, or can we improve it?
   - *Recommendation:* Match MCP format for compatibility, add enhancements as optional

2. **Batch operations** - Should we add batch create/update not in MCP?
   - *Recommendation:* Non-goal for v1, can add later

3. **Caching** - Should we cache notebook list for performance?
   - *Recommendation:* No, keep it simple, always fresh from API

---

## Technical Design Notes

### File Structure
```
~/PAI/.claude/skills/Joplin/
├── SKILL.md                    # Updated skill documentation
├── stories/
│   └── JOPLIN-001-*.md        # This spec
├── tools/
│   ├── joplin-client.ts       # Shared API client
│   ├── ping.ts
│   ├── notebooks.ts           # list, create, delete, rename, move
│   ├── notes.ts               # find, get, create, update, delete, move, rename
│   ├── tags.ts                # list, create, delete, tag, untag, get_by_note
│   └── links.ts               # get_links
└── tests/
    └── joplin-tools.test.ts   # Integration tests
```

### Shared Client Pattern
```typescript
// joplin-client.ts
export async function getToken(): Promise<string> {
  const result = await $`security find-generic-password -s joplin-token -a claude-code -w`.text();
  return result.trim();
}

export async function joplinApi(endpoint: string, options?: RequestInit) {
  const token = await getToken();
  const response = await fetch(`http://localhost:41184${endpoint}?token=${token}`, options);
  if (!response.ok) throw new JoplinError(response.status, await response.text());
  return response.json();
}
```

---

## Appendix

### Joplin REST API Reference
- Base URL: `http://localhost:41184`
- Auth: `?token=<api_token>` query parameter
- Notebooks = "folders" in API
- IDs are 32-character hex strings
- PUT for updates, POST for creates, DELETE for deletes

### Existing Shell Scripts to Migrate
- `joplin-rename-notebook.sh` → `notebooks.ts`
- `joplin-rename-note.sh` → `notes.ts`
- `joplin-move-note.sh` → `notes.ts`
- `joplin-move-notebook.sh` → `notebooks.ts`
