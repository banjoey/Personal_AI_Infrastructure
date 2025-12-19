#!/usr/bin/env bun
/**
 * TimingCheck - 6-Factor Timing Decision System
 *
 * Implements Joseph's Unified Investment System v2.0 Timing Framework
 * Evaluates whether NOW is the right time to buy a stock:
 *
 * 1. 20-Day Trend: Higher lows vs lower lows
 * 2. 50-Day MA: Price above or below
 * 3. Price vs Target: Current price vs calculated buy price
 * 4. Event Risk: Earnings, Fed meetings, product launches nearby
 * 5. Seasonality: Tax-loss season, Santa rally, etc.
 * 6. Market Regime: S&P vs 50-day, VIX level
 *
 * Usage:
 *   bun TimingCheck.ts <ticker> [--target=<price>]
 *   bun TimingCheck.ts TSM
 *   bun TimingCheck.ts NVDA --target=120
 */

import { $ } from "bun";

// Types
interface TimingResult {
  ticker: string;
  date: string;
  currentPrice: number;
  targetBuyPrice: number;
  factors: TimingFactors;
  totalScore: number;
  maxScore: number;
  verdict: "STRONG_BUY" | "BUY" | "NIBBLE" | "WAIT" | "PASS";
  actionGuidance: string;
}

interface TimingFactors {
  twentyDayTrend: { score: number; signal: Signal; detail: string };
  fiftyDayMa: { score: number; signal: Signal; price: number; ma: number; detail: string };
  priceVsTarget: { score: number; signal: Signal; percentFromTarget: number; detail: string };
  eventRisk: { score: number; signal: Signal; events: string[]; detail: string };
  seasonality: { score: number; signal: Signal; period: string; detail: string };
  marketRegime: { score: number; signal: Signal; spyVsMa: string; vix: number; detail: string };
}

type Signal = "GREEN" | "YELLOW" | "RED";

interface MarketData {
  ticker: string;
  price: number;
  sma50: number;
  sma200: number;
  historicalPrices: { date: string; close: number; low: number }[];
  nextEarningsDate: string | null;
}

interface SPYData {
  price: number;
  sma50: number;
  vix: number;
}

// Python path
const PYTHON_PATH = process.env.FINANCE_PYTHON || `${import.meta.dir}/../.venv/bin/python3`;

// Fetch stock technical data
async function fetchStockData(ticker: string): Promise<MarketData | { error: string }> {
  const pythonScript = `
import yfinance as yf
import json
from datetime import datetime

ticker = "${ticker}"

try:
    stock = yf.Ticker(ticker)
    hist = stock.history(period="3mo")
    info = stock.info

    # Calculate 50-day MA
    if len(hist) >= 50:
        sma50 = hist['Close'].tail(50).mean()
    else:
        sma50 = hist['Close'].mean()

    # 200-day MA
    hist_1y = stock.history(period="1y")
    if len(hist_1y) >= 200:
        sma200 = hist_1y['Close'].tail(200).mean()
    else:
        sma200 = hist_1y['Close'].mean()

    # Get recent 20-day price data
    recent_20 = hist.tail(20)
    price_data = [{"date": str(d.date()), "close": round(row['Close'], 2), "low": round(row['Low'], 2)}
                  for d, row in recent_20.iterrows()]

    # Next earnings date
    calendar = stock.calendar
    earnings_date = None
    if calendar is not None:
        if isinstance(calendar, dict) and 'Earnings Date' in calendar:
            ed = calendar['Earnings Date']
            if len(ed) > 0:
                earnings_date = str(ed[0])[:10]

    result = {
        "ticker": ticker,
        "price": float(hist['Close'].iloc[-1]),
        "sma50": round(float(sma50), 2),
        "sma200": round(float(sma200), 2),
        "historicalPrices": price_data,
        "nextEarningsDate": earnings_date
    }
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

  try {
    const result = await $`${PYTHON_PATH} -c ${pythonScript}`.text();
    return JSON.parse(result.trim());
  } catch (error) {
    return { error: `Failed to fetch stock data: ${error}` };
  }
}

// Fetch S&P 500 and VIX data for market regime
async function fetchMarketData(): Promise<SPYData | { error: string }> {
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
        "price": round(spy_price, 2),
        "sma50": round(spy_sma50, 2),
        "vix": round(vix_price, 2)
    }
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

  try {
    const result = await $`${PYTHON_PATH} -c ${pythonScript}`.text();
    return JSON.parse(result.trim());
  } catch (error) {
    return { error: `Failed to fetch market data: ${error}` };
  }
}

// Analyze 20-day trend
function analyzeTrend(prices: { date: string; close: number; low: number }[]): { score: number; signal: Signal; detail: string } {
  if (prices.length < 10) {
    return { score: 0.5, signal: "YELLOW", detail: "Insufficient data for trend analysis" };
  }

  // Split into 4 windows and compare lows
  const windowSize = Math.floor(prices.length / 4);
  const windows: number[] = [];

  for (let i = 0; i < 4; i++) {
    const start = i * windowSize;
    const end = Math.min(start + windowSize, prices.length);
    const windowPrices = prices.slice(start, end);
    const minLow = Math.min(...windowPrices.map(p => p.low));
    windows.push(minLow);
  }

  // Count higher lows
  let higherLows = 0;
  for (let i = 1; i < windows.length; i++) {
    if (windows[i] >= windows[i - 1] * 0.98) {
      higherLows++;
    }
  }

  if (higherLows >= 2) {
    return { score: 1, signal: "GREEN", detail: `Higher lows pattern (${higherLows}/3 windows rising)` };
  } else if (higherLows === 1) {
    return { score: 0.5, signal: "YELLOW", detail: "Sideways/choppy trend" };
  } else {
    return { score: 0, signal: "RED", detail: `Lower lows pattern (${3 - higherLows}/3 windows falling)` };
  }
}

// Check 50-day MA
function check50DayMA(price: number, sma50: number): { score: number; signal: Signal; detail: string } {
  const percentDiff = ((price - sma50) / sma50) * 100;

  if (price > sma50) {
    return { score: 1, signal: "GREEN", detail: `Price $${price.toFixed(2)} > 50-day MA $${sma50.toFixed(2)} (+${percentDiff.toFixed(1)}%)` };
  } else if (Math.abs(percentDiff) <= 2) {
    return { score: 0.5, signal: "YELLOW", detail: `Price $${price.toFixed(2)} ≈ 50-day MA $${sma50.toFixed(2)} (${percentDiff.toFixed(1)}%)` };
  } else {
    return { score: 0, signal: "RED", detail: `Price $${price.toFixed(2)} < 50-day MA $${sma50.toFixed(2)} (${percentDiff.toFixed(1)}%)` };
  }
}

// Check price vs target buy price
function checkPriceVsTarget(currentPrice: number, targetBuyPrice: number): { score: number; signal: Signal; percentFromTarget: number; detail: string } {
  const percentDiff = ((currentPrice - targetBuyPrice) / targetBuyPrice) * 100;

  if (currentPrice < targetBuyPrice) {
    return { score: 1, signal: "GREEN", percentFromTarget: percentDiff, detail: `Below buy price: $${currentPrice.toFixed(2)} < $${targetBuyPrice.toFixed(2)} (${percentDiff.toFixed(1)}%)` };
  } else if (percentDiff <= 5) {
    return { score: 0.5, signal: "YELLOW", percentFromTarget: percentDiff, detail: `Near buy price: $${currentPrice.toFixed(2)} ≈ $${targetBuyPrice.toFixed(2)} (+${percentDiff.toFixed(1)}%)` };
  } else {
    return { score: 0, signal: "RED", percentFromTarget: percentDiff, detail: `Above buy price: $${currentPrice.toFixed(2)} > $${targetBuyPrice.toFixed(2)} (+${percentDiff.toFixed(1)}%)` };
  }
}

// Check event risk (earnings, Fed meetings, etc.)
function checkEventRisk(nextEarningsDate: string | null): { score: number; signal: Signal; events: string[]; detail: string } {
  const today = new Date();
  const events: string[] = [];

  // Check earnings date
  let earningsDays = 999;
  if (nextEarningsDate) {
    const earningsDate = new Date(nextEarningsDate);
    earningsDays = Math.ceil((earningsDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (earningsDays >= 0 && earningsDays <= 30) {
      events.push(`Earnings in ${earningsDays} days (${nextEarningsDate})`);
    }
  }

  // Check Fed meeting dates (2025)
  const fedMeetings2025 = [
    "2025-01-29", "2025-03-19", "2025-05-07", "2025-06-18",
    "2025-07-30", "2025-09-17", "2025-11-05", "2025-12-17"
  ];

  let nearestFedDays = 999;
  for (const meeting of fedMeetings2025) {
    const meetingDate = new Date(meeting);
    const daysUntil = Math.ceil((meetingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0 && daysUntil <= 10) {
      events.push(`Fed meeting in ${daysUntil} days (${meeting})`);
      nearestFedDays = Math.min(nearestFedDays, daysUntil);
    }
  }

  // Triple witching (3rd Friday of Mar, Jun, Sep, Dec)
  const month = today.getMonth();
  const isTripleWitchingMonth = [2, 5, 8, 11].includes(month);
  if (isTripleWitchingMonth) {
    // Find 3rd Friday
    const firstDay = new Date(today.getFullYear(), month, 1);
    let thirdFriday = new Date(firstDay);
    let fridayCount = 0;
    while (fridayCount < 3) {
      if (thirdFriday.getDay() === 5) fridayCount++;
      if (fridayCount < 3) thirdFriday.setDate(thirdFriday.getDate() + 1);
    }
    const daysUntilTw = Math.ceil((thirdFriday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilTw >= 0 && daysUntilTw <= 5) {
      events.push(`Triple witching in ${daysUntilTw} days`);
    }
  }

  // Determine score
  const nearestEventDays = Math.min(earningsDays, nearestFedDays);

  if (events.length === 0 || nearestEventDays > 10) {
    return { score: 1, signal: "GREEN", events, detail: "No major events within 10 days" };
  } else if (nearestEventDays >= 5) {
    return { score: 0.5, signal: "YELLOW", events, detail: `Event(s) 5-10 days out: ${events.join(", ")}` };
  } else {
    return { score: 0, signal: "RED", events, detail: `Event(s) < 5 days: ${events.join(", ")}` };
  }
}

// Check seasonality
function checkSeasonality(): { score: number; signal: Signal; period: string; detail: string } {
  const today = new Date();
  const month = today.getMonth(); // 0-indexed
  const day = today.getDate();

  // Good periods (GREEN)
  // Jan 2-7: Tax-loss rebound
  if (month === 0 && day >= 2 && day <= 7) {
    return { score: 1, signal: "GREEN", period: "Tax-Loss Rebound", detail: "Jan 2-7: Historically beaten stocks bounce (+2.1% avg)" };
  }

  // Dec 24 - Jan 2: Santa Rally
  if ((month === 11 && day >= 24) || (month === 0 && day <= 2)) {
    return { score: 1, signal: "GREEN", period: "Santa Rally", detail: "Dec 24-Jan 2: Santa Rally period (+1.3% avg S&P)" };
  }

  // Oct 15-31: October lows
  if (month === 9 && day >= 15) {
    return { score: 1, signal: "GREEN", period: "October Lows", detail: "Oct 15-31: Historical correction lows - buy the fear" };
  }

  // Bad periods (RED)
  // Dec 1-23: Tax-loss selling season
  if (month === 11 && day >= 1 && day <= 23) {
    return { score: 0, signal: "RED", period: "Tax-Loss Season", detail: "Dec 1-23: Tax-loss selling pressure - be patient" };
  }

  // Neutral periods (YELLOW)
  // Summer doldrums (late June - August)
  if ((month === 5 && day >= 20) || month === 6 || month === 7) {
    return { score: 0.5, signal: "YELLOW", period: "Summer Doldrums", detail: "Late June-Aug: Lower volume, good for accumulation" };
  }

  // Default: Neutral
  return { score: 0.5, signal: "YELLOW", period: "Neutral Period", detail: "No strong seasonal bias" };
}

// Check market regime (S&P vs 50-day, VIX)
function checkMarketRegime(spy: SPYData): { score: number; signal: Signal; spyVsMa: string; vix: number; detail: string } {
  const spyAbove50 = spy.price > spy.sma50;
  const vixLow = spy.vix < 20;
  const vixHigh = spy.vix > 25;

  if (spyAbove50 && vixLow) {
    return {
      score: 1,
      signal: "GREEN",
      spyVsMa: `SPY $${spy.price} > 50-day $${spy.sma50.toFixed(2)}`,
      vix: spy.vix,
      detail: `Bull regime: SPY above 50-day MA, VIX ${spy.vix.toFixed(1)} < 20`
    };
  } else if (!spyAbove50 && vixHigh) {
    return {
      score: 0,
      signal: "RED",
      spyVsMa: `SPY $${spy.price} < 50-day $${spy.sma50.toFixed(2)}`,
      vix: spy.vix,
      detail: `Risk-off regime: SPY below 50-day MA, VIX ${spy.vix.toFixed(1)} > 25`
    };
  } else {
    return {
      score: 0.5,
      signal: "YELLOW",
      spyVsMa: spyAbove50 ? `SPY $${spy.price} > 50-day` : `SPY $${spy.price} < 50-day`,
      vix: spy.vix,
      detail: `Mixed signals: SPY ${spyAbove50 ? "above" : "below"} 50-day, VIX ${spy.vix.toFixed(1)}`
    };
  }
}

// Determine verdict based on total score
function getVerdict(totalScore: number): { verdict: TimingResult["verdict"]; guidance: string } {
  if (totalScore >= 5) {
    return { verdict: "STRONG_BUY", guidance: "Full position immediately" };
  } else if (totalScore >= 4) {
    return { verdict: "BUY", guidance: "Full position this week" };
  } else if (totalScore >= 3) {
    return { verdict: "NIBBLE", guidance: "50% position now, add on dip" };
  } else if (totalScore >= 2) {
    return { verdict: "WAIT", guidance: "Set price alert, check back in 1 week" };
  } else {
    return { verdict: "PASS", guidance: "Not the right time - wait for better conditions" };
  }
}

// Calculate target buy price (simplified - uses 20% margin of safety from current price if not provided)
function calculateDefaultTarget(currentPrice: number): number {
  // Default to 20% below current price as a reasonable target
  return currentPrice * 0.80;
}

// Main timing check function
async function runTimingCheck(ticker: string, targetPrice?: number): Promise<TimingResult | { error: string }> {
  console.log(`Fetching timing data for ${ticker}...`);

  // Fetch stock and market data in parallel
  const [stockData, marketData] = await Promise.all([
    fetchStockData(ticker),
    fetchMarketData()
  ]);

  if ("error" in stockData) {
    return { error: stockData.error };
  }

  if ("error" in marketData) {
    return { error: marketData.error };
  }

  const today = new Date().toISOString().split("T")[0];
  const targetBuyPrice = targetPrice || calculateDefaultTarget(stockData.price);

  // Run all checks
  const twentyDayTrend = analyzeTrend(stockData.historicalPrices);
  const fiftyDayMa = check50DayMA(stockData.price, stockData.sma50);
  const priceVsTarget = checkPriceVsTarget(stockData.price, targetBuyPrice);
  const eventRisk = checkEventRisk(stockData.nextEarningsDate);
  const seasonality = checkSeasonality();
  const marketRegime = checkMarketRegime(marketData);

  // Calculate total score
  const totalScore = twentyDayTrend.score + fiftyDayMa.score + priceVsTarget.score +
                     eventRisk.score + seasonality.score + marketRegime.score;

  // Get verdict
  const { verdict, guidance } = getVerdict(totalScore);

  return {
    ticker,
    date: today,
    currentPrice: stockData.price,
    targetBuyPrice,
    factors: {
      twentyDayTrend: { ...twentyDayTrend },
      fiftyDayMa: { ...fiftyDayMa, price: stockData.price, ma: stockData.sma50 },
      priceVsTarget: { ...priceVsTarget },
      eventRisk: { ...eventRisk },
      seasonality: { ...seasonality },
      marketRegime: { ...marketRegime }
    },
    totalScore,
    maxScore: 6,
    verdict,
    actionGuidance: guidance
  };
}

// Format timing check for display
function formatTimingCheck(result: TimingResult): string {
  const f = result.factors;
  const signalIcon = (signal: Signal) => signal === "GREEN" ? "🟢" : signal === "YELLOW" ? "🟡" : "🔴";

  return `
================================================================================
                         TIMING CHECK - 6 FACTOR
================================================================================
STOCK: ${result.ticker} | DATE: ${result.date}
Current Price: $${result.currentPrice.toFixed(2)} | Target Buy: $${result.targetBuyPrice.toFixed(2)}

TIMING FACTORS:
--------------------------------------------------------------------------------
1. 20-Day Trend:    ${signalIcon(f.twentyDayTrend.signal)} ${f.twentyDayTrend.signal.padEnd(6)} - ${f.twentyDayTrend.score} pt
   ${f.twentyDayTrend.detail}

2. 50-Day MA:       ${signalIcon(f.fiftyDayMa.signal)} ${f.fiftyDayMa.signal.padEnd(6)} - ${f.fiftyDayMa.score} pt
   ${f.fiftyDayMa.detail}

3. Price vs Target: ${signalIcon(f.priceVsTarget.signal)} ${f.priceVsTarget.signal.padEnd(6)} - ${f.priceVsTarget.score} pt
   ${f.priceVsTarget.detail}

4. Event Risk:      ${signalIcon(f.eventRisk.signal)} ${f.eventRisk.signal.padEnd(6)} - ${f.eventRisk.score} pt
   ${f.eventRisk.detail}

5. Seasonality:     ${signalIcon(f.seasonality.signal)} ${f.seasonality.signal.padEnd(6)} - ${f.seasonality.score} pt
   ${f.seasonality.detail}

6. Market Regime:   ${signalIcon(f.marketRegime.signal)} ${f.marketRegime.signal.padEnd(6)} - ${f.marketRegime.score} pt
   ${f.marketRegime.detail}

================================================================================
TIMING SCORE: ${result.totalScore}/${result.maxScore}

VERDICT: ${result.verdict}
ACTION:  ${result.actionGuidance}
================================================================================
`;
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
TimingCheck - 6-Factor Timing Decision System

Usage:
  bun TimingCheck.ts <ticker> [--target=<price>] [--json]

Examples:
  bun TimingCheck.ts TSM
  bun TimingCheck.ts NVDA --target=120
  bun TimingCheck.ts AAPL --json

Options:
  --target=<price>  Set specific target buy price (default: 20% below current)
  --json            Output raw JSON instead of formatted report
`);
    process.exit(1);
  }

  const ticker = args[0].toUpperCase();
  const jsonOutput = args.includes("--json");

  // Parse target price if provided
  let targetPrice: number | undefined;
  const targetArg = args.find(a => a.startsWith("--target="));
  if (targetArg) {
    targetPrice = parseFloat(targetArg.split("=")[1]);
  }

  const result = await runTimingCheck(ticker, targetPrice);

  if ("error" in result) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatTimingCheck(result));
  }
}

// Export for programmatic use
export {
  runTimingCheck,
  formatTimingCheck,
  TimingResult,
  TimingFactors,
  Signal,
};

// Run CLI if executed directly
main().catch(console.error);
