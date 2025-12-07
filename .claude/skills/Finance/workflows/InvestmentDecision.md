# InvestmentDecision Workflow

**Structured framework for buy/sell/hold decisions with clear reasoning.**

## Trigger Phrases
- "should I buy/sell [ticker]"
- "investment decision on [ticker]"
- "buy or sell [ticker]"
- "trade recommendation for [ticker]"

## Workflow Steps

### Step 1: Clarify Decision Context

```
Decision Type: [BUY (new) / ADD (to existing) / TRIM / SELL (full exit)]
Ticker: [Symbol]
Current Position: [None / X shares @ $Y avg cost]
Available Capital: [If buying]
Time Horizon: [Days / Weeks / Months / Years]
Risk Tolerance: [Conservative / Moderate / Aggressive]
```

### Step 2: Quick Data Pull

**Use DataFetch tool:**
```typescript
const snapshot = await DataFetch.getQuote(ticker);
const fundamentals = await DataFetch.getFundamentals(ticker);
```

Key data points:
- Current price and daily change
- 52-week range
- Key valuation metrics (P/E, P/S, P/B)
- Recent news headlines

### Step 3: Decision Framework

Apply structured decision framework:

```markdown
## Decision Checklist

### BUY Criteria (need 4+ of 6)
- [ ] Fundamentals support the thesis
- [ ] Valuation is reasonable (not wildly overvalued)
- [ ] Technical setup is favorable (not extended)
- [ ] Sentiment is not excessively bullish (contrarian check)
- [ ] Macro environment supports the trade
- [ ] Risk/reward is asymmetric (more upside than downside)

### SELL Criteria (need 2+ of 4)
- [ ] Original thesis is broken
- [ ] Valuation is extreme (significant overvaluation)
- [ ] Better opportunities exist for the capital
- [ ] Risk has increased substantially

### HOLD Criteria
- Neither BUY nor SELL criteria met
- Thesis intact but not adding
```

### Step 4: Sub-Skill Analysis (Abbreviated)

Quick checks from each domain:

**FundamentalAnalysis:**
- Thesis still valid? [Y/N]
- Valuation: [Cheap / Fair / Expensive]
- Quality: [High / Medium / Low]

**QuantAnalysis:**
- Trend: [Up / Sideways / Down]
- Momentum: [Strong / Weak / Negative]
- Key levels: Support $X, Resistance $Y

**SentimentAnalysis:**
- News sentiment: [Positive / Neutral / Negative]
- Social buzz: [High / Normal / Low]
- Contrarian signal: [None / Buy / Sell]

**RiskManagement:**
- Position size OK? [Y/N]
- Stop-loss level: $X
- Portfolio impact: [Minimal / Moderate / Significant]

### Step 5: Decision Output

```markdown
## Investment Decision: [TICKER]

### Recommendation
**Decision:** [BUY / SELL / HOLD / WAIT]
**Confidence:** [HIGH / MEDIUM / LOW]
**Urgency:** [Act now / This week / No rush]

---

### Decision Summary
[2-3 sentences explaining the decision rationale]

### Key Factors

**Supporting the Decision:**
1. [Factor 1]
2. [Factor 2]
3. [Factor 3]

**Against the Decision (risks):**
1. [Risk/concern 1]
2. [Risk/concern 2]

---

### If Proceeding (BUY)

| Parameter | Value |
|-----------|-------|
| Entry Zone | $X - $Y |
| Position Size | X shares ($X,XXX or X% of portfolio) |
| Stop-Loss | $X (-X% from entry) |
| Target 1 | $X (+X%) |
| Target 2 | $X (+X%) |
| Time Horizon | X weeks/months |

**Execution Suggestion:**
- [ ] Limit order at $X
- [ ] Or scale in: 50% now, 50% on pullback to $Y

---

### If Proceeding (SELL)

| Parameter | Value |
|-----------|-------|
| Current Price | $X |
| Your Cost Basis | $Y |
| Gain/Loss | +$X,XXX (+X%) |
| Tax Impact | [Short-term / Long-term] gain/loss |

**Execution Suggestion:**
- [ ] Market order (if urgent)
- [ ] Limit order at $X (if can wait)
- [ ] Scale out: Sell X% now, remainder at $Y

---

### If HOLD/WAIT

**Review Triggers:**
- Reconsider BUY if: [condition]
- Reconsider SELL if: [condition]
- Next check-in: [date]

---

### Decision Record

Save this for future review:
```
Date: [Today]
Ticker: [Symbol]
Decision: [BUY/SELL/HOLD]
Price at Decision: $X
Rationale: [1 sentence]
Review Date: [Future date]
```
```

## Quick Decision Mode

For simple yes/no questions, provide abbreviated response:

```markdown
**[TICKER]: [BUY/SELL/HOLD]**

Why: [1-2 sentences]
If buying: $X entry, $Y stop, $Z target
Confidence: [H/M/L]
```
