# PortfolioReview Workflow

**Comprehensive portfolio health assessment across multiple dimensions.**

## Trigger Phrases
- "review my portfolio"
- "portfolio health check"
- "analyze my positions"
- "how is my portfolio doing"

## Workflow Steps

### Step 1: Gather Portfolio Data

Request portfolio information from user or load from PortfolioTracker:

```typescript
interface Portfolio {
  positions: Position[];
  cash: number;
  lastUpdated: Date;
}

interface Position {
  ticker: string;
  shares: number;
  avgCost: number;
  currentPrice?: number;
  purchaseDate: Date;
}
```

If no portfolio on file:
```
Please provide your current holdings in this format:
- TICKER: # shares @ $avg_cost (purchase date)

Example:
- AAPL: 100 shares @ $150 (2023-06-15)
- NVDA: 50 shares @ $200 (2024-01-10)
- Cash: $10,000
```

### Step 2: Enrich with Current Data

**Use DataFetch tool** to get current prices and fundamentals:

```typescript
const enriched = await Promise.all(
  portfolio.positions.map(p => DataFetch.getQuote(p.ticker))
);
```

Calculate:
- Current market value per position
- Total portfolio value
- Unrealized gain/loss per position
- Portfolio weights

### Step 3: Risk Analysis

**Invoke RiskManagement skill:**

Analyze:
- Portfolio volatility (weighted average)
- Concentration risk (single stock, sector)
- Correlation matrix
- Value at Risk (VaR) estimate
- Maximum drawdown potential

### Step 4: Tax Analysis

**Invoke TaxStrategy skill:**

Analyze:
- Short-term vs long-term positions
- Unrealized gains/losses
- Tax-loss harvesting candidates
- Wash sale concerns

### Step 5: Fundamental Check

**Invoke FundamentalAnalysis skill** for each major position (>5% weight):

Quick health check:
- Has thesis changed?
- Any red flags?
- Valuation vs entry

### Step 6: Allocation Analysis

Compare current allocation to targets (if known):

```markdown
| Category | Current | Target | Delta |
|----------|---------|--------|-------|
| US Stocks | 65% | 60% | +5% |
| Int'l Stocks | 10% | 15% | -5% |
| Bonds | 5% | 10% | -5% |
| Crypto | 15% | 10% | +5% |
| Cash | 5% | 5% | 0% |
```

### Step 7: Generate Report

```markdown
## Portfolio Review

**Date:** [Current date]
**Total Value:** $XXX,XXX
**Cash Position:** $XX,XXX (X%)

---

### Performance Summary

| Metric | Value |
|--------|-------|
| Total Unrealized Gain/Loss | $XX,XXX (+X.X%) |
| Day Change | $X,XXX (+X.X%) |
| YTD Return | +X.X% |

### Position Summary

| Ticker | Shares | Avg Cost | Current | Value | Gain/Loss | Weight |
|--------|--------|----------|---------|-------|-----------|--------|
| AAPL | 100 | $150 | $175 | $17,500 | +$2,500 (+16.7%) | 15% |
| NVDA | 50 | $200 | $450 | $22,500 | +$12,500 (+125%) | 20% |
| ... | ... | ... | ... | ... | ... | ... |

---

### Risk Assessment 🛡️

**Overall Risk Level:** [Low/Medium/High]

| Risk Metric | Value | Assessment |
|-------------|-------|------------|
| Portfolio Volatility | X% | [Normal/Elevated/High] |
| Concentration (Top 3) | X% | [Acceptable/Concerning] |
| Sector Concentration | X% in [sector] | [Diversified/Concentrated] |
| Beta to S&P 500 | X.XX | [Defensive/Neutral/Aggressive] |

**Key Risks Identified:**
1. [Risk 1 with mitigation suggestion]
2. [Risk 2 with mitigation suggestion]

---

### Tax Considerations 🧾

**Short-term Positions:** X positions ($XX,XXX value)
**Long-term Positions:** X positions ($XX,XXX value)

**Tax-Loss Harvesting Candidates:**
| Ticker | Loss | Holding Period | Action |
|--------|------|----------------|--------|
| XYZ | -$2,000 | Long-term | Consider harvesting |

**Wash Sale Alert:** [Any concerns]

---

### Allocation Analysis

[Allocation table from Step 6]

**Rebalancing Suggestions:**
1. [Suggestion 1]
2. [Suggestion 2]

---

### Position Health Checks

**Positions Flagged for Review:**
| Ticker | Concern | Suggested Action |
|--------|---------|------------------|
| XYZ | Thesis changed | Review and decide |
| ABC | Overvalued | Consider trimming |

**Positions Looking Good:**
- AAPL: Fundamentals strong, hold
- NVDA: Thesis intact, hold

---

### Action Items

**Immediate:**
- [ ] [High priority action]

**This Week:**
- [ ] [Medium priority action]

**This Month:**
- [ ] [Lower priority action]

---

### Next Review
Suggested next portfolio review: [Date - typically 1 month or quarterly]
```

## Output Options

User can request specific focus:
- "review my portfolio risk" → Emphasize risk section
- "review my portfolio for taxes" → Emphasize tax section
- "quick portfolio check" → Summary only
