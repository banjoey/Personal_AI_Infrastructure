---
name: RiskManagement
description: Portfolio risk assessment and position sizing including VaR analysis, stress testing, hedging strategies, and tail risk management. USE WHEN user mentions risk, position sizing, portfolio risk, hedging, stop-loss, drawdown, VaR, diversification, or portfolio construction.
---

# RiskManagement

**Protect the downside, the upside takes care of itself.** Provides comprehensive risk assessment, position sizing, and portfolio construction guidance to preserve capital while capturing opportunities.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName RiskManagement
```

| Workflow | Trigger | File |
|----------|---------|------|
| **PortfolioRisk** | "portfolio risk", "risk assessment" | `workflows/PortfolioRisk.md` |
| **PositionSizing** | "position size", "how much to buy" | `workflows/PositionSizing.md` |
| **HedgeDesign** | "hedge", "protect portfolio" | `workflows/HedgeDesign.md` |
| **StressTest** | "stress test", "scenario analysis" | `workflows/StressTest.md` |
| **RiskBudget** | "risk budget", "risk allocation" | `workflows/RiskBudget.md` |
| **CorrelationRisk** | "correlation", "concentration risk" | `workflows/CorrelationRisk.md` |
| **TailRisk** | "tail risk", "black swan", "crash protection" | `workflows/TailRisk.md` |
| **Rebalance** | "rebalance", "rebalancing strategy" | `workflows/Rebalance.md` |

## Examples

**Example 1: Position sizing**
```
User: "How much NVDA should I buy?"
→ Invokes PositionSizing workflow
→ Analyzes volatility, correlation, conviction
→ Applies Kelly Criterion and risk limits
→ Returns specific share count and dollar amount
```

**Example 2: Portfolio stress test**
```
User: "How would my portfolio do in a crash?"
→ Invokes StressTest workflow
→ Simulates 2008, COVID, rate shock scenarios
→ Calculates potential losses
→ Returns stress test results with hedging suggestions
```

**Example 3: Hedging strategy**
```
User: "How can I protect my tech positions?"
→ Invokes HedgeDesign workflow
→ Analyzes exposure and options available
→ Designs protective strategy
→ Returns hedge recommendation with costs
```

## Risk Metrics

### Portfolio-Level
| Metric | Formula | Target |
|--------|---------|--------|
| Portfolio Volatility | Weighted avg of position vols + correlation | Context-dependent |
| Value at Risk (95%) | 5% probability of exceeding | <5% of portfolio |
| Maximum Drawdown | Largest peak-to-trough decline | <20% |
| Sharpe Ratio | (Return - Rf) / Volatility | >1.0 |
| Sortino Ratio | (Return - Rf) / Downside Vol | >1.5 |

### Position-Level
| Metric | Purpose |
|--------|---------|
| Position Volatility | Individual stock risk |
| Beta | Market sensitivity |
| Correlation | Relationship to portfolio |
| Liquidity | Ability to exit |

## Position Sizing Framework

### Methods

**1. Kelly Criterion**
```
Kelly % = (Win% × Avg Win - Loss% × Avg Loss) / Avg Win
Practical: Use 25-50% of full Kelly
```

**2. Risk-Based Sizing**
```
Position Size = (Portfolio × Risk%) / (Entry - Stop)
Example: $100K × 2% / ($50 - $45) = 400 shares
```

**3. Volatility-Based**
```
Position Size = (Portfolio × Target Vol%) / Stock Volatility
```

**4. Conviction-Weighted**
| Conviction | Position Size |
|------------|---------------|
| High | 5-10% |
| Medium | 2-5% |
| Low/Speculative | 0.5-2% |

## Portfolio Construction

### Risk Parity
Equal risk contribution from each position:
```
Weight_i = (1/Vol_i) / Σ(1/Vol_j)
```

### Core-Satellite
- **Core (70-80%):** Index funds, blue chips
- **Satellite (20-30%):** Active bets, thematics

### Barbell Strategy
- **90% Safe:** Treasury, cash, low-vol
- **10% High Risk:** Speculative, high-conviction

## Stress Test Scenarios

| Scenario | Impact Assumptions |
|----------|-------------------|
| Market Crash (-30%) | Equities -30%, bonds +5%, gold +10% |
| Rate Shock (+200bps) | Duration × -2%, banks benefit |
| Recession | Cyclicals -40%, defensives -10% |
| Inflation Spike | Growth stocks -25%, commodities +15% |
| Liquidity Crisis | All correlations → 1, credit spreads blow out |

## Hedging Strategies

### Equity Hedges
- SPY/QQQ puts
- VIX calls
- Inverse ETFs (short-term only)
- Sector puts

### Single Stock Hedges
- Protective puts
- Collars (sell call to fund put)
- Put spreads (reduce cost)

### Tail Risk Hedges
- Far OTM puts (cheap insurance)
- Long volatility (VIX calls)
- Managed futures
- Gold allocation

## Integration

- **QuantAnalysis:** For volatility and correlation data
- **Finance Orchestrator:** Always consulted for major decisions
- **All Skills:** Provides risk guardrails
