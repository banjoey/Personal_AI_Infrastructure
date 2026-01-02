/**
 * Skill Validation Tests
 *
 * Validates that all Finance-related skills follow PAI skill structure requirements.
 * Based on SkillSystem.md specifications.
 *
 * Run with: bun test SkillValidation.test.ts
 */

import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const SKILLS_DIR = join(import.meta.dir, "../../../skills");
const FINANCE_SKILLS = [
  "Finance",
  "QuantAnalysis",
  "FundamentalAnalysis",
  "SentimentAnalysis",
  "MacroStrategy",
  "RiskManagement",
  "AITrading",
  "CryptoAnalysis",
  // Phase 2 skills (commented until implemented)
  // "TaxStrategy",
  // "RealEstateInvesting",
  // "PersonalFinance",
  // "RetirementPlanning",
  // "EstatePlanning",
];

// Helper to read skill file
function readSkillFile(skillName: string): string | null {
  const path = join(SKILLS_DIR, skillName, "SKILL.md");
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

// Helper to parse YAML frontmatter
function parseFrontmatter(content: string): { name?: string; description?: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const nameMatch = yaml.match(/^name:\s*(.+)$/m);
  const descMatch = yaml.match(/^description:\s*(.+)$/m);

  return {
    name: nameMatch?.[1]?.trim(),
    description: descMatch?.[1]?.trim(),
  };
}

// Helper to check TitleCase
function isTitleCase(str: string): boolean {
  return /^[A-Z][a-zA-Z]*$/.test(str);
}

describe("Skill Structure Validation", () => {
  // Test Finance skill specifically (should exist)
  describe("Finance Orchestrator Skill", () => {
    test("Finance skill directory exists", () => {
      expect(existsSync(join(SKILLS_DIR, "Finance"))).toBe(true);
    });

    test("Finance SKILL.md exists", () => {
      const content = readSkillFile("Finance");
      expect(content).not.toBeNull();
    });

    test("Finance has valid YAML frontmatter", () => {
      const content = readSkillFile("Finance");
      expect(content).not.toBeNull();

      const frontmatter = parseFrontmatter(content!);
      expect(frontmatter).not.toBeNull();
      expect(frontmatter?.name).toBe("Finance");
    });

    test("Finance description contains USE WHEN", () => {
      const content = readSkillFile("Finance");
      const frontmatter = parseFrontmatter(content!);

      expect(frontmatter?.description).toContain("USE WHEN");
    });

    test("Finance has workflows directory", () => {
      expect(existsSync(join(SKILLS_DIR, "Finance", "workflows"))).toBe(true);
    });

    test("Finance has tools directory", () => {
      expect(existsSync(join(SKILLS_DIR, "Finance", "tools"))).toBe(true);
    });

    test("Finance has required workflows", () => {
      const workflowsDir = join(SKILLS_DIR, "Finance", "workflows");
      const files = readdirSync(workflowsDir);

      const requiredWorkflows = [
        "StockAnalysis.md",
        "CompanyResearch.md",
        "FinancialStandup.md",
        "PortfolioReview.md",
        "InvestmentDecision.md",
      ];

      for (const workflow of requiredWorkflows) {
        expect(files).toContain(workflow);
      }
    });

    test("Finance has Examples section", () => {
      const content = readSkillFile("Finance");
      expect(content).toContain("## Examples");
    });

    test("Finance has Workflow Routing section", () => {
      const content = readSkillFile("Finance");
      expect(content).toContain("## Workflow Routing");
    });
  });

  // Generic tests for all Finance-related skills
  describe("All Finance Skills - Structure Validation", () => {
    for (const skillName of FINANCE_SKILLS) {
      describe(`${skillName} Skill`, () => {
        test(`${skillName} uses TitleCase naming`, () => {
          expect(isTitleCase(skillName)).toBe(true);
        });

        test(`${skillName} directory structure (if exists)`, () => {
          const skillDir = join(SKILLS_DIR, skillName);
          if (!existsSync(skillDir)) {
            console.log(`  [SKIP] ${skillName} not yet implemented`);
            return;
          }

          // Check SKILL.md exists
          expect(existsSync(join(skillDir, "SKILL.md"))).toBe(true);

          // Check workflows directory exists
          expect(existsSync(join(skillDir, "workflows"))).toBe(true);

          // Check tools directory exists
          expect(existsSync(join(skillDir, "tools"))).toBe(true);
        });

        test(`${skillName} YAML frontmatter (if exists)`, () => {
          const content = readSkillFile(skillName);
          if (!content) {
            console.log(`  [SKIP] ${skillName} not yet implemented`);
            return;
          }

          const frontmatter = parseFrontmatter(content);
          expect(frontmatter).not.toBeNull();
          expect(frontmatter?.name).toBe(skillName);
          expect(frontmatter?.description).toBeTruthy();
          expect(frontmatter?.description?.length).toBeLessThanOrEqual(1024);
        });

        test(`${skillName} has USE WHEN in description (if exists)`, () => {
          const content = readSkillFile(skillName);
          if (!content) {
            console.log(`  [SKIP] ${skillName} not yet implemented`);
            return;
          }

          const frontmatter = parseFrontmatter(content);
          expect(frontmatter?.description).toContain("USE WHEN");
        });

        test(`${skillName} has required sections (if exists)`, () => {
          const content = readSkillFile(skillName);
          if (!content) {
            console.log(`  [SKIP] ${skillName} not yet implemented`);
            return;
          }

          expect(content).toContain("## Workflow Routing");
          expect(content).toContain("## Examples");
        });

        test(`${skillName} workflow files use TitleCase (if exists)`, () => {
          const workflowsDir = join(SKILLS_DIR, skillName, "workflows");
          if (!existsSync(workflowsDir)) {
            console.log(`  [SKIP] ${skillName} workflows not yet implemented`);
            return;
          }

          const files = readdirSync(workflowsDir).filter(f => f.endsWith(".md"));
          for (const file of files) {
            const baseName = file.replace(".md", "");
            expect(isTitleCase(baseName)).toBe(true);
          }
        });

        test(`${skillName} has no backups directory inside skill`, () => {
          const skillDir = join(SKILLS_DIR, skillName);
          if (!existsSync(skillDir)) {
            return;
          }

          expect(existsSync(join(skillDir, "backups"))).toBe(false);
          expect(existsSync(join(skillDir, "backup"))).toBe(false);
        });
      });
    }
  });
});

// Description quality tests
describe("Description Quality", () => {
  test("Finance description is single line", () => {
    const content = readSkillFile("Finance");
    const frontmatter = parseFrontmatter(content!);

    // Should not contain newlines in description
    expect(frontmatter?.description).not.toContain("\n");
  });

  test("Finance description under 1024 characters", () => {
    const content = readSkillFile("Finance");
    const frontmatter = parseFrontmatter(content!);

    expect(frontmatter?.description?.length).toBeLessThanOrEqual(1024);
  });

  test("Finance description uses intent language", () => {
    const content = readSkillFile("Finance");
    const frontmatter = parseFrontmatter(content!);

    // Should use intent-based triggers
    const description = frontmatter?.description?.toLowerCase() || "";
    const hasIntentLanguage =
      description.includes("user asks") ||
      description.includes("user mentions") ||
      description.includes("user wants");

    expect(hasIntentLanguage).toBe(true);
  });
});

// Workflow content validation
describe("Workflow Content Validation", () => {
  const workflowsDir = join(SKILLS_DIR, "Finance", "workflows");

  test("StockAnalysis workflow has required sections", () => {
    if (!existsSync(workflowsDir)) return;

    const content = readFileSync(join(workflowsDir, "StockAnalysis.md"), "utf-8");

    expect(content).toContain("## Trigger Phrases");
    expect(content).toContain("## Workflow Steps");
    expect(content).toContain("## Output Format");
  });

  test("Workflows reference other skills appropriately", () => {
    if (!existsSync(workflowsDir)) return;

    const content = readFileSync(join(workflowsDir, "StockAnalysis.md"), "utf-8");

    // Should reference sub-skills
    expect(content).toContain("FundamentalAnalysis");
    expect(content).toContain("QuantAnalysis");
    expect(content).toContain("RiskManagement");
  });

  test("Workflows reference Research skill for data gathering", () => {
    if (!existsSync(workflowsDir)) return;

    const content = readFileSync(join(workflowsDir, "CompanyResearch.md"), "utf-8");

    // Should reference Research skill
    expect(content).toContain("Research");
    expect(content).toContain("research");
  });
});

// Agent profiles validation
describe("Agent Profiles", () => {
  const agentsDir = join(SKILLS_DIR, "Finance", "agents");

  test("Agents directory exists", () => {
    expect(existsSync(agentsDir)).toBe(true);
  });

  // This will be tested once agent profiles are created
  test.skip("Agent profiles have required structure", () => {
    // Future test for agent profile validation
  });
});
