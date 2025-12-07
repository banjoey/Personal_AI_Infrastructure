#!/usr/bin/env bun
/**
 * Portfolio - Track holdings, positions, and P&L
 *
 * Features:
 * - Load/save portfolio from JSON file
 * - Add/remove positions with cost basis tracking
 * - Calculate unrealized P&L using live prices
 * - Track realized gains/losses from closed positions
 * - Asset allocation analysis
 * - Tax lot tracking for FIFO/LIFO/specific ID
 *
 * Usage:
 *   bun Portfolio.ts show                    # Show current portfolio
 *   bun Portfolio.ts add AAPL 100 150.00     # Add 100 shares at $150
 *   bun Portfolio.ts sell AAPL 50 175.00     # Sell 50 shares at $175
 *   bun Portfolio.ts performance             # Show P&L breakdown
 *   bun Portfolio.ts allocation              # Show asset allocation
 *   bun Portfolio.ts history                 # Show transaction history
 */

import { $ } from "bun";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Types
interface TaxLot {
  id: string;
  shares: number;
  costBasis: number;  // per share
  purchaseDate: string;
  notes?: string;
}

interface Position {
  ticker: string;
  lots: TaxLot[];
  assetClass: "stock" | "etf" | "crypto" | "reit" | "bond" | "cash" | "other";
}

interface Transaction {
  id: string;
  date: string;
  type: "buy" | "sell" | "dividend" | "split";
  ticker: string;
  shares: number;
  price: number;
  fees?: number;
  notes?: string;
  realizedGain?: number;
  holdingPeriod?: "short" | "long";
}

interface Portfolio {
  name: string;
  created: string;
  lastUpdated: string;
  positions: Position[];
  transactions: Transaction[];
  cashBalance: number;
}

interface PriceData {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
}

// Config
const PAI_DIR = process.env.PAI_DIR || join(process.env.HOME || "", ".claude");
const PORTFOLIO_FILE = join(PAI_DIR, "data", "portfolio.json");
const DATA_DIR = join(PAI_DIR, "data");

// Ensure data directory exists
function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    const fs = require("fs");
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load portfolio from file
function loadPortfolio(): Portfolio {
  ensureDataDir();
  if (existsSync(PORTFOLIO_FILE)) {
    const data = readFileSync(PORTFOLIO_FILE, "utf-8");
    return JSON.parse(data);
  }
  // Return empty portfolio
  return {
    name: "My Portfolio",
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    positions: [],
    transactions: [],
    cashBalance: 0,
  };
}

// Save portfolio to file
function savePortfolio(portfolio: Portfolio): void {
  ensureDataDir();
  portfolio.lastUpdated = new Date().toISOString();
  writeFileSync(PORTFOLIO_FILE, JSON.stringify(portfolio, null, 2));
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Fetch current price via yfinance
async function fetchPrice(ticker: string): Promise<PriceData | null> {
  try {
    const pythonCode = `
import yfinance as yf
import json

ticker = yf.Ticker("${ticker}")
info = ticker.info
hist = ticker.history(period="2d")

if len(hist) >= 2:
    prev_close = hist['Close'].iloc[-2]
    current = hist['Close'].iloc[-1]
    change = current - prev_close
    change_pct = (change / prev_close) * 100
else:
    current = info.get('regularMarketPrice', info.get('previousClose', 0))
    prev_close = info.get('previousClose', current)
    change = current - prev_close
    change_pct = (change / prev_close) * 100 if prev_close else 0

print(json.dumps({
    "ticker": "${ticker}",
    "price": round(current, 2),
    "change": round(change, 2),
    "changePercent": round(change_pct, 2)
}))
`;
    const result = await $`python3 -c ${pythonCode}`.text();
    return JSON.parse(result.trim());
  } catch (error) {
    console.error(`Failed to fetch price for ${ticker}:`, error);
    return null;
  }
}

// Calculate position metrics
function calculatePositionMetrics(position: Position, currentPrice: number) {
  let totalShares = 0;
  let totalCost = 0;

  for (const lot of position.lots) {
    totalShares += lot.shares;
    totalCost += lot.shares * lot.costBasis;
  }

  const avgCostBasis = totalShares > 0 ? totalCost / totalShares : 0;
  const marketValue = totalShares * currentPrice;
  const unrealizedGain = marketValue - totalCost;
  const unrealizedGainPercent = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0;

  return {
    totalShares,
    totalCost,
    avgCostBasis,
    marketValue,
    unrealizedGain,
    unrealizedGainPercent,
  };
}

// Determine holding period (short vs long term)
function getHoldingPeriod(purchaseDate: string): "short" | "long" {
  const purchase = new Date(purchaseDate);
  const now = new Date();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  return now.getTime() - purchase.getTime() >= oneYear ? "long" : "short";
}

// Add position
async function addPosition(
  ticker: string,
  shares: number,
  price: number,
  assetClass: Position["assetClass"] = "stock",
  notes?: string
): Promise<void> {
  const portfolio = loadPortfolio();

  // Find or create position
  let position = portfolio.positions.find((p) => p.ticker === ticker.toUpperCase());
  if (!position) {
    position = {
      ticker: ticker.toUpperCase(),
      lots: [],
      assetClass,
    };
    portfolio.positions.push(position);
  }

  // Add tax lot
  const lot: TaxLot = {
    id: generateId(),
    shares,
    costBasis: price,
    purchaseDate: new Date().toISOString(),
    notes,
  };
  position.lots.push(lot);

  // Record transaction
  const transaction: Transaction = {
    id: generateId(),
    date: new Date().toISOString(),
    type: "buy",
    ticker: ticker.toUpperCase(),
    shares,
    price,
    notes,
  };
  portfolio.transactions.push(transaction);

  // Update cash balance
  portfolio.cashBalance -= shares * price;

  savePortfolio(portfolio);
  console.log(`Added ${shares} shares of ${ticker.toUpperCase()} at $${price.toFixed(2)}`);
}

// Sell position (FIFO by default)
async function sellPosition(
  ticker: string,
  shares: number,
  price: number,
  method: "fifo" | "lifo" | "hifo" = "fifo",
  notes?: string
): Promise<void> {
  const portfolio = loadPortfolio();

  const position = portfolio.positions.find((p) => p.ticker === ticker.toUpperCase());
  if (!position) {
    console.error(`No position found for ${ticker}`);
    return;
  }

  const totalShares = position.lots.reduce((sum, lot) => sum + lot.shares, 0);
  if (totalShares < shares) {
    console.error(`Insufficient shares. Have ${totalShares}, trying to sell ${shares}`);
    return;
  }

  // Sort lots based on method
  const sortedLots = [...position.lots];
  if (method === "fifo") {
    sortedLots.sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());
  } else if (method === "lifo") {
    sortedLots.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  } else if (method === "hifo") {
    sortedLots.sort((a, b) => b.costBasis - a.costBasis);
  }

  let remainingToSell = shares;
  let totalCostBasis = 0;
  let shortTermGain = 0;
  let longTermGain = 0;

  for (const lot of sortedLots) {
    if (remainingToSell <= 0) break;

    const sellFromLot = Math.min(lot.shares, remainingToSell);
    const lotCost = sellFromLot * lot.costBasis;
    const lotProceeds = sellFromLot * price;
    const lotGain = lotProceeds - lotCost;

    totalCostBasis += lotCost;

    if (getHoldingPeriod(lot.purchaseDate) === "long") {
      longTermGain += lotGain;
    } else {
      shortTermGain += lotGain;
    }

    // Update lot
    const originalLot = position.lots.find((l) => l.id === lot.id);
    if (originalLot) {
      originalLot.shares -= sellFromLot;
    }

    remainingToSell -= sellFromLot;
  }

  // Remove empty lots
  position.lots = position.lots.filter((lot) => lot.shares > 0);

  // Remove position if no lots remain
  if (position.lots.length === 0) {
    portfolio.positions = portfolio.positions.filter((p) => p.ticker !== ticker.toUpperCase());
  }

  const totalGain = shortTermGain + longTermGain;

  // Record transaction
  const transaction: Transaction = {
    id: generateId(),
    date: new Date().toISOString(),
    type: "sell",
    ticker: ticker.toUpperCase(),
    shares,
    price,
    realizedGain: totalGain,
    holdingPeriod: longTermGain > shortTermGain ? "long" : "short",
    notes,
  };
  portfolio.transactions.push(transaction);

  // Update cash balance
  portfolio.cashBalance += shares * price;

  savePortfolio(portfolio);

  console.log(`Sold ${shares} shares of ${ticker.toUpperCase()} at $${price.toFixed(2)}`);
  console.log(`Realized gain: $${totalGain.toFixed(2)}`);
  console.log(`  Short-term: $${shortTermGain.toFixed(2)}`);
  console.log(`  Long-term: $${longTermGain.toFixed(2)}`);
}

// Show portfolio
async function showPortfolio(): Promise<void> {
  const portfolio = loadPortfolio();

  if (portfolio.positions.length === 0) {
    console.log("Portfolio is empty. Use 'add <ticker> <shares> <price>' to add positions.");
    return;
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log(`PORTFOLIO: ${portfolio.name}`);
  console.log(`Last Updated: ${new Date(portfolio.lastUpdated).toLocaleString()}`);
  console.log(`${"=".repeat(80)}\n`);

  let totalValue = 0;
  let totalCost = 0;
  let totalGain = 0;

  console.log(`${"Ticker".padEnd(8)} ${"Shares".padStart(10)} ${"Avg Cost".padStart(10)} ${"Price".padStart(10)} ${"Value".padStart(12)} ${"Gain/Loss".padStart(12)} ${"Return".padStart(8)}`);
  console.log("-".repeat(80));

  for (const position of portfolio.positions) {
    const priceData = await fetchPrice(position.ticker);
    const currentPrice = priceData?.price || 0;

    const metrics = calculatePositionMetrics(position, currentPrice);

    totalValue += metrics.marketValue;
    totalCost += metrics.totalCost;
    totalGain += metrics.unrealizedGain;

    const gainColor = metrics.unrealizedGain >= 0 ? "\x1b[32m" : "\x1b[31m";
    const reset = "\x1b[0m";

    console.log(
      `${position.ticker.padEnd(8)} ` +
      `${metrics.totalShares.toFixed(2).padStart(10)} ` +
      `${("$" + metrics.avgCostBasis.toFixed(2)).padStart(10)} ` +
      `${("$" + currentPrice.toFixed(2)).padStart(10)} ` +
      `${("$" + metrics.marketValue.toFixed(2)).padStart(12)} ` +
      `${gainColor}${("$" + metrics.unrealizedGain.toFixed(2)).padStart(12)}${reset} ` +
      `${gainColor}${(metrics.unrealizedGainPercent.toFixed(1) + "%").padStart(8)}${reset}`
    );
  }

  console.log("-".repeat(80));
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const gainColor = totalGain >= 0 ? "\x1b[32m" : "\x1b[31m";
  const reset = "\x1b[0m";

  console.log(
    `${"TOTAL".padEnd(8)} ` +
    `${"".padStart(10)} ` +
    `${("$" + totalCost.toFixed(2)).padStart(10)} ` +
    `${"".padStart(10)} ` +
    `${("$" + totalValue.toFixed(2)).padStart(12)} ` +
    `${gainColor}${("$" + totalGain.toFixed(2)).padStart(12)}${reset} ` +
    `${gainColor}${(totalGainPercent.toFixed(1) + "%").padStart(8)}${reset}`
  );

  console.log(`\nCash Balance: $${portfolio.cashBalance.toFixed(2)}`);
  console.log(`Total Portfolio Value: $${(totalValue + portfolio.cashBalance).toFixed(2)}`);
}

// Show asset allocation
async function showAllocation(): Promise<void> {
  const portfolio = loadPortfolio();

  if (portfolio.positions.length === 0) {
    console.log("Portfolio is empty.");
    return;
  }

  const allocation: Record<string, number> = {};
  let totalValue = portfolio.cashBalance;
  allocation["cash"] = portfolio.cashBalance;

  for (const position of portfolio.positions) {
    const priceData = await fetchPrice(position.ticker);
    const currentPrice = priceData?.price || 0;
    const metrics = calculatePositionMetrics(position, currentPrice);

    allocation[position.assetClass] = (allocation[position.assetClass] || 0) + metrics.marketValue;
    totalValue += metrics.marketValue;
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log("ASSET ALLOCATION");
  console.log(`${"=".repeat(50)}\n`);

  console.log(`${"Asset Class".padEnd(20)} ${"Value".padStart(15)} ${"Allocation".padStart(12)}`);
  console.log("-".repeat(50));

  const sortedClasses = Object.entries(allocation).sort((a, b) => b[1] - a[1]);

  for (const [assetClass, value] of sortedClasses) {
    const percent = totalValue > 0 ? (value / totalValue) * 100 : 0;
    const bar = "█".repeat(Math.round(percent / 2));
    console.log(
      `${assetClass.padEnd(20)} ` +
      `${("$" + value.toFixed(2)).padStart(15)} ` +
      `${(percent.toFixed(1) + "%").padStart(12)} ${bar}`
    );
  }

  console.log("-".repeat(50));
  console.log(`${"TOTAL".padEnd(20)} ${("$" + totalValue.toFixed(2)).padStart(15)} ${"100.0%".padStart(12)}`);
}

// Show performance metrics
async function showPerformance(): Promise<void> {
  const portfolio = loadPortfolio();

  // Calculate realized gains from transactions
  const sellTransactions = portfolio.transactions.filter((t) => t.type === "sell");

  let totalRealizedGain = 0;
  let shortTermGains = 0;
  let longTermGains = 0;

  for (const tx of sellTransactions) {
    totalRealizedGain += tx.realizedGain || 0;
    if (tx.holdingPeriod === "short") {
      shortTermGains += tx.realizedGain || 0;
    } else {
      longTermGains += tx.realizedGain || 0;
    }
  }

  // Calculate unrealized gains
  let totalUnrealizedGain = 0;
  let unrealizedShortTerm = 0;
  let unrealizedLongTerm = 0;

  for (const position of portfolio.positions) {
    const priceData = await fetchPrice(position.ticker);
    const currentPrice = priceData?.price || 0;

    for (const lot of position.lots) {
      const lotValue = lot.shares * currentPrice;
      const lotCost = lot.shares * lot.costBasis;
      const gain = lotValue - lotCost;

      totalUnrealizedGain += gain;

      if (getHoldingPeriod(lot.purchaseDate) === "short") {
        unrealizedShortTerm += gain;
      } else {
        unrealizedLongTerm += gain;
      }
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("PERFORMANCE SUMMARY");
  console.log(`${"=".repeat(60)}\n`);

  console.log("REALIZED GAINS/LOSSES (Closed Positions)");
  console.log("-".repeat(40));
  console.log(`  Short-term: $${shortTermGains.toFixed(2)}`);
  console.log(`  Long-term:  $${longTermGains.toFixed(2)}`);
  console.log(`  Total:      $${totalRealizedGain.toFixed(2)}`);

  console.log("\nUNREALIZED GAINS/LOSSES (Open Positions)");
  console.log("-".repeat(40));
  console.log(`  Short-term: $${unrealizedShortTerm.toFixed(2)}`);
  console.log(`  Long-term:  $${unrealizedLongTerm.toFixed(2)}`);
  console.log(`  Total:      $${totalUnrealizedGain.toFixed(2)}`);

  console.log("\nTOTAL GAINS/LOSSES");
  console.log("-".repeat(40));
  const totalGain = totalRealizedGain + totalUnrealizedGain;
  const color = totalGain >= 0 ? "\x1b[32m" : "\x1b[31m";
  const reset = "\x1b[0m";
  console.log(`  ${color}$${totalGain.toFixed(2)}${reset}`);
}

// Show transaction history
function showHistory(limit: number = 20): void {
  const portfolio = loadPortfolio();

  if (portfolio.transactions.length === 0) {
    console.log("No transaction history.");
    return;
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("TRANSACTION HISTORY");
  console.log(`${"=".repeat(80)}\n`);

  console.log(`${"Date".padEnd(12)} ${"Type".padEnd(8)} ${"Ticker".padEnd(8)} ${"Shares".padStart(10)} ${"Price".padStart(10)} ${"Gain/Loss".padStart(12)}`);
  console.log("-".repeat(80));

  const recentTx = portfolio.transactions.slice(-limit).reverse();

  for (const tx of recentTx) {
    const date = new Date(tx.date).toLocaleDateString();
    const gainStr = tx.realizedGain !== undefined ? `$${tx.realizedGain.toFixed(2)}` : "-";

    console.log(
      `${date.padEnd(12)} ` +
      `${tx.type.toUpperCase().padEnd(8)} ` +
      `${tx.ticker.padEnd(8)} ` +
      `${tx.shares.toFixed(2).padStart(10)} ` +
      `${("$" + tx.price.toFixed(2)).padStart(10)} ` +
      `${gainStr.padStart(12)}`
    );
  }
}

// Add cash to portfolio
function addCash(amount: number): void {
  const portfolio = loadPortfolio();
  portfolio.cashBalance += amount;
  savePortfolio(portfolio);
  console.log(`Added $${amount.toFixed(2)} cash. New balance: $${portfolio.cashBalance.toFixed(2)}`);
}

// Main CLI
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  switch (command) {
    case "show":
    case "list":
    case undefined:
      await showPortfolio();
      break;

    case "add":
    case "buy": {
      const ticker = args[1];
      const shares = parseFloat(args[2]);
      const price = parseFloat(args[3]);
      const assetClass = (args[4] as Position["assetClass"]) || "stock";

      if (!ticker || isNaN(shares) || isNaN(price)) {
        console.log("Usage: Portfolio.ts add <ticker> <shares> <price> [assetClass]");
        console.log("Asset classes: stock, etf, crypto, reit, bond, cash, other");
        return;
      }

      await addPosition(ticker, shares, price, assetClass);
      break;
    }

    case "sell": {
      const ticker = args[1];
      const shares = parseFloat(args[2]);
      const price = parseFloat(args[3]);
      const method = (args[4] as "fifo" | "lifo" | "hifo") || "fifo";

      if (!ticker || isNaN(shares) || isNaN(price)) {
        console.log("Usage: Portfolio.ts sell <ticker> <shares> <price> [method]");
        console.log("Methods: fifo (default), lifo, hifo");
        return;
      }

      await sellPosition(ticker, shares, price, method);
      break;
    }

    case "performance":
    case "perf":
      await showPerformance();
      break;

    case "allocation":
    case "alloc":
      await showAllocation();
      break;

    case "history":
    case "hist": {
      const limit = parseInt(args[1]) || 20;
      showHistory(limit);
      break;
    }

    case "cash": {
      const amount = parseFloat(args[1]);
      if (isNaN(amount)) {
        console.log("Usage: Portfolio.ts cash <amount>");
        return;
      }
      addCash(amount);
      break;
    }

    case "help":
      console.log(`
Portfolio - Track holdings, positions, and P&L

Commands:
  show                          Show current portfolio with live prices
  add <ticker> <shares> <price> Add a position (buy)
  sell <ticker> <shares> <price> Sell a position
  performance                   Show realized/unrealized gains
  allocation                    Show asset allocation breakdown
  history [limit]               Show transaction history
  cash <amount>                 Add/remove cash from portfolio
  help                          Show this help message

Examples:
  bun Portfolio.ts show
  bun Portfolio.ts add AAPL 100 150.00
  bun Portfolio.ts add BTC 0.5 45000 crypto
  bun Portfolio.ts sell AAPL 50 175.00
  bun Portfolio.ts sell AAPL 50 175.00 hifo  # Highest cost first
  bun Portfolio.ts performance
  bun Portfolio.ts allocation
`);
      break;

    default:
      console.log(`Unknown command: ${command}. Use 'help' for usage.`);
  }
}

main().catch(console.error);

// Export for testing
export {
  loadPortfolio,
  savePortfolio,
  addPosition,
  sellPosition,
  calculatePositionMetrics,
  getHoldingPeriod,
  type Portfolio,
  type Position,
  type Transaction,
  type TaxLot,
};
