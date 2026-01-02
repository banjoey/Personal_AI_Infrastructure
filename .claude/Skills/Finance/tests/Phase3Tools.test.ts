/**
 * Phase 3 Tools Test Suite
 *
 * Tests for Portfolio, DecisionJournal, Watchlist, and Backtest tools
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, unlinkSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

// Set test data directory
const TEST_DATA_DIR = join(import.meta.dir, "..", "test-data");
process.env.PAI_DIR = TEST_DATA_DIR;

// Import after setting PAI_DIR
import {
  loadPortfolio,
  savePortfolio,
  calculatePositionMetrics,
  getHoldingPeriod,
  type Portfolio,
  type Position,
} from "../tools/Portfolio";

import {
  loadJournal,
  saveJournal,
  createEntry,
  recordOutcome,
  type DecisionEntry,
} from "../tools/DecisionJournal";

import {
  loadWatchlist,
  saveWatchlist,
  addItem,
  removeItem,
  addAlert,
  type WatchlistItem,
} from "../tools/Watchlist";

import {
  sma,
  ema,
  rsi,
  strategies,
  type OHLCV,
} from "../tools/Backtest";

// Setup and teardown
beforeEach(() => {
  if (!existsSync(TEST_DATA_DIR)) {
    mkdirSync(TEST_DATA_DIR, { recursive: true });
  }
  if (!existsSync(join(TEST_DATA_DIR, "data"))) {
    mkdirSync(join(TEST_DATA_DIR, "data"), { recursive: true });
  }
});

afterEach(() => {
  // Clean up test files
  const files = [
    join(TEST_DATA_DIR, "data", "portfolio.json"),
    join(TEST_DATA_DIR, "data", "decision-journal.json"),
    join(TEST_DATA_DIR, "data", "watchlist.json"),
  ];
  for (const file of files) {
    if (existsSync(file)) {
      unlinkSync(file);
    }
  }
});

// ============================================================
// Portfolio Tests
// ============================================================
describe("Portfolio Tool", () => {
  test("creates empty portfolio when no file exists", () => {
    const portfolio = loadPortfolio();
    expect(portfolio).toBeDefined();
    expect(portfolio.positions).toEqual([]);
    expect(portfolio.transactions).toEqual([]);
    expect(portfolio.cashBalance).toBe(0);
  });

  test("saves and loads portfolio", () => {
    const portfolio: Portfolio = {
      name: "Test Portfolio",
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      positions: [],
      transactions: [],
      cashBalance: 10000,
    };

    savePortfolio(portfolio);
    const loaded = loadPortfolio();

    expect(loaded.name).toBe("Test Portfolio");
    expect(loaded.cashBalance).toBe(10000);
  });

  test("calculates position metrics correctly", () => {
    const position: Position = {
      ticker: "AAPL",
      lots: [
        { id: "1", shares: 50, costBasis: 100, purchaseDate: "2024-01-01" },
        { id: "2", shares: 50, costBasis: 120, purchaseDate: "2024-06-01" },
      ],
      assetClass: "stock",
    };

    const currentPrice = 150;
    const metrics = calculatePositionMetrics(position, currentPrice);

    expect(metrics.totalShares).toBe(100);
    expect(metrics.totalCost).toBe(11000); // 50*100 + 50*120
    expect(metrics.avgCostBasis).toBe(110);
    expect(metrics.marketValue).toBe(15000); // 100 * 150
    expect(metrics.unrealizedGain).toBe(4000);
  });

  test("determines holding period correctly", () => {
    const today = new Date();

    // Short term (less than 1 year ago)
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    expect(getHoldingPeriod(sixMonthsAgo.toISOString())).toBe("short");

    // Long term (more than 1 year ago)
    const twoYearsAgo = new Date(today);
    twoYearsAgo.setFullYear(today.getFullYear() - 2);
    expect(getHoldingPeriod(twoYearsAgo.toISOString())).toBe("long");
  });
});

// ============================================================
// Decision Journal Tests
// ============================================================
describe("DecisionJournal Tool", () => {
  test("creates empty journal when no file exists", () => {
    const journal = loadJournal();
    expect(journal).toBeDefined();
    expect(journal.entries).toEqual([]);
    expect(journal.defaultChecklist.length).toBeGreaterThan(0);
  });

  test("creates new entry with defaults", () => {
    const entry = createEntry("AAPL", "buy", {
      thesis: "Strong iPhone demand",
      convictionLevel: 4,
    });

    expect(entry.ticker).toBe("AAPL");
    expect(entry.action).toBe("buy");
    expect(entry.thesis).toBe("Strong iPhone demand");
    expect(entry.convictionLevel).toBe(4);
    expect(entry.checklist.length).toBeGreaterThan(0);
    expect(entry.id).toBeDefined();
  });

  test("records outcome for entry", () => {
    const entry = createEntry("NVDA", "buy", { thesis: "AI growth" });

    recordOutcome(entry.id, "win", 25.5, "Thesis played out perfectly");

    const journal = loadJournal();
    const updated = journal.entries.find((e) => e.id === entry.id);

    expect(updated?.outcome).toBeDefined();
    expect(updated?.outcome?.result).toBe("win");
    expect(updated?.outcome?.actualReturn).toBe(25.5);
    expect(updated?.outcome?.lessonsLearned).toBe("Thesis played out perfectly");
  });

  test("validates entry actions", () => {
    const validActions = ["buy", "sell", "hold", "avoid", "watchlist"];

    for (const action of validActions) {
      const entry = createEntry("TEST", action as DecisionEntry["action"]);
      expect(entry.action).toBe(action);
    }
  });
});

// ============================================================
// Watchlist Tests
// ============================================================
describe("Watchlist Tool", () => {
  test("creates empty watchlist when no file exists", () => {
    const watchlist = loadWatchlist();
    expect(watchlist).toBeDefined();
    expect(watchlist.items).toEqual([]);
    expect(watchlist.categories.length).toBeGreaterThan(0);
  });

  test("adds item to watchlist", () => {
    addItem("AAPL", "tech", { thesis: "Waiting for pullback" });

    const watchlist = loadWatchlist();
    expect(watchlist.items.length).toBe(1);
    expect(watchlist.items[0].ticker).toBe("AAPL");
    expect(watchlist.items[0].category).toBe("tech");
    expect(watchlist.items[0].thesis).toBe("Waiting for pullback");
  });

  test("removes item from watchlist", () => {
    addItem("AAPL", "tech");
    addItem("NVDA", "tech");

    removeItem("AAPL");

    const watchlist = loadWatchlist();
    expect(watchlist.items.length).toBe(1);
    expect(watchlist.items[0].ticker).toBe("NVDA");
  });

  test("adds alert to item", () => {
    addItem("AAPL", "tech");
    addAlert("AAPL", "below", 150, "Buy zone");

    const watchlist = loadWatchlist();
    const item = watchlist.items.find((i) => i.ticker === "AAPL");

    expect(item?.alerts.length).toBe(1);
    expect(item?.alerts[0].type).toBe("below");
    expect(item?.alerts[0].threshold).toBe(150);
    expect(item?.alerts[0].message).toBe("Buy zone");
  });

  test("handles multiple categories", () => {
    addItem("AAPL", "tech");
    addItem("O", "reit");
    addItem("BTC-USD", "crypto");

    const watchlist = loadWatchlist();

    const techItems = watchlist.items.filter((i) => i.category === "tech");
    const reitItems = watchlist.items.filter((i) => i.category === "reit");
    const cryptoItems = watchlist.items.filter((i) => i.category === "crypto");

    expect(techItems.length).toBe(1);
    expect(reitItems.length).toBe(1);
    expect(cryptoItems.length).toBe(1);
  });
});

// ============================================================
// Backtest Tests
// ============================================================
describe("Backtest Tool - Technical Indicators", () => {
  const testData = [10, 11, 12, 11, 13, 14, 13, 15, 16, 14, 15, 17, 18, 17, 19, 20];

  test("calculates SMA correctly", () => {
    const result = sma(testData, 5);

    // First 4 values should be NaN
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[3])).toBe(true);

    // 5th value should be average of first 5
    expect(result[4]).toBeCloseTo((10 + 11 + 12 + 11 + 13) / 5, 2);
  });

  test("calculates EMA correctly", () => {
    const result = ema(testData, 5);

    // All values should be defined
    expect(result.length).toBe(testData.length);
    expect(isNaN(result[0])).toBe(false);

    // EMA should be more responsive to recent prices
    // Last EMA should be closer to recent values
    expect(result[result.length - 1]).toBeGreaterThan(15);
  });

  test("calculates RSI correctly", () => {
    const result = rsi(testData, 5);

    // All values should be between 0 and 100
    for (const value of result) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  test("RSI shows overbought in uptrend", () => {
    // Strong uptrend
    const uptrend = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const result = rsi(uptrend, 5);

    // RSI should be high (above 50) in uptrend
    const lastRsi = result[result.length - 1];
    expect(lastRsi).toBeGreaterThan(50);
  });
});

describe("Backtest Tool - Strategies", () => {
  // Create mock OHLCV data
  const createMockData = (closes: number[]): OHLCV[] => {
    return closes.map((close, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, "0")}`,
      open: close - 0.5,
      high: close + 1,
      low: close - 1,
      close,
      volume: 1000000,
    }));
  };

  test("buy_hold strategy enters on first bar", () => {
    const data = createMockData([100, 101, 102, 103, 104]);
    const signal = strategies.buy_hold(data, 0, "flat", {});

    expect(signal.action).toBe("buy");
    expect(signal.strength).toBe(1);
  });

  test("buy_hold strategy holds after entry", () => {
    const data = createMockData([100, 101, 102, 103, 104]);
    const signal = strategies.buy_hold(data, 2, "long", {});

    expect(signal.action).toBe("hold");
  });

  test("momentum strategy signals buy on positive momentum", () => {
    // Create data with strong upward momentum
    const prices = [];
    for (let i = 0; i < 30; i++) {
      prices.push(100 + i * 2); // Strong uptrend
    }
    const data = createMockData(prices);

    const signal = strategies.momentum(data, 25, "flat", { lookback: 20, threshold: 0.05 });

    expect(signal.action).toBe("buy");
  });

  test("sma_crossover waits for enough data", () => {
    const data = createMockData([100, 101, 102, 103, 104]);
    const signal = strategies.sma_crossover(data, 4, "flat", { short: 20, long: 50 });

    expect(signal.action).toBe("hold");
  });

  test("strategies object contains all expected strategies", () => {
    const expectedStrategies = [
      "sma_crossover",
      "rsi_reversion",
      "momentum",
      "buy_hold",
      "breakout",
    ];

    for (const strategyName of expectedStrategies) {
      expect(strategies[strategyName]).toBeDefined();
      expect(typeof strategies[strategyName]).toBe("function");
    }
  });
});

// ============================================================
// Integration Tests
// ============================================================
describe("Tool Integration", () => {
  test("portfolio and journal can track same trades", () => {
    // This tests that you can log a trade in the journal
    // and record it in the portfolio

    // Journal entry
    const entry = createEntry("AAPL", "buy", {
      thesis: "Strong fundamentals",
      convictionLevel: 4,
    });

    expect(entry).toBeDefined();

    // Portfolio would have corresponding position
    // (In practice, these would be linked)
    const portfolio = loadPortfolio();
    expect(portfolio).toBeDefined();
  });

  test("watchlist items can become journal entries", () => {
    // Add to watchlist
    addItem("NVDA", "tech", { thesis: "Waiting for entry" });

    const watchlist = loadWatchlist();
    const watchedItem = watchlist.items.find((i) => i.ticker === "NVDA");

    // Later, when buying, create journal entry
    const entry = createEntry("NVDA", "buy", {
      thesis: watchedItem?.thesis || "No thesis",
      tags: ["from-watchlist"],
    });

    expect(entry.thesis).toBe("Waiting for entry");
  });
});

console.log("Phase 3 tools test suite loaded successfully");
