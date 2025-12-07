# CompanyResearch Workflow

**Research-driven company discovery using PAI Research skill integration.**

## Trigger Phrases
- "find companies in [sector/theme]"
- "research [industry] stocks"
- "what are good [theme] investments"
- "discover [sector] opportunities"

## Workflow Steps

### Step 1: Define Research Parameters

Extract from user request:
```
Theme/Sector: [e.g., "nuclear energy", "AI infrastructure"]
Investment Style: [growth/value/income/speculative]
Market Cap Preference: [large/mid/small/any]
Geographic Focus: [US/global/specific region]
```

### Step 2: Theme Definition via MacroStrategy

**Invoke MacroStrategy skill** to define the investment theme:

```markdown
Questions to answer:
1. What sub-sectors comprise this theme?
2. What are the key growth drivers?
3. Where are we in the cycle for this theme?
4. What macro factors affect this theme?
```

Example output for "nuclear energy":
```
Sub-sectors:
- Uranium miners (CCJ, UEC, DNN)
- Nuclear utilities (CEG, VST, NRG)
- Enrichment/fuel services (LEU)
- Small modular reactors (NuScale via FLWR, Oklo)
- Equipment/construction (BWX)

Growth drivers:
- AI data center power demand
- Decarbonization mandates
- Energy security concerns
- Baseload reliability needs
```

### Step 3: Parallel Research via Research Skill

**READ:** `${PAI_DIR}/skills/research/workflows/conduct.md`

Launch extensive parallel research:

```
Research Mode: EXTENSIVE (8 agents per type)
Timeout: 10 minutes

Query variations:
1. "best [theme] stocks to buy 2025"
2. "[theme] industry analysis investment"
3. "top [theme] companies market leaders"
4. "[theme] emerging companies growth potential"
5. "[theme] stock analyst recommendations"
6. "[theme] investment risks and opportunities"
```

### Step 4: Candidate Extraction

From research results, extract candidate companies:

```typescript
interface Candidate {
  ticker: string;
  name: string;
  subSector: string;
  mentionCount: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyReasons: string[];
}
```

### Step 5: Data Enrichment

For each candidate (top 10-15), fetch:

```typescript
const enriched = await Promise.all(
  candidates.map(c => DataFetch.getComprehensive(c.ticker, {
    quote: true,
    fundamentals: true,
    technicals: false // Skip for screening phase
  }))
);
```

### Step 6: Fundamental Screening

**Invoke FundamentalAnalysis skill** with screening criteria:

Default screens (adjust based on investment style):

**Growth Screen:**
- Revenue growth > 15% YoY
- Positive earnings or path to profitability
- Strong balance sheet (debt/equity < 1)

**Value Screen:**
- P/E < sector median
- P/B < 3
- Positive free cash flow

**Quality Screen:**
- ROIC > 10%
- Consistent margins
- Strong competitive position

### Step 7: Risk Assessment

**Invoke RiskManagement skill** for sector-level risks:

```markdown
Assess:
- Regulatory risk
- Concentration risk (if adding to portfolio)
- Correlation with existing holdings
- Liquidity considerations
```

### Step 8: Rank and Output

Generate ranked candidate list:

```markdown
## Company Research: [Theme]

### Investment Theme Summary
[2-3 sentences on the theme and why it's interesting]

### Top Candidates

#### Tier 1: High Conviction
| Rank | Ticker | Company | Sub-Sector | Why It Stands Out |
|------|--------|---------|------------|-------------------|
| 1 | XXX | Company A | Sub-sector | Key differentiator |
| 2 | XXX | Company B | Sub-sector | Key differentiator |
| 3 | XXX | Company C | Sub-sector | Key differentiator |

#### Tier 2: Worth Watching
| Rank | Ticker | Company | Sub-Sector | Notes |
|------|--------|---------|------------|-------|
| 4-6 | ... | ... | ... | ... |

#### Tier 3: Speculative
| Rank | Ticker | Company | Sub-Sector | Risk/Reward |
|------|--------|---------|------------|-------------|
| 7-10 | ... | ... | ... | ... |

### Theme Risks
- [Key risk 1]
- [Key risk 2]
- [Key risk 3]

### Suggested Next Steps
1. Deep dive on top 2-3 candidates (use "analyze [ticker]")
2. Consider position sizing across theme
3. Monitor key catalysts: [list]

### Sources Consulted
- [List research sources used]
```

## Integration Notes

This workflow heavily relies on:
1. **Research skill** - For parallel web research
2. **MacroStrategy** - For theme definition
3. **FundamentalAnalysis** - For screening
4. **RiskManagement** - For risk assessment

Ensure these skills are available before executing.
