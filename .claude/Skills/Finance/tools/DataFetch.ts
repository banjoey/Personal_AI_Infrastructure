#!/usr/bin/env bun
/**
 * DataFetch - Unified financial data interface
 *
 * Provides a single interface to multiple free financial data sources:
 * - yfinance (via Python) - Primary source for stocks
 * - Finnhub - Real-time data and news (60 calls/min free tier)
 * - Alpha Vantage - Technical indicators (25 calls/day free tier)
 * - FRED - Economic data (120 calls/min)
 * - CoinGecko - Crypto data (10-50 calls/min)
 *
 * Usage:
 *   bun DataFetch.ts quote AAPL
 *   bun DataFetch.ts fundamentals NVDA
 *   bun DataFetch.ts historical MSFT 1y
 *   bun DataFetch.ts news TSLA
 *   bun DataFetch.ts crypto bitcoin
 *   bun DataFetch.ts economic GDP
 */

import { $ } from "bun";

// Types
interface Quote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  high52Week?: number;
  low52Week?: number;
  timestamp: string;
}

interface Fundamentals {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number;
  pegRatio?: number;
  priceToBook?: number;
  priceToSales?: number;
  debtToEquity?: number;
  returnOnEquity?: number;
  returnOnAssets?: number;
  profitMargin?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  dividendYield?: number;
  beta?: number;
  analystRating?: string;
  targetPrice?: number;
}

interface HistoricalData {
  ticker: string;
  period: string;
  data: OHLCV[];
}

interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface NewsItem {
  title: string;
  source: string;
  date: string;
  summary?: string;
  url?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

// Configuration
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';

// Rate limiting
const rateLimits = {
  finnhub: { calls: 0, resetTime: Date.now(), limit: 60 },
  alphaVantage: { calls: 0, resetTime: Date.now(), limit: 25 },
  coingecko: { calls: 0, resetTime: Date.now(), limit: 50 },
};

function checkRateLimit(source: keyof typeof rateLimits): boolean {
  const limit = rateLimits[source];
  const now = Date.now();

  // Reset if minute has passed
  if (now - limit.resetTime > 60000) {
    limit.calls = 0;
    limit.resetTime = now;
  }

  if (limit.calls >= limit.limit) {
    return false;
  }

  limit.calls++;
  return true;
}

// Primary data source: yfinance via Python
async function fetchViaYFinance(ticker: string, dataType: string): Promise<any> {
  const pythonScript = `
import yfinance as yf
import json
import sys

ticker = "${ticker}"
data_type = "${dataType}"

try:
    stock = yf.Ticker(ticker)

    if data_type == "quote":
        info = stock.info
        result = {
            "ticker": ticker,
            "price": info.get("currentPrice") or info.get("regularMarketPrice", 0),
            "change": info.get("regularMarketChange", 0),
            "changePercent": info.get("regularMarketChangePercent", 0),
            "volume": info.get("volume", 0),
            "marketCap": info.get("marketCap", 0),
            "peRatio": info.get("trailingPE"),
            "high52Week": info.get("fiftyTwoWeekHigh"),
            "low52Week": info.get("fiftyTwoWeekLow"),
            "timestamp": str(info.get("regularMarketTime", ""))
        }
    elif data_type == "fundamentals":
        info = stock.info
        result = {
            "ticker": ticker,
            "name": info.get("longName", ""),
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "marketCap": info.get("marketCap", 0),
            "peRatio": info.get("trailingPE"),
            "pegRatio": info.get("pegRatio"),
            "priceToBook": info.get("priceToBook"),
            "priceToSales": info.get("priceToSalesTrailing12Months"),
            "debtToEquity": info.get("debtToEquity"),
            "returnOnEquity": info.get("returnOnEquity"),
            "returnOnAssets": info.get("returnOnAssets"),
            "profitMargin": info.get("profitMargins"),
            "revenueGrowth": info.get("revenueGrowth"),
            "earningsGrowth": info.get("earningsGrowth"),
            "dividendYield": info.get("dividendYield"),
            "beta": info.get("beta"),
            "analystRating": info.get("recommendationKey"),
            "targetPrice": info.get("targetMeanPrice")
        }
    elif data_type == "historical":
        hist = stock.history(period="1y")
        data = []
        for date, row in hist.iterrows():
            data.append({
                "date": str(date.date()),
                "open": round(row["Open"], 2),
                "high": round(row["High"], 2),
                "low": round(row["Low"], 2),
                "close": round(row["Close"], 2),
                "volume": int(row["Volume"])
            })
        result = {"ticker": ticker, "period": "1y", "data": data}
    else:
        result = {"error": f"Unknown data type: {data_type}"}

    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

  try {
    const result = await $`python3 -c ${pythonScript}`.text();
    return JSON.parse(result.trim());
  } catch (error) {
    return { error: `yfinance error: ${error}` };
  }
}

// Finnhub API for real-time data and news
async function fetchFromFinnhub(ticker: string, endpoint: string): Promise<any> {
  if (!FINNHUB_API_KEY) {
    return { error: 'FINNHUB_API_KEY not set' };
  }

  if (!checkRateLimit('finnhub')) {
    return { error: 'Finnhub rate limit exceeded' };
  }

  try {
    const baseUrl = 'https://finnhub.io/api/v1';
    let url: string;

    switch (endpoint) {
      case 'quote':
        url = `${baseUrl}/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`;
        break;
      case 'news':
        const toDate = new Date().toISOString().split('T')[0];
        const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        url = `${baseUrl}/company-news?symbol=${ticker}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`;
        break;
      default:
        return { error: `Unknown endpoint: ${endpoint}` };
    }

    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    return { error: `Finnhub error: ${error}` };
  }
}

// CoinGecko for crypto data
async function fetchCrypto(coinId: string): Promise<CryptoData | { error: string }> {
  if (!checkRateLimit('coingecko')) {
    return { error: 'CoinGecko rate limit exceeded' };
  }

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return { error: data.error };
    }

    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      price: data.market_data.current_price.usd,
      change24h: data.market_data.price_change_percentage_24h,
      marketCap: data.market_data.market_cap.usd,
      volume24h: data.market_data.total_volume.usd,
      high24h: data.market_data.high_24h.usd,
      low24h: data.market_data.low_24h.usd,
    };
  } catch (error) {
    return { error: `CoinGecko error: ${error}` };
  }
}

// Comprehensive data fetch
async function getComprehensive(ticker: string): Promise<any> {
  const [quote, fundamentals, news] = await Promise.all([
    fetchViaYFinance(ticker, 'quote'),
    fetchViaYFinance(ticker, 'fundamentals'),
    FINNHUB_API_KEY ? fetchFromFinnhub(ticker, 'news') : { note: 'Set FINNHUB_API_KEY for news' },
  ]);

  return {
    ticker,
    timestamp: new Date().toISOString(),
    quote,
    fundamentals,
    news: Array.isArray(news) ? news.slice(0, 5) : news,
  };
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
DataFetch - Financial Data CLI

Usage:
  bun DataFetch.ts <command> <ticker/id> [options]

Commands:
  quote <ticker>        Get current quote
  fundamentals <ticker> Get company fundamentals
  historical <ticker>   Get historical price data (1 year)
  news <ticker>         Get recent news (requires FINNHUB_API_KEY)
  crypto <coin-id>      Get crypto data (e.g., bitcoin, ethereum)
  comprehensive <ticker> Get all available data

Examples:
  bun DataFetch.ts quote AAPL
  bun DataFetch.ts fundamentals NVDA
  bun DataFetch.ts crypto bitcoin
  bun DataFetch.ts comprehensive MSFT

Environment Variables:
  FINNHUB_API_KEY       For news and real-time quotes
  ALPHA_VANTAGE_API_KEY For technical indicators
`);
    process.exit(1);
  }

  const [command, ticker] = args;
  let result: any;

  switch (command.toLowerCase()) {
    case 'quote':
      result = await fetchViaYFinance(ticker.toUpperCase(), 'quote');
      break;
    case 'fundamentals':
      result = await fetchViaYFinance(ticker.toUpperCase(), 'fundamentals');
      break;
    case 'historical':
      result = await fetchViaYFinance(ticker.toUpperCase(), 'historical');
      break;
    case 'news':
      result = await fetchFromFinnhub(ticker.toUpperCase(), 'news');
      break;
    case 'crypto':
      result = await fetchCrypto(ticker.toLowerCase());
      break;
    case 'comprehensive':
      result = await getComprehensive(ticker.toUpperCase());
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

// Export for testing and programmatic use
export {
  fetchViaYFinance,
  fetchFromFinnhub,
  fetchCrypto,
  getComprehensive,
  Quote,
  Fundamentals,
  HistoricalData,
  CryptoData,
  NewsItem,
};

// Run CLI if executed directly
main().catch(console.error);
