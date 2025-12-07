---
name: SentimentAnalysis
description: Market sentiment and news analysis including social media tracking, earnings call tone, news catalysts, and manipulation detection. USE WHEN user mentions sentiment, news analysis, social media buzz, Reddit, Twitter, earnings call, analyst ratings, or market narrative.
---

# SentimentAnalysis

**Read the market's mood before it moves.** Analyzes sentiment across news, social media, earnings calls, and institutional behavior to identify opportunities and risks.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName SentimentAnalysis
```

| Workflow | Trigger | File |
|----------|---------|------|
| **SentimentScan** | "sentiment analysis", "market sentiment" | `workflows/SentimentScan.md` |
| **NewsCatalysts** | "news catalysts", "upcoming events" | `workflows/NewsCatalysts.md` |
| **SocialMomentum** | "social sentiment", "Reddit", "Twitter buzz" | `workflows/SocialMomentum.md` |
| **EarningsSentiment** | "earnings call", "management tone" | `workflows/EarningsSentiment.md` |
| **ManipulationDetection** | "pump and dump", "manipulation" | `workflows/ManipulationDetection.md` |
| **SmartMoneyTracking** | "smart money", "institutional", "13F" | `workflows/SmartMoneyTracking.md` |
| **ContrarianSignals** | "contrarian", "extreme sentiment" | `workflows/ContrarianSignals.md` |

## Examples

**Example 1: Comprehensive sentiment scan**
```
User: "What's the sentiment on Tesla?"
→ Invokes SentimentScan workflow
→ Analyzes news, social, institutional sentiment
→ Scores across multiple dimensions
→ Returns sentiment score with key narratives
```

**Example 2: Social media momentum**
```
User: "What's trending on Reddit for stocks?"
→ Invokes SocialMomentum workflow
→ Tracks r/wallstreetbets, r/stocks mentions
→ Identifies viral stocks
→ Returns momentum list with sentiment scores
```

**Example 3: Manipulation check**
```
User: "Is this stock being pumped?"
→ Invokes ManipulationDetection workflow
→ Checks for red flags
→ Analyzes promotion patterns
→ Returns risk assessment
```

## Sentiment Sources

### News Sentiment
- Financial news (Bloomberg, Reuters, CNBC)
- Press releases
- Analyst reports
- Upgrade/downgrade actions

### Social Sentiment
- Reddit (r/wallstreetbets, r/stocks, r/investing)
- Twitter/X (FinTwit)
- StockTwits
- Discord/Telegram groups

### Institutional Sentiment
- 13F filings (hedge fund positions)
- Insider transactions
- Options flow
- Dark pool activity

### Technical Sentiment
- Put/call ratios
- Short interest
- Fund flows
- Volatility indices

## Sentiment Scoring Framework

```
Sentiment Analysis: [Ticker]
├── Overall Score: X/10
├── News Sentiment
│   ├── Volume: [High/Normal/Low]
│   ├── Tone: [Positive/Neutral/Negative]
│   └── Score: X/10
├── Social Sentiment
│   ├── Buzz Level: [Viral/High/Normal/Low]
│   ├── Tone: [Bullish/Mixed/Bearish]
│   └── Score: X/10
├── Institutional Sentiment
│   ├── Smart Money: [Buying/Neutral/Selling]
│   ├── Insider Activity: [Buying/Neutral/Selling]
│   └── Score: X/10
├── Technical Sentiment
│   ├── Put/Call Ratio: X.XX
│   ├── Short Interest: X%
│   └── Score: X/10
└── Key Narratives
    ├── Bull: [Primary bullish narrative]
    └── Bear: [Primary bearish narrative]
```

## Contrarian Framework

| Indicator | Extreme Bullish (Sell Signal) | Extreme Bearish (Buy Signal) |
|-----------|------------------------------|------------------------------|
| Put/Call Ratio | <0.5 | >1.2 |
| AAII Bulls | >60% | <20% |
| VIX | <12 | >35 |
| News Sentiment | >0.8 | <0.2 |
| Social Buzz | Euphoric | Despair |

## Manipulation Red Flags

1. Sudden spike in promotional content
2. Coordinated social media campaigns
3. Paid articles without disclosure
4. Anonymous "research" with extreme claims
5. Unusual options activity before news
6. Pattern of press releases without substance
7. Low float with high social buzz
8. History of reverse splits/dilution

## Integration

- **Research Skill:** For gathering news and social data
- **QuantAnalysis:** For options flow interpretation
- **RiskManagement:** For position sizing based on sentiment extremes
