---
name: DeepStockAnalysis
description: Bulletproof stock deep-dive analysis for identifying 10-baggers. USE WHEN analyzing screener survivors, evaluating individual stocks, generating buy/watch/avoid ratings, or creating investment research reports. Designed for CI/CD automation.
---

# DeepStockAnalysis Skill

**Purpose:** Systematic deep-dive analysis of stocks to identify potential 10-baggers with asymmetric risk/reward. This skill is designed to be run via CI/CD automation on screener survivors.

**Critical Principle:** NO HALLUCINATION. Every data point must come from a verified source. If data is unavailable, explicitly state "DATA NOT AVAILABLE" rather than guessing.

---

## 1. ANALYSIS WORKFLOW

### Phase 1: Data Collection (15 min per stock)

Gather data from these FREE sources only:

| Data Type | Primary Source | Backup Source |
|-----------|---------------|---------------|
| Price/Volume | yfinance | Yahoo Finance web |
| Financials | yfinance `.info` | SEC EDGAR |
| SEC Filings | SEC EDGAR API | sec.gov direct |
| News | Google News search | Yahoo Finance news |
| Insider Activity | SEC Form 4 | OpenInsider.com |
| Short Interest | FINRA | Finviz |
| Analyst Ratings | Yahoo Finance | TipRanks (free tier) |
| Social Sentiment | Reddit/Twitter search | StockTwits |

### Phase 2: Scoring (5 min per stock)

Apply the 100-point scoring system defined below.

### Phase 3: Report Generation (5 min per stock)

Generate standardized report with rating and actionable recommendations.

---

## 2. SCORING SYSTEM (100 Points Total)

### 2.1 Fundamental Analysis (35 points)

| Metric | Criteria | Points |
|--------|----------|--------|
| **Revenue Growth** | >30% YoY = 8pts, 20-30% = 6pts, 10-20% = 3pts, <10% = 0pts | 0-8 |
| **Earnings Growth** | >25% YoY = 7pts, 15-25% = 5pts, 5-15% = 2pts, <5% = 0pts | 0-7 |
| **FCF Yield** | >7% = 6pts, 4-7% = 4pts, 1-4% = 2pts, <1% = 0pts | 0-6 |
| **Gross Margin** | >60% = 5pts, 40-60% = 3pts, 20-40% = 1pt, <20% = 0pts | 0-5 |
| **ROE** | >20% = 5pts, 15-20% = 3pts, 10-15% = 1pt, <10% = 0pts | 0-5 |
| **Debt/Equity** | <0.3 = 4pts, 0.3-0.5 = 2pts, 0.5-1.0 = 1pt, >1.0 = 0pts | 0-4 |

### 2.2 Valuation (15 points)

| Metric | Criteria | Points |
|--------|----------|--------|
| **PEG Ratio** | <0.5 = 6pts, 0.5-1.0 = 4pts, 1.0-1.5 = 2pts, >1.5 = 0pts | 0-6 |
| **P/S Ratio** | <2 = 5pts, 2-5 = 3pts, 5-10 = 1pt, >10 = 0pts | 0-5 |
| **FCF Yield vs Growth** | FCF Yield > Growth/3 = 4pts, else 0pts | 0-4 |

### 2.3 Technical Analysis (15 points)

| Metric | Criteria | Points |
|--------|----------|--------|
| **Price vs 200 MA** | Above +5% = 5pts, 0-5% = 3pts, Below 0-10% = 1pt, Below >10% = 0pts | 0-5 |
| **RSI** | 40-60 = 4pts, 30-40 or 60-70 = 2pts, <30 or >70 = 0pts | 0-4 |
| **Volume Trend** | Rising 20-day avg = 3pts, Stable = 2pts, Declining = 0pts | 0-3 |
| **52-Week Range** | 20-60% from low = 3pts, else 1pt | 0-3 |

### 2.4 Catalyst & Sentiment (15 points)

| Metric | Criteria | Points |
|--------|----------|--------|
| **Insider Buying** | Net buying last 6 months = 5pts, Neutral = 2pts, Net selling = 0pts | 0-5 |
| **Institutional Trend** | Increasing ownership = 4pts, Stable = 2pts, Decreasing = 0pts | 0-4 |
| **Upcoming Catalysts** | Clear catalyst in 3-6 months = 4pts, 6-12 months = 2pts, None = 0pts | 0-4 |
| **News Sentiment** | Positive = 2pts, Neutral = 1pt, Negative = 0pts | 0-2 |

### 2.5 Risk Factors (20 points - DEDUCTIONS)

Start with 20 points, deduct for red flags:

| Red Flag | Deduction |
|----------|-----------|
| Share dilution >10% YoY | -5 |
| Declining revenue (2+ quarters) | -5 |
| Negative FCF + high burn rate | -4 |
| Debt/Equity >1.0 | -4 |
| SEC investigation or restatement | -10 |
| Insider selling >$1M (6 months) | -3 |
| Short interest >20% | -3 |
| Going concern warning | -10 |
| Related party transactions | -3 |
| Auditor change | -3 |

**Minimum Risk Score:** 0 (cannot go negative)

---

## 3. RATING THRESHOLDS

| Score | Rating | Action |
|-------|--------|--------|
| 80-100 | **STRONG BUY** | Add to portfolio at next entry signal |
| 65-79 | **BUY** | Add to watchlist, wait for pullback |
| 50-64 | **WATCH** | Monitor for improvement |
| 35-49 | **HOLD** | Existing position only, don't add |
| 0-34 | **AVOID** | Do not invest, potential value trap |

---

## 4. 10-BAGGER QUALIFICATION CHECKLIST

A stock MUST meet ALL of these to be flagged as "10-Bagger Potential":

- [ ] Market Cap $50M - $2B
- [ ] Revenue Growth >20% YoY
- [ ] PEG Ratio <1.0
- [ ] Positive Free Cash Flow (or clear path to it within 2 years)
- [ ] Total Addressable Market >$10B
- [ ] <10% market share captured
- [ ] Score >70 on analysis
- [ ] No critical red flags (SEC issues, going concern, fraud indicators)
- [ ] Clear secular tailwind (AI, energy, healthcare innovation, etc.)

---

## 5. REPORT FORMAT

Generate this exact format for each stock:

```markdown
# [SYMBOL] Deep Analysis Report
**Generated:** [DATE]
**Rating:** [STRONG BUY/BUY/WATCH/HOLD/AVOID]
**Score:** [XX]/100
**10-Bagger Potential:** [YES/NO]

## Executive Summary
[2-3 sentences on the investment thesis]

## Scores Breakdown
| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| Fundamentals | XX | 35 | [key driver] |
| Valuation | XX | 15 | [key driver] |
| Technical | XX | 15 | [key driver] |
| Sentiment | XX | 15 | [key driver] |
| Risk | XX | 20 | [key concerns] |
| **TOTAL** | **XX** | **100** | |

## Key Metrics
- Market Cap: $XXB
- Revenue Growth: XX%
- PEG Ratio: X.XX
- FCF Yield: X.X%
- Debt/Equity: X.XX

## Bull Case (Why it could 10x)
1. [Point 1]
2. [Point 2]
3. [Point 3]

## Bear Case (Key risks)
1. [Risk 1]
2. [Risk 2]
3. [Risk 3]

## Catalysts Timeline
- [Q1 2026]: [Catalyst]
- [Q2 2026]: [Catalyst]

## Technical Entry
- Current Price: $XX.XX
- Support Level: $XX.XX
- Entry Zone: $XX.XX - $XX.XX
- Stop Loss: $XX.XX (X% below entry)

## Position Sizing Recommendation
- Portfolio Allocation: X-X%
- Based on: [volatility/conviction/risk factors]

## Data Sources
- [List all sources used with dates]

## Confidence Level
[HIGH/MEDIUM/LOW] - [Explanation of data quality]
```

---

## 6. DISCORD ALERT FORMAT

For STRONG BUY ratings, send this alert:

```
**NEW STRONG BUY: [SYMBOL]**

Score: XX/100 | 10-Bagger: [YES/NO]

**Quick Take:** [1 sentence thesis]

**Key Metrics:**
- Revenue Growth: XX%
- PEG: X.XX
- FCF Yield: X.X%

**Entry Zone:** $XX - $XX
**Stop Loss:** $XX

Full report: [link to saved report]
```

---

## 7. CI/CD EXECUTION RULES

When running via GitLab CI/CD:

1. **Time Window:** Only execute between 2:00 AM - 5:00 AM local time
2. **Rate Limiting:** 1 stock per 3 minutes (avoid API rate limits)
3. **Queue System:** Process stocks from `data/screener/analysis-queue.json`
4. **State Management:** Update queue status after each stock
5. **Error Handling:** Log errors, skip to next stock, don't fail pipeline
6. **Output:** Save reports to `data/reports/[SYMBOL]-[DATE].md`
7. **Alerts:** Send Discord webhook for STRONG BUY only

### Queue File Format
```json
{
  "queue": [
    {"symbol": "AAPL", "status": "pending", "added": "2025-12-17"},
    {"symbol": "MSFT", "status": "completed", "added": "2025-12-17", "score": 72}
  ],
  "lastRun": "2025-12-17T03:00:00Z",
  "config": {
    "maxPerRun": 20,
    "alertThreshold": 80
  }
}
```

---

## 8. DATA VERIFICATION REQUIREMENTS

**CRITICAL: No Hallucination Protocol**

For each data point, you MUST:

1. **Cite the source** - Include where the data came from
2. **Note the date** - When was this data retrieved?
3. **Mark uncertainty** - If data conflicts or is unclear, note it
4. **Fail gracefully** - If data unavailable, write "N/A - [reason]"

**Verification Checklist:**
- [ ] All financial metrics from yfinance or SEC filings
- [ ] All news from actual search results with URLs
- [ ] All insider data from SEC Form 4 or OpenInsider
- [ ] No projections stated as facts
- [ ] All estimates clearly labeled as "Analyst Estimate" or "Projection"

---

## 9. INTEGRATION WITH INVESTMENT-ALERT-BOT

This skill integrates with the existing alert bot:

1. **Screener Output:** Reads from `data/screener/final-results.json`
2. **Report Output:** Writes to `data/reports/`
3. **Discord Alerts:** Uses existing `DISCORD_WEBHOOK_URL`
4. **Config:** Respects `config/config.json` settings

### Triggering Deep Analysis

**CLI:**
```bash
bun src/index.ts --deep-analyze [SYMBOL]
bun src/index.ts --deep-analyze-all  # All screener survivors
```

**API:**
```bash
POST /analyze/:symbol
POST /analyze/batch  # Body: {"symbols": ["AAPL", "MSFT"]}
```

---

## 10. EXAMPLE ANALYSIS

See `docs/EXAMPLE-DEEP-ANALYSIS.md` for a complete worked example.

---

**Version:** 1.0
**Created:** 2025-12-17
**Author:** PAI DeepStockAnalysis System

This skill is designed for maximum reliability and zero hallucination in a real-money investment context.
