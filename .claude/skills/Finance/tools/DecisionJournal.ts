#!/usr/bin/env bun
/**
 * DecisionJournal - Log and review trading decisions
 *
 * Features:
 * - Record investment decisions with thesis and reasoning
 * - Track pre-trade checklists and conviction levels
 * - Link decisions to actual outcomes
 * - Review past decisions to learn from mistakes/successes
 * - Generate decision quality analytics
 *
 * Usage:
 *   bun DecisionJournal.ts new                  # Start new decision entry
 *   bun DecisionJournal.ts log AAPL buy         # Quick log
 *   bun DecisionJournal.ts review               # Review recent decisions
 *   bun DecisionJournal.ts outcome <id> <result> # Record outcome
 *   bun DecisionJournal.ts analyze              # Decision quality analytics
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Types
interface DecisionEntry {
  id: string;
  createdAt: string;
  updatedAt: string;

  // The Decision
  ticker: string;
  action: "buy" | "sell" | "hold" | "avoid" | "watchlist";
  targetPrice?: number;
  stopLoss?: number;
  positionSize?: string;  // e.g., "2% of portfolio"

  // The Thesis
  thesis: string;
  bullCase: string[];
  bearCase: string[];
  catalysts: string[];
  timeframe: "days" | "weeks" | "months" | "years";

  // Conviction & Process
  convictionLevel: 1 | 2 | 3 | 4 | 5;  // 1=low, 5=high
  checklist: {
    item: string;
    checked: boolean;
  }[];

  // Agents Consulted (standup)
  agentsConsulted: string[];
  dissent?: string;  // Any agent disagreement

  // Outcome (filled in later)
  outcome?: {
    recordedAt: string;
    result: "win" | "loss" | "breakeven" | "pending";
    actualReturn?: number;  // percentage
    lessonsLearned?: string;
    wouldDoAgain: boolean;
    whatWorked?: string;
    whatFailed?: string;
  };

  // Metadata
  tags: string[];
  notes?: string;
}

interface Journal {
  created: string;
  lastUpdated: string;
  entries: DecisionEntry[];
  defaultChecklist: string[];
}

// Config
const PAI_DIR = process.env.PAI_DIR || join(process.env.HOME || "", ".claude");
const JOURNAL_FILE = join(PAI_DIR, "data", "decision-journal.json");
const DATA_DIR = join(PAI_DIR, "data");

// Ensure data directory exists
function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Default checklist items
const DEFAULT_CHECKLIST = [
  "Reviewed financial statements",
  "Checked valuation metrics",
  "Considered macro environment",
  "Analyzed competitive position",
  "Identified key risks",
  "Set position size appropriately",
  "Defined exit criteria",
  "Consulted financial advisors/agents",
];

// Load journal
function loadJournal(): Journal {
  ensureDataDir();
  if (existsSync(JOURNAL_FILE)) {
    const data = readFileSync(JOURNAL_FILE, "utf-8");
    return JSON.parse(data);
  }
  return {
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    entries: [],
    defaultChecklist: DEFAULT_CHECKLIST,
  };
}

// Save journal
function saveJournal(journal: Journal): void {
  ensureDataDir();
  journal.lastUpdated = new Date().toISOString();
  writeFileSync(JOURNAL_FILE, JSON.stringify(journal, null, 2));
}

// Generate ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Create new decision entry
function createEntry(
  ticker: string,
  action: DecisionEntry["action"],
  options: Partial<DecisionEntry> = {}
): DecisionEntry {
  const journal = loadJournal();

  const entry: DecisionEntry = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ticker: ticker.toUpperCase(),
    action,
    thesis: options.thesis || "",
    bullCase: options.bullCase || [],
    bearCase: options.bearCase || [],
    catalysts: options.catalysts || [],
    timeframe: options.timeframe || "months",
    convictionLevel: options.convictionLevel || 3,
    checklist: journal.defaultChecklist.map((item) => ({
      item,
      checked: false,
    })),
    agentsConsulted: options.agentsConsulted || [],
    tags: options.tags || [],
    ...options,
  };

  journal.entries.push(entry);
  saveJournal(journal);

  return entry;
}

// Quick log a decision
function quickLog(
  ticker: string,
  action: DecisionEntry["action"],
  thesis: string,
  conviction: 1 | 2 | 3 | 4 | 5 = 3
): void {
  const entry = createEntry(ticker, action, {
    thesis,
    convictionLevel: conviction,
  });

  console.log(`\nDecision logged:`);
  console.log(`  ID: ${entry.id}`);
  console.log(`  ${entry.action.toUpperCase()} ${entry.ticker}`);
  console.log(`  Thesis: ${entry.thesis}`);
  console.log(`  Conviction: ${"★".repeat(conviction)}${"☆".repeat(5 - conviction)}`);
  console.log(`\nUse 'outcome ${entry.id} <result>' to record the outcome later.`);
}

// Update entry
function updateEntry(id: string, updates: Partial<DecisionEntry>): DecisionEntry | null {
  const journal = loadJournal();
  const entry = journal.entries.find((e) => e.id === id);

  if (!entry) {
    console.error(`Entry not found: ${id}`);
    return null;
  }

  Object.assign(entry, updates, { updatedAt: new Date().toISOString() });
  saveJournal(journal);
  return entry;
}

// Record outcome
function recordOutcome(
  id: string,
  result: "win" | "loss" | "breakeven",
  actualReturn?: number,
  lessons?: string
): void {
  const journal = loadJournal();
  const entry = journal.entries.find((e) => e.id === id);

  if (!entry) {
    console.error(`Entry not found: ${id}`);
    return;
  }

  entry.outcome = {
    recordedAt: new Date().toISOString(),
    result,
    actualReturn,
    lessonsLearned: lessons,
    wouldDoAgain: result === "win",
  };
  entry.updatedAt = new Date().toISOString();

  saveJournal(journal);

  console.log(`\nOutcome recorded for ${entry.ticker} (${entry.action}):`);
  console.log(`  Result: ${result.toUpperCase()}`);
  if (actualReturn !== undefined) {
    const color = actualReturn >= 0 ? "\x1b[32m" : "\x1b[31m";
    console.log(`  Return: ${color}${actualReturn.toFixed(1)}%\x1b[0m`);
  }
  if (lessons) {
    console.log(`  Lessons: ${lessons}`);
  }
}

// Review recent decisions
function reviewDecisions(limit: number = 10, filter?: { ticker?: string; result?: string }): void {
  const journal = loadJournal();
  let entries = [...journal.entries].reverse();

  // Apply filters
  if (filter?.ticker) {
    entries = entries.filter((e) => e.ticker === filter.ticker.toUpperCase());
  }
  if (filter?.result) {
    entries = entries.filter((e) => e.outcome?.result === filter.result);
  }

  entries = entries.slice(0, limit);

  if (entries.length === 0) {
    console.log("No decisions found matching criteria.");
    return;
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("DECISION JOURNAL - Recent Entries");
  console.log(`${"=".repeat(80)}\n`);

  for (const entry of entries) {
    const date = new Date(entry.createdAt).toLocaleDateString();
    const conviction = "★".repeat(entry.convictionLevel) + "☆".repeat(5 - entry.convictionLevel);

    let outcomeStr = "PENDING";
    let outcomeColor = "\x1b[33m";
    if (entry.outcome) {
      outcomeStr = entry.outcome.result.toUpperCase();
      outcomeColor = entry.outcome.result === "win" ? "\x1b[32m" : entry.outcome.result === "loss" ? "\x1b[31m" : "\x1b[33m";
      if (entry.outcome.actualReturn !== undefined) {
        outcomeStr += ` (${entry.outcome.actualReturn >= 0 ? "+" : ""}${entry.outcome.actualReturn.toFixed(1)}%)`;
      }
    }

    console.log(`[${entry.id}] ${date} - ${entry.action.toUpperCase()} ${entry.ticker}`);
    console.log(`  Conviction: ${conviction}`);
    console.log(`  Thesis: ${entry.thesis.substring(0, 60)}${entry.thesis.length > 60 ? "..." : ""}`);
    console.log(`  Outcome: ${outcomeColor}${outcomeStr}\x1b[0m`);

    if (entry.outcome?.lessonsLearned) {
      console.log(`  Lessons: ${entry.outcome.lessonsLearned}`);
    }

    console.log("");
  }
}

// Analyze decision quality
function analyzeDecisions(): void {
  const journal = loadJournal();
  const closedEntries = journal.entries.filter((e) => e.outcome && e.outcome.result !== "pending");

  if (closedEntries.length === 0) {
    console.log("No completed decisions to analyze. Record outcomes first.");
    return;
  }

  // Overall stats
  const wins = closedEntries.filter((e) => e.outcome?.result === "win").length;
  const losses = closedEntries.filter((e) => e.outcome?.result === "loss").length;
  const breakeven = closedEntries.filter((e) => e.outcome?.result === "breakeven").length;
  const winRate = (wins / closedEntries.length) * 100;

  // Returns
  const returns = closedEntries
    .filter((e) => e.outcome?.actualReturn !== undefined)
    .map((e) => e.outcome!.actualReturn!);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const avgWin = returns.filter((r) => r > 0);
  const avgLoss = returns.filter((r) => r < 0);
  const avgWinReturn = avgWin.length > 0 ? avgWin.reduce((a, b) => a + b, 0) / avgWin.length : 0;
  const avgLossReturn = avgLoss.length > 0 ? avgLoss.reduce((a, b) => a + b, 0) / avgLoss.length : 0;

  // By conviction level
  const byConviction: Record<number, { wins: number; total: number }> = {};
  for (const entry of closedEntries) {
    const level = entry.convictionLevel;
    if (!byConviction[level]) {
      byConviction[level] = { wins: 0, total: 0 };
    }
    byConviction[level].total++;
    if (entry.outcome?.result === "win") {
      byConviction[level].wins++;
    }
  }

  // By action type
  const byAction: Record<string, { wins: number; total: number }> = {};
  for (const entry of closedEntries) {
    const action = entry.action;
    if (!byAction[action]) {
      byAction[action] = { wins: 0, total: 0 };
    }
    byAction[action].total++;
    if (entry.outcome?.result === "win") {
      byAction[action].wins++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("DECISION QUALITY ANALYTICS");
  console.log(`${"=".repeat(60)}\n`);

  console.log("OVERALL PERFORMANCE");
  console.log("-".repeat(40));
  console.log(`  Total Decisions: ${closedEntries.length}`);
  console.log(`  Wins: ${wins} | Losses: ${losses} | Breakeven: ${breakeven}`);
  console.log(`  Win Rate: ${winRate.toFixed(1)}%`);
  console.log(`  Avg Return: ${avgReturn >= 0 ? "+" : ""}${avgReturn.toFixed(1)}%`);
  console.log(`  Avg Win: +${avgWinReturn.toFixed(1)}% | Avg Loss: ${avgLossReturn.toFixed(1)}%`);

  console.log("\nWIN RATE BY CONVICTION LEVEL");
  console.log("-".repeat(40));
  for (let level = 5; level >= 1; level--) {
    const data = byConviction[level];
    if (data) {
      const rate = ((data.wins / data.total) * 100).toFixed(0);
      const stars = "★".repeat(level) + "☆".repeat(5 - level);
      console.log(`  ${stars}: ${rate}% (${data.wins}/${data.total})`);
    }
  }

  console.log("\nWIN RATE BY ACTION TYPE");
  console.log("-".repeat(40));
  for (const [action, data] of Object.entries(byAction)) {
    const rate = ((data.wins / data.total) * 100).toFixed(0);
    console.log(`  ${action.toUpperCase().padEnd(10)}: ${rate}% (${data.wins}/${data.total})`);
  }

  // Find patterns in losses
  const lossEntries = closedEntries.filter((e) => e.outcome?.result === "loss");
  if (lossEntries.length > 0) {
    console.log("\nLOSS PATTERNS");
    console.log("-".repeat(40));

    const highConvictionLosses = lossEntries.filter((e) => e.convictionLevel >= 4);
    if (highConvictionLosses.length > 0) {
      console.log(`  High conviction losses: ${highConvictionLosses.length}`);
      console.log(`  (Consider: Are you overconfident in certain situations?)`);
    }

    const lessonsFromLosses = lossEntries
      .filter((e) => e.outcome?.lessonsLearned)
      .map((e) => e.outcome!.lessonsLearned);
    if (lessonsFromLosses.length > 0) {
      console.log(`  Key lessons from losses:`);
      for (const lesson of lessonsFromLosses.slice(0, 3)) {
        console.log(`    - ${lesson}`);
      }
    }
  }
}

// Show detailed entry
function showEntry(id: string): void {
  const journal = loadJournal();
  const entry = journal.entries.find((e) => e.id === id);

  if (!entry) {
    console.error(`Entry not found: ${id}`);
    return;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`DECISION: ${entry.action.toUpperCase()} ${entry.ticker}`);
  console.log(`${"=".repeat(60)}\n`);

  console.log(`ID: ${entry.id}`);
  console.log(`Created: ${new Date(entry.createdAt).toLocaleString()}`);
  console.log(`Timeframe: ${entry.timeframe}`);
  console.log(`Conviction: ${"★".repeat(entry.convictionLevel)}${"☆".repeat(5 - entry.convictionLevel)}`);

  if (entry.targetPrice) console.log(`Target Price: $${entry.targetPrice}`);
  if (entry.stopLoss) console.log(`Stop Loss: $${entry.stopLoss}`);
  if (entry.positionSize) console.log(`Position Size: ${entry.positionSize}`);

  console.log(`\nTHESIS`);
  console.log("-".repeat(40));
  console.log(entry.thesis);

  if (entry.bullCase.length > 0) {
    console.log(`\nBULL CASE`);
    for (const point of entry.bullCase) {
      console.log(`  + ${point}`);
    }
  }

  if (entry.bearCase.length > 0) {
    console.log(`\nBEAR CASE`);
    for (const point of entry.bearCase) {
      console.log(`  - ${point}`);
    }
  }

  if (entry.catalysts.length > 0) {
    console.log(`\nCATALYSTS`);
    for (const catalyst of entry.catalysts) {
      console.log(`  * ${catalyst}`);
    }
  }

  if (entry.agentsConsulted.length > 0) {
    console.log(`\nAGENTS CONSULTED: ${entry.agentsConsulted.join(", ")}`);
  }
  if (entry.dissent) {
    console.log(`DISSENT: ${entry.dissent}`);
  }

  console.log(`\nCHECKLIST`);
  for (const item of entry.checklist) {
    console.log(`  [${item.checked ? "x" : " "}] ${item.item}`);
  }

  if (entry.outcome) {
    const color = entry.outcome.result === "win" ? "\x1b[32m" : entry.outcome.result === "loss" ? "\x1b[31m" : "\x1b[33m";
    console.log(`\nOUTCOME`);
    console.log("-".repeat(40));
    console.log(`  Result: ${color}${entry.outcome.result.toUpperCase()}\x1b[0m`);
    if (entry.outcome.actualReturn !== undefined) {
      console.log(`  Return: ${entry.outcome.actualReturn >= 0 ? "+" : ""}${entry.outcome.actualReturn.toFixed(1)}%`);
    }
    if (entry.outcome.lessonsLearned) {
      console.log(`  Lessons: ${entry.outcome.lessonsLearned}`);
    }
    console.log(`  Would do again: ${entry.outcome.wouldDoAgain ? "Yes" : "No"}`);
  }

  if (entry.tags.length > 0) {
    console.log(`\nTags: ${entry.tags.join(", ")}`);
  }
}

// Export to markdown
function exportToMarkdown(id?: string): string {
  const journal = loadJournal();
  const entries = id ? journal.entries.filter((e) => e.id === id) : journal.entries;

  let md = "# Investment Decision Journal\n\n";
  md += `Generated: ${new Date().toLocaleString()}\n\n`;

  for (const entry of entries) {
    md += `## ${entry.action.toUpperCase()} ${entry.ticker}\n\n`;
    md += `**Date:** ${new Date(entry.createdAt).toLocaleDateString()}\n`;
    md += `**Conviction:** ${"★".repeat(entry.convictionLevel)}${"☆".repeat(5 - entry.convictionLevel)}\n`;
    md += `**Timeframe:** ${entry.timeframe}\n\n`;

    md += `### Thesis\n${entry.thesis}\n\n`;

    if (entry.bullCase.length > 0) {
      md += `### Bull Case\n`;
      for (const point of entry.bullCase) {
        md += `- ${point}\n`;
      }
      md += "\n";
    }

    if (entry.bearCase.length > 0) {
      md += `### Bear Case\n`;
      for (const point of entry.bearCase) {
        md += `- ${point}\n`;
      }
      md += "\n";
    }

    if (entry.outcome) {
      md += `### Outcome\n`;
      md += `- **Result:** ${entry.outcome.result.toUpperCase()}\n`;
      if (entry.outcome.actualReturn !== undefined) {
        md += `- **Return:** ${entry.outcome.actualReturn >= 0 ? "+" : ""}${entry.outcome.actualReturn.toFixed(1)}%\n`;
      }
      if (entry.outcome.lessonsLearned) {
        md += `- **Lessons:** ${entry.outcome.lessonsLearned}\n`;
      }
      md += "\n";
    }

    md += "---\n\n";
  }

  return md;
}

// Main CLI
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  switch (command) {
    case "log":
    case "add": {
      const ticker = args[1];
      const action = args[2] as DecisionEntry["action"];
      const thesis = args.slice(3).join(" ") || "No thesis provided";

      if (!ticker || !action) {
        console.log("Usage: DecisionJournal.ts log <ticker> <action> [thesis]");
        console.log("Actions: buy, sell, hold, avoid, watchlist");
        return;
      }

      quickLog(ticker, action, thesis);
      break;
    }

    case "outcome": {
      const id = args[1];
      const result = args[2] as "win" | "loss" | "breakeven";
      const returnPct = args[3] ? parseFloat(args[3]) : undefined;
      const lessons = args.slice(4).join(" ");

      if (!id || !result) {
        console.log("Usage: DecisionJournal.ts outcome <id> <result> [return%] [lessons]");
        console.log("Results: win, loss, breakeven");
        return;
      }

      recordOutcome(id, result, returnPct, lessons || undefined);
      break;
    }

    case "review":
    case "list": {
      const limit = parseInt(args[1]) || 10;
      const ticker = args[2];
      reviewDecisions(limit, ticker ? { ticker } : undefined);
      break;
    }

    case "show":
    case "view": {
      const id = args[1];
      if (!id) {
        console.log("Usage: DecisionJournal.ts show <id>");
        return;
      }
      showEntry(id);
      break;
    }

    case "analyze":
    case "analytics":
      analyzeDecisions();
      break;

    case "export": {
      const id = args[1];
      const md = exportToMarkdown(id);
      console.log(md);
      break;
    }

    case "help":
    case undefined:
      console.log(`
DecisionJournal - Log and review trading decisions

Commands:
  log <ticker> <action> [thesis]     Quick log a decision
  outcome <id> <result> [return%]    Record outcome of a decision
  review [limit] [ticker]            Review recent decisions
  show <id>                          Show detailed entry
  analyze                            Decision quality analytics
  export [id]                        Export to markdown
  help                               Show this help

Actions: buy, sell, hold, avoid, watchlist
Results: win, loss, breakeven

Examples:
  bun DecisionJournal.ts log AAPL buy "Strong iPhone demand, undervalued"
  bun DecisionJournal.ts outcome abc123 win 15.5 "Thesis played out"
  bun DecisionJournal.ts review
  bun DecisionJournal.ts review 20 AAPL
  bun DecisionJournal.ts analyze
`);
      break;

    default:
      console.log(`Unknown command: ${command}. Use 'help' for usage.`);
  }
}

main().catch(console.error);

// Export for testing
export {
  loadJournal,
  saveJournal,
  createEntry,
  updateEntry,
  recordOutcome,
  analyzeDecisions,
  type DecisionEntry,
  type Journal,
};
