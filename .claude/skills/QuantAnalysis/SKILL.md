---
name: QuantAnalysis
description: Quantitative trading analysis including backtesting, technical indicators, ML predictions, options analysis, and statistical arbitrage. USE WHEN user mentions backtesting, technical analysis, quantitative screening, options pricing, volatility modeling, algorithmic trading, RSI, MACD, moving averages, or statistical patterns.
---

# QuantAnalysis

**Data-driven trading analysis with statistical rigor.** Transforms market data into actionable signals using technical indicators, machine learning, and options analytics.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName QuantAnalysis
```

| Workflow | Trigger | File |
|----------|---------|------|
| **StockAnalysis** | "technical analysis on", "quant analysis of" | `workflows/StockAnalysis.md` |
| **Backtest** | "backtest strategy", "test trading system" | `workflows/Backtest.md` |
| **ScreenOpportunities** | "screen for stocks", "find opportunities" | `workflows/ScreenOpportunities.md` |
| **OptionsAnalysis** | "options analysis", "options chain", "calls/puts" | `workflows/OptionsAnalysis.md` |
| **MLPrediction** | "predict price", "ML model", "machine learning" | `workflows/MLPrediction.md` |
| **VolatilityForecast** | "volatility forecast", "GARCH", "implied vol" | `workflows/VolatilityForecast.md` |
| **CorrelationMatrix** | "correlation analysis", "correlation matrix" | `workflows/CorrelationMatrix.md` |

## Examples

**Example 1: Technical stock analysis**
```
User: "Give me a technical analysis of TSLA"
→ Invokes StockAnalysis workflow
→ Calculates RSI, MACD, moving averages, Bollinger Bands
→ Identifies support/resistance levels
→ Returns technical score with entry/exit recommendations
```

**Example 2: Strategy backtesting**
```
User: "Backtest a momentum strategy on SPY"
→ Invokes Backtest workflow
→ Defines entry/exit rules
→ Runs historical simulation with transaction costs
→ Returns Sharpe ratio, max drawdown, win rate
```

**Example 3: Options opportunity**
```
User: "Analyze AAPL options for next month"
→ Invokes OptionsAnalysis workflow
→ Pulls options chain via DataFetch
→ Calculates implied volatility, Greeks
→ Identifies mispriced options or strategy opportunities
```

## Technical Indicators

### Trend Indicators
- Moving Averages (SMA, EMA, WMA)
- MACD (Moving Average Convergence Divergence)
- ADX (Average Directional Index)
- Parabolic SAR

### Momentum Indicators
- RSI (Relative Strength Index)
- Stochastic Oscillator
- Williams %R
- Rate of Change (ROC)

### Volatility Indicators
- Bollinger Bands
- ATR (Average True Range)
- Keltner Channels
- Historical Volatility

### Volume Indicators
- On-Balance Volume (OBV)
- Volume Profile
- Accumulation/Distribution
- Money Flow Index (MFI)

## Analysis Framework

```
Technical Analysis Output:
├── Trend Analysis
│   ├── Primary trend: [Bullish/Bearish/Sideways]
│   ├── Trend strength: [Strong/Moderate/Weak]
│   └── Key moving averages: [Above/Below]
├── Momentum
│   ├── RSI: [Value] → [Overbought/Neutral/Oversold]
│   ├── MACD: [Signal line cross status]
│   └── Momentum score: X/10
├── Support/Resistance
│   ├── Key support: $X, $Y
│   ├── Key resistance: $X, $Y
│   └── Current position in range
├── Volume Analysis
│   ├── Volume trend: [Increasing/Decreasing]
│   └── Volume confirmation: [Yes/No]
└── Recommendation
    ├── Technical score: X/10
    ├── Entry zone: $X - $Y
    ├── Stop-loss: $X
    └── Target: $X
```

## Trading Strategies

### Momentum Strategies
- Breakout trading
- Moving average crossovers
- Relative strength rotation

### Mean Reversion
- RSI oversold/overbought
- Bollinger Band bounces
- Statistical arbitrage

### Options Strategies
- Covered calls
- Cash-secured puts
- Spreads (vertical, calendar, diagonal)
- Iron condors
- Straddles/strangles

## Data Sources

Uses Finance/DataFetch tool for:
- Real-time and historical prices (yfinance)
- Options chains (yfinance)
- Volume data
- Technical indicator calculations

## Integration

- **Research Skill:** For gathering market context
- **RiskManagement:** For position sizing
- **Finance Orchestrator:** For comprehensive analysis
