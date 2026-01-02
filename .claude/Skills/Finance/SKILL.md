---
name: Finance
description: Comprehensive financial analysis and personal finance orchestrator. USE WHEN user asks about stocks, investments, portfolio, taxes, real estate, retirement, budgeting, crypto, trading strategies, financial planning, or any money-related topic. Routes to specialized sub-skills and coordinates multi-agent financial discussions.
---

# Finance

**Your complete financial team in one skill.** Orchestrates specialized financial analysis skills and coordinates multi-agent discussions for comprehensive investment decisions.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName Finance
```

| Workflow | Trigger | File |
|----------|---------|------|
| **StockAnalysis** | "analyze stock", "should I buy", "stock research" | `workflows/StockAnalysis.md` |
| **PortfolioReview** | "review portfolio", "portfolio health", "check my positions" | `workflows/PortfolioReview.md` |
| **InvestmentDecision** | "buy or sell", "investment decision", "trade recommendation" | `workflows/InvestmentDecision.md` |
| **FinancialStandup** | "financial standup", "investment team meeting", "agent discussion" | `workflows/FinancialStandup.md` |
| **QuarterlyReview** | "quarterly review", "financial checkup", "periodic review" | `workflows/QuarterlyReview.md` |
| **CompanyResearch** | "research company", "find companies", "sector research" | `workflows/CompanyResearch.md` |

## Examples

**Example 1: Comprehensive stock analysis**
```
User: "Should I buy NVDA?"
→ Invokes StockAnalysis workflow
→ Orchestrates: FundamentalAnalysis + QuantAnalysis + SentimentAnalysis + MacroStrategy + RiskManagement
→ Leverages Research skill for current data gathering
→ Returns comprehensive buy/hold/sell recommendation with confidence level
```

**Example 2: Portfolio health check**
```
User: "Review my portfolio"
→ Invokes PortfolioReview workflow
→ Analyzes positions via RiskManagement skill
→ Checks tax efficiency via TaxStrategy skill
→ Identifies rebalancing opportunities
→ Returns portfolio scorecard with action items
```

**Example 3: Multi-agent investment discussion**
```
User: "Let's have a standup about my tech allocation"
→ Invokes FinancialStandup workflow
→ Loads relevant agent profiles (Quentin, Warren, Marcus, Prudence)
→ Each agent provides perspective on tech allocation
→ Debate and synthesis
→ Returns consensus recommendation with dissenting views noted
```

**Example 4: Research-driven company discovery**
```
User: "Find good nuclear energy companies"
→ Invokes CompanyResearch workflow
→ MacroStrategy defines investment theme criteria
→ Research skill does parallel web research
→ FundamentalAnalysis screens candidates
→ Returns ranked list with investment thesis for each
```

## Skill Architecture

### Sub-Skills (Investment Analysis)

| Skill | Domain | Key Workflows |
|-------|--------|---------------|
| **QuantAnalysis** | Technical/quantitative analysis | Backtest, OptionsAnalysis, MLPrediction |
| **FundamentalAnalysis** | Company valuation | DeepDive, DCFModel, MoatAssessment |
| **SentimentAnalysis** | Market sentiment | SentimentScan, NewsCatalysts, SocialMomentum |
| **MacroStrategy** | Macro/sector analysis | MacroOutlook, SectorRotation, ThemeInvesting |
| **RiskManagement** | Risk/portfolio | PortfolioRisk, PositionSizing, HedgeDesign |
| **AITrading** | AI/LLM strategies | LLMScreening, TradingAgent, RAGSystem |
| **CryptoAnalysis** | Crypto markets | CorrelationScan, OnchainSignals, DeFiAnalysis |

### Sub-Skills (Personal Finance)

| Skill | Domain | Key Workflows |
|-------|--------|---------------|
| **TaxStrategy** | Tax optimization | TaxLossHarvesting, CapitalGainsStrategy |
| **RealEstateInvesting** | Property investment | PropertyAnalysis, REITScreening |
| **PersonalFinance** | Budgeting/basics | BudgetCreation, CashFlowAnalysis |
| **RetirementPlanning** | Retirement | RetirementProjection, RothConversion |
| **EstatePlanning** | Estate/wealth transfer | WillChecklist, TrustAnalysis |

## PAI Skill Integration

This skill leverages existing PAI capabilities:

| PAI Skill | Integration |
|-----------|-------------|
| **Research** | Multi-source parallel research for company/market data |
| **Fabric** | 242+ patterns for analysis (analyze_paper, extract_wisdom) |
| **BrightData** | Scraping financial sites with bot protection |
| **Art** | Portfolio visualizations, charts, diagrams |

### Integration Pattern

```
User Request
    ↓
Finance Skill (this orchestrator)
    ↓
┌─────────────────────────────────────┐
│ 1. Route to appropriate workflow    │
│ 2. Invoke Research skill for data   │
│ 3. Apply domain sub-skills          │
│ 4. Synthesize recommendations       │
└─────────────────────────────────────┘
    ↓
Actionable output with confidence level
```

## Agent Profiles for Standup Mode

Located in `agents/` directory:

### Investment Team
- **Quentin** - Quantitative analyst (📊)
- **Warren** - Fundamental analyst (💼)
- **Sage** - Sentiment analyst (📰)
- **Marcus** - Macro strategist (🌍)
- **Prudence** - Risk manager (🛡️)
- **Nova** - AI trading strategist (🤖)
- **Satoshi** - Crypto analyst (₿)

### Personal Finance Team
- **Taxley** - Tax strategist (🧾)
- **Reginald** - Real estate analyst (🏠)
- **Penelope** - Personal finance advisor (💰)
- **Victor** - Retirement planner (🎯)
- **Estelle** - Estate planner (📜)

## Tools

| Tool | Purpose |
|------|---------|
| `DataFetch.ts` | Unified interface to yfinance, Finnhub, Alpaca |
| `PortfolioTracker.ts` | Track positions, cost basis, tax lots |
| `BacktestRunner.ts` | Run strategy backtests |

## Data Sources (Free Tier)

| Source | Data Type | Rate Limit |
|--------|-----------|------------|
| yfinance | Quotes, fundamentals, options | Unlimited |
| Finnhub | Real-time, news, earnings | 60/min |
| Alpaca | Paper trading, market data | Unlimited |
| FRED | Economic indicators | 120/min |
| SEC EDGAR | Company filings | Unlimited |
| CoinGecko | Crypto data | 10-50/min |

## Important Disclaimer

```
This skill provides analysis tools and educational information only.
It does NOT provide financial, tax, or legal advice.
All investment decisions should be made in consultation with qualified professionals.
Past performance does not guarantee future results.
You could lose money investing.
```
