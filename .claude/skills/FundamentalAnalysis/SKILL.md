---
name: FundamentalAnalysis
description: Company valuation and financial analysis including DCF modeling, moat assessment, financial statements, and earnings analysis. USE WHEN user mentions valuation, fair value, DCF, financial statements, earnings, moat, competitive advantage, 10-K, P/E ratio, or fundamental research.
---

# FundamentalAnalysis

**Deep business analysis for long-term investing.** Evaluates companies based on financial health, competitive position, management quality, and intrinsic value.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName FundamentalAnalysis
```

| Workflow | Trigger | File |
|----------|---------|------|
| **DeepDive** | "fundamental analysis of", "deep dive on" | `workflows/DeepDive.md` |
| **DCFModel** | "DCF valuation", "intrinsic value", "fair value" | `workflows/DCFModel.md` |
| **MoatAssessment** | "moat analysis", "competitive advantage" | `workflows/MoatAssessment.md` |
| **EarningsPreview** | "earnings preview", "earnings estimate" | `workflows/EarningsPreview.md` |
| **ValueScreen** | "value stocks", "undervalued stocks" | `workflows/ValueScreen.md` |
| **FinancialHealth** | "financial health", "balance sheet", "bankruptcy risk" | `workflows/FinancialHealth.md` |
| **ManagementQuality** | "management quality", "capital allocation" | `workflows/ManagementQuality.md` |
| **SectorComparison** | "compare companies", "sector analysis" | `workflows/SectorComparison.md` |

## Examples

**Example 1: Company deep dive**
```
User: "Do a fundamental analysis of Microsoft"
→ Invokes DeepDive workflow
→ Analyzes business model, financials, moat, management
→ Builds valuation estimate
→ Returns comprehensive investment thesis
```

**Example 2: Valuation model**
```
User: "What's the fair value of GOOGL?"
→ Invokes DCFModel workflow
→ Projects revenue, margins, capex
→ Calculates WACC and terminal value
→ Returns fair value range with sensitivity analysis
```

**Example 3: Competitive analysis**
```
User: "Does Amazon have a moat?"
→ Invokes MoatAssessment workflow
→ Evaluates 5 moat sources
→ Assesses moat width and trend
→ Returns moat score with sustainability assessment
```

## Valuation Methods

### Discounted Cash Flow (DCF)
- Revenue projection (5-10 years)
- Margin assumptions
- WACC calculation
- Terminal value (growth or multiple)
- Sensitivity analysis

### Relative Valuation
- P/E ratio vs peers and history
- EV/EBITDA
- P/S, P/B, P/FCF
- PEG ratio

### Other Methods
- Dividend Discount Model (DDM)
- Sum-of-the-parts (SOTP)
- Asset-based valuation
- Residual income

## Moat Framework

### Five Sources of Moat
1. **Network Effects** - Value increases with users
2. **Switching Costs** - Customer lock-in
3. **Cost Advantages** - Scale, unique assets, process
4. **Intangible Assets** - Brands, patents, licenses
5. **Efficient Scale** - Natural monopolies

### Moat Assessment Output
```
Moat Analysis: [Company]
├── Network Effects: [None/Narrow/Wide]
├── Switching Costs: [None/Narrow/Wide]
├── Cost Advantages: [None/Narrow/Wide]
├── Intangible Assets: [None/Narrow/Wide]
├── Efficient Scale: [None/Narrow/Wide]
├── Overall Moat: [None/Narrow/Wide]
├── Moat Trend: [Expanding/Stable/Eroding]
└── Sustainability: [X years estimated]
```

## Financial Statement Analysis

### Income Statement Focus
- Revenue growth and composition
- Gross margin trends
- Operating leverage
- Earnings quality

### Balance Sheet Focus
- Debt levels and structure
- Working capital efficiency
- Asset quality
- Liquidity ratios

### Cash Flow Focus
- Free cash flow generation
- Capital allocation
- Cash conversion
- Dividend sustainability

## Quality Metrics

| Metric | Good | Excellent |
|--------|------|-----------|
| ROIC | >10% | >20% |
| ROE | >15% | >25% |
| Gross Margin | >40% | >60% |
| FCF Margin | >10% | >20% |
| Debt/Equity | <1.0 | <0.5 |

## Data Sources

Uses Finance/DataFetch tool for:
- Financial statements (yfinance)
- Valuation metrics
- Analyst estimates
- Historical data

## Integration

- **Research Skill:** For competitive analysis, news
- **MacroStrategy:** For sector context
- **RiskManagement:** For position sizing
