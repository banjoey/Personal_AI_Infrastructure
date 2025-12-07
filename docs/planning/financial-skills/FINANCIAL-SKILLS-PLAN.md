# Financial Skills Suite - Comprehensive Implementation Plan

**Created:** 2025-12-06
**Branch:** feature/financial-skills
**Status:** Planning Phase

---

## Executive Summary

Transform the 7 BMAD stock trading agents into a comprehensive PAI skill-based "Financial Team" that covers the full spectrum of personal financial life. This creates a modular, extensible system where Charles can assume any financial persona while maintaining the ability to conduct standup discussions with specialist agent profiles.

### Design Philosophy

1. **Skills First** - Each domain becomes a PAI skill that Charles can invoke
2. **Agent Profiles for Standup** - Corresponding personas for multi-agent discussions
3. **Free Data Sources** - yfinance, Alpaca paper trading, Finnhub free tier, web research
4. **Multi-Philosophy Approach** - Capital preservation foundation with growth orientation, data-driven quantitative methods, open to all strategies
5. **Modular Architecture** - Skills can work independently or orchestrate together
6. **PAI Ecosystem Integration** - Financial skills leverage existing PAI capabilities (research, fabric, etc.)

---

## PAI Skill Integration (Critical Architecture)

**Financial skills are CONSUMERS of existing PAI capabilities, not replacements.**

### Integration with Research Skill

The existing `research` skill provides powerful capabilities that financial skills should leverage:

| Research Skill Feature | Financial Skill Usage |
|------------------------|----------------------|
| Multi-source parallel research (Claude, Perplexity, Gemini) | Company research, competitive analysis, industry trends |
| Content retrieval (WebFetch → BrightData → Apify) | SEC filings, earnings transcripts, news articles |
| 242+ Fabric patterns | `analyze_paper` for reports, `extract_wisdom` for calls |
| YouTube extraction | Earnings calls, investor presentations, interviews |
| Knowledge extraction | Synthesizing research into actionable insights |

### Integration Flow Examples

**Example 1: "Find good nuclear energy companies"**

```
User Request
    ↓
Finance Skill (orchestrator)
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. MacroStrategy: Define "nuclear energy" investment theme  │
│    → Criteria: utilities, uranium miners, enrichment, SMRs  │
│                                                             │
│ 2. Research Skill: Parallel web research                   │ ← EXISTING PAI SKILL
│    → Launch claude-researcher, perplexity-researcher        │
│    → Search: "best nuclear energy stocks 2025"              │
│    → Search: "uranium mining companies analysis"            │
│    → Search: "nuclear power plant operators investing"      │
│                                                             │
│ 3. FundamentalAnalysis: Screen candidates                   │
│    → Apply valuation criteria to research results           │
│    → Rank by moat strength, growth potential                │
│                                                             │
│ 4. RiskManagement: Assess sector risks                      │
│    → Regulatory risk, concentration risk                    │
│    → Position sizing recommendations                        │
└─────────────────────────────────────────────────────────────┘
    ↓
Synthesized recommendation with ranked candidates
```

**Example 2: "What's the sentiment on NVDA?"**

```
User Request
    ↓
Finance Skill (orchestrator)
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. SentimentAnalysis: Structure the query                   │
│    → Define sentiment dimensions to analyze                 │
│                                                             │
│ 2. Research Skill: Gather current information              │ ← EXISTING PAI SKILL
│    → News sentiment (recent articles, analyst reports)      │
│    → Social sentiment (Reddit, Twitter, StockTwits)         │
│    → Institutional sentiment (13F filings, fund letters)    │
│                                                             │
│ 3. SentimentAnalysis: Interpret findings                    │
│    → Score sentiment across dimensions                      │
│    → Identify divergences and inflection points             │
│                                                             │
│ 4. QuantAnalysis: Correlate with price action               │
│    → Options flow analysis                                  │
│    → Volume confirmation                                    │
└─────────────────────────────────────────────────────────────┘
    ↓
Multi-dimensional sentiment report with trading implications
```

**Example 3: "Analyze this earnings call" (YouTube URL)**

```
User Request + YouTube URL
    ↓
Finance Skill (orchestrator)
    ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. Research Skill: Extract content                         │ ← EXISTING PAI SKILL
│    → YouTube extraction via `fabric -y`                     │
│    → Transcript + key moments                               │
│                                                             │
│ 2. Research Skill: Apply Fabric patterns                   │ ← EXISTING PAI SKILL
│    → `analyze_paper` for structured analysis                │
│    → `extract_wisdom` for key insights                      │
│                                                             │
│ 3. FundamentalAnalysis: Interpret financial content         │
│    → Revenue/earnings commentary                            │
│    → Guidance analysis                                      │
│    → Management tone assessment                             │
│                                                             │
│ 4. SentimentAnalysis: Management confidence scoring         │
│    → Language pattern analysis                              │
│    → Compare to previous calls                              │
└─────────────────────────────────────────────────────────────┘
    ↓
Comprehensive earnings analysis with sentiment and implications
```

### Other PAI Skill Integrations

| Existing Skill | Integration Point |
|----------------|-------------------|
| **Fabric** | Pattern-based analysis (threat models for risk, summaries for reports) |
| **BrightData** | Scraping financial sites that block standard fetching |
| **Art** | Visualizations (portfolio charts, correlation matrices, timelines) |
| **Createskill** | Used to build the financial skills themselves |

### Integration Implementation

Each financial skill workflow should include integration hooks:

```markdown
## Workflow: CompanyResearch.md

### Step 1: Define Research Parameters
- Company name/ticker
- Research depth (quick/standard/extensive)
- Specific questions to answer

### Step 2: Invoke Research Skill
**READ:** `${PAI_DIR}/skills/research/workflows/conduct.md`
**EXECUTE:** Multi-agent parallel research with financial focus

### Step 3: Apply Domain Expertise
- FundamentalAnalysis interprets financial data
- SentimentAnalysis scores market perception
- RiskManagement flags concerns

### Step 4: Synthesize
- Combine research findings with domain analysis
- Generate actionable recommendation
```

### Why This Matters

1. **No Reinventing the Wheel** - Research skill already solves web research
2. **Leverage Existing Infrastructure** - API keys, rate limiting, caching already configured
3. **Consistent Experience** - Same research quality across all PAI usage
4. **Easier Maintenance** - Improvements to research skill benefit financial skills automatically
5. **Fabric Patterns** - 242+ specialized prompts available without recreation

---

## Current State Analysis

### Source: 7 BMAD Stock Trading Agents

| Agent | Persona | Core Capabilities |
|-------|---------|-------------------|
| **Quentin** (quant-analyst) | Former hedge fund quant | Backtesting, ML prediction, options pricing, statistical arbitrage |
| **Warren** (fundamental-analyst) | CFA, value investing expert | DCF modeling, moat assessment, financial statement analysis |
| **Sage** (sentiment-analyst) | Former financial journalist | NLP, earnings call analysis, social sentiment, manipulation detection |
| **Marcus** (macro-strategist) | Global macro hedge fund strategist | Sector rotation, Fed policy, thematic investing, business cycles |
| **Prudence** (risk-manager) | Former institutional CRO | VaR, position sizing, hedging, tail risk, stress testing |
| **Nova** (ai-trader) | ML engineer at quant fund | LLM applications, RAG systems, autonomous agents, prompt engineering |
| **Satoshi** (crypto-correlation) | On-chain analysis expert | Crypto-stock correlations, mining economics, DeFi metrics |

### Strengths to Preserve

1. **Deep domain expertise** - Each agent has comprehensive knowledge
2. **Practical prompts** - Menu-driven actions with specific methodologies
3. **Real-world principles** - Grounded in actual trading/investing wisdom
4. **Code examples** - Python snippets for implementation (Nova agent especially)

### Gaps to Address

1. **No tax optimization** - Missing entirely
2. **No real estate** - No property investment analysis
3. **No budgeting/cash flow** - No personal finance basics
4. **No insurance** - No coverage optimization
5. **No estate planning** - No wealth transfer strategies
6. **No retirement planning** - No 401k/IRA optimization
7. **No data source integration** - Agents describe but don't implement
8. **No cross-skill orchestration** - Each agent operates in isolation

---

## Proposed Architecture

### Skill Hierarchy

```
Finance/                              # Parent skill (orchestrator)
├── SKILL.md                          # Main orchestrator - routes to sub-skills
├── agents/                           # Standup agent profiles
│   ├── Quentin.md                    # Quant persona
│   ├── Warren.md                     # Fundamental persona
│   ├── Sage.md                       # Sentiment persona
│   ├── Marcus.md                     # Macro persona
│   ├── Prudence.md                   # Risk persona
│   ├── Nova.md                       # AI trading persona
│   ├── Satoshi.md                    # Crypto persona
│   ├── Taxley.md                     # Tax persona (NEW)
│   ├── Reginald.md                   # Real estate persona (NEW)
│   └── Penelope.md                   # Personal finance persona (NEW)
├── tools/
│   ├── DataFetch.ts                  # yfinance/Finnhub integration
│   ├── PortfolioTracker.ts           # Position tracking
│   └── BacktestRunner.ts             # Strategy backtesting
└── workflows/
    ├── StockAnalysis.md              # Comprehensive stock analysis
    ├── PortfolioReview.md            # Full portfolio health check
    ├── TaxOptimization.md            # Tax strategy workflow
    ├── InvestmentDecision.md         # Buy/sell/hold decision framework
    └── FinancialStandup.md           # Multi-agent discussion

QuantAnalysis/                        # Quantitative trading skill
├── SKILL.md
├── workflows/
│   ├── Backtest.md
│   ├── ScreenOpportunities.md
│   ├── OptionsAnalysis.md
│   ├── MLPrediction.md
│   └── VolatilityForecast.md
└── tools/

FundamentalAnalysis/                  # Fundamental analysis skill
├── SKILL.md
├── workflows/
│   ├── DeepDive.md
│   ├── DCFModel.md
│   ├── MoatAssessment.md
│   ├── EarningsPreview.md
│   └── ValueScreen.md
└── tools/

SentimentAnalysis/                    # Market sentiment skill
├── SKILL.md
├── workflows/
│   ├── SentimentScan.md
│   ├── NewsCatalysts.md
│   ├── SocialMomentum.md
│   ├── ManipulationDetection.md
│   └── SmartMoneyTracking.md
└── tools/

MacroStrategy/                        # Macro & sector strategy skill
├── SKILL.md
├── workflows/
│   ├── MacroOutlook.md
│   ├── SectorRotation.md
│   ├── ThemeInvesting.md
│   ├── FedAnalysis.md
│   └── RecessionWatch.md
└── tools/

RiskManagement/                       # Risk & portfolio skill
├── SKILL.md
├── workflows/
│   ├── PortfolioRisk.md
│   ├── PositionSizing.md
│   ├── HedgeDesign.md
│   ├── StressTest.md
│   └── TailRisk.md
└── tools/

AITrading/                            # AI/LLM trading skill
├── SKILL.md
├── workflows/
│   ├── LLMScreening.md
│   ├── SentimentPipeline.md
│   ├── TradingAgent.md
│   ├── RAGSystem.md
│   └── PromptEngineering.md
└── tools/

CryptoAnalysis/                       # Crypto & correlation skill
├── SKILL.md
├── workflows/
│   ├── CorrelationScan.md
│   ├── CryptoStocks.md
│   ├── OnchainSignals.md
│   ├── DeFiAnalysis.md
│   └── WeekendPrediction.md
└── tools/

TaxStrategy/                          # Tax optimization skill (NEW)
├── SKILL.md
├── workflows/
│   ├── TaxLossHarvesting.md
│   ├── CapitalGainsStrategy.md
│   ├── RetirementContributions.md
│   ├── TaxEfficiencyAudit.md
│   └── YearEndPlanning.md
└── tools/

RealEstateInvesting/                  # Real estate skill (NEW)
├── SKILL.md
├── workflows/
│   ├── PropertyAnalysis.md
│   ├── REITScreening.md
│   ├── RentalROI.md
│   ├── MarketComparison.md
│   └── MortgageOptimization.md
└── tools/

PersonalFinance/                      # Personal finance basics (NEW)
├── SKILL.md
├── workflows/
│   ├── BudgetCreation.md
│   ├── CashFlowAnalysis.md
│   ├── DebtPayoff.md
│   ├── EmergencyFund.md
│   ├── NetWorthTracking.md
│   └── InsuranceReview.md
└── tools/

RetirementPlanning/                   # Retirement skill (NEW)
├── SKILL.md
├── workflows/
│   ├── RetirementProjection.md
│   ├── ContributionOptimization.md
│   ├── SocialSecurityStrategy.md
│   ├── DrawdownPlanning.md
│   └── RothConversion.md
└── tools/

EstatePlanning/                       # Estate planning skill (NEW)
├── SKILL.md
├── workflows/
│   ├── WillChecklist.md
│   ├── TrustAnalysis.md
│   ├── BeneficiaryReview.md
│   ├── GiftingStrategy.md
│   └── SuccessionPlanning.md
└── tools/
```

### Skill Count Summary

| Category | Skills | Status |
|----------|--------|--------|
| Investment Analysis | 7 | Transform from BMAD agents |
| Personal Finance | 5 | New creation |
| **Total** | **12** | |

---

## Data Source Integration

### Free Tier APIs

| Source | Purpose | Rate Limits | Integration |
|--------|---------|-------------|-------------|
| **yfinance** | Stock data, fundamentals, options | Unlimited | Python library |
| **Finnhub** | Real-time quotes, news, earnings | 60 calls/min free | REST API |
| **Alpaca** | Paper trading, market data | Unlimited paper | REST/WebSocket |
| **Alpha Vantage** | Technical indicators | 25 calls/day free | REST API |
| **FRED** | Economic data | 120 calls/min | REST API |
| **SEC EDGAR** | Company filings | Unlimited | REST API |
| **CoinGecko** | Crypto data | 10-50 calls/min | REST API |

### Tool Implementation Strategy

```typescript
// DataFetch.ts - Unified data interface
interface DataSource {
  getQuote(ticker: string): Promise<Quote>;
  getHistorical(ticker: string, period: string): Promise<OHLCV[]>;
  getFundamentals(ticker: string): Promise<Fundamentals>;
  getOptions(ticker: string): Promise<OptionsChain>;
  getNews(ticker: string): Promise<NewsItem[]>;
}

// Implementations
class YFinanceSource implements DataSource { ... }
class FinnhubSource implements DataSource { ... }
class AlpacaSource implements DataSource { ... }

// Smart routing based on data type and rate limits
class DataRouter {
  async fetch(request: DataRequest): Promise<DataResponse> {
    // Route to appropriate source based on request type
    // Handle rate limiting and fallbacks
  }
}
```

---

## Agent Profiles for Standup Mode

Each skill maps to a corresponding agent profile for multi-agent discussions:

### Investment Team

| Agent | Skill | Standup Role |
|-------|-------|--------------|
| **Quentin** | QuantAnalysis | "The numbers don't lie - here's what the data shows..." |
| **Warren** | FundamentalAnalysis | "Looking at the business fundamentals..." |
| **Sage** | SentimentAnalysis | "The market narrative is shifting..." |
| **Marcus** | MacroStrategy | "From a macro perspective, we need to consider..." |
| **Prudence** | RiskManagement | "Before we proceed, let me highlight the risks..." |
| **Nova** | AITrading | "My models are indicating..." |
| **Satoshi** | CryptoAnalysis | "On-chain data suggests..." |

### Personal Finance Team (NEW)

| Agent | Skill | Standup Role |
|-------|-------|--------------|
| **Taxley** | TaxStrategy | "From a tax efficiency standpoint..." |
| **Reginald** | RealEstateInvesting | "Looking at the real estate angle..." |
| **Penelope** | PersonalFinance | "Let's step back and look at the full financial picture..." |
| **Victor** | RetirementPlanning | "Considering your long-term retirement goals..." |
| **Estelle** | EstatePlanning | "For wealth preservation and transfer..." |

### Standup Workflow

```markdown
## Financial Standup Workflow

1. **Context Setting** - Present the topic/decision to be discussed
2. **Round Robin** - Each relevant agent provides perspective
3. **Debate** - Agents can challenge each other's views
4. **Risk Check** - Prudence always gets final risk assessment
5. **Synthesis** - Charles synthesizes recommendations
6. **Action Items** - Specific next steps with owners
```

---

## Enhancement Opportunities

### 1. Cross-Skill Orchestration

**Current State:** Each BMAD agent operates independently
**Enhanced State:** Skills can invoke each other

```markdown
## Example: Comprehensive Stock Analysis

User: "Should I buy NVDA?"

→ Finance skill orchestrates:
  1. FundamentalAnalysis/DeepDive.md → Business quality, valuation
  2. QuantAnalysis/ScreenOpportunities.md → Technical setup
  3. SentimentAnalysis/SentimentScan.md → Market sentiment
  4. MacroStrategy/ThemeInvesting.md → AI theme positioning
  5. RiskManagement/PositionSizing.md → How much to buy
  6. TaxStrategy/CapitalGainsStrategy.md → Tax implications

→ Synthesize into recommendation with confidence level
```

### 2. Portfolio Context Awareness

**New Capability:** Skills can reference your actual portfolio

```typescript
// Portfolio state stored in PAI
interface Portfolio {
  positions: Position[];
  cash: number;
  costBasis: Map<string, number>;
  taxLots: TaxLot[];
  targetAllocation: Allocation;
}

// Skills can access portfolio context
"Given your current 15% allocation to tech..."
"Considering you have $5,000 in unrealized losses in XYZ..."
```

### 3. Decision Journal Integration

**New Feature:** Track investment decisions and outcomes

```markdown
## Decision Journal Entry

**Date:** 2025-12-06
**Decision:** Buy 50 shares NVDA @ $140
**Thesis:** AI infrastructure demand + data center growth
**Agents Consulted:** Warren (bullish), Prudence (position size OK), Marcus (AI theme)
**Risk Factors:** High valuation, concentration in tech
**Review Date:** 2026-03-06
**Outcome:** [To be filled]
```

### 4. Watchlist & Alert System

**New Feature:** Proactive monitoring

```markdown
## Watchlist Integration

- Track stocks/crypto of interest
- Set price alerts, fundamental triggers
- Daily/weekly briefings from relevant agents
- Catalyst calendar integration
```

### 5. Backtesting Framework

**New Feature:** Test strategies before deploying capital

```typescript
// BacktestRunner.ts
interface BacktestConfig {
  strategy: Strategy;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  commissions: number;
  slippage: number;
}

interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  trades: Trade[];
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Establish core structure and transform existing agents

| Task | Priority | Effort |
|------|----------|--------|
| Create Finance/ orchestrator skill | P0 | 4h |
| Transform QuantAnalysis skill from Quentin | P0 | 3h |
| Transform FundamentalAnalysis from Warren | P0 | 3h |
| Transform SentimentAnalysis from Sage | P0 | 3h |
| Transform MacroStrategy from Marcus | P0 | 3h |
| Transform RiskManagement from Prudence | P0 | 3h |
| Transform AITrading from Nova | P0 | 3h |
| Transform CryptoAnalysis from Satoshi | P0 | 3h |
| Create DataFetch.ts tool (yfinance) | P0 | 4h |
| Create agent profiles for standup | P1 | 4h |

**Deliverable:** 8 working skills with data integration

### Phase 2: Personal Finance Expansion (Week 3-4)

**Goal:** Add missing personal finance domains

| Task | Priority | Effort |
|------|----------|--------|
| Create TaxStrategy skill | P0 | 4h |
| Create RealEstateInvesting skill | P1 | 4h |
| Create PersonalFinance skill | P0 | 4h |
| Create RetirementPlanning skill | P1 | 4h |
| Create EstatePlanning skill | P2 | 3h |
| Create new agent profiles | P1 | 3h |
| Integrate cross-skill workflows | P1 | 4h |

**Deliverable:** Full 12-skill suite

### Phase 3: Advanced Features (Week 5-6)

**Goal:** Add sophisticated capabilities

| Task | Priority | Effort |
|------|----------|--------|
| Portfolio tracking tool | P1 | 6h |
| Decision journal integration | P2 | 4h |
| Watchlist & alerts | P2 | 4h |
| Backtesting framework | P2 | 8h |
| Financial standup workflow | P1 | 4h |
| API rate limiting & caching | P1 | 4h |

**Deliverable:** Production-ready financial system

### Phase 4: Polish & Documentation (Week 7-8)

**Goal:** Ensure quality and usability

| Task | Priority | Effort |
|------|----------|--------|
| Comprehensive testing | P0 | 8h |
| Documentation & examples | P0 | 6h |
| Edge case handling | P1 | 4h |
| Performance optimization | P2 | 4h |
| User guide creation | P1 | 4h |

**Deliverable:** Release-ready system

---

## Skill Specifications

### Finance (Orchestrator) Skill

```yaml
---
name: Finance
description: Comprehensive financial analysis and personal finance orchestrator. USE WHEN user asks about stocks, investments, portfolio, taxes, real estate, retirement, budgeting, crypto, trading strategies, or any financial topic. Routes to specialized sub-skills.
---
```

**Workflows:**
- `StockAnalysis.md` - Comprehensive multi-skill stock analysis
- `PortfolioReview.md` - Full portfolio health assessment
- `InvestmentDecision.md` - Buy/sell/hold decision framework
- `FinancialStandup.md` - Multi-agent discussion facilitation
- `QuarterlyReview.md` - Periodic financial checkup

### QuantAnalysis Skill

```yaml
---
name: QuantAnalysis
description: Quantitative trading analysis including backtesting, technical indicators, ML predictions, options analysis, and statistical arbitrage. USE WHEN user mentions backtesting, technical analysis, quantitative screening, options pricing, volatility modeling, or algorithmic trading strategies.
---
```

**Enhanced from Quentin agent with:**
- yfinance/Finnhub data integration
- Actual Python code generation for strategies
- Integration with Alpaca paper trading
- Cross-reference with RiskManagement skill

### TaxStrategy Skill (NEW)

```yaml
---
name: TaxStrategy
description: Tax optimization strategies for investors including tax-loss harvesting, capital gains planning, retirement account optimization, and year-end tax planning. USE WHEN user mentions taxes, tax-loss harvesting, capital gains, tax efficiency, 1099, wash sale, or year-end planning.
---
```

**Workflows:**
- `TaxLossHarvesting.md` - Identify and execute tax-loss harvesting opportunities
- `CapitalGainsStrategy.md` - Short-term vs long-term planning
- `RetirementContributions.md` - 401k/IRA/HSA optimization
- `TaxEfficiencyAudit.md` - Review portfolio for tax efficiency
- `YearEndPlanning.md` - December tax optimization checklist
- `WashSaleMonitor.md` - Track wash sale violations

---

## Risk Considerations

### Technical Risks

| Risk | Mitigation |
|------|------------|
| API rate limiting | Implement caching, request queuing |
| Data accuracy | Cross-reference multiple sources |
| Skill complexity | Modular design, clear interfaces |
| Performance | Lazy loading, parallel execution |

### Financial Risks (Disclaimer)

```markdown
## IMPORTANT DISCLAIMER

This financial skills suite provides analysis tools and educational information only.
It does NOT provide:
- Financial advice
- Tax advice
- Legal advice
- Investment recommendations

All investment decisions should be made in consultation with qualified professionals.
Past performance does not guarantee future results.
You could lose money investing.

The user accepts full responsibility for all financial decisions.
```

---

## Success Metrics

### Quantitative

- [ ] All 12 skills created and working
- [ ] All workflows documented with examples
- [ ] Agent profiles for standup discussions
- [ ] Data integration with 3+ free sources
- [ ] <5 second response time for most queries

### Qualitative

- [ ] Can answer "Should I buy X?" comprehensively
- [ ] Can run financial standup discussions
- [ ] Provides actionable, specific recommendations
- [ ] Considers tax implications automatically
- [ ] Maintains consistent persona across interactions

---

## Next Steps

1. **Review this plan** - Confirm scope, priorities, and approach
2. **Create Finance skill** - Start with orchestrator
3. **Transform first skill** - QuantAnalysis as proof of concept
4. **Build DataFetch tool** - Enable real data integration
5. **Iterate** - Build remaining skills incrementally

---

## Appendix A: Full Workflow Inventory

### From BMAD Agents (56 workflows to transform)

**QuantAnalysis (8):** analyze-stock, backtest-strategy, screen-opportunities, options-analysis, risk-assessment, correlation-matrix, ml-prediction, volatility-forecast

**FundamentalAnalysis (8):** deep-dive, value-screen, earnings-preview, sector-analysis, moat-assessment, dcf-model, financial-health, management-quality

**SentimentAnalysis (8):** sentiment-scan, news-catalyst, social-momentum, earnings-sentiment, media-manipulation, sentiment-screen, smart-money, contrarian-signals

**MacroStrategy (8):** macro-outlook, sector-rotation, theme-investing, fed-analysis, recession-watch, inflation-trades, geographic-allocation, intermarket-analysis

**RiskManagement (8):** portfolio-analysis, position-sizing, hedge-design, stress-test, risk-budget, correlation-risk, black-swan, rebalance-strategy

**AITrading (8):** llm-screening, ai-analysis, sentiment-pipeline, trading-agent, prompt-engineering, rag-system, ai-backtest, multi-agent

**CryptoAnalysis (8):** correlation-scan, crypto-stocks, onchain-signals, defi-analysis, weekend-prediction, mining-stocks, stablecoin-flows, arb-opportunities

### New Workflows (25+)

**TaxStrategy (6):** tax-loss-harvesting, capital-gains-strategy, retirement-contributions, tax-efficiency-audit, year-end-planning, wash-sale-monitor

**RealEstateInvesting (5):** property-analysis, reit-screening, rental-roi, market-comparison, mortgage-optimization

**PersonalFinance (6):** budget-creation, cash-flow-analysis, debt-payoff, emergency-fund, net-worth-tracking, insurance-review

**RetirementPlanning (5):** retirement-projection, contribution-optimization, social-security-strategy, drawdown-planning, roth-conversion

**EstatePlanning (5):** will-checklist, trust-analysis, beneficiary-review, gifting-strategy, succession-planning

---

## Appendix B: Agent Persona Details

### New Agent: Taxley (Tax Strategist)

```yaml
persona:
  name: Taxley
  icon: "🧾"
  role: Tax Optimization Strategist
  identity: |
    Former Big 4 tax partner turned personal finance advisor with deep expertise in
    investment taxation. Specializes in tax-loss harvesting, capital gains optimization,
    and retirement account strategies. Known for finding legal tax savings that most
    people overlook. Expert in wash sale rules, qualified dividends, and tax-efficient
    fund placement.
  principles:
    - "A dollar saved in taxes is a dollar earned"
    - Tax-loss harvesting is free money when done correctly
    - Asset location matters as much as asset allocation
    - The wash sale rule has teeth - respect it
    - Long-term gains beat short-term gains every time
    - Roth conversions can be powerful in low-income years
```

### New Agent: Penelope (Personal Finance)

```yaml
persona:
  name: Penelope
  icon: "💰"
  role: Personal Finance Strategist
  identity: |
    Certified Financial Planner with expertise in comprehensive financial planning.
    Focuses on the fundamentals: budgeting, cash flow, emergency funds, and building
    a solid financial foundation. Believes complex investments mean nothing without
    strong financial basics. Former teacher who excels at making finance accessible.
  principles:
    - "Pay yourself first - always"
    - Emergency fund before investments
    - Budget is not a restriction, it's a plan
    - Cash flow is the foundation of wealth
    - Automate good habits, require effort for bad ones
    - Lifestyle inflation is the enemy of wealth building
```

---

*Document Version: 1.0*
*Last Updated: 2025-12-06*
