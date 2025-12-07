---
name: CryptoAnalysis
description: Cryptocurrency analysis including on-chain metrics, crypto-stock correlations, DeFi analytics, and mining economics. USE WHEN user mentions crypto, Bitcoin, Ethereum, on-chain, DeFi, crypto stocks, mining, or cryptocurrency correlation with traditional markets.
---

# CryptoAnalysis

**Bridge crypto and traditional markets.** Analyzes cryptocurrency markets, on-chain data, and correlations with equity markets to identify opportunities across asset classes.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName CryptoAnalysis
```

| Workflow | Trigger | File |
|----------|---------|------|
| **CorrelationScan** | "crypto correlation", "bitcoin vs stocks" | `workflows/CorrelationScan.md` |
| **CryptoStocks** | "crypto stocks", "MSTR", "COIN", "miners" | `workflows/CryptoStocks.md` |
| **OnchainSignals** | "on-chain", "whale activity", "exchange flows" | `workflows/OnchainSignals.md` |
| **DeFiAnalysis** | "DeFi", "yield", "TVL" | `workflows/DeFiAnalysis.md` |
| **WeekendPrediction** | "weekend crypto", "Monday prediction" | `workflows/WeekendPrediction.md` |
| **MiningStocks** | "mining stocks", "miners", "hash rate" | `workflows/MiningStocks.md` |
| **StablecoinFlows** | "stablecoin", "USDT", "USDC flows" | `workflows/StablecoinFlows.md` |
| **ArbOpportunities** | "crypto arbitrage", "GBTC premium" | `workflows/ArbOpportunities.md` |

## Examples

**Example 1: Crypto-stock correlation**
```
User: "How correlated is Bitcoin with tech stocks?"
→ Invokes CorrelationScan workflow
→ Calculates rolling correlations
→ Identifies regime changes
→ Returns correlation analysis with trading implications
```

**Example 2: Crypto-exposed equities**
```
User: "What are the best crypto stocks to own?"
→ Invokes CryptoStocks workflow
→ Analyzes MSTR, COIN, miners
→ Compares pure-play vs indirect exposure
→ Returns ranked list with thesis
```

**Example 3: On-chain intelligence**
```
User: "What are whales doing with Bitcoin?"
→ Invokes OnchainSignals workflow
→ Analyzes exchange flows, whale wallets
→ Interprets accumulation/distribution
→ Returns on-chain sentiment with signals
```

## Crypto-Equity Correlation Framework

### Correlation Regimes

| Regime | BTC-NASDAQ Correlation | Interpretation |
|--------|------------------------|----------------|
| Risk-On | 0.6 - 0.8 | BTC acts as risk asset |
| Transition | 0.3 - 0.6 | Mixed signals |
| Decoupling | 0.0 - 0.3 | BTC independent |
| Risk-Off | -0.2 - 0.2 | Potential safe haven |

### Key Relationships
```
Crypto-Equity Map
├── Direct Exposure
│   ├── MSTR: ~2x levered Bitcoin
│   ├── COIN: Exchange + custody
│   ├── RIOT, MARA: Bitcoin miners
│   └── SQ, PYPL: Payment + holdings
├── Indirect Exposure
│   ├── NVDA, AMD: Mining hardware
│   ├── CME: Futures volume
│   └── Banks: Trading desks
└── Correlation Trading
    ├── Weekend BTC → Monday equities
    ├── BTC volatility → Tech volatility
    └── Stablecoin flows → Risk appetite
```

## On-Chain Metrics

### Supply Dynamics
| Metric | Bullish Signal | Bearish Signal |
|--------|---------------|----------------|
| Exchange Balance | Decreasing | Increasing |
| Long-term Holder Supply | Increasing | Decreasing |
| Miner Reserves | Stable/Increasing | Rapid selling |

### Activity Metrics
| Metric | Purpose |
|--------|---------|
| Active Addresses | Network usage |
| Transaction Volume | Economic activity |
| NVT Ratio | Valuation relative to activity |
| MVRV | Market value vs realized value |

### Whale Watching
- Transactions >$10M
- Exchange deposits/withdrawals
- Known fund wallets
- Old coins moving (coin days destroyed)

## Crypto-Exposed Stocks

### Tier 1: Direct Bitcoin Exposure
| Ticker | Exposure Type | BTC Beta |
|--------|--------------|----------|
| MSTR | Treasury holdings | ~2.0x |
| COIN | Exchange revenue | ~1.5x |
| RIOT | Mining | ~1.5x |
| MARA | Mining | ~1.5x |

### Tier 2: Infrastructure
| Ticker | Exposure Type |
|--------|--------------|
| NVDA | GPU demand |
| AMD | GPU demand |
| SQ | Cash App + holdings |
| PYPL | Crypto services |

### Tier 3: Financial
| Ticker | Exposure Type |
|--------|--------------|
| CME | Futures trading |
| HOOD | Retail crypto |
| Various banks | Trading desks |

## Weekend Prediction Framework

```
Weekend Crypto → Monday Equity Correlation

Strong Signals:
- BTC +5% weekend → Crypto stocks +3-4% Monday
- BTC -5% weekend → Tech futures negative Sunday
- High volume weekend → Signal more reliable
- Low volume → Often reverses

Trading Rules:
- >+10% weekend: Buy crypto miners pre-market
- +5-10% weekend: Buy MSTR, COIN at open
- -5-10% weekend: Hedge tech exposure
- <-10% weekend: Risk-off across all markets

False Signal Filters:
- Holiday weekends less predictive
- Single-exchange moves (manipulation)
- Low volume weekends
```

## Data Sources

- **CoinGecko:** Price, volume, market cap (via DataFetch)
- **Glassnode:** On-chain metrics (if available)
- **DeFi Llama:** TVL, protocol metrics
- **Exchange APIs:** Order book, funding rates

## Integration

- **Research Skill:** For crypto news and analysis
- **QuantAnalysis:** For correlation calculations
- **MacroStrategy:** For macro-crypto relationships
- **RiskManagement:** For crypto position sizing
