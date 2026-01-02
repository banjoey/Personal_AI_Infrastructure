# StockAnalysis Workflow

**Comprehensive multi-skill stock analysis for investment decisions.**

## Trigger Phrases
- "analyze [ticker]"
- "should I buy [ticker]"
- "stock research on [ticker]"
- "what do you think about [ticker]"

## Workflow Steps

### Step 1: Identify Target
Extract ticker symbol and any specific concerns from user request.

```
Input: "Should I buy NVDA?"
→ Ticker: NVDA
→ Context: Buy decision needed
→ Depth: Standard (use "deep dive" for extensive)
```

### Step 2: Gather Data via Research Skill

**READ:** `${PAI_DIR}/skills/research/workflows/conduct.md`

Launch parallel research:
```
Research queries:
1. "[Company] latest news and developments"
2. "[Company] analyst ratings and price targets"
3. "[Company] recent earnings and guidance"
4. "[Company] competitive position and risks"
```

### Step 3: Fetch Market Data

**Use DataFetch tool:**
```typescript
const data = await DataFetch.getComprehensive(ticker, {
  quote: true,
  fundamentals: true,
  technicals: true,
  options: true,
  news: true
});
```

### Step 4: Apply Domain Analysis (Parallel)

Invoke sub-skills in parallel:

| Sub-Skill | Analysis | Output |
|-----------|----------|--------|
| **FundamentalAnalysis** | Business quality, valuation, moat | Fair value estimate, quality score |
| **QuantAnalysis** | Technical setup, momentum, volatility | Entry/exit levels, technical score |
| **SentimentAnalysis** | News tone, social buzz, analyst sentiment | Sentiment score, key narratives |
| **MacroStrategy** | Sector positioning, thematic fit | Macro alignment score |

### Step 5: Risk Assessment

**Invoke RiskManagement skill:**
- Position sizing recommendation
- Key risk factors
- Correlation with existing portfolio (if known)
- Stop-loss levels

### Step 6: Tax Considerations (if applicable)

**Invoke TaxStrategy skill:**
- Short-term vs long-term implications
- Tax-loss harvesting opportunities
- Wash sale concerns

### Step 7: Synthesize Recommendation

Combine all analyses into actionable output:

```markdown
## Stock Analysis: [TICKER]

### Summary
**Recommendation:** [BUY / HOLD / SELL / AVOID]
**Confidence:** [HIGH / MEDIUM / LOW]
**Time Horizon:** [Short-term / Medium-term / Long-term]

### Key Metrics
| Metric | Value | Assessment |
|--------|-------|------------|
| Current Price | $XXX | |
| Fair Value Est. | $XXX | [Undervalued/Overvalued by X%] |
| Technical Setup | X/10 | |
| Sentiment Score | X/10 | |
| Risk Level | [Low/Medium/High] | |

### Investment Thesis
[2-3 sentence summary of why to buy/hold/sell]

### Bull Case
- [Key bullish factor 1]
- [Key bullish factor 2]

### Bear Case
- [Key risk 1]
- [Key risk 2]

### Position Sizing
- Suggested allocation: X% of portfolio
- Entry zone: $XXX - $XXX
- Stop-loss: $XXX (X% downside)
- Target: $XXX (X% upside)

### Agent Perspectives
- **Warren (Fundamental):** [1 sentence view]
- **Quentin (Quant):** [1 sentence view]
- **Sage (Sentiment):** [1 sentence view]
- **Prudence (Risk):** [1 sentence view]

### Next Catalysts
- [Upcoming event 1 with date]
- [Upcoming event 2 with date]
```

## Output Format

Always return structured analysis with:
1. Clear recommendation (BUY/HOLD/SELL)
2. Confidence level with reasoning
3. Specific entry/exit levels
4. Position sizing guidance
5. Key risks highlighted

## Error Handling

If data unavailable:
- Note which data sources failed
- Proceed with available data
- Lower confidence if key data missing
- Suggest manual verification for missing items
