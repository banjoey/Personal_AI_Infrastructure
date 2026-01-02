# [PROJECT_NAME]

This project uses [PackDev](https://gitlab.com/mikmattley/packdev) for AI-assisted development.

## Getting Started

```bash
claude .
```

Then tell Claude: *"Let's create a story for [your feature]. Start with the spec."*

## Project Structure

```
.pack/
  config.yaml       # PackDev configuration
stories/
  PROJ-XXX-name/    # Story artifacts
    spec.md         # What we're building
    design.md       # How we're building it
    verify.md       # Proof it works
src/                # Source code
```

## Process

1. **SPEC** - Define what we're building (human approval)
2. **DESIGN** - Define how we're building it (human approval)
3. **BUILD** - Implement the solution (CI gate)
4. **VERIFY** - Confirm it works (CI gate)
5. **SHIP** - Deploy to production (human approval)
