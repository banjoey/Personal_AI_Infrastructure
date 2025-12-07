#!/usr/bin/env bun
/**
 * Backtest - Test trading strategies against historical data
 *
 * Features:
 * - Fetch historical price data via yfinance
 * - Define strategies using simple rules
 * - Run backtests with realistic assumptions
 * - Calculate performance metrics (Sharpe, max drawdown, etc.)
 * - Compare strategies against benchmarks
 *
 * Usage:
 *   bun Backtest.ts run AAPL --strategy sma_crossover
 *   bun Backtest.ts compare AAPL SPY --strategy momentum
 *   bun Backtest.ts analyze <results-file>
 */

import { $ } from "bun";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// Types
interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Trade {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  shares: number;
  pnl: number;
  pnlPercent: number;
  holdingDays: number;
  type: "long" | "short";
}

interface BacktestResult {
  ticker: string;
  strategy: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  annualizedReturn: number;
  benchmarkReturn?: number;
  alpha?: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownDate: string;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  avgTradeReturn: number;
  avgWin: number;
  avgLoss: number;
  avgHoldingDays: number;
  trades: Trade[];
  equity: { date: string; value: number }[];
}

interface StrategySignal {
  action: "buy" | "sell" | "hold";
  strength: number;  // 0-1
  reason?: string;
}

type StrategyFunction = (
  data: OHLCV[],
  index: number,
  position: "long" | "short" | "flat",
  params: Record<string, number>
) => StrategySignal;

// Config
const PAI_DIR = process.env.PAI_DIR || join(process.env.HOME || "", ".claude");
const RESULTS_DIR = join(PAI_DIR, "data", "backtests");

// Ensure directories exist
function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// Fetch historical data via yfinance
async function fetchHistoricalData(
  ticker: string,
  period: string = "2y"
): Promise<OHLCV[]> {
  const pythonCode = `
import yfinance as yf
import json

ticker = yf.Ticker("${ticker}")
hist = ticker.history(period="${period}")

data = []
for idx, row in hist.iterrows():
    data.append({
        "date": idx.strftime("%Y-%m-%d"),
        "open": round(row['Open'], 2),
        "high": round(row['High'], 2),
        "low": round(row['Low'], 2),
        "close": round(row['Close'], 2),
        "volume": int(row['Volume'])
    })

print(json.dumps(data))
`;

  try {
    const result = await $`python3 -c ${pythonCode}`.text();
    return JSON.parse(result.trim());
  } catch (error) {
    console.error(`Failed to fetch data for ${ticker}:`, error);
    return [];
  }
}

// Technical indicators
function sma(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

function ema(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(data[0]);
    } else if (i < period - 1) {
      // Use SMA for first few values
      const sum = data.slice(0, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / (i + 1));
    } else {
      result.push((data[i] - result[i - 1]) * multiplier + result[i - 1]);
    }
  }
  return result;
}

function rsi(data: number[], period: number = 14): number[] {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      gains.push(0);
      losses.push(0);
      result.push(50);
      continue;
    }

    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);

    if (i < period) {
      result.push(50);
      continue;
    }

    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}

// Strategy definitions
const strategies: Record<string, StrategyFunction> = {
  // SMA Crossover: Buy when short SMA crosses above long SMA
  sma_crossover: (data, index, position, params) => {
    const shortPeriod = params.short || 20;
    const longPeriod = params.long || 50;

    if (index < longPeriod) return { action: "hold", strength: 0 };

    const closes = data.slice(0, index + 1).map((d) => d.close);
    const shortSma = sma(closes, shortPeriod);
    const longSma = sma(closes, longPeriod);

    const prevShort = shortSma[index - 1];
    const prevLong = longSma[index - 1];
    const currShort = shortSma[index];
    const currLong = longSma[index];

    // Golden cross
    if (prevShort <= prevLong && currShort > currLong && position !== "long") {
      return { action: "buy", strength: 0.8, reason: "SMA golden cross" };
    }

    // Death cross
    if (prevShort >= prevLong && currShort < currLong && position === "long") {
      return { action: "sell", strength: 0.8, reason: "SMA death cross" };
    }

    return { action: "hold", strength: 0 };
  },

  // RSI Mean Reversion: Buy oversold, sell overbought
  rsi_reversion: (data, index, position, params) => {
    const period = params.period || 14;
    const oversold = params.oversold || 30;
    const overbought = params.overbought || 70;

    if (index < period) return { action: "hold", strength: 0 };

    const closes = data.slice(0, index + 1).map((d) => d.close);
    const rsiValues = rsi(closes, period);
    const currentRsi = rsiValues[index];

    if (currentRsi < oversold && position !== "long") {
      return { action: "buy", strength: (oversold - currentRsi) / oversold, reason: `RSI oversold (${currentRsi.toFixed(1)})` };
    }

    if (currentRsi > overbought && position === "long") {
      return { action: "sell", strength: (currentRsi - overbought) / (100 - overbought), reason: `RSI overbought (${currentRsi.toFixed(1)})` };
    }

    return { action: "hold", strength: 0 };
  },

  // Momentum: Follow the trend
  momentum: (data, index, position, params) => {
    const lookback = params.lookback || 20;

    if (index < lookback) return { action: "hold", strength: 0 };

    const currentClose = data[index].close;
    const pastClose = data[index - lookback].close;
    const momentum = (currentClose - pastClose) / pastClose;

    const threshold = params.threshold || 0.05;

    if (momentum > threshold && position !== "long") {
      return { action: "buy", strength: Math.min(momentum / 0.2, 1), reason: `Positive momentum (${(momentum * 100).toFixed(1)}%)` };
    }

    if (momentum < -threshold && position === "long") {
      return { action: "sell", strength: Math.min(-momentum / 0.2, 1), reason: `Negative momentum (${(momentum * 100).toFixed(1)}%)` };
    }

    return { action: "hold", strength: 0 };
  },

  // Buy and Hold (baseline)
  buy_hold: (data, index, position, params) => {
    if (index === 0 && position !== "long") {
      return { action: "buy", strength: 1, reason: "Buy and hold entry" };
    }
    return { action: "hold", strength: 0 };
  },

  // Breakout: Buy on new highs
  breakout: (data, index, position, params) => {
    const lookback = params.lookback || 20;

    if (index < lookback) return { action: "hold", strength: 0 };

    const recentHighs = data.slice(index - lookback, index).map((d) => d.high);
    const maxHigh = Math.max(...recentHighs);
    const currentClose = data[index].close;

    // Breakout above recent highs
    if (currentClose > maxHigh && position !== "long") {
      return { action: "buy", strength: 0.9, reason: `Breakout above ${lookback}-day high` };
    }

    // Stop loss at recent low
    const recentLows = data.slice(index - lookback, index).map((d) => d.low);
    const minLow = Math.min(...recentLows);

    if (currentClose < minLow && position === "long") {
      return { action: "sell", strength: 0.9, reason: `Breakdown below ${lookback}-day low` };
    }

    return { action: "hold", strength: 0 };
  },
};

// Run backtest
async function runBacktest(
  ticker: string,
  strategyName: string,
  options: {
    period?: string;
    initialCapital?: number;
    positionSize?: number;  // Fraction of capital per trade
    params?: Record<string, number>;
  } = {}
): Promise<BacktestResult | null> {
  const period = options.period || "2y";
  const initialCapital = options.initialCapital || 100000;
  const positionSize = options.positionSize || 1.0;  // Full capital by default
  const params = options.params || {};

  console.log(`Fetching data for ${ticker}...`);
  const data = await fetchHistoricalData(ticker, period);

  if (data.length === 0) {
    console.error("No data available");
    return null;
  }

  const strategy = strategies[strategyName];
  if (!strategy) {
    console.error(`Unknown strategy: ${strategyName}`);
    console.log("Available strategies:", Object.keys(strategies).join(", "));
    return null;
  }

  console.log(`Running backtest: ${strategyName} on ${ticker}...`);

  // Initialize
  let capital = initialCapital;
  let shares = 0;
  let position: "long" | "short" | "flat" = "flat";
  let entryPrice = 0;
  let entryDate = "";

  const trades: Trade[] = [];
  const equity: { date: string; value: number }[] = [];
  let peakEquity = initialCapital;
  let maxDrawdown = 0;
  let maxDrawdownDate = "";

  // Run simulation
  for (let i = 0; i < data.length; i++) {
    const bar = data[i];
    const signal = strategy(data, i, position, params);

    // Execute trades
    if (signal.action === "buy" && position === "flat") {
      const tradableCapital = capital * positionSize;
      shares = Math.floor(tradableCapital / bar.close);
      if (shares > 0) {
        capital -= shares * bar.close;
        position = "long";
        entryPrice = bar.close;
        entryDate = bar.date;
      }
    } else if (signal.action === "sell" && position === "long") {
      const exitValue = shares * bar.close;
      const pnl = exitValue - shares * entryPrice;
      const pnlPercent = (pnl / (shares * entryPrice)) * 100;
      const entryDateObj = new Date(entryDate);
      const exitDateObj = new Date(bar.date);
      const holdingDays = Math.round((exitDateObj.getTime() - entryDateObj.getTime()) / (1000 * 60 * 60 * 24));

      trades.push({
        entryDate,
        exitDate: bar.date,
        entryPrice,
        exitPrice: bar.close,
        shares,
        pnl,
        pnlPercent,
        holdingDays,
        type: "long",
      });

      capital += exitValue;
      shares = 0;
      position = "flat";
    }

    // Track equity
    const currentEquity = capital + shares * bar.close;
    equity.push({ date: bar.date, value: currentEquity });

    // Track drawdown
    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }
    const drawdown = (peakEquity - currentEquity) / peakEquity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownDate = bar.date;
    }
  }

  // Close any open position at end
  if (position === "long") {
    const lastBar = data[data.length - 1];
    const exitValue = shares * lastBar.close;
    capital += exitValue;
    shares = 0;
  }

  // Calculate metrics
  const finalCapital = capital;
  const totalReturn = ((finalCapital - initialCapital) / initialCapital) * 100;

  // Annualized return
  const days = data.length;
  const years = days / 252;
  const annualizedReturn = (Math.pow(finalCapital / initialCapital, 1 / years) - 1) * 100;

  // Win rate
  const winningTrades = trades.filter((t) => t.pnl > 0);
  const losingTrades = trades.filter((t) => t.pnl < 0);
  const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

  // Profit factor
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  // Average returns
  const avgTradeReturn = trades.length > 0
    ? trades.reduce((sum, t) => sum + t.pnlPercent, 0) / trades.length
    : 0;
  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / winningTrades.length
    : 0;
  const avgLoss = losingTrades.length > 0
    ? losingTrades.reduce((sum, t) => sum + t.pnlPercent, 0) / losingTrades.length
    : 0;
  const avgHoldingDays = trades.length > 0
    ? trades.reduce((sum, t) => sum + t.holdingDays, 0) / trades.length
    : 0;

  // Sharpe ratio (simplified - using 0% risk-free rate)
  const returns = equity.slice(1).map((e, i) => (e.value - equity[i].value) / equity[i].value);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

  return {
    ticker,
    strategy: strategyName,
    startDate: data[0].date,
    endDate: data[data.length - 1].date,
    initialCapital,
    finalCapital,
    totalReturn,
    annualizedReturn,
    sharpeRatio,
    maxDrawdown: maxDrawdown * 100,
    maxDrawdownDate,
    winRate,
    profitFactor,
    totalTrades: trades.length,
    avgTradeReturn,
    avgWin,
    avgLoss,
    avgHoldingDays,
    trades,
    equity,
  };
}

// Display results
function displayResults(result: BacktestResult): void {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`BACKTEST RESULTS: ${result.strategy.toUpperCase()} on ${result.ticker}`);
  console.log(`${"=".repeat(60)}\n`);

  console.log(`Period: ${result.startDate} to ${result.endDate}`);
  console.log(`Initial Capital: $${result.initialCapital.toLocaleString()}`);

  const returnColor = result.totalReturn >= 0 ? "\x1b[32m" : "\x1b[31m";
  const reset = "\x1b[0m";

  console.log(`\nPERFORMANCE`);
  console.log("-".repeat(40));
  console.log(`Final Capital: $${result.finalCapital.toLocaleString()}`);
  console.log(`Total Return: ${returnColor}${result.totalReturn >= 0 ? "+" : ""}${result.totalReturn.toFixed(2)}%${reset}`);
  console.log(`Annualized Return: ${returnColor}${result.annualizedReturn >= 0 ? "+" : ""}${result.annualizedReturn.toFixed(2)}%${reset}`);
  console.log(`Sharpe Ratio: ${result.sharpeRatio.toFixed(2)}`);
  console.log(`Max Drawdown: \x1b[31m-${result.maxDrawdown.toFixed(2)}%\x1b[0m (${result.maxDrawdownDate})`);

  console.log(`\nTRADING STATISTICS`);
  console.log("-".repeat(40));
  console.log(`Total Trades: ${result.totalTrades}`);
  console.log(`Win Rate: ${result.winRate.toFixed(1)}%`);
  console.log(`Profit Factor: ${result.profitFactor === Infinity ? "Infinity" : result.profitFactor.toFixed(2)}`);
  console.log(`Avg Trade Return: ${result.avgTradeReturn >= 0 ? "+" : ""}${result.avgTradeReturn.toFixed(2)}%`);
  console.log(`Avg Win: +${result.avgWin.toFixed(2)}% | Avg Loss: ${result.avgLoss.toFixed(2)}%`);
  console.log(`Avg Holding Period: ${result.avgHoldingDays.toFixed(0)} days`);

  // Show recent trades
  if (result.trades.length > 0) {
    console.log(`\nRECENT TRADES (last 5)`);
    console.log("-".repeat(40));
    const recentTrades = result.trades.slice(-5);
    for (const trade of recentTrades) {
      const tradeColor = trade.pnl >= 0 ? "\x1b[32m" : "\x1b[31m";
      console.log(
        `  ${trade.entryDate} -> ${trade.exitDate}: ` +
        `$${trade.entryPrice.toFixed(2)} -> $${trade.exitPrice.toFixed(2)} ` +
        `${tradeColor}${trade.pnl >= 0 ? "+" : ""}${trade.pnlPercent.toFixed(1)}%${reset}`
      );
    }
  }
}

// Save results
function saveResults(result: BacktestResult): string {
  ensureDir(RESULTS_DIR);
  const filename = `${result.ticker}_${result.strategy}_${Date.now()}.json`;
  const filepath = join(RESULTS_DIR, filename);
  writeFileSync(filepath, JSON.stringify(result, null, 2));
  return filepath;
}

// Compare strategies
async function compareStrategies(
  ticker: string,
  strategyNames: string[],
  options: { period?: string; initialCapital?: number } = {}
): Promise<void> {
  console.log(`\nComparing strategies on ${ticker}...\n`);

  const results: BacktestResult[] = [];

  for (const strategyName of strategyNames) {
    const result = await runBacktest(ticker, strategyName, options);
    if (result) {
      results.push(result);
    }
  }

  if (results.length === 0) {
    console.log("No results to compare");
    return;
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("STRATEGY COMPARISON");
  console.log(`${"=".repeat(80)}\n`);

  console.log(
    `${"Strategy".padEnd(15)} ` +
    `${"Return".padStart(10)} ` +
    `${"Ann.Ret".padStart(10)} ` +
    `${"Sharpe".padStart(8)} ` +
    `${"MaxDD".padStart(8)} ` +
    `${"WinRate".padStart(8)} ` +
    `${"Trades".padStart(8)}`
  );
  console.log("-".repeat(80));

  for (const result of results.sort((a, b) => b.annualizedReturn - a.annualizedReturn)) {
    const returnColor = result.totalReturn >= 0 ? "\x1b[32m" : "\x1b[31m";
    const reset = "\x1b[0m";

    console.log(
      `${result.strategy.padEnd(15)} ` +
      `${returnColor}${(result.totalReturn >= 0 ? "+" : "") + result.totalReturn.toFixed(1) + "%"}${reset}`.padStart(20) +
      `${(result.annualizedReturn >= 0 ? "+" : "") + result.annualizedReturn.toFixed(1) + "%"}`.padStart(10) +
      `${result.sharpeRatio.toFixed(2)}`.padStart(8) +
      `${"-" + result.maxDrawdown.toFixed(1) + "%"}`.padStart(8) +
      `${result.winRate.toFixed(0) + "%"}`.padStart(8) +
      `${result.totalTrades}`.padStart(8)
    );
  }
}

// Main CLI
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  switch (command) {
    case "run": {
      const ticker = args[1];
      const strategyIdx = args.indexOf("--strategy");
      const strategy = strategyIdx > -1 ? args[strategyIdx + 1] : "sma_crossover";
      const periodIdx = args.indexOf("--period");
      const period = periodIdx > -1 ? args[periodIdx + 1] : "2y";

      if (!ticker) {
        console.log("Usage: Backtest.ts run <ticker> [--strategy <name>] [--period <period>]");
        return;
      }

      const result = await runBacktest(ticker, strategy, { period });
      if (result) {
        displayResults(result);
        const filepath = saveResults(result);
        console.log(`\nResults saved to: ${filepath}`);
      }
      break;
    }

    case "compare": {
      const ticker = args[1];
      const strategyNames = args.slice(2).filter((a) => !a.startsWith("--"));

      if (!ticker) {
        console.log("Usage: Backtest.ts compare <ticker> <strategy1> <strategy2> ...");
        return;
      }

      const strategies = strategyNames.length > 0 ? strategyNames : ["buy_hold", "sma_crossover", "momentum"];
      await compareStrategies(ticker, strategies);
      break;
    }

    case "strategies":
    case "list":
      console.log("\nAvailable Strategies:");
      console.log("-".repeat(40));
      console.log("  sma_crossover  - SMA golden/death cross (20/50)");
      console.log("  rsi_reversion  - RSI mean reversion (30/70)");
      console.log("  momentum       - Trend following (20-day)");
      console.log("  breakout       - Buy new highs, sell new lows");
      console.log("  buy_hold       - Baseline buy and hold");
      break;

    case "help":
    case undefined:
      console.log(`
Backtest - Test trading strategies against historical data

Commands:
  run <ticker> [--strategy <name>] [--period <period>]
    Run a backtest on a single ticker

  compare <ticker> <strategy1> <strategy2> ...
    Compare multiple strategies on same ticker

  strategies
    List available strategies

  help
    Show this help

Strategies: sma_crossover, rsi_reversion, momentum, breakout, buy_hold

Examples:
  bun Backtest.ts run AAPL --strategy sma_crossover --period 5y
  bun Backtest.ts compare NVDA buy_hold momentum sma_crossover
  bun Backtest.ts strategies
`);
      break;

    default:
      console.log(`Unknown command: ${command}. Use 'help' for usage.`);
  }
}

main().catch(console.error);

// Export for testing
export {
  runBacktest,
  fetchHistoricalData,
  sma,
  ema,
  rsi,
  strategies,
  type BacktestResult,
  type Trade,
  type OHLCV,
};
