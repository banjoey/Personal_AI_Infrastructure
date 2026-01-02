---
name: MacroStrategy
description: Macroeconomic analysis and sector strategy including business cycle positioning, Fed policy, sector rotation, and thematic investing. USE WHEN user mentions macro, economy, Fed, interest rates, sector rotation, business cycle, inflation, recession, or investment themes like AI or energy transition.
---

# MacroStrategy

**See the big picture to position for what's next.** Analyzes macroeconomic conditions, central bank policy, and sector dynamics to identify opportunities across the cycle.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName MacroStrategy
```

| Workflow | Trigger | File |
|----------|---------|------|
| **MacroOutlook** | "macro outlook", "economic environment" | `workflows/MacroOutlook.md` |
| **SectorRotation** | "sector rotation", "best sectors" | `workflows/SectorRotation.md` |
| **ThemeInvesting** | "investment themes", "AI stocks", "energy transition" | `workflows/ThemeInvesting.md` |
| **FedAnalysis** | "Fed policy", "interest rates", "FOMC" | `workflows/FedAnalysis.md` |
| **RecessionWatch** | "recession risk", "economic indicators" | `workflows/RecessionWatch.md` |
| **InflationTrades** | "inflation", "inflation hedges" | `workflows/InflationTrades.md` |
| **GeographicAllocation** | "international", "emerging markets" | `workflows/GeographicAllocation.md` |
| **IntermarketAnalysis** | "cross-asset", "bonds vs stocks" | `workflows/IntermarketAnalysis.md` |

## Examples

**Example 1: Macro positioning**
```
User: "What's the current macro environment?"
→ Invokes MacroOutlook workflow
→ Analyzes cycle position, Fed stance, growth/inflation
→ Recommends sector positioning
→ Returns macro scorecard with allocation suggestions
```

**Example 2: Sector rotation**
```
User: "Which sectors should I overweight now?"
→ Invokes SectorRotation workflow
→ Identifies business cycle phase
→ Maps historical sector performance
→ Returns ranked sector recommendations
```

**Example 3: Theme exploration**
```
User: "What are the best AI infrastructure plays?"
→ Invokes ThemeInvesting workflow
→ Defines theme and sub-sectors
→ Identifies key beneficiaries
→ Returns theme thesis with stock ideas
```

## Business Cycle Framework

### Cycle Phases

| Phase | Economy | Policy | Favored Sectors |
|-------|---------|--------|-----------------|
| **Early** | Recovery, accelerating | Accommodative | Financials, Consumer Disc, Industrials |
| **Mid** | Expansion, steady | Normalizing | Technology, Communication, Industrials |
| **Late** | Slowing, peak | Tightening | Energy, Materials, Healthcare |
| **Recession** | Contracting | Easing | Staples, Utilities, Healthcare |

### Current Cycle Assessment
```
Business Cycle Position
├── GDP Growth: X% (trend: accelerating/decelerating)
├── Employment: X% unemployment
├── Inflation: X% (above/below target)
├── Credit: Spreads [tight/normal/wide]
├── Policy: [Accommodative/Neutral/Restrictive]
└── Phase: [Early/Mid/Late/Recession]
```

## Key Economic Indicators

### Leading Indicators
- PMI (Manufacturing & Services)
- Building permits
- Initial jobless claims
- Yield curve shape
- Consumer confidence

### Coincident Indicators
- Employment
- Industrial production
- Retail sales
- Personal income

### Lagging Indicators
- Unemployment rate
- CPI
- Corporate profits
- Average duration of unemployment

## Investment Themes (Current)

### Artificial Intelligence
- Semiconductors (compute layer)
- Cloud infrastructure (CAPEX beneficiaries)
- Software (AI integration)
- Enterprise adoption

### Energy Transition
- Renewable energy
- Electric vehicles
- Grid infrastructure
- Battery/storage

### Deglobalization/Reshoring
- Domestic manufacturing
- Industrial automation
- Defense
- Critical materials

### Aging Demographics
- Healthcare
- Biotech
- Senior housing
- Life insurance

## Fed Analysis Framework

```
Fed Policy Assessment
├── Current Stance: [Hawkish/Neutral/Dovish]
├── Rate Path: X% now → Y% in 12 months
├── Balance Sheet: [QT/Neutral/QE]
├── Dot Plot Trajectory
├── Key Concerns: [Inflation/Growth/Financial Stability]
└── Market Implications
    ├── Duration: [Underweight/Neutral/Overweight]
    ├── Credit: [Risk-on/Neutral/Risk-off]
    ├── Equity Style: [Growth/Value/Quality]
    └── Dollar: [Bullish/Neutral/Bearish]
```

## Integration

- **Research Skill:** For economic data and news
- **FundamentalAnalysis:** For sector/company analysis
- **RiskManagement:** For macro-aware position sizing
