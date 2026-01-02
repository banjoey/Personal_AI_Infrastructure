# CLAUDE.md - [Project Name]

This project is [brief description of what the project does].

## Project Context

[2-3 sentences about the project's purpose and goals]

## How This Project Works

### Process Documentation
Read `.pack/docs/PROCESS.md` for the full methodology. Key points:
- Work flows through phases: SPEC → DESIGN → BUILD → VERIFY → SHIP
- Each phase has required artifacts
- Stories are in `stories/[ID]-[name]/` folders

### Current Work
Check `stories/` for active stories. Each story folder contains:
- `spec.md` - What we're building (if past SPEC phase)
- `design.md` - How we're building it (if past DESIGN phase)
- `interfaces.ts` - Type contracts (if past DESIGN phase)
- `verify.md` - Test results (if past VERIFY phase)

### Starting Work
1. Ask which story to work on, or check `stories/` for one in progress
2. Read the story's spec.md and design.md
3. Check which phase we're in (look at what artifacts exist)
4. Follow the phase-appropriate workflow

## Development Commands

```bash
# Install dependencies
[package manager] install

# Run tests
[package manager] test

# Type check (if applicable)
[package manager] run typecheck

# Start development
[package manager] run dev
```

## Code Style

- [Language] [version]
- [Key style rules]
- [Linting/formatting tools]
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`

## Key Files

| File | Purpose |
|------|---------|
| `.pack/config.yaml` | Project configuration |
| `stories/*/spec.md` | Story requirements |
| `stories/*/design.md` | Story architecture |
| `stories/*/interfaces.ts` | Type contracts |

## Architecture Overview

```
src/
├── [main directories]
└── [explain structure]
```

## Phase Rules

| Phase | You Can Write | You Cannot Write |
|-------|---------------|------------------|
| SPEC | `stories/*/spec.md` | design.md, src/, tests/ |
| DESIGN | `stories/*/design.md`, `interfaces.ts` | src/, tests/ |
| BUILD | `src/**`, `tests/**` | spec.md, design.md |
| VERIFY | `stories/*/verify.md`, `tests/**` | src/ (only fixes) |
| SHIP | Documentation only | Everything else |

## Current Status

**Epic:** [Epic ID and name, or "None yet"]
**Current Story:** [Story ID and name, or "None yet"]
**Current Phase:** [Phase, or "N/A"]

[Brief description of where things stand]

## When Starting a Session

1. Read this file
2. Check which story is active
3. Read that story's artifacts
4. Continue from where we left off

## Commit Guidelines

- Prefix with story ID: `PROJ-XXX: feat: description`
- Keep commits small and focused
- Run tests before committing
