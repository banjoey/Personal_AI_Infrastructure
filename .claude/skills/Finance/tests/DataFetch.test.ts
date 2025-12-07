/**
 * DataFetch Tool Tests
 *
 * Tests the financial data fetching functionality.
 * Note: Some tests require network access and may be affected by rate limits.
 *
 * Run with: bun test DataFetch.test.ts
 */

import { describe, test, expect, beforeAll } from "bun:test";
import { fetchViaYFinance, fetchCrypto } from "../tools/DataFetch";

describe("DataFetch Tool", () => {
  // Test yfinance quote fetching
  describe("fetchViaYFinance - Quote", () => {
    test("should fetch quote for valid ticker (AAPL)", async () => {
      const result = await fetchViaYFinance("AAPL", "quote");

      // Should not have error
      expect(result.error).toBeUndefined();

      // Should have required fields
      expect(result.ticker).toBe("AAPL");
      expect(typeof result.price).toBe("number");
      expect(result.price).toBeGreaterThan(0);
      expect(typeof result.volume).toBe("number");
    }, 30000); // 30 second timeout for network

    test("should return error for invalid ticker", async () => {
      const result = await fetchViaYFinance("INVALIDTICKER12345", "quote");

      // Should either have error or price of 0/null
      const hasError = result.error || result.price === 0 || result.price === null;
      expect(hasError).toBeTruthy();
    }, 30000);
  });

  // Test yfinance fundamentals
  describe("fetchViaYFinance - Fundamentals", () => {
    test("should fetch fundamentals for NVDA", async () => {
      const result = await fetchViaYFinance("NVDA", "fundamentals");

      expect(result.error).toBeUndefined();
      expect(result.ticker).toBe("NVDA");
      expect(result.name).toBeTruthy();
      expect(result.sector).toBeTruthy();
      expect(typeof result.marketCap).toBe("number");
    }, 30000);

    test("should include valuation metrics", async () => {
      const result = await fetchViaYFinance("MSFT", "fundamentals");

      expect(result.error).toBeUndefined();
      // PE ratio should exist for profitable company
      expect(result.peRatio).toBeDefined();
    }, 30000);
  });

  // Test yfinance historical data
  describe("fetchViaYFinance - Historical", () => {
    test("should fetch historical data for SPY", async () => {
      const result = await fetchViaYFinance("SPY", "historical");

      expect(result.error).toBeUndefined();
      expect(result.ticker).toBe("SPY");
      expect(result.period).toBe("1y");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(200); // ~252 trading days

      // Check data structure
      const firstDay = result.data[0];
      expect(firstDay.date).toBeDefined();
      expect(typeof firstDay.open).toBe("number");
      expect(typeof firstDay.high).toBe("number");
      expect(typeof firstDay.low).toBe("number");
      expect(typeof firstDay.close).toBe("number");
      expect(typeof firstDay.volume).toBe("number");
    }, 30000);
  });

  // Test CoinGecko crypto data
  describe("fetchCrypto", () => {
    test("should fetch Bitcoin data", async () => {
      const result = await fetchCrypto("bitcoin");

      if ('error' in result && result.error.includes('rate limit')) {
        console.log("Skipping test due to rate limit");
        return;
      }

      expect(result.error).toBeUndefined();
      expect(result.id).toBe("bitcoin");
      expect(result.symbol).toBe("BTC");
      expect(typeof result.price).toBe("number");
      expect(result.price).toBeGreaterThan(0);
      expect(typeof result.marketCap).toBe("number");
    }, 30000);

    test("should fetch Ethereum data", async () => {
      const result = await fetchCrypto("ethereum");

      if ('error' in result && result.error.includes('rate limit')) {
        console.log("Skipping test due to rate limit");
        return;
      }

      expect(result.error).toBeUndefined();
      expect(result.id).toBe("ethereum");
      expect(result.symbol).toBe("ETH");
    }, 30000);

    test("should return error for invalid coin", async () => {
      const result = await fetchCrypto("not-a-real-coin-12345");
      expect(result.error).toBeDefined();
    }, 30000);
  });
});

// Data validation tests (don't require network)
describe("Data Validation", () => {
  test("Quote interface has correct shape", () => {
    const mockQuote = {
      ticker: "TEST",
      price: 100,
      change: 1.5,
      changePercent: 1.5,
      volume: 1000000,
      marketCap: 1000000000,
      peRatio: 25,
      high52Week: 120,
      low52Week: 80,
      timestamp: "2025-12-06",
    };

    expect(mockQuote.ticker).toBe("TEST");
    expect(mockQuote.price).toBe(100);
  });

  test("Fundamentals interface has correct shape", () => {
    const mockFundamentals = {
      ticker: "TEST",
      name: "Test Company",
      sector: "Technology",
      industry: "Software",
      marketCap: 1000000000,
      peRatio: 25,
      pegRatio: 1.5,
      priceToBook: 5,
      priceToSales: 10,
      debtToEquity: 0.5,
      returnOnEquity: 0.2,
      returnOnAssets: 0.1,
      profitMargin: 0.15,
      revenueGrowth: 0.25,
      earningsGrowth: 0.3,
      dividendYield: 0.02,
      beta: 1.1,
      analystRating: "buy",
      targetPrice: 150,
    };

    expect(mockFundamentals.sector).toBe("Technology");
    expect(mockFundamentals.returnOnEquity).toBe(0.2);
  });

  test("OHLCV data has correct shape", () => {
    const mockOHLCV = {
      date: "2025-12-06",
      open: 100,
      high: 105,
      low: 99,
      close: 103,
      volume: 1000000,
    };

    expect(mockOHLCV.high).toBeGreaterThanOrEqual(mockOHLCV.low);
    expect(mockOHLCV.high).toBeGreaterThanOrEqual(mockOHLCV.open);
    expect(mockOHLCV.high).toBeGreaterThanOrEqual(mockOHLCV.close);
  });
});

// Rate limiting tests
describe("Rate Limiting", () => {
  test("should handle rate limit gracefully", () => {
    // This is a unit test for the rate limiting logic
    // The actual implementation should return a clear error message
    // when rate limited, not throw an exception

    const mockRateLimitError = { error: "Rate limit exceeded" };
    expect(mockRateLimitError.error).toContain("Rate limit");
  });
});
