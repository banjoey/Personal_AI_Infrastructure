#!/usr/bin/env bun
/**
 * Watchlist - Track stocks of interest with price alerts
 *
 * Features:
 * - Maintain watchlists by category (e.g., "tech", "dividend", "crypto")
 * - Set price alerts (above/below thresholds)
 * - Track why each stock was added (thesis)
 * - Check alerts against current prices
 * - Export watchlist for review
 *
 * Usage:
 *   bun Watchlist.ts show                    # Show all watchlists
 *   bun Watchlist.ts add AAPL tech           # Add to tech watchlist
 *   bun Watchlist.ts alert AAPL below 150    # Alert when below $150
 *   bun Watchlist.ts check                   # Check all alerts
 *   bun Watchlist.ts remove AAPL             # Remove from watchlist
 */

import { $ } from "bun";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Types
interface WatchlistItem {
  ticker: string;
  addedAt: string;
  category: string;
  thesis?: string;
  targetBuy?: number;
  targetSell?: number;
  alerts: Alert[];
  notes?: string;
  tags: string[];
}

interface Alert {
  id: string;
  type: "above" | "below" | "percent_change";
  threshold: number;
  createdAt: string;
  triggered?: boolean;
  triggeredAt?: string;
  message?: string;
}

interface WatchlistData {
  created: string;
  lastUpdated: string;
  lastChecked?: string;
  items: WatchlistItem[];
  categories: string[];
}

interface PriceData {
  ticker: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
}

// Config
const PAI_DIR = process.env.PAI_DIR || join(process.env.HOME || "", ".claude");
const WATCHLIST_FILE = join(PAI_DIR, "data", "watchlist.json");
const DATA_DIR = join(PAI_DIR, "data");

// Ensure data directory exists
function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load watchlist
function loadWatchlist(): WatchlistData {
  ensureDataDir();
  if (existsSync(WATCHLIST_FILE)) {
    const data = readFileSync(WATCHLIST_FILE, "utf-8");
    return JSON.parse(data);
  }
  return {
    created: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    items: [],
    categories: ["general", "tech", "dividend", "growth", "value", "crypto", "speculative"],
  };
}

// Save watchlist
function saveWatchlist(data: WatchlistData): void {
  ensureDataDir();
  data.lastUpdated = new Date().toISOString();
  writeFileSync(WATCHLIST_FILE, JSON.stringify(data, null, 2));
}

// Generate ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Fetch price data
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
else:
    current = info.get('regularMarketPrice', info.get('previousClose', 0))
    prev_close = info.get('previousClose', current)

change = current - prev_close
change_pct = (change / prev_close) * 100 if prev_close else 0

print(json.dumps({
    "ticker": "${ticker}",
    "price": round(current, 2),
    "previousClose": round(prev_close, 2),
    "change": round(change, 2),
    "changePercent": round(change_pct, 2),
    "high52w": info.get('fiftyTwoWeekHigh', 0),
    "low52w": info.get('fiftyTwoWeekLow', 0)
}))
`;
    const result = await $`python3 -c ${pythonCode}`.text();
    return JSON.parse(result.trim());
  } catch (error) {
    console.error(`Failed to fetch price for ${ticker}`);
    return null;
  }
}

// Add to watchlist
function addItem(
  ticker: string,
  category: string = "general",
  options: Partial<WatchlistItem> = {}
): void {
  const data = loadWatchlist();

  // Check if already exists
  const existing = data.items.find((i) => i.ticker === ticker.toUpperCase());
  if (existing) {
    console.log(`${ticker.toUpperCase()} is already on the watchlist in category: ${existing.category}`);
    return;
  }

  // Add category if new
  if (!data.categories.includes(category)) {
    data.categories.push(category);
  }

  const item: WatchlistItem = {
    ticker: ticker.toUpperCase(),
    addedAt: new Date().toISOString(),
    category,
    alerts: [],
    tags: [],
    ...options,
  };

  data.items.push(item);
  saveWatchlist(data);

  console.log(`Added ${ticker.toUpperCase()} to watchlist (${category})`);
}

// Remove from watchlist
function removeItem(ticker: string): void {
  const data = loadWatchlist();
  const initialLength = data.items.length;

  data.items = data.items.filter((i) => i.ticker !== ticker.toUpperCase());

  if (data.items.length < initialLength) {
    saveWatchlist(data);
    console.log(`Removed ${ticker.toUpperCase()} from watchlist`);
  } else {
    console.log(`${ticker.toUpperCase()} not found on watchlist`);
  }
}

// Add alert
function addAlert(
  ticker: string,
  type: Alert["type"],
  threshold: number,
  message?: string
): void {
  const data = loadWatchlist();
  const item = data.items.find((i) => i.ticker === ticker.toUpperCase());

  if (!item) {
    console.log(`${ticker.toUpperCase()} not on watchlist. Adding first...`);
    addItem(ticker);
    return addAlert(ticker, type, threshold, message);
  }

  const alert: Alert = {
    id: generateId(),
    type,
    threshold,
    createdAt: new Date().toISOString(),
    message,
  };

  item.alerts.push(alert);
  saveWatchlist(data);

  const typeStr = type === "above" ? "rises above" : type === "below" ? "falls below" : "changes by";
  const thresholdStr = type === "percent_change" ? `${threshold}%` : `$${threshold}`;
  console.log(`Alert set: ${ticker.toUpperCase()} ${typeStr} ${thresholdStr}`);
}

// Check all alerts
async function checkAlerts(): Promise<void> {
  const data = loadWatchlist();
  const triggeredAlerts: { item: WatchlistItem; alert: Alert; price: number }[] = [];

  console.log("\nChecking alerts...\n");

  for (const item of data.items) {
    if (item.alerts.length === 0) continue;

    const priceData = await fetchPrice(item.ticker);
    if (!priceData) continue;

    for (const alert of item.alerts) {
      if (alert.triggered) continue;

      let isTriggered = false;

      if (alert.type === "above" && priceData.price >= alert.threshold) {
        isTriggered = true;
      } else if (alert.type === "below" && priceData.price <= alert.threshold) {
        isTriggered = true;
      } else if (alert.type === "percent_change" && Math.abs(priceData.changePercent) >= alert.threshold) {
        isTriggered = true;
      }

      if (isTriggered) {
        alert.triggered = true;
        alert.triggeredAt = new Date().toISOString();
        triggeredAlerts.push({ item, alert, price: priceData.price });
      }
    }
  }

  data.lastChecked = new Date().toISOString();
  saveWatchlist(data);

  if (triggeredAlerts.length === 0) {
    console.log("No alerts triggered.");
    return;
  }

  console.log(`${"=".repeat(60)}`);
  console.log("TRIGGERED ALERTS");
  console.log(`${"=".repeat(60)}\n`);

  for (const { item, alert, price } of triggeredAlerts) {
    const typeStr = alert.type === "above" ? "rose above" : alert.type === "below" ? "fell below" : "changed by";
    const thresholdStr = alert.type === "percent_change" ? `${alert.threshold}%` : `$${alert.threshold}`;

    console.log(`🔔 ${item.ticker} ${typeStr} ${thresholdStr}`);
    console.log(`   Current price: $${price}`);
    if (alert.message) {
      console.log(`   Note: ${alert.message}`);
    }
    if (item.thesis) {
      console.log(`   Thesis: ${item.thesis}`);
    }
    console.log("");
  }
}

// Show watchlist
async function showWatchlist(category?: string, withPrices: boolean = false): Promise<void> {
  const data = loadWatchlist();
  let items = data.items;

  if (category) {
    items = items.filter((i) => i.category === category);
  }

  if (items.length === 0) {
    console.log("Watchlist is empty.");
    return;
  }

  // Group by category
  const byCategory: Record<string, WatchlistItem[]> = {};
  for (const item of items) {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("WATCHLIST");
  if (data.lastChecked) {
    console.log(`Last checked: ${new Date(data.lastChecked).toLocaleString()}`);
  }
  console.log(`${"=".repeat(80)}\n`);

  for (const [cat, catItems] of Object.entries(byCategory)) {
    console.log(`\n📁 ${cat.toUpperCase()}`);
    console.log("-".repeat(40));

    if (withPrices) {
      console.log(`${"Ticker".padEnd(8)} ${"Price".padStart(10)} ${"Change".padStart(10)} ${"52w Range".padStart(20)} ${"Alerts".padStart(8)}`);
    } else {
      console.log(`${"Ticker".padEnd(8)} ${"Added".padEnd(12)} ${"Alerts".padStart(8)} ${"Thesis".padEnd(40)}`);
    }

    for (const item of catItems) {
      if (withPrices) {
        const priceData = await fetchPrice(item.ticker);
        if (priceData) {
          const changeColor = priceData.change >= 0 ? "\x1b[32m" : "\x1b[31m";
          const reset = "\x1b[0m";
          const range = `$${priceData.low52w.toFixed(0)}-$${priceData.high52w.toFixed(0)}`;

          console.log(
            `${item.ticker.padEnd(8)} ` +
            `${("$" + priceData.price.toFixed(2)).padStart(10)} ` +
            `${changeColor}${(priceData.change >= 0 ? "+" : "") + priceData.changePercent.toFixed(1) + "%"}${reset}`.padStart(20) +
            `${range.padStart(20)} ` +
            `${item.alerts.length.toString().padStart(8)}`
          );
        }
      } else {
        const date = new Date(item.addedAt).toLocaleDateString();
        const thesis = item.thesis ? item.thesis.substring(0, 38) + (item.thesis.length > 38 ? ".." : "") : "-";

        console.log(
          `${item.ticker.padEnd(8)} ` +
          `${date.padEnd(12)} ` +
          `${item.alerts.length.toString().padStart(8)} ` +
          `${thesis}`
        );
      }
    }
  }

  // Show active alerts summary
  const activeAlerts = items.flatMap((i) => i.alerts.filter((a) => !a.triggered));
  if (activeAlerts.length > 0) {
    console.log(`\n📢 Active alerts: ${activeAlerts.length}`);
  }
}

// Update item thesis
function updateThesis(ticker: string, thesis: string): void {
  const data = loadWatchlist();
  const item = data.items.find((i) => i.ticker === ticker.toUpperCase());

  if (!item) {
    console.log(`${ticker.toUpperCase()} not on watchlist`);
    return;
  }

  item.thesis = thesis;
  saveWatchlist(data);
  console.log(`Updated thesis for ${ticker.toUpperCase()}`);
}

// Clear triggered alerts
function clearTriggered(ticker?: string): void {
  const data = loadWatchlist();
  let cleared = 0;

  for (const item of data.items) {
    if (ticker && item.ticker !== ticker.toUpperCase()) continue;

    const before = item.alerts.length;
    item.alerts = item.alerts.filter((a) => !a.triggered);
    cleared += before - item.alerts.length;
  }

  saveWatchlist(data);
  console.log(`Cleared ${cleared} triggered alerts`);
}

// Export to markdown
function exportWatchlist(): string {
  const data = loadWatchlist();

  let md = "# Watchlist\n\n";
  md += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Group by category
  const byCategory: Record<string, WatchlistItem[]> = {};
  for (const item of data.items) {
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
  }

  for (const [cat, items] of Object.entries(byCategory)) {
    md += `## ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n\n`;
    md += "| Ticker | Added | Thesis | Alerts |\n";
    md += "|--------|-------|--------|--------|\n";

    for (const item of items) {
      const date = new Date(item.addedAt).toLocaleDateString();
      const thesis = item.thesis || "-";
      const alertCount = item.alerts.length;

      md += `| ${item.ticker} | ${date} | ${thesis} | ${alertCount} |\n`;
    }

    md += "\n";
  }

  return md;
}

// Main CLI
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  switch (command) {
    case "add": {
      const ticker = args[1];
      const category = args[2] || "general";
      const thesis = args.slice(3).join(" ");

      if (!ticker) {
        console.log("Usage: Watchlist.ts add <ticker> [category] [thesis]");
        return;
      }

      addItem(ticker, category, thesis ? { thesis } : {});
      break;
    }

    case "remove":
    case "rm": {
      const ticker = args[1];
      if (!ticker) {
        console.log("Usage: Watchlist.ts remove <ticker>");
        return;
      }
      removeItem(ticker);
      break;
    }

    case "alert": {
      const ticker = args[1];
      const type = args[2] as Alert["type"];
      const threshold = parseFloat(args[3]);
      const message = args.slice(4).join(" ");

      if (!ticker || !type || isNaN(threshold)) {
        console.log("Usage: Watchlist.ts alert <ticker> <above|below|percent_change> <threshold> [message]");
        return;
      }

      addAlert(ticker, type, threshold, message || undefined);
      break;
    }

    case "check":
      await checkAlerts();
      break;

    case "show":
    case "list":
    case undefined: {
      const category = args[1];
      const withPrices = args.includes("--prices") || args.includes("-p");
      await showWatchlist(category, withPrices);
      break;
    }

    case "thesis": {
      const ticker = args[1];
      const thesis = args.slice(2).join(" ");

      if (!ticker || !thesis) {
        console.log("Usage: Watchlist.ts thesis <ticker> <thesis>");
        return;
      }

      updateThesis(ticker, thesis);
      break;
    }

    case "clear": {
      const ticker = args[1];
      clearTriggered(ticker);
      break;
    }

    case "export": {
      const md = exportWatchlist();
      console.log(md);
      break;
    }

    case "categories": {
      const data = loadWatchlist();
      console.log("Categories:", data.categories.join(", "));
      break;
    }

    case "help":
      console.log(`
Watchlist - Track stocks of interest with price alerts

Commands:
  add <ticker> [category] [thesis]        Add to watchlist
  remove <ticker>                         Remove from watchlist
  alert <ticker> <type> <threshold>       Set price alert
  check                                   Check all alerts
  show [category] [--prices]              Show watchlist
  thesis <ticker> <thesis>                Update investment thesis
  clear [ticker]                          Clear triggered alerts
  categories                              List categories
  export                                  Export to markdown
  help                                    Show this help

Alert types: above, below, percent_change

Examples:
  bun Watchlist.ts add AAPL tech "Waiting for pullback"
  bun Watchlist.ts alert AAPL below 170 "Buy zone"
  bun Watchlist.ts alert NVDA percent_change 5 "High volatility"
  bun Watchlist.ts show tech --prices
  bun Watchlist.ts check
`);
      break;

    default:
      console.log(`Unknown command: ${command}. Use 'help' for usage.`);
  }
}

main().catch(console.error);

// Export for testing
export {
  loadWatchlist,
  saveWatchlist,
  addItem,
  removeItem,
  addAlert,
  checkAlerts,
  type WatchlistItem,
  type Alert,
  type WatchlistData,
};
