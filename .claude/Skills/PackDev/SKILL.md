---
name: PackDev
description: AI-assisted development methodology with structured phases. USE WHEN user mentions packdev, pack, story, spec, design phase, build phase, wants to create a new project, add packdev to existing project, OR references story IDs like PACK-XXX. Provides SPEC → DESIGN → BUILD → VERIFY → SHIP workflow.
---

# PackDev Development Skill

A structured development methodology for AI-assisted software development.

---

## Quick Reference

| Command | Action |
|---------|--------|
| "Create a new packdev project" | Initialize new project with template |
| "Start work on PACK-XXX" | Load context, begin task |
| "Write a spec for..." | Create spec.md following template |
| "Design this feature" | Create design.md + interfaces.ts |
| "What phase am I in?" | Check current story phase |
| "Complete this task" | Summarize work, update Linear |

---

## Activation

This skill activates when:
- User wants to create/init/start a new project
- User mentions "pack", "story", "spec", "design phase", "build phase"
- User references a story ID (PACK-XXX format)
- User asks about development process or artifacts

---

## Project Initialization

**Triggers:** "create a new project", "init packdev", "start a new packdev project", "new project called X"

When user asks to create a new PackDev project:

1. **Extract project name** from their request
2. **Determine location** (default: `~/projects/<name>`, or ask if unclear)
3. **Run the init workflow:**

```bash
# Create project directory
mkdir -p ~/projects/<project-name>
cd ~/projects/<project-name>

# Copy template from skill installation
cp -r ~/.claude/skills/PackDev/project-template/* .

# Update project name in config
sed -i '' 's/\[PROJECT_NAME\]/<project-name>/g' .pack/config.yaml README.md CLAUDE.md

# Initialize git
git init
git add .
git commit -m "Initial commit: PackDev project template"
```

4. **Report success** and offer to open the project:
   ```
   Project created at ~/projects/<project-name>

   To start working:
     cd ~/projects/<project-name>
     claude .

   Then tell me: "Let's create a story for [your feature]"
   ```

---

## Adopt PackDev (Existing Projects)

**Triggers:** "add packdev", "adopt packdev", "use packdev here", "make this a packdev project", "set up packdev"

When user wants to add PackDev to an existing project:

1. **Confirm the project path** (default: current working directory)
2. **Ask for story prefix** if not provided (default: PROJ, but suggest based on project name)
3. **Run the adopt script:**

```bash
bun run ~/.claude/skills/PackDev/cli/adopt.ts --path <project-path> --prefix <PREFIX>
```

The script will:
- Scan the project to detect tech stack, frameworks, package manager
- Create `.pack/config.yaml` with project settings
- Create `stories/` directory for artifacts
- Generate `CLAUDE.md` with detected project info

4. **Report what was added** and suggest next steps:
   ```
   PackDev adopted for <project-name>!

   Added:
     .pack/config.yaml  - Configuration
     stories/           - Story artifacts
     CLAUDE.md          - Project context (auto-generated)

   Please review CLAUDE.md and add any project-specific details.

   Ready to work! Say: "Create a story for [your feature]"
   ```

---

## Core Workflow

```
SPEC → DESIGN → BUILD → VERIFY → SHIP
```

Each phase has required artifacts. See workflows/ for details.

---

## Key Principles

1. **Artifacts over memory** - Write it down or it didn't happen
2. **Gates over trust** - Automation enforces quality
3. **Batch over interrupt** - Humans review in sessions
4. **Contracts over code** - Define interfaces before implementation
5. **Context over assumption** - Load context before working

---

## Workflows

| Workflow | When to Use |
|----------|-------------|
| `workflows/spec.md` | Writing requirements |
| `workflows/design.md` | Designing architecture |
| `workflows/build.md` | Implementing code |
| `workflows/verify.md` | Testing and verification |
| `workflows/ship.md` | Deploying to production |

---

## Templates

| Template | Purpose |
|----------|---------|
| `templates/spec.template.md` | New spec document |
| `templates/design.template.md` | New design document |
| `templates/verify.template.md` | Verification report |

---

## Templates

| Template | Purpose |
|----------|---------|
| `templates/CLAUDE.template.md` | Project instructions for Claude Code |
| `templates/epic.template.md` | New epic/project overview |
| `templates/spec.template.md` | New spec document |
| `templates/design.template.md` | New design document |
| `templates/verify.template.md` | Verification report |

---

## MCP Server Integration

When the Pack MCP Server is available, use its tools:
- `pack_context_load` - Load story context
- `pack_task_start` - Begin a task
- `pack_task_complete` - Complete a task
- `pack_commit` - Commit with validation

Until then, follow the workflows manually.

---

## Related Documentation

Project-specific docs live in the project's `.pack/process/` folder:
- PROCESS.md - Full methodology
- PHASES.md - Detailed phase guidance
- ARTIFACTS.md - All templates
- LINEAR-SETUP.md - Linear configuration
