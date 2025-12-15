# PAI Release Notes - December 2025

## TL;DR - Update Now

```bash
cd ~/PAI && git pull origin merlin-all && ./setup.sh
```

That's it. The setup script preserves your existing AI name and user name.

---

## What's New

### Modular Launcher System
Your PAI now has an intelligent startup system that runs before Claude Code launches:

- **MCP Sync** - Automatically syncs MCP server configs to `~/.claude/mcp.json`
- **Health Check** - Validates your PAI installation on each launch
- **Context Detection** - Finds and loads project context files automatically
- **Auto-Update Check** - Notifies you when PAI updates are available

### Project-Level Configuration
You can now override PAI settings per-project by creating `.claude/pai-config.json` in any project directory:

```json
{
  "context": {
    "onLoad": "auto-load",
    "onExit": "auto-save"
  }
}
```

This lets you enable auto-save context for specific projects without affecting global behavior.

### New Skills
- **Cloudflare** - Deploy to Pages, manage Workers, D1 databases, KV storage
- **GitLab** - CI/CD pipelines, repository management, scheduled jobs
- **ContentPublishing** - End-to-end blog publishing workflow
- **McpManager** - Add/remove MCP servers from templates

### Setup Improvements
- Preserves your AI name and user name during upgrades
- Creates launcher alias (`charles`/`char` or your custom name)
- Initializes `pai-config.json` with sensible defaults
- Branch-aware cloning (merlin-all for full features)

### Context Save on Exit
When configured, PAI can automatically save session summaries to your project's context file when you exit. Enable it globally or per-project via `pai-config.json`.

---

## Breaking Changes

None. Existing installations will continue to work. The update adds new features without changing existing behavior.

---

## Configuration Reference

### pai-config.json Options

| Setting | Values | Description |
|---------|--------|-------------|
| `context.onLoad` | `auto-load`, `notify`, `none` | How to handle project context at startup |
| `context.onExit` | `auto-save`, `prompt`, `none` | Whether to save session context on exit |
| `autoUpdate` | `notify`, `auto`, `off` | Update notification behavior |

### Context File Locations (checked in order)
1. `./project-context.md`
2. `./CONTEXT.md`
3. `./.claude/context.md`

---

## Questions?

Ping Joey or ask your PAI - it knows about these features now.
