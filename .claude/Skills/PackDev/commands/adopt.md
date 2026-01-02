# Adopt PackDev for Existing Project

Add PackDev structure to an existing project.

## Arguments
- `$ARGUMENTS` - Optional: `--prefix <PREFIX>` to set story prefix (default: PROJ)

## Instructions

1. Run the adopt script on the current working directory:
   ```bash
   bun run ~/.claude/skills/PackDev/cli/adopt.ts $ARGUMENTS
   ```

2. The script will:
   - Scan the project for tech stack
   - Create `.pack/config.yaml`
   - Create `stories/` directory
   - Generate `CLAUDE.md` from scan

3. After completion, remind the user to:
   - Review and customize `CLAUDE.md`
   - Start creating stories

## Examples

- `/adopt` - Adopt current project with default prefix PROJ
- `/adopt --prefix API` - Use API as the story prefix
- `/adopt --force` - Overwrite existing config
