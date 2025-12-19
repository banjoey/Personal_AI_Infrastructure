#!/usr/bin/env bun
/**
 * DailyCheck - Morning Investment Routine
 *
 * A comprehensive morning check that answers: "What should I do today?"
 *
 * 1. Market Regime - Is the market in risk-on or risk-off mode?
 * 2. Watchlist Timing - Which stocks on watchlist have BUY signals?
 * 3. Price Alerts - Any watchlist stocks hit target prices?
 * 4. Event Calendar - Earnings, Fed meetings, etc. this week
 * 5. Action Items - Clear list of what to do today
 *
 * Usage:
 *   bun DailyCheck.ts [tickers...]
 *   bun DailyCheck.ts TSM CCJ MU RKLB EXK NU
 *   bun DailyCheck.ts --watchlist=~/watchlist.json
 */

import { $ } from "bun";
import { readFile, exists } from "fs/promises";
import { homedir } from "os";

// Types
interface DailyCheckResult {
  date: string;
  marketRegime: MarketRegime;
  stockChecks: StockCheck[];
  alerts: Alert[];
  events: CalendarEvent[];
  actionItems: ActionItem[];
  summary: string;
}

interface MarketRegime {
  status: "RISK_ON" | "CAUTIOUS" | "RISK_OFF";
  spyPrice: number;
  spySma50: number;
  spyAbove50: boolean;
  vix: number;
  detail: string;
}

interface StockCheck {
  ticker: string;
  price: number;
  targetBuy: number;
  timingScore: number;
  verdict: "STRONG_BUY" | "BUY" | "NIBBLE" | "WAIT" | "PASS";
  keyFactors: string[];
}

interface Alert {
  type: "PRICE_TARGET" | "STOP_LOSS" | "EARNINGS_SOON";
  ticker: string;
  message: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
}

interface CalendarEvent {
  date: string;
  type: "EARNINGS" | "FED" | "TRIPLE_WITCHING" | "OTHER";
  description: string;
}

interface ActionItem {
  priority: number;
  action: string;
  ticker?: string;
  reason: string;
}

interface WatchlistEntry {
  ticker: string;
  targetBuy: number;
  stopLoss?: number;
}

// Python path
const PYTHON_PATH = process.env.FINANCE_PYTHON || `${import.meta.dir}/../.venv/bin/python3`;

// Default watchlist path
const DEFAULT_WATCHLIST_PATH = `${homedir()}/.claude/skills/Finance/data/watchlist.json`;

// Fetch market regime data
async function fetchMarketRegime(): Promise<MarketRegime | { error: string }> {
  const pythonScript = `
import yfinance as yf
import json

try:
    # SPY data
    spy = yf.Ticker("SPY")
    spy_hist = spy.history(period="3mo")
    spy_price = float(spy_hist['Close'].iloc[-1])
    spy_sma50 = float(spy_hist['Close'].tail(50).mean())

    # VIX data
    vix = yf.Ticker("^VIX")
    vix_hist = vix.history(period="5d")
    vix_price = float(vix_hist['Close'].iloc[-1]) if not vix_hist.empty else 20

    result = {
        "spyPrice": round(spy_price, 2),
        "spySma50": round(spy_sma50, 2),
        "vix": round(vix_price, 2)
    }
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

  try {
    const result = await $`${PYTHON_PATH} -c ${pythonScript}`.text();
    const data = JSON.parse(result.trim());

    if ("error" in data) {
      return { error: data.error };
    }

    const spyAbove50 = data.spyPrice > data.spySma50;
    const vixLow = data.vix < 20;
    const vixHigh = data.vix > 25;

    let status: MarketRegime["status"];
    let detail: string;

    if (spyAbove50 && vixLow) {
      status = "RISK_ON";
      detail = `Bull market: SPY above 50-day, VIX ${data.vix} < 20. Green light for buying.`;
    } else if (!spyAbove50 && vixHigh) {
      status = "RISK_OFF";
      detail = `Risk-off: SPY below 50-day, VIX ${data.vix} > 25. Reduce exposure, hold cash.`;
    } else {
      status = "CAUTIOUS";
      detail = `Mixed signals: Be selective, reduce position sizes.`;
    }

    return {
      status,
      spyPrice: data.spyPrice,
      spySma50: data.spySma50,
      spyAbove50,
      vix: data.vix,
      detail
    };
  } catch (error) {
    return { error: `Failed to fetch market data: ${error}` };
  }
}

// Fetch stock timing data
async function fetchStockTiming(ticker: string, targetBuy: number): Promise<StockCheck | { error: string }> {
  const pythonScript = `
import yfinance as yf
import json
import numpy as np

ticker = "${ticker}"

try:
    stock = yf.Ticker(ticker)
    hist = stock.history(period="3mo")
    info = stock.info

    price = float(hist['Close'].iloc[-1])

    # 50-day MA
    sma50 = float(hist['Close'].tail(50).mean()) if len(hist) >= 50 else float(hist['Close'].mean())

    # Get recent 20-day lows for trend
    recent_20 = hist.tail(20)
    lows = recent_20['Low'].tolist()

    # Simple trend: compare first half lows to second half lows
    first_half = min(lows[:10]) if len(lows) >= 10 else min(lows)
    second_half = min(lows[10:]) if len(lows) > 10 else min(lows)
    uptrend = second_half >= first_half * 0.98

    # RSI
    delta = hist['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    current_rsi = float(rsi.iloc[-1]) if not np.isnan(rsi.iloc[-1]) else 50

    # Earnings date
    calendar = stock.calendar
    earnings_date = None
    earnings_days = 999
    if calendar is not None:
        if isinstance(calendar, dict) and 'Earnings Date' in calendar:
            ed = calendar['Earnings Date']
            if len(ed) > 0:
                earnings_date = str(ed[0])[:10]
                from datetime import datetime
                ed_dt = datetime.strptime(earnings_date, "%Y-%m-%d")
                earnings_days = (ed_dt - datetime.now()).days

    result = {
        "ticker": ticker,
        "price": round(price, 2),
        "sma50": round(sma50, 2),
        "uptrend": uptrend,
        "rsi": round(current_rsi, 1),
        "earningsDays": earnings_days
    }
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

  try {
    const result = await $`${PYTHON_PATH} -c ${pythonScript}`.text();
    const data = JSON.parse(result.trim());

    if ("error" in data) {
      return { error: data.error };
    }

    // Calculate timing score (simplified)
    let score = 0;
    const keyFactors: string[] = [];

    // 20-day trend
    if (data.uptrend) {
      score += 1;
      keyFactors.push("✅ Uptrend");
    } else {
      keyFactors.push("❌ Downtrend");
    }

    // 50-day MA
    if (data.price > data.sma50) {
      score += 1;
      keyFactors.push("✅ Above 50-day MA");
    } else if (Math.abs(data.price - data.sma50) / data.sma50 < 0.02) {
      score += 0.5;
      keyFactors.push("🟡 Near 50-day MA");
    } else {
      keyFactors.push("❌ Below 50-day MA");
    }

    // Price vs target
    if (data.price < targetBuy) {
      score += 1;
      keyFactors.push(`✅ Below target ($${data.price} < $${targetBuy})`);
    } else if (data.price <= targetBuy * 1.05) {
      score += 0.5;
      keyFactors.push(`🟡 Near target ($${data.price} ≈ $${targetBuy})`);
    } else {
      keyFactors.push(`❌ Above target ($${data.price} > $${targetBuy})`);
    }

    // Event risk
    if (data.earningsDays > 10) {
      score += 1;
      keyFactors.push("✅ No imminent earnings");
    } else if (data.earningsDays >= 5) {
      score += 0.5;
      keyFactors.push(`🟡 Earnings in ${data.earningsDays} days`);
    } else if (data.earningsDays >= 0) {
      keyFactors.push(`❌ Earnings in ${data.earningsDays} days`);
    }

    // Seasonality (Dec 1-23 = bad)
    const now = new Date();
    if (now.getMonth() === 11 && now.getDate() <= 23) {
      keyFactors.push("❌ Tax-loss season");
    } else {
      score += 0.5;
    }

    // Determine verdict
    let verdict: StockCheck["verdict"];
    if (score >= 4.5) verdict = "STRONG_BUY";
    else if (score >= 3.5) verdict = "BUY";
    else if (score >= 2.5) verdict = "NIBBLE";
    else if (score >= 1.5) verdict = "WAIT";
    else verdict = "PASS";

    return {
      ticker: data.ticker,
      price: data.price,
      targetBuy,
      timingScore: score,
      verdict,
      keyFactors
    };
  } catch (error) {
    return { error: `Failed to fetch ${ticker}: ${error}` };
  }
}

// Check for alerts
function checkAlerts(stockChecks: StockCheck[], watchlist: WatchlistEntry[]): Alert[] {
  const alerts: Alert[] = [];

  for (const stock of stockChecks) {
    const entry = watchlist.find(w => w.ticker === stock.ticker);

    // Price target hit
    if (stock.price <= stock.targetBuy) {
      alerts.push({
        type: "PRICE_TARGET",
        ticker: stock.ticker,
        message: `${stock.ticker} hit target price! $${stock.price} <= $${stock.targetBuy}`,
        urgency: "HIGH"
      });
    }

    // Stop loss check
    if (entry?.stopLoss && stock.price <= entry.stopLoss) {
      alerts.push({
        type: "STOP_LOSS",
        ticker: stock.ticker,
        message: `${stock.ticker} hit stop loss! $${stock.price} <= $${entry.stopLoss}`,
        urgency: "HIGH"
      });
    }
  }

  return alerts;
}

// Get calendar events
function getCalendarEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  // Fed meetings 2025
  const fedMeetings = [
    "2025-01-29", "2025-03-19", "2025-05-07", "2025-06-18",
    "2025-07-30", "2025-09-17", "2025-11-05", "2025-12-17"
  ];

  for (const meeting of fedMeetings) {
    const meetingDate = new Date(meeting);
    if (meetingDate >= today && meetingDate <= nextWeek) {
      events.push({
        date: meeting,
        type: "FED",
        description: "Federal Reserve Interest Rate Decision"
      });
    }
  }

  // Triple witching (3rd Friday of Mar, Jun, Sep, Dec)
  const month = today.getMonth();
  if ([2, 5, 8, 11].includes(month)) {
    const firstDay = new Date(today.getFullYear(), month, 1);
    let thirdFriday = new Date(firstDay);
    let fridayCount = 0;
    while (fridayCount < 3) {
      if (thirdFriday.getDay() === 5) fridayCount++;
      if (fridayCount < 3) thirdFriday.setDate(thirdFriday.getDate() + 1);
    }
    if (thirdFriday >= today && thirdFriday <= nextWeek) {
      events.push({
        date: thirdFriday.toISOString().split("T")[0],
        type: "TRIPLE_WITCHING",
        description: "Options/Futures Expiration - Expect volatility"
      });
    }
  }

  return events;
}

// Generate action items
function generateActionItems(
  marketRegime: MarketRegime,
  stockChecks: StockCheck[],
  alerts: Alert[]
): ActionItem[] {
  const items: ActionItem[] = [];
  let priority = 1;

  // High urgency alerts first
  for (const alert of alerts.filter(a => a.urgency === "HIGH")) {
    items.push({
      priority: priority++,
      action: alert.type === "STOP_LOSS" ? "SELL" : "REVIEW FOR BUY",
      ticker: alert.ticker,
      reason: alert.message
    });
  }

  // Buyable stocks
  const buyable = stockChecks.filter(s => s.verdict === "STRONG_BUY" || s.verdict === "BUY");
  for (const stock of buyable) {
    if (marketRegime.status !== "RISK_OFF") {
      items.push({
        priority: priority++,
        action: stock.verdict === "STRONG_BUY" ? "BUY (Full Position)" : "BUY (This Week)",
        ticker: stock.ticker,
        reason: `Timing score: ${stock.timingScore}/5 - ${stock.keyFactors.slice(0, 2).join(", ")}`
      });
    }
  }

  // Nibble candidates
  const nibbles = stockChecks.filter(s => s.verdict === "NIBBLE");
  for (const stock of nibbles) {
    if (marketRegime.status === "RISK_ON") {
      items.push({
        priority: priority++,
        action: "NIBBLE (50% position)",
        ticker: stock.ticker,
        reason: `Timing score: ${stock.timingScore}/5 - mixed signals`
      });
    }
  }

  // If nothing to do
  if (items.length === 0) {
    items.push({
      priority: 1,
      action: "HOLD",
      reason: marketRegime.status === "RISK_OFF"
        ? "Risk-off regime - preserve capital"
        : "No compelling opportunities - wait for better setups"
    });
  }

  return items;
}

// Load watchlist
async function loadWatchlist(watchlistPath: string): Promise<WatchlistEntry[]> {
  try {
    if (await exists(watchlistPath)) {
      const data = await readFile(watchlistPath, "utf-8");
      const parsed = JSON.parse(data);
      // Handle both array format and object with stocks property
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (parsed.stocks) {
        return parsed.stocks;
      }
    }
  } catch (error) {
    console.log(`Note: Could not load watchlist from ${watchlistPath}`);
  }
  return [];
}

// Main daily check
async function runDailyCheck(
  tickers: string[],
  watchlistPath?: string
): Promise<DailyCheckResult> {
  const today = new Date().toISOString().split("T")[0];

  console.log("Running daily check...\n");
  console.log("1. Fetching market regime...");

  // Fetch market regime
  const marketRegimeResult = await fetchMarketRegime();
  if ("error" in marketRegimeResult) {
    throw new Error(marketRegimeResult.error);
  }
  const marketRegime = marketRegimeResult;

  // Load watchlist for target prices
  const path = watchlistPath || DEFAULT_WATCHLIST_PATH;
  const watchlist = await loadWatchlist(path);

  // Merge command-line tickers with watchlist
  const allTickers = new Set([
    ...tickers,
    ...watchlist.map(w => w.ticker)
  ]);

  // Create lookup for target prices
  const targetPrices: Record<string, number> = {};
  for (const entry of watchlist) {
    targetPrices[entry.ticker] = entry.targetBuy;
  }

  console.log(`2. Checking ${allTickers.size} stocks...`);

  // Fetch stock timing data
  const stockChecks: StockCheck[] = [];
  for (const ticker of allTickers) {
    const targetBuy = targetPrices[ticker] || 0; // Will calculate if 0
    const result = await fetchStockTiming(ticker, targetBuy || 999999);
    if (!("error" in result)) {
      // If no target was set, use 80% of current price as default target
      if (!targetPrices[ticker]) {
        result.targetBuy = result.price * 0.8;
      }
      stockChecks.push(result);
    } else {
      console.log(`   Warning: ${ticker} - ${result.error}`);
    }
  }

  console.log("3. Checking alerts...");
  const alerts = checkAlerts(stockChecks, watchlist);

  console.log("4. Getting calendar events...");
  const events = getCalendarEvents();

  console.log("5. Generating action items...\n");
  const actionItems = generateActionItems(marketRegime, stockChecks, alerts);

  // Build summary
  const buyCount = stockChecks.filter(s => s.verdict === "STRONG_BUY" || s.verdict === "BUY").length;
  const summary = marketRegime.status === "RISK_OFF"
    ? "Risk-off environment. Hold positions, preserve cash."
    : buyCount > 0
      ? `${buyCount} stock(s) showing buy signals. Review and execute.`
      : "No immediate buy signals. Continue monitoring watchlist.";

  return {
    date: today,
    marketRegime,
    stockChecks,
    alerts,
    events,
    actionItems,
    summary
  };
}

// Format daily check for display
function formatDailyCheck(result: DailyCheckResult): string {
  const regimeIcon = result.marketRegime.status === "RISK_ON" ? "🟢" :
                     result.marketRegime.status === "CAUTIOUS" ? "🟡" : "🔴";

  let output = `
================================================================================
                      DAILY INVESTMENT CHECK
                         ${result.date}
================================================================================

MARKET REGIME: ${regimeIcon} ${result.marketRegime.status}
--------------------------------------------------------------------------------
SPY: $${result.marketRegime.spyPrice} ${result.marketRegime.spyAbove50 ? ">" : "<"} 50-day MA $${result.marketRegime.spySma50.toFixed(2)}
VIX: ${result.marketRegime.vix}
${result.marketRegime.detail}

`;

  // Alerts section
  if (result.alerts.length > 0) {
    output += `🚨 ALERTS
--------------------------------------------------------------------------------
`;
    for (const alert of result.alerts) {
      const urgencyIcon = alert.urgency === "HIGH" ? "🔴" : alert.urgency === "MEDIUM" ? "🟡" : "⚪";
      output += `${urgencyIcon} ${alert.message}\n`;
    }
    output += "\n";
  }

  // Calendar events
  if (result.events.length > 0) {
    output += `📅 THIS WEEK
--------------------------------------------------------------------------------
`;
    for (const event of result.events) {
      output += `${event.date}: ${event.description}\n`;
    }
    output += "\n";
  }

  // Stock checks table
  output += `WATCHLIST STATUS
--------------------------------------------------------------------------------
`;
  const sortedStocks = [...result.stockChecks].sort((a, b) => b.timingScore - a.timingScore);

  for (const stock of sortedStocks) {
    const verdictIcon = stock.verdict === "STRONG_BUY" ? "🟢" :
                        stock.verdict === "BUY" ? "🟢" :
                        stock.verdict === "NIBBLE" ? "🟡" :
                        stock.verdict === "WAIT" ? "⚪" : "🔴";

    output += `${verdictIcon} ${stock.ticker.padEnd(6)} $${stock.price.toFixed(2).padStart(8)} | Target: $${stock.targetBuy.toFixed(2).padStart(8)} | Score: ${stock.timingScore.toFixed(1)}/5 | ${stock.verdict}\n`;
  }

  // Action items
  output += `
================================================================================
ACTION ITEMS
================================================================================
`;
  for (const item of result.actionItems) {
    output += `${item.priority}. ${item.action}${item.ticker ? ` ${item.ticker}` : ""}\n   ${item.reason}\n\n`;
  }

  output += `================================================================================
SUMMARY: ${result.summary}
================================================================================
`;

  return output;
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 && !args.includes("--help")) {
    // Run with default watchlist
    console.log("No tickers specified, using watchlist...\n");
  }

  if (args.includes("--help")) {
    console.log(`
DailyCheck - Morning Investment Routine

Usage:
  bun DailyCheck.ts [tickers...] [options]

Examples:
  bun DailyCheck.ts                           # Use default watchlist
  bun DailyCheck.ts TSM CCJ MU RKLB EXK NU   # Check specific tickers
  bun DailyCheck.ts --watchlist=~/stocks.json # Use custom watchlist

Options:
  --watchlist=<file>  Path to watchlist JSON file
  --json              Output raw JSON
  --help              Show this help

Watchlist Format:
  [
    { "ticker": "TSM", "targetBuy": 255.29 },
    { "ticker": "CCJ", "targetBuy": 50.00, "stopLoss": 42.00 }
  ]
`);
    process.exit(0);
  }

  const jsonOutput = args.includes("--json");
  const watchlistArg = args.find(a => a.startsWith("--watchlist="));
  const watchlistPath = watchlistArg ? watchlistArg.split("=")[1] : undefined;

  // Get tickers from args (filter out flags)
  const tickers = args.filter(a => !a.startsWith("--")).map(t => t.toUpperCase());

  try {
    const result = await runDailyCheck(tickers, watchlistPath);

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatDailyCheck(result));
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

// Export for programmatic use
export {
  runDailyCheck,
  formatDailyCheck,
  DailyCheckResult,
  MarketRegime,
  StockCheck,
  Alert,
  ActionItem,
};

// Run CLI if executed directly
main().catch(console.error);
