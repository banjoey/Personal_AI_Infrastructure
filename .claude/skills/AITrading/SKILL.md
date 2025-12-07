---
name: AITrading
description: AI and LLM-powered trading strategies including automated analysis systems, RAG for market intelligence, sentiment pipelines, and prompt engineering for finance. USE WHEN user mentions AI trading, LLM analysis, automated trading, RAG system, sentiment pipeline, or using AI for stock analysis.
---

# AITrading

**Leverage AI to gain an analytical edge.** Designs and implements AI-powered trading systems using LLMs, machine learning, and automated pipelines for market analysis.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName AITrading
```

| Workflow | Trigger | File |
|----------|---------|------|
| **LLMScreening** | "AI screening", "LLM stock screen" | `workflows/LLMScreening.md` |
| **AIAnalysis** | "AI analysis system", "automated analysis" | `workflows/AIAnalysis.md` |
| **SentimentPipeline** | "sentiment pipeline", "NLP analysis" | `workflows/SentimentPipeline.md` |
| **TradingAgent** | "trading bot", "autonomous agent" | `workflows/TradingAgent.md` |
| **PromptEngineering** | "financial prompts", "optimize prompts" | `workflows/PromptEngineering.md` |
| **RAGSystem** | "RAG", "market intelligence system" | `workflows/RAGSystem.md` |
| **AIBacktest** | "backtest AI strategy" | `workflows/AIBacktest.md` |
| **MultiAgent** | "multi-agent", "agent collaboration" | `workflows/MultiAgent.md` |

## Examples

**Example 1: AI-powered screening**
```
User: "Design an LLM screening system for value stocks"
→ Invokes LLMScreening workflow
→ Designs multi-stage prompt pipeline
→ Creates scoring rubric
→ Returns system architecture with prompts
```

**Example 2: Sentiment pipeline**
```
User: "Build a sentiment analysis pipeline for earnings calls"
→ Invokes SentimentPipeline workflow
→ Designs extraction prompts
→ Creates scoring system
→ Returns pipeline code and prompts
```

**Example 3: RAG for market intelligence**
```
User: "How would I build a RAG system for SEC filings?"
→ Invokes RAGSystem workflow
→ Designs document processing
→ Creates retrieval strategy
→ Returns architecture with implementation guide
```

## AI/LLM Applications in Finance

### Document Analysis
- 10-K/10-Q parsing and summarization
- Earnings call transcript analysis
- News article processing
- Research report extraction

### Sentiment Analysis
- News sentiment scoring
- Social media analysis
- Management tone detection
- Analyst report sentiment

### Screening & Scoring
- Multi-factor LLM scoring
- Narrative change detection
- Hidden catalyst identification
- Risk factor extraction

### Automation
- Alert generation
- Report creation
- Data pipeline orchestration
- Decision support systems

## Model Selection Guide

| Task | Recommended Model | Why |
|------|------------------|-----|
| Complex reasoning | Claude/GPT-4 | Best analytical capability |
| Long documents | Claude (100k+) | Extended context |
| Bulk processing | Llama/Mistral | Cost-effective |
| Sentiment | FinBERT | Finance-specialized |
| Tabular data | TabNet/XGBoost | Structured data |

## Prompt Engineering for Finance

### Structured Analysis Prompt
```
Role: You are a senior equity analyst with 20 years experience
Context: Analyzing {company} in {sector} sector
Data: {financial_data}

Task: Perform the following analysis:
1. Calculate key ratios (P/E, EV/EBITDA, ROIC)
2. Compare to sector medians
3. Identify red flags or strengths
4. Provide investment recommendation

Format:
- Summary (2 sentences)
- Detailed Analysis (bullet points)
- Recommendation (Buy/Hold/Sell with PT)
- Risks (top 3)
```

### Chain-of-Thought for Complex Reasoning
```
Analyze {company} step by step:

Step 1: What is their competitive advantage?
Step 2: Is this advantage sustainable?
Step 3: How does this translate to financial performance?
Step 4: What could disrupt this thesis?

Think through each step before concluding.
```

## RAG Architecture

```
Market Intelligence RAG System
├── Document Ingestion
│   ├── SEC filings (EDGAR API)
│   ├── News feeds (RSS, APIs)
│   ├── Earnings transcripts
│   └── Research reports
├── Processing Pipeline
│   ├── Chunking strategy
│   ├── Embedding generation
│   └── Metadata extraction
├── Vector Store
│   ├── Pinecone / Weaviate / Chroma
│   └── Hybrid search (semantic + keyword)
├── Retrieval
│   ├── Query understanding
│   ├── Multi-query generation
│   └── Relevance reranking
└── Generation
    ├── Context assembly
    ├── Prompt template
    └── Response synthesis
```

## Safety Mechanisms for Trading AI

1. **Human Oversight** - No fully autonomous execution
2. **Position Limits** - Hard caps on any AI recommendation
3. **Circuit Breakers** - Pause on unusual activity
4. **Audit Trail** - Full logging of decisions
5. **Backtesting Required** - No live trading without testing
6. **Ensemble Validation** - Multiple models must agree

## Integration

- **Research Skill:** For data gathering
- **All Analysis Skills:** AI enhances, doesn't replace
- **RiskManagement:** Safety checks on AI recommendations
