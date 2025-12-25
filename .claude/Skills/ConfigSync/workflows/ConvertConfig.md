# Convert Config Workflow

**Convert MCP configurations between Claude Code and OpenCode formats**

## Trigger
- "convert this config"
- "port mcp.json to opencode"
- "set up project for opencode"

## Conversion: .mcp.json → opencode.jsonc

### Input (Claude Code .mcp.json)

```json
{
  "mcpServers": {
    "joplin": {
      "command": "/Users/jbarkley/.claude/mcp-venvs/joplin/bin/joplin-mcp-server",
      "args": ["--config", "/Users/jbarkley/.claude/mcp-configs/joplin.json"],
      "description": "Joplin note-taking"
    },
    "gitlab": {
      "command": "/usr/local/bin/mcp-proxy",
      "args": ["--transport", "streamablehttp", "https://mcp-gitlab.op.barkleyfarm.com/mcp"],
      "description": "GitLab via k3s"
    }
  }
}
```

### Output (OpenCode opencode.jsonc)

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-opus-4",
  "small_model": "anthropic/claude-haiku-4-5",
  
  "permission": {
    "edit": "allow",
    "bash": {
      "git *": "allow",
      "ls *": "allow",
      "cat *": "allow",
      "*": "ask"
    }
  },

  "mcp": {
    "joplin": {
      "type": "local",
      "command": ["/Users/jbarkley/.claude/mcp-venvs/joplin/bin/joplin-mcp-server", "--config", "/Users/jbarkley/.claude/mcp-configs/joplin.json"]
    },
    "gitlab": {
      "type": "local",
      "command": ["/usr/local/bin/mcp-proxy", "--transport", "streamablehttp", "https://mcp-gitlab.op.barkleyfarm.com/mcp"]
    }
  }
}
```

## Conversion Rules

### MCP Servers

| Claude Code | OpenCode | Notes |
|-------------|----------|-------|
| `mcpServers` | `mcp` | Key name change |
| `command` | `command[0]` | First element of array |
| `args` | `command[1..]` | Append to command array |
| `description` | (omit) | Not used in OpenCode |
| (implicit) | `type: "local"` | Add explicitly |
| `env` | `env` | Same format |

### HTTP MCPs (bunx, external)

If original uses `bunx` or is an HTTP endpoint:

```jsonc
// bunx-based becomes local with full command
"brightdata": {
  "type": "local", 
  "command": ["bunx", "-y", "@brightdata/mcp"],
  "env": { "API_TOKEN": "..." }
}

// Pure HTTP endpoint
"httpx": {
  "type": "http",
  "url": "https://httpx-mcp.example.com",
  "headers": { "x-api-key": "..." }
}
```

## Steps

### 1. Read Source Config

```bash
cat /path/to/project/.mcp.json
```

### 2. Parse and Convert

For each server in `mcpServers`:
1. Create new object under `mcp`
2. Set `type: "local"` (or `"http"` if URL-based)
3. Merge `command` and `args` into `command` array
4. Copy `env` if present
5. Drop `description`

### 3. Add OpenCode Boilerplate

- Add `$schema`
- Add `model` and `small_model`
- Add `permission` block with project-appropriate commands

### 4. Create AGENTS.md

Create `.opencode/AGENTS.md` with:
- PAI Charles identity
- Project-specific context
- Relevant skill recommendations

### 5. Write Output

```bash
mkdir -p /path/to/project/.opencode
# Write opencode.jsonc
# Write AGENTS.md
```

## Project Type Templates

### Infrastructure Project
```jsonc
"permission": {
  "bash": {
    "kubectl *": "allow",
    "helm *": "allow",
    "ssh *": "allow",
    "ansible *": "allow",
    "docker *": "allow"
  }
}
```

### Web Project
```jsonc
"permission": {
  "bash": {
    "bun *": "allow",
    "npm *": "allow",
    "curl *": "allow"
  }
}
```

### Python Project
```jsonc
"permission": {
  "bash": {
    "uv *": "allow",
    "python *": "allow",
    "pytest *": "allow"
  }
}
```

## Output

- Created `.opencode/opencode.jsonc`
- Created `.opencode/AGENTS.md`
- Report MCP servers converted
