---
name: ConfigSync
description: Sync PAI configurations and skills between Claude Code and OpenCode environments. USE WHEN user mentions sync, convert config, port to opencode, port to claude, update joey-all, update opencode-all, OR sync skills between environments.
---

# ConfigSync - Cross-Environment Synchronization

**Bidirectional sync between Claude Code (joey-all) and OpenCode (opencode-all) environments.**

## Repository Locations

| Environment | Repo Path | Branch | Config Dir |
|-------------|-----------|--------|------------|
| Claude Code | `~/src/pai/Personal_AI_Infrastructure` | `joey-all` | `.claude/` |
| OpenCode | `~/src/PAI-opencode` | `opencode-all` | `.opencode/` |
| Live OpenCode | `~/.config/opencode` | N/A | Root |

## Workflow Routing

| Trigger | Action |
|---------|--------|
| "sync to opencode", "port to opencode" | Claude → OpenCode sync |
| "sync to claude", "port to claude code" | OpenCode → Claude sync |
| "update opencode-all" | Pull joey-all, convert, commit to opencode-all |
| "update joey-all" | Pull opencode-all, convert, commit to joey-all |
| "convert this config" | Convert .mcp.json ↔ opencode.jsonc |
| "deploy to live" | Copy from repo to ~/.config/opencode/ |
| "sync skills" | Copy skill directories between environments |

## Directory Structure Mapping

### Skills
```
Claude Code:  .claude/skills/{SkillName}/SKILL.md
              .claude/Skills/{SkillName}/SKILL.md  (TitleCase canonical)
OpenCode:     .opencode/skill/{SkillName}/SKILL.md
Live:         ~/.config/opencode/skill/{SkillName}/SKILL.md
```

**Rule:** Top-level must be lowercase for OpenCode (`skill/`), subdirs are TitleCase (`CORE/`, `Fabric/`).

### Config Files
```
Claude Code:  .mcp.json (project), .claude/settings.local.json
OpenCode:     .opencode/opencode.jsonc (project), .mcp.json (also works)
```

## Config Conversion

### .mcp.json → opencode.jsonc

**Claude Code format:**
```json
{
  "mcpServers": {
    "joplin": {
      "command": "/path/to/joplin-mcp-server",
      "args": ["--config", "/path/to/config.json"],
      "description": "Joplin notes"
    }
  }
}
```

**OpenCode format:**
```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-opus-4",
  "mcp": {
    "joplin": {
      "type": "local",
      "command": ["/path/to/joplin-mcp-server", "--config", "/path/to/config.json"]
    }
  }
}
```

### Key Differences

| Aspect | Claude Code | OpenCode |
|--------|-------------|----------|
| MCP key | `mcpServers` | `mcp` |
| Command | `command` + `args` array | `command` array (merged) |
| Type | Implicit | Explicit `type: "local"` or `type: "http"` |
| HTTP MCPs | N/A | `type: "http"`, `url`, `headers` |
| Description | In MCP object | Not used (separate docs) |
| Schema | None | `$schema` recommended |

### HTTP MCP Format (OpenCode only)
```jsonc
{
  "mcp": {
    "httpx": {
      "type": "http",
      "url": "https://httpx-mcp.example.com",
      "headers": {
        "x-api-key": "..."
      }
    }
  }
}
```

## Sync Workflows

### Workflow: Sync Skills to OpenCode

```bash
# 1. Pull latest from Claude Code repo
cd ~/src/pai/Personal_AI_Infrastructure
git checkout joey-all
git pull origin joey-all

# 2. Copy skills to OpenCode repo (preserving TitleCase)
rsync -av --delete \
  .claude/skills/ \
  ~/src/PAI-opencode/.opencode/skill/

# 3. Rename any lowercase top-level if needed
# (OpenCode requires: skill/ lowercase, subdirs TitleCase)

# 4. Commit to OpenCode repo
cd ~/src/PAI-opencode
git add .opencode/skill/
git commit -m "sync: Update skills from joey-all"
git push origin opencode-all
```

### Workflow: Sync Skills to Claude Code

```bash
# 1. Pull latest from OpenCode repo
cd ~/src/PAI-opencode
git checkout opencode-all
git pull origin opencode-all

# 2. Copy skills to Claude Code repo
rsync -av --delete \
  .opencode/skill/ \
  ~/src/pai/Personal_AI_Infrastructure/.claude/skills/

# 3. Commit to Claude Code repo
cd ~/src/pai/Personal_AI_Infrastructure
git add .claude/skills/
git commit -m "sync: Update skills from opencode-all"
git push origin joey-all
```

### Workflow: Deploy to Live OpenCode

```bash
# Copy skills from repo to live config
rsync -av --delete \
  ~/src/PAI-opencode/.opencode/skill/ \
  ~/.config/opencode/skill/

# Verify
ls ~/.config/opencode/skill/ | wc -l
```

### Workflow: Convert Project MCP Config

When setting up a new project for OpenCode:

1. Read existing `.mcp.json`
2. Create `.opencode/opencode.jsonc` with:
   - `$schema` header
   - `model` and `small_model` settings
   - `permission` block for common commands
   - `mcp` block with converted servers
3. Create `.opencode/AGENTS.md` with PAI identity

## Skill Naming Convention

| Environment | Top-Level Dir | Subdirectory | Example |
|-------------|---------------|--------------|---------|
| Claude Code | `.claude/skills/` or `.claude/Skills/` | TitleCase | `.claude/Skills/CORE/SKILL.md` |
| OpenCode | `skill/` (lowercase required) | TitleCase | `skill/CORE/SKILL.md` |

**OpenCode Glob Pattern:** `skill/**/SKILL.md` - requires lowercase `skill/`

## Quick Commands

### Check sync status
```bash
# Compare skill counts
echo "Claude Code:" && ls ~/src/pai/Personal_AI_Infrastructure/.claude/skills/ | wc -l
echo "OpenCode repo:" && ls ~/src/PAI-opencode/.opencode/skill/ | wc -l
echo "Live OpenCode:" && ls ~/.config/opencode/skill/ | wc -l
```

### Find differences
```bash
diff -rq \
  ~/src/pai/Personal_AI_Infrastructure/.claude/skills/ \
  ~/src/PAI-opencode/.opencode/skill/ \
  2>/dev/null | head -20
```

### List new skills in Claude Code
```bash
comm -23 \
  <(ls ~/src/pai/Personal_AI_Infrastructure/.claude/skills/ | sort) \
  <(ls ~/src/PAI-opencode/.opencode/skill/ | sort)
```

## Proactive Behavior

When user mentions:
- "I added a skill in claude code" → Offer to sync to opencode-all
- "new skill in joey-all" → Offer to sync and deploy to live
- "setting up project for opencode" → Offer to convert .mcp.json

## Files

- `workflows/SyncToOpenCode.md` - Full sync workflow Claude → OpenCode
- `workflows/SyncToClaudeCode.md` - Full sync workflow OpenCode → Claude
- `workflows/ConvertConfig.md` - MCP config conversion logic
