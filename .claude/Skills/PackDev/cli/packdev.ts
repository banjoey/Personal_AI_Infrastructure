#!/usr/bin/env bun
/**
 * PackDev CLI - Project initialization and management
 *
 * Usage:
 *   packdev init <project-name> [--path <base-path>]
 *   packdev adopt [--path <project-path>] [--prefix <PROJ>]
 *
 * Examples:
 *   packdev init my-app                    # Creates ~/projects/my-app
 *   packdev init my-app --path /tmp        # Creates /tmp/my-app
 *   packdev adopt                          # Add PackDev to current directory
 *   packdev adopt --prefix API             # Use API as story prefix
 */

import { existsSync, mkdirSync, cpSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";

const PACKDEV_ROOT = resolve(import.meta.dir, "..");
const TEMPLATE_PATH = join(PACKDEV_ROOT, "project-template");
const DEFAULT_PROJECTS_PATH = join(process.env.HOME || "~", "projects");

interface InitOptions {
  projectName: string;
  basePath: string;
  skipGit: boolean;
}

function printUsage(): void {
  console.log(`
PackDev CLI - AI-Assisted Development Methodology

Usage:
  packdev init <project-name> [options]    Create a new PackDev project
  packdev adopt [options]                  Add PackDev to existing project
  packdev help                             Show this help message

Init Options:
  --path <dir>     Base directory for project (default: ~/projects)
  --skip-git       Don't initialize git repository

Adopt Options:
  --path <dir>     Project to adopt (default: current directory)
  --prefix <PRE>   Story prefix, e.g., PROJ, API (default: PROJ)
  --force          Overwrite existing config files

Examples:
  packdev init my-awesome-app
  packdev init api-service --path ~/work
  packdev adopt
  packdev adopt --prefix API --force
`);
}

function initProject(options: InitOptions): void {
  const { projectName, basePath, skipGit } = options;
  const projectPath = join(basePath, projectName);

  console.log(`\nInitializing PackDev project: ${projectName}`);
  console.log(`Location: ${projectPath}\n`);

  // Check if project already exists
  if (existsSync(projectPath)) {
    console.error(`Error: Directory already exists: ${projectPath}`);
    process.exit(1);
  }

  // Check if template exists
  if (!existsSync(TEMPLATE_PATH)) {
    console.error(`Error: Template not found at: ${TEMPLATE_PATH}`);
    process.exit(1);
  }

  // Create base directory if needed
  if (!existsSync(basePath)) {
    console.log(`Creating base directory: ${basePath}`);
    mkdirSync(basePath, { recursive: true });
  }

  // Create project directory
  console.log(`Creating project directory...`);
  mkdirSync(projectPath, { recursive: true });

  // Copy template
  console.log(`Copying PackDev template...`);
  cpSync(TEMPLATE_PATH, projectPath, { recursive: true });

  // Update CLAUDE.md with project name
  const claudeMdPath = join(projectPath, "CLAUDE.md");
  if (existsSync(claudeMdPath)) {
    const content = Bun.file(claudeMdPath).text();
    content.then((text) => {
      const updated = text.replace(/\[PROJECT_NAME\]/g, projectName);
      writeFileSync(claudeMdPath, updated);
    });
  }

  // Initialize git
  if (!skipGit) {
    console.log(`Initializing git repository...`);
    try {
      execSync("git init", { cwd: projectPath, stdio: "pipe" });
      execSync("git add .", { cwd: projectPath, stdio: "pipe" });
      execSync('git commit -m "Initial commit: PackDev project template"', {
        cwd: projectPath,
        stdio: "pipe",
      });
      console.log(`Git repository initialized with initial commit.`);
    } catch (e) {
      console.warn(`Warning: Git initialization failed. You may need to init manually.`);
    }
  }

  // Success message
  console.log(`
PackDev project created successfully!

Next steps:
  cd ${projectPath}
  claude .

Then tell Claude:
  "Let's create a story for [your feature]. Start with the spec."

Project structure:
  ${projectPath}/
  ├── .pack/
  │   └── config.yaml      # PackDev configuration
  ├── stories/             # Story artifacts go here
  ├── CLAUDE.md            # Project context for Claude
  └── README.md            # Project readme
`);
}

// Parse arguments
function parseArgs(args: string[]): { command: string; options: InitOptions } {
  const command = args[0] || "help";

  const options: InitOptions = {
    projectName: "",
    basePath: DEFAULT_PROJECTS_PATH,
    skipGit: false,
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--path" && args[i + 1]) {
      options.basePath = resolve(args[i + 1]);
      i++;
    } else if (arg === "--skip-git") {
      options.skipGit = true;
    } else if (!arg.startsWith("-")) {
      options.projectName = arg;
    }
  }

  return { command, options };
}

// Main
const args = process.argv.slice(2);
const { command, options } = parseArgs(args);

switch (command) {
  case "init":
    if (!options.projectName) {
      console.error("Error: Project name required\n");
      printUsage();
      process.exit(1);
    }
    initProject(options);
    break;
  case "adopt":
    // Delegate to adopt.ts with remaining args
    const adoptArgs = args.slice(1); // Remove 'adopt' command
    const adoptScript = join(import.meta.dir, "adopt.ts");
    try {
      execSync(`bun run ${adoptScript} ${adoptArgs.join(" ")}`, { stdio: "inherit" });
    } catch (e) {
      process.exit(1);
    }
    break;
  case "help":
  case "--help":
  case "-h":
    printUsage();
    break;
  default:
    console.error(`Unknown command: ${command}\n`);
    printUsage();
    process.exit(1);
}
