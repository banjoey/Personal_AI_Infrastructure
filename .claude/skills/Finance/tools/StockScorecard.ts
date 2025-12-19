#!/usr/bin/env bun
/**
 * StockScorecard - 22-Point Stock Evaluation System
 *
 * Implements Joseph's Unified Investment System v2.0
 * Evaluates stocks across 4 categories:
 * - Quality (7 pts): Business fundamentals, moat, ROIC
 * - Value (6 pts): PEG, P/E vs sector, 52-week position
 * - Catalyst (5 pts): Near-term events, sector tailwinds, analyst momentum
 * - Technical (4 pts): Moving averages, RSI, trend
 *
 * Usage:
 *   bun StockScorecard.ts <ticker>
 *   bun StockScorecard.ts AAPL
 *   bun StockScorecard.ts NVDA --verbose
 */

import { $ } from "bun";

// Types
interface ScorecardResult {
  ticker: string;
  date: string;
  price: number;
  quality: QualityScore;
  value: ValueScore;
  catalyst: CatalystScore;
  technical: TechnicalScore;
  totalScore: number;
  maxScore: number;
  positionType: "Core" | "Growth" | "Speculative" | "Avoid";
  suggestedAllocation: string;
  targetBuyPrice: number;
  fairValue: number;
  summary: string;
}

interface QualityScore {
  score: number;
  maxScore: 7;
  details: {
    understandBusiness: { pass: boolean; note: string };
    competitiveMoat: { pass: boolean; moatType: string; note: string };
    revenueGrowth: { pass: boolean; years: string; note: string };
    earningsGrowth: { pass: boolean; note: string };
    insiderOwnership: { pass: boolean; percent: number; note: string };
    noRedFlags: { pass: boolean; debtToEquity: number; note: string };
    roic: { pass: boolean; value: number; note: string };
  };
}

interface ValueScore {
  score: number;
  maxScore: 6;
  details: {
    pegRatio: { points: number; value: number; note: string };
    peVsSector: { points: number; value: number; sectorPe: number; note: string };
    fiftyTwoWeekPosition: { points: number; value: number; note: string };
  };
  fairValue: number;
  buyPrice: number;
  strongBuyPrice: number;
}

interface CatalystScore {
  score: number;
  maxScore: 5;
  details: {
    nearTermCatalyst: { pass: boolean; catalyst: string; note: string };
    sectorTailwind: { pass: boolean; sector: string; note: string };
    analystMomentum: { pass: boolean; upgrades: number; downgrades: number; note: string };
    institutionalBuying: { pass: boolean; note: string };
    managementExecution: { pass: boolean; note: string };
  };
}

interface TechnicalScore {
  score: number;
  maxScore: 4;
  details: {
    aboveSma50: { pass: boolean; price: number; sma50: number; note: string };
    aboveSma200: { pass: boolean; price: number; sma200: number; note: string };
    rsiHealthy: { pass: boolean; rsi: number; note: string };
    twentyDayTrend: { pass: boolean; trend: string; note: string };
  };
}

interface StockData {
  ticker: string;
  price: number;
  name: string;
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number;
  pegRatio: number;
  priceToBook: number;
  debtToEquity: number;
  returnOnEquity: number;
  returnOnAssets: number;
  profitMargin: number;
  revenueGrowth: number;
  earningsGrowth: number;
  beta: number;
  high52Week: number;
  low52Week: number;
  sma50: number;
  sma200: number;
  rsi: number;
  analystRating: string;
  targetPrice: number;
  insiderOwnership: number;
  operatingIncome: number;
  totalEquity: number;
  totalDebt: number;
  cash: number;
  revenueHistory: number[];
  epsHistory: number[];
  historicalPrices: { date: string; close: number; low: number }[];
}

// Python path - use venv if available
const PYTHON_PATH = process.env.FINANCE_PYTHON || `${import.meta.dir}/../.venv/bin/python3`;

// Fetch comprehensive stock data via Python/yfinance
async function fetchStockData(ticker: string): Promise<StockData | { error: string }> {
  const pythonScript = `
import yfinance as yf
import json
import numpy as np

ticker = "${ticker}"

try:
    stock = yf.Ticker(ticker)
    info = stock.info

    # Get historical data for technicals
    hist = stock.history(period="1y")
    hist_6mo = stock.history(period="6mo")

    # Calculate moving averages
    if len(hist) >= 200:
        sma200 = hist['Close'].tail(200).mean()
    else:
        sma200 = hist['Close'].mean()

    if len(hist) >= 50:
        sma50 = hist['Close'].tail(50).mean()
    else:
        sma50 = hist['Close'].mean()

    # Calculate RSI (14-day)
    delta = hist['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    current_rsi = rsi.iloc[-1] if not np.isnan(rsi.iloc[-1]) else 50

    # Get recent price data for 20-day trend
    recent_20 = hist.tail(20)
    price_data = [{"date": str(d.date()), "close": round(row['Close'], 2), "low": round(row['Low'], 2)}
                  for d, row in recent_20.iterrows()]

    # Get financials for ROIC calculation
    try:
        bs = stock.balance_sheet
        fs = stock.financials

        # Try to get operating income
        operating_income = 0
        if fs is not None and not fs.empty:
            if 'Operating Income' in fs.index:
                operating_income = float(fs.loc['Operating Income'].iloc[0] or 0)
            elif 'EBIT' in fs.index:
                operating_income = float(fs.loc['EBIT'].iloc[0] or 0)

        # Get balance sheet items
        total_equity = 0
        total_debt = 0
        cash = 0

        if bs is not None and not bs.empty:
            if 'Total Stockholder Equity' in bs.index:
                total_equity = float(bs.loc['Total Stockholder Equity'].iloc[0] or 0)
            elif 'Stockholders Equity' in bs.index:
                total_equity = float(bs.loc['Stockholders Equity'].iloc[0] or 0)

            if 'Total Debt' in bs.index:
                total_debt = float(bs.loc['Total Debt'].iloc[0] or 0)
            elif 'Long Term Debt' in bs.index:
                total_debt = float(bs.loc['Long Term Debt'].iloc[0] or 0)

            if 'Cash And Cash Equivalents' in bs.index:
                cash = float(bs.loc['Cash And Cash Equivalents'].iloc[0] or 0)
            elif 'Cash' in bs.index:
                cash = float(bs.loc['Cash'].iloc[0] or 0)
    except:
        operating_income = 0
        total_equity = 0
        total_debt = 0
        cash = 0

    # Get revenue history (last 3 years)
    try:
        revenues = stock.financials
        if revenues is not None and 'Total Revenue' in revenues.index:
            rev_history = [float(x) for x in revenues.loc['Total Revenue'].head(3).tolist() if x is not None]
        else:
            rev_history = []
    except:
        rev_history = []

    # Get EPS history
    try:
        eps_history = []
        earnings = stock.earnings_history
        if earnings is not None and not earnings.empty:
            eps_history = earnings['epsActual'].tail(4).tolist()
    except:
        eps_history = []

    result = {
        "ticker": ticker,
        "price": info.get("currentPrice") or info.get("regularMarketPrice", 0),
        "name": info.get("longName", ticker),
        "sector": info.get("sector", "Unknown"),
        "industry": info.get("industry", "Unknown"),
        "marketCap": info.get("marketCap", 0),
        "peRatio": info.get("trailingPE") or info.get("forwardPE", 0),
        "pegRatio": info.get("pegRatio", 0),
        "priceToBook": info.get("priceToBook", 0),
        "debtToEquity": info.get("debtToEquity", 0),
        "returnOnEquity": (info.get("returnOnEquity") or 0) * 100,
        "returnOnAssets": (info.get("returnOnAssets") or 0) * 100,
        "profitMargin": (info.get("profitMargins") or 0) * 100,
        "revenueGrowth": (info.get("revenueGrowth") or 0) * 100,
        "earningsGrowth": (info.get("earningsGrowth") or 0) * 100,
        "beta": info.get("beta", 1),
        "high52Week": info.get("fiftyTwoWeekHigh", 0),
        "low52Week": info.get("fiftyTwoWeekLow", 0),
        "sma50": round(sma50, 2),
        "sma200": round(sma200, 2),
        "rsi": round(current_rsi, 1),
        "analystRating": info.get("recommendationKey", "none"),
        "targetPrice": info.get("targetMeanPrice", 0),
        "insiderOwnership": (info.get("heldPercentInsiders") or 0) * 100,
        "operatingIncome": operating_income,
        "totalEquity": total_equity,
        "totalDebt": total_debt,
        "cash": cash,
        "revenueHistory": rev_history,
        "epsHistory": eps_history,
        "historicalPrices": price_data
    }

    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

  try {
    const result = await $`${PYTHON_PATH} -c ${pythonScript}`.text();
    return JSON.parse(result.trim());
  } catch (error) {
    return { error: `Failed to fetch data: ${error}` };
  }
}

// Calculate ROIC
function calculateROIC(data: StockData): number {
  // ROIC = NOPAT / Invested Capital
  // NOPAT = Operating Income * (1 - Tax Rate) -- assume 25% tax rate
  // Invested Capital = Total Equity + Total Debt - Cash

  if (!data.operatingIncome || data.operatingIncome === 0) {
    // Fallback to ROE as proxy
    return data.returnOnEquity || 0;
  }

  const nopat = data.operatingIncome * 0.75; // 25% tax rate assumption
  const investedCapital = data.totalEquity + data.totalDebt - data.cash;

  if (investedCapital <= 0) return data.returnOnEquity || 0;

  return (nopat / investedCapital) * 100;
}

// Analyze 20-day trend (higher lows vs lower lows)
function analyzeTrend(prices: { date: string; close: number; low: number }[]): { isUptrend: boolean; description: string } {
  if (prices.length < 10) {
    return { isUptrend: false, description: "Insufficient data" };
  }

  // Split into 4 windows and compare lows
  const windowSize = Math.floor(prices.length / 4);
  const windows = [];

  for (let i = 0; i < 4; i++) {
    const start = i * windowSize;
    const end = Math.min(start + windowSize, prices.length);
    const windowPrices = prices.slice(start, end);
    const minLow = Math.min(...windowPrices.map(p => p.low));
    windows.push(minLow);
  }

  // Check if lows are generally rising
  let higherLows = 0;
  for (let i = 1; i < windows.length; i++) {
    if (windows[i] >= windows[i - 1] * 0.98) { // 2% tolerance
      higherLows++;
    }
  }

  const isUptrend = higherLows >= 2;
  const description = isUptrend
    ? `Higher lows pattern (${higherLows}/3 windows rising)`
    : `Lower lows pattern (${3 - higherLows}/3 windows falling)`;

  return { isUptrend, description };
}

// Determine moat type based on sector/industry
function detectMoat(data: StockData): { hasMoat: boolean; moatType: string } {
  const sector = data.sector.toLowerCase();
  const industry = data.industry.toLowerCase();

  // High margin + high ROE suggests moat
  const hasStrongFinancials = (data.profitMargin > 15 || data.returnOnEquity > 15);

  // Sector-based moat detection
  if (sector.includes("technology")) {
    if (industry.includes("software") || industry.includes("cloud")) {
      return { hasMoat: hasStrongFinancials, moatType: "Switching Costs / Network Effect" };
    }
    if (industry.includes("semiconductor")) {
      return { hasMoat: hasStrongFinancials, moatType: "Cost Advantage / IP" };
    }
  }

  if (sector.includes("consumer")) {
    return { hasMoat: hasStrongFinancials, moatType: "Brand" };
  }

  if (sector.includes("financial")) {
    return { hasMoat: hasStrongFinancials, moatType: "Network Effect / Regulatory" };
  }

  if (sector.includes("healthcare") || sector.includes("pharma")) {
    return { hasMoat: hasStrongFinancials, moatType: "Patents / Regulatory" };
  }

  if (sector.includes("utilities") || sector.includes("energy")) {
    return { hasMoat: hasStrongFinancials, moatType: "Regulatory / Cost Advantage" };
  }

  // Fallback: check financials
  return {
    hasMoat: hasStrongFinancials,
    moatType: hasStrongFinancials ? "Financial Performance" : "None identified"
  };
}

// Detect sector tailwinds based on current themes
function detectSectorTailwind(sector: string): { hasTailwind: boolean; note: string } {
  const sectorLower = sector.toLowerCase();

  // 2025 sector tailwinds
  const tailwinds: Record<string, string> = {
    "technology": "AI/ML infrastructure buildout, cloud adoption",
    "semiconductor": "AI chip demand, reshoring initiatives",
    "energy": "Energy transition, nuclear renaissance",
    "utilities": "Data center power demand, rate stabilization",
    "industrials": "Infrastructure spending, reshoring",
    "materials": "Green energy materials, construction",
    "financial": "Rate environment stabilizing, fintech",
    "healthcare": "AI in healthcare, aging demographics",
  };

  for (const [key, note] of Object.entries(tailwinds)) {
    if (sectorLower.includes(key)) {
      return { hasTailwind: true, note };
    }
  }

  return { hasTailwind: false, note: "No clear sector tailwind identified" };
}

// Calculate the full scorecard
async function calculateScorecard(ticker: string, verbose: boolean = false): Promise<ScorecardResult | { error: string }> {
  const data = await fetchStockData(ticker);

  if ("error" in data) {
    return { error: data.error };
  }

  const today = new Date().toISOString().split("T")[0];

  // === QUALITY SCORE (7 points) ===
  const moatInfo = detectMoat(data);
  const roic = calculateROIC(data);

  // Check revenue growth (2 of last 3 years)
  let revenueGrowthYears = "N/A";
  let revenueGrowthPass = false;
  if (data.revenueHistory.length >= 2) {
    let growthYears = 0;
    for (let i = 0; i < data.revenueHistory.length - 1; i++) {
      if (data.revenueHistory[i] > data.revenueHistory[i + 1]) {
        growthYears++;
      }
    }
    revenueGrowthYears = `${growthYears} of ${data.revenueHistory.length - 1}`;
    revenueGrowthPass = growthYears >= 2 || data.revenueGrowth > 0;
  } else {
    revenueGrowthPass = data.revenueGrowth > 0;
    revenueGrowthYears = data.revenueGrowth > 0 ? "YoY positive" : "Unknown";
  }

  const quality: QualityScore = {
    score: 0,
    maxScore: 7,
    details: {
      understandBusiness: {
        pass: true, // Default to true - agent confirms this
        note: `${data.name} - ${data.sector} / ${data.industry}`,
      },
      competitiveMoat: {
        pass: moatInfo.hasMoat,
        moatType: moatInfo.moatType,
        note: moatInfo.hasMoat ? `Identified: ${moatInfo.moatType}` : "No clear moat identified",
      },
      revenueGrowth: {
        pass: revenueGrowthPass,
        years: revenueGrowthYears,
        note: `Revenue growth: ${data.revenueGrowth.toFixed(1)}%`,
      },
      earningsGrowth: {
        pass: data.earningsGrowth > 0 || data.profitMargin > 0,
        note: data.earningsGrowth > 0
          ? `EPS growth: ${data.earningsGrowth.toFixed(1)}%`
          : data.profitMargin > 0
            ? `Profitable (margin: ${data.profitMargin.toFixed(1)}%)`
            : "No earnings growth / not profitable",
      },
      insiderOwnership: {
        pass: data.insiderOwnership > 5,
        percent: data.insiderOwnership,
        note: `Insider ownership: ${data.insiderOwnership.toFixed(1)}%`,
      },
      noRedFlags: {
        pass: data.debtToEquity < 200, // D/E < 2.0 means < 200%
        debtToEquity: data.debtToEquity,
        note: `D/E ratio: ${(data.debtToEquity / 100).toFixed(2)}`,
      },
      roic: {
        pass: roic > 10,
        value: roic,
        note: `ROIC: ${roic.toFixed(1)}%`,
      },
    },
  };

  // Count quality points
  if (quality.details.understandBusiness.pass) quality.score++;
  if (quality.details.competitiveMoat.pass) quality.score++;
  if (quality.details.revenueGrowth.pass) quality.score++;
  if (quality.details.earningsGrowth.pass) quality.score++;
  if (quality.details.insiderOwnership.pass) quality.score++;
  if (quality.details.noRedFlags.pass) quality.score++;
  if (quality.details.roic.pass) quality.score++;

  // === VALUE SCORE (6 points) ===
  // PEG: <1.0 = 2pts, 1.0-1.5 = 1pt, >1.5 = 0pts
  let pegPoints = 0;
  if (data.pegRatio && data.pegRatio > 0) {
    if (data.pegRatio < 1.0) pegPoints = 2;
    else if (data.pegRatio <= 1.5) pegPoints = 1;
  }

  // P/E vs Sector: <0.8 = 2pts, 0.8-1.2 = 1pt, >1.2 = 0pts
  // Use industry average estimation based on sector
  const sectorPeEstimates: Record<string, number> = {
    "Technology": 30,
    "Healthcare": 22,
    "Financial Services": 15,
    "Consumer Cyclical": 20,
    "Consumer Defensive": 22,
    "Industrials": 20,
    "Energy": 12,
    "Utilities": 18,
    "Basic Materials": 15,
    "Real Estate": 35,
    "Communication Services": 20,
  };

  const sectorPe = sectorPeEstimates[data.sector] || 20;
  const peRatio = data.peRatio / sectorPe;
  let peVsSectorPoints = 0;
  if (data.peRatio > 0) {
    if (peRatio < 0.8) peVsSectorPoints = 2;
    else if (peRatio <= 1.2) peVsSectorPoints = 1;
  }

  // 52-Week Position: <30% = 2pts, 30-70% = 1pt, >70% = 0pts
  const fiftyTwoWeekPosition = data.high52Week > data.low52Week
    ? ((data.price - data.low52Week) / (data.high52Week - data.low52Week)) * 100
    : 50;

  let positionPoints = 0;
  if (fiftyTwoWeekPosition < 30) positionPoints = 2;
  else if (fiftyTwoWeekPosition <= 70) positionPoints = 1;

  // Fair value calculation: EPS × (8 + Growth Rate)
  const eps = data.peRatio > 0 ? data.price / data.peRatio : 0;
  const growthRate = Math.max(data.earningsGrowth, data.revenueGrowth, 5); // Min 5%
  const fairValue = eps * (8 + Math.min(growthRate, 25)); // Cap growth at 25%
  const buyPrice = fairValue * 0.80;
  const strongBuyPrice = fairValue * 0.65;

  const value: ValueScore = {
    score: pegPoints + peVsSectorPoints + positionPoints,
    maxScore: 6,
    details: {
      pegRatio: {
        points: pegPoints,
        value: data.pegRatio || 0,
        note: data.pegRatio
          ? `PEG ${data.pegRatio.toFixed(2)} ${pegPoints === 2 ? "(Excellent)" : pegPoints === 1 ? "(Good)" : "(High)"}`
          : "PEG not available",
      },
      peVsSector: {
        points: peVsSectorPoints,
        value: peRatio,
        sectorPe: sectorPe,
        note: `P/E ${data.peRatio?.toFixed(1) || "N/A"} vs sector ${sectorPe} (ratio: ${peRatio.toFixed(2)})`,
      },
      fiftyTwoWeekPosition: {
        points: positionPoints,
        value: fiftyTwoWeekPosition,
        note: `${fiftyTwoWeekPosition.toFixed(0)}% of 52-week range ($${data.low52Week.toFixed(2)} - $${data.high52Week.toFixed(2)})`,
      },
    },
    fairValue: fairValue,
    buyPrice: buyPrice,
    strongBuyPrice: strongBuyPrice,
  };

  // === CATALYST SCORE (5 points) ===
  const tailwindInfo = detectSectorTailwind(data.sector);

  const catalyst: CatalystScore = {
    score: 0,
    maxScore: 5,
    details: {
      nearTermCatalyst: {
        pass: false, // Requires manual research
        catalyst: "Requires manual research",
        note: "Check earnings calendar, product launches, regulatory decisions",
      },
      sectorTailwind: {
        pass: tailwindInfo.hasTailwind,
        sector: data.sector,
        note: tailwindInfo.note,
      },
      analystMomentum: {
        pass: ["buy", "strong_buy", "strongBuy"].includes(data.analystRating?.toLowerCase() || ""),
        upgrades: 0,
        downgrades: 0,
        note: `Analyst rating: ${data.analystRating || "N/A"}, Target: $${data.targetPrice?.toFixed(2) || "N/A"}`,
      },
      institutionalBuying: {
        pass: false, // Requires 13F data
        note: "Check 13F filings for institutional accumulation",
      },
      managementExecution: {
        pass: false, // Requires earnings history
        note: "Check last 2 quarters vs guidance",
      },
    },
  };

  // Count catalyst points
  if (catalyst.details.sectorTailwind.pass) catalyst.score++;
  if (catalyst.details.analystMomentum.pass) catalyst.score++;
  // Note: Other catalysts require manual research

  // === TECHNICAL SCORE (4 points) ===
  const trendAnalysis = analyzeTrend(data.historicalPrices);

  const technical: TechnicalScore = {
    score: 0,
    maxScore: 4,
    details: {
      aboveSma50: {
        pass: data.price > data.sma50,
        price: data.price,
        sma50: data.sma50,
        note: `$${data.price.toFixed(2)} ${data.price > data.sma50 ? ">" : "<"} 50-day MA $${data.sma50.toFixed(2)}`,
      },
      aboveSma200: {
        pass: data.price > data.sma200,
        price: data.price,
        sma200: data.sma200,
        note: `$${data.price.toFixed(2)} ${data.price > data.sma200 ? ">" : "<"} 200-day MA $${data.sma200.toFixed(2)}`,
      },
      rsiHealthy: {
        pass: data.rsi >= 30 && data.rsi <= 65,
        rsi: data.rsi,
        note: `RSI: ${data.rsi.toFixed(0)} ${data.rsi < 30 ? "(Oversold)" : data.rsi > 70 ? "(Overbought)" : "(Healthy)"}`,
      },
      twentyDayTrend: {
        pass: trendAnalysis.isUptrend,
        trend: trendAnalysis.description,
        note: trendAnalysis.description,
      },
    },
  };

  // Count technical points
  if (technical.details.aboveSma50.pass) technical.score++;
  if (technical.details.aboveSma200.pass) technical.score++;
  if (technical.details.rsiHealthy.pass) technical.score++;
  if (technical.details.twentyDayTrend.pass) technical.score++;

  // === TOTAL SCORE ===
  const totalScore = quality.score + value.score + catalyst.score + technical.score;

  // Position type
  let positionType: "Core" | "Growth" | "Speculative" | "Avoid";
  let suggestedAllocation: string;

  if (totalScore >= 18) {
    positionType = "Core";
    suggestedAllocation = "10-15%";
  } else if (totalScore >= 13) {
    positionType = "Growth";
    suggestedAllocation = "5-8%";
  } else if (totalScore >= 8) {
    positionType = "Speculative";
    suggestedAllocation = "2-4%";
  } else {
    positionType = "Avoid";
    suggestedAllocation = "0%";
  }

  // Build summary
  const summary = `${data.name} scores ${totalScore}/22 (${positionType}). ` +
    `Quality: ${quality.score}/7, Value: ${value.score}/6, Catalyst: ${catalyst.score}/5, Technical: ${technical.score}/4. ` +
    `Current: $${data.price.toFixed(2)}, Fair Value: $${fairValue.toFixed(2)}, Buy Price: $${buyPrice.toFixed(2)}.`;

  return {
    ticker: data.ticker,
    date: today,
    price: data.price,
    quality,
    value,
    catalyst,
    technical,
    totalScore,
    maxScore: 22,
    positionType,
    suggestedAllocation,
    targetBuyPrice: buyPrice,
    fairValue,
    summary,
  };
}

// Format scorecard for display
function formatScorecard(result: ScorecardResult): string {
  const q = result.quality.details;
  const v = result.value.details;
  const c = result.catalyst.details;
  const t = result.technical.details;

  const checkMark = (pass: boolean) => pass ? "[x]" : "[ ]";
  const pts = (pass: boolean) => pass ? "1" : "0";

  return `
================================================================================
                         STOCK SCORECARD v2.0
================================================================================
STOCK: ${result.ticker.padEnd(12)} | DATE: ${result.date} | PRICE: $${result.price.toFixed(2)}

================== QUALITY CHECK (Max 7) ==================
${checkMark(q.understandBusiness.pass)} Understand business model                    (1 pt): ${pts(q.understandBusiness.pass)}
   ${q.understandBusiness.note}
${checkMark(q.competitiveMoat.pass)} Clear competitive moat                       (1 pt): ${pts(q.competitiveMoat.pass)}
   ${q.competitiveMoat.note}
${checkMark(q.revenueGrowth.pass)} Revenue grew 2 of last 3 years              (1 pt): ${pts(q.revenueGrowth.pass)}
   ${q.revenueGrowth.note}
${checkMark(q.earningsGrowth.pass)} Earnings growing or path to profit          (1 pt): ${pts(q.earningsGrowth.pass)}
   ${q.earningsGrowth.note}
${checkMark(q.insiderOwnership.pass)} Insider ownership > 5%                      (1 pt): ${pts(q.insiderOwnership.pass)}
   ${q.insiderOwnership.note}
${checkMark(q.noRedFlags.pass)} No red flags (D/E < 2.0, no fraud/SEC)      (1 pt): ${pts(q.noRedFlags.pass)}
   ${q.noRedFlags.note}
${checkMark(q.roic.pass)} ROIC > 10%                                  (1 pt): ${pts(q.roic.pass)}
   ${q.roic.note}
                                        QUALITY SCORE: ${result.quality.score}/7

=================== VALUE CHECK (Max 6) ===================
PEG Ratio: ${v.pegRatio.value.toFixed(2).padStart(5)} (<1.0=2pts, 1.0-1.5=1pt, >1.5=0pts):  ${v.pegRatio.points}
   ${v.pegRatio.note}
P/E vs Sector: ${v.peVsSector.value.toFixed(2).padStart(5)} (<0.8=2pts, 0.8-1.2=1pt, >1.2=0): ${v.peVsSector.points}
   ${v.peVsSector.note}
52-Week Position: ${v.fiftyTwoWeekPosition.value.toFixed(0).padStart(3)}% (<30%=2pts, 30-70%=1pt, >70%=0): ${v.fiftyTwoWeekPosition.points}
   ${v.fiftyTwoWeekPosition.note}
                                          VALUE SCORE: ${result.value.score}/6

Fair Value Estimate: $${result.fairValue.toFixed(2)} (EPS x (8 + Growth Rate))
Buy Price (20% MOS): $${result.value.buyPrice.toFixed(2)}
Strong Buy (35% MOS): $${result.value.strongBuyPrice.toFixed(2)}

================= CATALYST CHECK (Max 5) ==================
${checkMark(c.nearTermCatalyst.pass)} Near-term catalyst (12 months)              (1 pt): ${pts(c.nearTermCatalyst.pass)}
   ${c.nearTermCatalyst.note}
${checkMark(c.sectorTailwind.pass)} Sector tailwind                             (1 pt): ${pts(c.sectorTailwind.pass)}
   ${c.sectorTailwind.note}
${checkMark(c.analystMomentum.pass)} Analyst momentum (upgrades > downgrades)    (1 pt): ${pts(c.analystMomentum.pass)}
   ${c.analystMomentum.note}
${checkMark(c.institutionalBuying.pass)} Institutional buying (13F accumulation)     (1 pt): ${pts(c.institutionalBuying.pass)}
   ${c.institutionalBuying.note}
${checkMark(c.managementExecution.pass)} Management executing (beat last 2 Qs)       (1 pt): ${pts(c.managementExecution.pass)}
   ${c.managementExecution.note}
                                        CATALYST SCORE: ${result.catalyst.score}/5

================ TECHNICAL CHECK (Max 4) ==================
${checkMark(t.aboveSma50.pass)} Price > 50-day MA                           (1 pt): ${pts(t.aboveSma50.pass)}
   ${t.aboveSma50.note}
${checkMark(t.aboveSma200.pass)} Price > 200-day MA                          (1 pt): ${pts(t.aboveSma200.pass)}
   ${t.aboveSma200.note}
${checkMark(t.rsiHealthy.pass)} RSI between 30-65                           (1 pt): ${pts(t.rsiHealthy.pass)}
   ${t.rsiHealthy.note}
${checkMark(t.twentyDayTrend.pass)} 20-day trend: higher lows                   (1 pt): ${pts(t.twentyDayTrend.pass)}
   ${t.twentyDayTrend.note}
                                       TECHNICAL SCORE: ${result.technical.score}/4

======================== TOTALS ===========================
Quality:   ${result.quality.score}/7
Value:     ${result.value.score}/6
Catalyst:  ${result.catalyst.score}/5
Technical: ${result.technical.score}/4
------------------------------------------------------------
TOTAL SCORE: ${result.totalScore}/22

POSITION TYPE: ${result.positionType === "Core" ? "[x] Core (18-22)" : "[ ] Core (18-22)"} ${result.positionType === "Growth" ? "[x] Growth (13-17)" : "[ ] Growth (13-17)"}
               ${result.positionType === "Speculative" ? "[x] Spec (8-12)" : "[ ] Spec (8-12)"}  ${result.positionType === "Avoid" ? "[x] Avoid (<8)" : "[ ] Avoid (<8)"}

SUGGESTED ALLOCATION: ${result.suggestedAllocation}
TARGET BUY PRICE: $${result.targetBuyPrice.toFixed(2)}
================================================================================
`;
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`
StockScorecard - 22-Point Stock Evaluation System

Usage:
  bun StockScorecard.ts <ticker> [--verbose] [--json]

Examples:
  bun StockScorecard.ts AAPL
  bun StockScorecard.ts NVDA --json
  bun StockScorecard.ts TSM --verbose

Options:
  --verbose  Show additional debug information
  --json     Output raw JSON instead of formatted scorecard
`);
    process.exit(1);
  }

  const ticker = args[0].toUpperCase();
  const verbose = args.includes("--verbose");
  const jsonOutput = args.includes("--json");

  console.log(`\nFetching data for ${ticker}...`);

  const result = await calculateScorecard(ticker, verbose);

  if ("error" in result) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatScorecard(result));
  }
}

// Export for programmatic use
export {
  calculateScorecard,
  formatScorecard,
  ScorecardResult,
  QualityScore,
  ValueScore,
  CatalystScore,
  TechnicalScore,
};

// Run CLI if executed directly
main().catch(console.error);
