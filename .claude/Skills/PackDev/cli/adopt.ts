#!/usr/bin/env bun
/**
 * PackDev Adopt - Add PackDev to an existing project
 *
 * Usage:
 *   packdev adopt [--path <project-path>] [--prefix <PROJ>] [--scan]
 *
 * Examples:
 *   packdev adopt                    # Adopt current directory
 *   packdev adopt --path ~/myproject # Adopt specific project
 *   packdev adopt --scan             # Scan and generate CLAUDE.md
 */

import { existsSync, mkdirSync, readdirSync, statSync, readFileSync } from "fs";
import { join, basename, resolve } from "path";
import { execSync } from "child_process";

interface AdoptOptions {
  projectPath: string;
  prefix: string;
  scan: boolean;
  force: boolean;
}

interface ProjectScan {
  name: string;
  techStack: string[];
  entryPoints: string[];
  hasTests: boolean;
  hasCI: boolean;
  packageManager: string | null;
  frameworks: string[];
  structure: string[];
}

// Detect tech stack from files
function scanProject(projectPath: string): ProjectScan {
  const scan: ProjectScan = {
    name: basename(projectPath),
    techStack: [],
    entryPoints: [],
    hasTests: false,
    hasCI: false,
    packageManager: null,
    frameworks: [],
    structure: [],
  };

  const files = getAllFiles(projectPath, 2); // Max 2 levels deep for speed

  // Package manager detection
  if (files.includes("package.json")) {
    scan.techStack.push("Node.js");
    if (files.includes("bun.lockb")) {
      scan.packageManager = "bun";
    } else if (files.includes("pnpm-lock.yaml")) {
      scan.packageManager = "pnpm";
    } else if (files.includes("yarn.lock")) {
      scan.packageManager = "yarn";
    } else if (files.includes("package-lock.json")) {
      scan.packageManager = "npm";
    }

    // Read package.json for more info
    try {
      const pkg = JSON.parse(readFileSync(join(projectPath, "package.json"), "utf-8"));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      // Framework detection
      if (allDeps["react"]) scan.frameworks.push("React");
      if (allDeps["vue"]) scan.frameworks.push("Vue");
      if (allDeps["svelte"]) scan.frameworks.push("Svelte");
      if (allDeps["next"]) scan.frameworks.push("Next.js");
      if (allDeps["express"]) scan.frameworks.push("Express");
      if (allDeps["fastify"]) scan.frameworks.push("Fastify");
      if (allDeps["hono"]) scan.frameworks.push("Hono");
      if (allDeps["elysia"]) scan.frameworks.push("Elysia");

      // TypeScript
      if (allDeps["typescript"] || files.includes("tsconfig.json")) {
        scan.techStack.push("TypeScript");
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Python detection
  if (files.includes("pyproject.toml") || files.includes("requirements.txt") || files.includes("setup.py")) {
    scan.techStack.push("Python");
    if (files.includes("pyproject.toml")) {
      scan.packageManager = "uv/poetry";
    } else {
      scan.packageManager = "pip";
    }
  }

  // Go detection
  if (files.includes("go.mod")) {
    scan.techStack.push("Go");
    scan.packageManager = "go mod";
  }

  // Rust detection
  if (files.includes("Cargo.toml")) {
    scan.techStack.push("Rust");
    scan.packageManager = "cargo";
  }

  // Test detection
  if (files.some(f => f.includes("test") || f.includes("spec") || f.includes("__tests__"))) {
    scan.hasTests = true;
  }

  // CI detection
  if (files.includes(".gitlab-ci.yml") || files.includes(".github")) {
    scan.hasCI = true;
  }

  // Entry points
  const entryPatterns = ["src/index", "src/main", "index", "main", "app", "server"];
  for (const pattern of entryPatterns) {
    const matches = files.filter(f => f.startsWith(pattern));
    scan.entryPoints.push(...matches.slice(0, 3));
  }

  // Structure (top-level directories)
  try {
    const topLevel = readdirSync(projectPath)
      .filter(f => {
        const stat = statSync(join(projectPath, f));
        return stat.isDirectory() && !f.startsWith(".") && f !== "node_modules";
      })
      .slice(0, 10);
    scan.structure = topLevel;
  } catch (e) {
    // Ignore
  }

  return scan;
}

function getAllFiles(dir: string, maxDepth: number, currentDepth = 0): string[] {
  if (currentDepth >= maxDepth) return [];

  const files: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry === "node_modules" || entry === ".git" || entry === "vendor") continue;

      const fullPath = join(dir, entry);
      const relativePath = fullPath.replace(dir + "/", "");

      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          files.push(entry);
          files.push(...getAllFiles(fullPath, maxDepth, currentDepth + 1).map(f => `${entry}/${f}`));
        } else {
          files.push(relativePath);
        }
      } catch (e) {
        // Skip inaccessible files
      }
    }
  } catch (e) {
    // Ignore directory read errors
  }
  return files;
}

function generateClaudeMd(scan: ProjectScan, projectPath: string): string {
  const techStackStr = scan.techStack.length > 0 ? scan.techStack.join(", ") : "Unknown";
  const frameworksStr = scan.frameworks.length > 0 ? scan.frameworks.join(", ") : "None detected";

  let commands = "";
  if (scan.packageManager === "bun") {
    commands = `bun install
bun test
bun run dev`;
  } else if (scan.packageManager === "npm") {
    commands = `npm install
npm test
npm run dev`;
  } else if (scan.packageManager === "uv/poetry") {
    commands = `uv sync
uv run pytest
uv run python main.py`;
  } else if (scan.packageManager === "cargo") {
    commands = `cargo build
cargo test
cargo run`;
  } else if (scan.packageManager === "go mod") {
    commands = `go build
go test ./...
go run .`;
  } else {
    commands = `# Add your commands here`;
  }

  return `# CLAUDE.md - ${scan.name}

This project is [brief description - please fill in].

## Tech Stack

- **Language:** ${techStackStr}
- **Frameworks:** ${frameworksStr}
- **Package Manager:** ${scan.packageManager || "Unknown"}
${scan.hasTests ? "- **Tests:** Yes" : "- **Tests:** Not detected"}
${scan.hasCI ? "- **CI/CD:** Yes" : "- **CI/CD:** Not detected"}

## Project Structure

\`\`\`
${scan.structure.map(d => d + "/").join("\n")}
\`\`\`

## Development Commands

\`\`\`bash
${commands}
\`\`\`

## How This Project Works

This project follows **PackDev** methodology:
- Work flows through phases: SPEC → DESIGN → BUILD → VERIFY → SHIP
- Each phase has required artifacts
- Stories are in \`stories/[ID]-[name]/\` folders

### Starting Work

1. Check \`stories/\` for active work
2. Read the story's spec.md and design.md
3. Follow the phase-appropriate workflow

## Current Status

**Active Story:** None yet
**Current Phase:** N/A

## Commit Guidelines

- Prefix with story ID: \`${scan.name.toUpperCase().slice(0, 4)}-XXX: feat: description\`
- Keep commits small and focused
- Run tests before committing
`;
}

function generateConfig(scan: ProjectScan, prefix: string): string {
  return `# PackDev Configuration
# See: https://gitlab.com/mikmattley/packdev/-/blob/main/docs/CONFIG.md

version: 1

project:
  name: "${scan.name}"
  prefix: "${prefix}"

server:
  name: "pack-mcp"
  log_level: "info"
  log_format: "pretty"

gates:
  require_spec_approval: true
  require_design_approval: true
  require_ship_approval: true

artifacts:
  stories_dir: "stories"
  require_threat_model: false
`;
}

function adopt(options: AdoptOptions): void {
  const { projectPath, prefix, scan: shouldScan, force } = options;

  console.log(`\nAdopting PackDev for: ${projectPath}\n`);

  // Check if project exists
  if (!existsSync(projectPath)) {
    console.error(`Error: Project path does not exist: ${projectPath}`);
    process.exit(1);
  }

  // Check if already adopted
  const packDir = join(projectPath, ".pack");
  if (existsSync(packDir) && !force) {
    console.log(`Project already has .pack/ directory.`);
    console.log(`Use --force to overwrite existing config.\n`);
  }

  // Scan project
  console.log("Scanning project...");
  const scanResult = scanProject(projectPath);
  console.log(`  Tech stack: ${scanResult.techStack.join(", ") || "Unknown"}`);
  console.log(`  Frameworks: ${scanResult.frameworks.join(", ") || "None"}`);
  console.log(`  Package manager: ${scanResult.packageManager || "Unknown"}`);
  console.log(`  Has tests: ${scanResult.hasTests ? "Yes" : "No"}`);
  console.log(`  Has CI: ${scanResult.hasCI ? "Yes" : "No"}`);

  // Create .pack directory
  if (!existsSync(packDir)) {
    console.log(`\nCreating .pack/ directory...`);
    mkdirSync(packDir, { recursive: true });
  }

  // Create config.yaml
  const configPath = join(packDir, "config.yaml");
  if (!existsSync(configPath) || force) {
    console.log(`Creating .pack/config.yaml...`);
    Bun.write(configPath, generateConfig(scanResult, prefix));
  }

  // Create stories directory
  const storiesDir = join(projectPath, "stories");
  if (!existsSync(storiesDir)) {
    console.log(`Creating stories/ directory...`);
    mkdirSync(storiesDir, { recursive: true });
    Bun.write(join(storiesDir, ".gitkeep"), "# Story artifacts go here\n");
  }

  // Generate CLAUDE.md if requested or doesn't exist
  const claudeMdPath = join(projectPath, "CLAUDE.md");
  if (shouldScan || !existsSync(claudeMdPath)) {
    console.log(`Generating CLAUDE.md...`);
    Bun.write(claudeMdPath, generateClaudeMd(scanResult, projectPath));
  }

  // Success
  console.log(`
PackDev adoption complete!

Added:
  .pack/config.yaml    - PackDev configuration
  stories/             - Story artifacts directory
  CLAUDE.md            - Project context (${shouldScan ? "generated from scan" : "template"})

Next steps:
  1. Review and edit CLAUDE.md with project-specific details
  2. Start working with: claude .
  3. Create your first story: "Create a story for [feature]"

Prefix for stories: ${prefix}
`);
}

// Parse arguments
function parseArgs(args: string[]): AdoptOptions {
  const options: AdoptOptions = {
    projectPath: process.cwd(),
    prefix: "PROJ",
    scan: true, // Default to scanning
    force: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--path" && args[i + 1]) {
      options.projectPath = resolve(args[i + 1]);
      i++;
    } else if (arg === "--prefix" && args[i + 1]) {
      options.prefix = args[i + 1].toUpperCase();
      i++;
    } else if (arg === "--scan") {
      options.scan = true;
    } else if (arg === "--no-scan") {
      options.scan = false;
    } else if (arg === "--force" || arg === "-f") {
      options.force = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
PackDev Adopt - Add PackDev to an existing project

Usage:
  bun run adopt.ts [options]

Options:
  --path <dir>     Project to adopt (default: current directory)
  --prefix <PRE>   Story prefix, e.g., PROJ, API, WEB (default: PROJ)
  --scan           Scan project and generate CLAUDE.md (default)
  --no-scan        Skip scanning, use template CLAUDE.md
  --force, -f      Overwrite existing config files

Examples:
  bun run adopt.ts
  bun run adopt.ts --path ~/myproject --prefix API
  bun run adopt.ts --force
`);
      process.exit(0);
    }
  }

  return options;
}

// Main
const args = process.argv.slice(2);
const options = parseArgs(args);
adopt(options);
