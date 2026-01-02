# PackDev Project Initialization

Create a new PackDev project with the standard template.

## Arguments
- `$ARGUMENTS` - Project name (required), optionally followed by `--path <dir>`

## Instructions

1. Parse the arguments to extract:
   - Project name (first argument, required)
   - Base path (after `--path` flag, defaults to `~/projects`)

2. Run the PackDev CLI to create the project:
   ```bash
   bun run ~/.claude/skills/PackDev/cli/packdev.ts init $ARGUMENTS
   ```

3. If the CLI succeeds, offer to open the new project:
   - Ask: "Project created! Want me to open it in a new Claude Code session?"

4. If the user says yes, provide the command:
   ```bash
   cd <project-path> && claude .
   ```

## Examples

- `/init my-app` - Creates `~/projects/my-app`
- `/init api-service --path ~/work` - Creates `~/work/api-service`
- `/init quick-test --skip-git` - Creates without git init
