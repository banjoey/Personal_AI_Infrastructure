#!/usr/bin/env bun
/**
 * PreFlightCheck - Portfolio Safety Check Before Any Buy
 *
 * Implements Joseph's Unified Investment System v2.0 Pre-Flight Safety
 * Three critical checks before every purchase:
 *
 * 1. Correlation Check - No single category > 40% of portfolio
 * 2. Volatility-Adjusted Sizing - Position size scaled by stock volatility
 * 3. Deployment Limits - $10K/day, $25K/week max
 *
 * Usage:
 *   bun PreFlightCheck.ts <ticker> <amount> [--portfolio=<file>]
 *   bun PreFlightCheck.ts TSM 5000
 *   bun PreFlightCheck.ts NVDA 8000 --portfolio=~/portfolio.json
 */

import { $ } from "bun";
import { readFile, writeFile, exists } from "fs/promises";
import { homedir } from "os";

// Types
interface PreFlightResult {
  ticker: string;
  date: string;
  proposedAmount: number;
  checks: {
    correlation: CorrelationCheck;
    volatility: VolatilityCheck;
    deployment: DeploymentCheck;
  };
  allPassed: boolean;
  finalOrder: FinalOrder | null;
  blockers: string[];
}

interface CorrelationCheck {
  passed: boolean;
  stockCategory: string;
  currentExposure: { amount: number; percent: number };
  afterBuyExposure: { amount: number; percent: number };
  limit: number; // 40%
  detail: string;
}

interface VolatilityCheck {
  passed: boolean;
  beta: number;
  volatility30Day: number;
  adjustmentFactor: number;
  basePosition: number;
  adjustedPosition: number;
  detail: string;
}

interface DeploymentCheck {
  passed: boolean;
  dailySpent: number;
  dailyLimit: number;
  weeklySpent: number;
  weeklyLimit: number;
  detail: string;
}

interface FinalOrder {
  ticker: string;
  shares: number;
  limitPrice: number;
  totalAmount: number;
}

interface Portfolio {
  totalValue: number;
  positions: Position[];
  deploymentLog: DeploymentEntry[];
}

interface Position {
  ticker: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  category: string;
}

interface DeploymentEntry {
  date: string;
  ticker: string;
  amount: number;
}

// Category definitions
const CATEGORY_MAP: Record<string, string> = {
  // Tech/Growth
  "TSM": "Tech/Growth", "NVDA": "Tech/Growth", "MU": "Tech/Growth", "AMD": "Tech/Growth",
  "AAPL": "Tech/Growth", "MSFT": "Tech/Growth", "GOOGL": "Tech/Growth", "META": "Tech/Growth",
  "AMZN": "Tech/Growth", "RKLB": "Tech/Growth", "PLTR": "Tech/Growth", "SNOW": "Tech/Growth",

  // Cyclical (Mining, Energy, Materials)
  "CCJ": "Cyclical", "EXK": "Cyclical", "XOM": "Cyclical", "CVX": "Cyclical",
  "FCX": "Cyclical", "NEM": "Cyclical", "GOLD": "Cyclical", "SLV": "Cyclical",
  "GLD": "Cyclical", "URA": "Cyclical", "URNM": "Cyclical",

  // Defensive
  "JNJ": "Defensive", "PG": "Defensive", "KO": "Defensive", "PEP": "Defensive",
  "VZ": "Defensive", "T": "Defensive", "SO": "Defensive", "DUK": "Defensive",

  // Financial
  "JPM": "Financial", "BAC": "Financial", "WFC": "Financial", "GS": "Financial",
  "V": "Financial", "MA": "Financial", "NU": "Financial",

  // Speculative
  "GME": "Speculative", "AMC": "Speculative", "MARA": "Speculative", "RIOT": "Speculative",
};

// Python path
const PYTHON_PATH = process.env.FINANCE_PYTHON || `${import.meta.dir}/../.venv/bin/python3`;

// Default portfolio path
const DEFAULT_PORTFOLIO_PATH = `${homedir()}/.claude/skills/Finance/data/portfolio.json`;

// Fetch stock volatility data
async function fetchVolatilityData(ticker: string): Promise<{ price: number; beta: number; volatility30Day: number } | { error: string }> {
  const pythonScript = `
import yfinance as yf
import json
import numpy as np

ticker = "${ticker}"

try:
    stock = yf.Ticker(ticker)
    info = stock.info
    hist = stock.history(period="2mo")

    # Calculate 30-day volatility (annualized)
    if len(hist) >= 30:
        returns = hist['Close'].pct_change().dropna().tail(30)
        vol_30d = returns.std() * np.sqrt(252) * 100  # Annualized as percentage
    else:
        vol_30d = 30  # Default assumption

    result = {
        "price": float(info.get("currentPrice") or info.get("regularMarketPrice", 0)),
        "beta": float(info.get("beta", 1) or 1),
        "volatility30Day": round(vol_30d, 1)
    }
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

  try {
    const result = await $`${PYTHON_PATH} -c ${pythonScript}`.text();
    return JSON.parse(result.trim());
  } catch (error) {
    return { error: `Failed to fetch volatility data: ${error}` };
  }
}

// Load portfolio from file
async function loadPortfolio(portfolioPath: string): Promise<Portfolio> {
  try {
    if (await exists(portfolioPath)) {
      const data = await readFile(portfolioPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.log(`Note: Could not load portfolio from ${portfolioPath}, using default`);
  }

  // Default empty portfolio
  return {
    totalValue: 66000, // Joseph's investable capital
    positions: [],
    deploymentLog: []
  };
}

// Save portfolio
async function savePortfolio(portfolio: Portfolio, portfolioPath: string): Promise<void> {
  const dir = portfolioPath.substring(0, portfolioPath.lastIndexOf("/"));
  await $`mkdir -p ${dir}`;
  await writeFile(portfolioPath, JSON.stringify(portfolio, null, 2));
}

// Determine stock category
function getStockCategory(ticker: string, sector?: string): string {
  // Check predefined map
  if (CATEGORY_MAP[ticker]) {
    return CATEGORY_MAP[ticker];
  }

  // Infer from sector
  if (sector) {
    const sectorLower = sector.toLowerCase();
    if (sectorLower.includes("technology") || sectorLower.includes("semiconductor")) {
      return "Tech/Growth";
    }
    if (sectorLower.includes("energy") || sectorLower.includes("materials") || sectorLower.includes("basic")) {
      return "Cyclical";
    }
    if (sectorLower.includes("utilities") || sectorLower.includes("consumer defensive") || sectorLower.includes("healthcare")) {
      return "Defensive";
    }
    if (sectorLower.includes("financial")) {
      return "Financial";
    }
  }

  return "Speculative"; // Default for unknowns
}

// Check correlation/category exposure
function checkCorrelation(
  ticker: string,
  category: string,
  proposedAmount: number,
  portfolio: Portfolio
): CorrelationCheck {
  const limit = 40; // 40% max per category

  // Calculate current exposure in this category
  let currentCategoryValue = 0;
  for (const position of portfolio.positions) {
    if (position.category === category) {
      currentCategoryValue += position.shares * position.currentPrice;
    }
  }

  const currentPercent = (currentCategoryValue / portfolio.totalValue) * 100;
  const afterBuyValue = currentCategoryValue + proposedAmount;
  const afterBuyPercent = (afterBuyValue / portfolio.totalValue) * 100;

  const passed = afterBuyPercent <= limit;

  return {
    passed,
    stockCategory: category,
    currentExposure: { amount: currentCategoryValue, percent: currentPercent },
    afterBuyExposure: { amount: afterBuyValue, percent: afterBuyPercent },
    limit,
    detail: passed
      ? `${category} exposure: ${currentPercent.toFixed(1)}% → ${afterBuyPercent.toFixed(1)}% (limit: ${limit}%)`
      : `BLOCKED: ${category} would exceed ${limit}% limit (${afterBuyPercent.toFixed(1)}%)`
  };
}

// Check volatility and adjust position size
function checkVolatility(
  proposedAmount: number,
  beta: number,
  volatility30Day: number
): VolatilityCheck {
  // Formula: Adjusted Size = Base Size × (20% / Stock's 30-Day Volatility)
  const targetVolatility = 20; // 20% baseline

  // Cap adjustment factor between 0.3 and 1.0
  const rawAdjustment = targetVolatility / volatility30Day;
  const adjustmentFactor = Math.max(0.3, Math.min(1.0, rawAdjustment));

  const adjustedPosition = proposedAmount * adjustmentFactor;

  // Determine if we should warn (adjustment < 0.7)
  const needsAdjustment = adjustmentFactor < 0.7;

  return {
    passed: true, // Volatility check always "passes" but may adjust size
    beta,
    volatility30Day,
    adjustmentFactor,
    basePosition: proposedAmount,
    adjustedPosition: Math.round(adjustedPosition),
    detail: needsAdjustment
      ? `High volatility (${volatility30Day.toFixed(1)}%) - reducing position: $${proposedAmount} → $${Math.round(adjustedPosition)}`
      : `Volatility ${volatility30Day.toFixed(1)}% OK - position size: $${Math.round(adjustedPosition)}`
  };
}

// Check deployment limits
function checkDeployment(
  proposedAmount: number,
  portfolio: Portfolio
): DeploymentCheck {
  const dailyLimit = 10000;
  const weeklyLimit = 25000;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Calculate start of week (Sunday)
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  // Calculate daily spend
  let dailySpent = 0;
  let weeklySpent = 0;

  for (const entry of portfolio.deploymentLog) {
    if (entry.date === todayStr) {
      dailySpent += entry.amount;
    }
    if (entry.date >= weekStartStr) {
      weeklySpent += entry.amount;
    }
  }

  const dailyRemaining = dailyLimit - dailySpent;
  const weeklyRemaining = weeklyLimit - weeklySpent;

  const wouldExceedDaily = (dailySpent + proposedAmount) > dailyLimit;
  const wouldExceedWeekly = (weeklySpent + proposedAmount) > weeklyLimit;

  const passed = !wouldExceedDaily && !wouldExceedWeekly;

  let detail: string;
  if (!passed) {
    if (wouldExceedDaily) {
      detail = `BLOCKED: Would exceed daily limit. Today: $${dailySpent} + $${proposedAmount} > $${dailyLimit}`;
    } else {
      detail = `BLOCKED: Would exceed weekly limit. This week: $${weeklySpent} + $${proposedAmount} > $${weeklyLimit}`;
    }
  } else {
    detail = `Daily: $${dailySpent}/$${dailyLimit} | Weekly: $${weeklySpent}/$${weeklyLimit}`;
  }

  return {
    passed,
    dailySpent,
    dailyLimit,
    weeklySpent,
    weeklyLimit,
    detail
  };
}

// Main pre-flight check
async function runPreFlightCheck(
  ticker: string,
  proposedAmount: number,
  portfolioPath?: string
): Promise<PreFlightResult> {
  const path = portfolioPath || DEFAULT_PORTFOLIO_PATH;
  const today = new Date().toISOString().split("T")[0];

  console.log(`Running pre-flight check for ${ticker} - $${proposedAmount}...`);

  // Load portfolio
  const portfolio = await loadPortfolio(path);

  // Fetch volatility data
  const volData = await fetchVolatilityData(ticker);
  if ("error" in volData) {
    return {
      ticker,
      date: today,
      proposedAmount,
      checks: {
        correlation: { passed: false, stockCategory: "Unknown", currentExposure: { amount: 0, percent: 0 }, afterBuyExposure: { amount: 0, percent: 0 }, limit: 40, detail: `Error: ${volData.error}` },
        volatility: { passed: false, beta: 1, volatility30Day: 30, adjustmentFactor: 1, basePosition: proposedAmount, adjustedPosition: proposedAmount, detail: `Error: ${volData.error}` },
        deployment: { passed: false, dailySpent: 0, dailyLimit: 10000, weeklySpent: 0, weeklyLimit: 25000, detail: `Error: ${volData.error}` }
      },
      allPassed: false,
      finalOrder: null,
      blockers: [`Failed to fetch data: ${volData.error}`]
    };
  }

  // Determine category
  const category = getStockCategory(ticker);

  // Run all checks
  const correlationCheck = checkCorrelation(ticker, category, proposedAmount, portfolio);
  const volatilityCheck = checkVolatility(proposedAmount, volData.beta, volData.volatility30Day);
  const deploymentCheck = checkDeployment(volatilityCheck.adjustedPosition, portfolio);

  // Collect blockers
  const blockers: string[] = [];
  if (!correlationCheck.passed) blockers.push(correlationCheck.detail);
  if (!deploymentCheck.passed) blockers.push(deploymentCheck.detail);

  const allPassed = correlationCheck.passed && deploymentCheck.passed;

  // Calculate final order if all passed
  let finalOrder: FinalOrder | null = null;
  if (allPassed) {
    const shares = Math.floor(volatilityCheck.adjustedPosition / volData.price);
    finalOrder = {
      ticker,
      shares,
      limitPrice: volData.price,
      totalAmount: shares * volData.price
    };
  }

  return {
    ticker,
    date: today,
    proposedAmount,
    checks: {
      correlation: correlationCheck,
      volatility: volatilityCheck,
      deployment: deploymentCheck
    },
    allPassed,
    finalOrder,
    blockers
  };
}

// Format pre-flight check for display
function formatPreFlightCheck(result: PreFlightResult): string {
  const c = result.checks;
  const checkMark = (pass: boolean) => pass ? "✅" : "❌";

  let output = `
================================================================================
                    PRE-FLIGHT SAFETY CHECK
================================================================================
STOCK: ${result.ticker} | DATE: ${result.date}
PROPOSED AMOUNT: $${result.proposedAmount.toLocaleString()}

SAFETY CHECKS:
--------------------------------------------------------------------------------
${checkMark(c.correlation.passed)} Category Exposure Check
   Category: ${c.correlation.stockCategory}
   ${c.correlation.detail}

${checkMark(c.volatility.passed)} Volatility-Adjusted Sizing
   Beta: ${c.volatility.beta.toFixed(2)} | 30-Day Vol: ${c.volatility.volatility30Day.toFixed(1)}%
   Adjustment: ${(c.volatility.adjustmentFactor * 100).toFixed(0)}%
   ${c.volatility.detail}

${checkMark(c.deployment.passed)} Deployment Limits
   ${c.deployment.detail}

================================================================================
`;

  if (result.allPassed && result.finalOrder) {
    output += `
ALL CHECKS PASSED ✅ - PROCEED WITH ORDER

FINAL ORDER:
--------------------------------------------------------------------------------
Stock:       ${result.finalOrder.ticker}
Shares:      ${result.finalOrder.shares}
Limit Price: $${result.finalOrder.limitPrice.toFixed(2)}
Total:       $${result.finalOrder.totalAmount.toFixed(2)}
================================================================================
`;
  } else {
    output += `
BLOCKED ❌ - DO NOT PROCEED

BLOCKERS:
--------------------------------------------------------------------------------
${result.blockers.map(b => `• ${b}`).join("\n")}
================================================================================
`;
  }

  return output;
}

// Log a deployment (after successful purchase)
async function logDeployment(
  ticker: string,
  amount: number,
  portfolioPath?: string
): Promise<void> {
  const path = portfolioPath || DEFAULT_PORTFOLIO_PATH;
  const portfolio = await loadPortfolio(path);

  portfolio.deploymentLog.push({
    date: new Date().toISOString().split("T")[0],
    ticker,
    amount
  });

  // Keep only last 30 days of deployment history
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().split("T")[0];

  portfolio.deploymentLog = portfolio.deploymentLog.filter(e => e.date >= cutoff);

  await savePortfolio(portfolio, path);
  console.log(`Logged deployment: ${ticker} $${amount}`);
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
PreFlightCheck - Portfolio Safety Check

Usage:
  bun PreFlightCheck.ts <ticker> <amount> [options]
  bun PreFlightCheck.ts log <ticker> <amount> [--portfolio=<file>]

Commands:
  <ticker> <amount>     Run pre-flight check for proposed purchase
  log <ticker> <amount> Log a completed deployment

Examples:
  bun PreFlightCheck.ts TSM 5000
  bun PreFlightCheck.ts NVDA 8000 --portfolio=~/my-portfolio.json
  bun PreFlightCheck.ts log TSM 4500

Options:
  --portfolio=<file>  Path to portfolio JSON file
  --json              Output raw JSON
`);
    process.exit(1);
  }

  // Handle log command
  if (args[0].toLowerCase() === "log") {
    const ticker = args[1].toUpperCase();
    const amount = parseFloat(args[2]);
    const portfolioArg = args.find(a => a.startsWith("--portfolio="));
    const portfolioPath = portfolioArg ? portfolioArg.split("=")[1] : undefined;

    await logDeployment(ticker, amount, portfolioPath);
    return;
  }

  const ticker = args[0].toUpperCase();
  const amount = parseFloat(args[1]);
  const jsonOutput = args.includes("--json");
  const portfolioArg = args.find(a => a.startsWith("--portfolio="));
  const portfolioPath = portfolioArg ? portfolioArg.split("=")[1] : undefined;

  if (isNaN(amount) || amount <= 0) {
    console.error("Error: Amount must be a positive number");
    process.exit(1);
  }

  const result = await runPreFlightCheck(ticker, amount, portfolioPath);

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatPreFlightCheck(result));
  }
}

// Export for programmatic use
export {
  runPreFlightCheck,
  formatPreFlightCheck,
  logDeployment,
  loadPortfolio,
  savePortfolio,
  PreFlightResult,
  Portfolio,
  Position,
};

// Run CLI if executed directly
main().catch(console.error);
