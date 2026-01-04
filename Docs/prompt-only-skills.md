# Prompt-Only Skills Analysis

**Date:** 2025-12-25
**Purpose:** Identify skills without CLI tools for Phase 4 tool creation prioritization

## Skills Without `tools/` Directory

Total: 47 skills

### Category 1: Use External Tools (Not Truly Prompt-Only)

These skills don't have a `tools/` dir but use MCP, kubectl, or other external CLIs:

| Skill | External Tool | Notes |
|-------|---------------|-------|
| Unifi | MCP (unifi) | Full MCP integration |
| Cloudflare | MCP (cloudflare) | Full MCP integration |
| GitLab | MCP (gitlab) | MCP + REST API |
| Ansible | ansible CLI | Runs playbooks |
| ArgoCD | argocd/kubectl | GitOps operations |
| Helm | helm CLI | Chart management |
| k3s | kubectl | Cluster operations |
| K3sDeployment | kubectl | Deployments |
| Longhorn | kubectl | Storage operations |
| Platform | kubectl | K8s platform |
| Traefik | kubectl | Ingress config |
| Ffuf | ffuf CLI | Web fuzzing |
| BrightData | scraping APIs | Web scraping |
| Research | subagents | Parallel research |
| Observability | dashboard | Monitoring |
| Transcribe | whisper | Audio transcription |

**Count:** 16 skills (not candidates for new tools)

### Category 2: Structural/Meta Skills

These are organizational skills, not action-oriented:

| Skill | Purpose |
|-------|---------|
| CORE | Auto-loaded identity/config |
| CreateCLI | Creates CLIs (meta) |
| ConfigSync | Configuration management |
| Network | Orchestrator (delegates to Unifi) |
| AgentOrchestrator | Agent delegation patterns |
| specs | Specification storage |

**Count:** 6 skills (not candidates for tools)

### Category 3: Finance Skills (Prompt-Only, High Value)

All 13 Finance domain skills lack CLI tools:

| Skill | Potential Tools |
|-------|-----------------|
| AITrading | Trading signal generator, backtest runner |
| CryptoAnalysis | On-chain metrics fetcher, correlation analyzer |
| DeepStockAnalysis | Stock screener, valuation calculator |
| EstatePlanning | Estate planning checklist, document generator |
| FundamentalAnalysis | DCF calculator, moat scorer |
| MacroStrategy | Economic indicator tracker, sector rotation |
| PersonalFinance | Budget tracker, goal progress |
| QuantAnalysis | Backtest engine, indicator calculator |
| RealEstateInvesting | Cap rate calculator, deal analyzer |
| RetirementPlanning | Retirement calculator, withdrawal planner |
| RiskManagement | VaR calculator, position sizer |
| SentimentAnalysis | Sentiment scorer, news aggregator |
| TaxStrategy | Tax-loss harvesting tracker, bracket optimizer |

**Count:** 13 skills (HIGH PRIORITY - user-created, domain-specific)

### Category 4: Productivity/Operations (Prompt-Only)

| Skill | Potential Tools |
|-------|-----------------|
| Adr | ADR generator, decision log |
| AnalyzeTranscript | Transcript parser, action item extractor |
| HardwareDiag | System health checker, SMART reader |
| Infisical | Secrets CLI (like Linear) |
| Lean | Waste identifier, process timer |
| NetworkOps | Network diagnostic tools |
| ProjectManagement | Project status, Gantt generator |
| Sre | SLO calculator, incident tracker |
| Utp | User testing protocol generator |

**Count:** 9 skills (MEDIUM PRIORITY)

### Category 5: Upstream Skills (Prompt-Only)

From danielmiessler's PAI - not user-created:

| Skill | Notes |
|-------|-------|
| AlexHormoziPitch | Offer creation framework |
| Prompting | Prompt engineering patterns |
| StoryExplanation | Narrative generation |

**Count:** 3 skills (LOW PRIORITY - upstream)

---

## Priority Ranking for Tool Creation

### Tier 1: High Value, User-Created, Finance Domain
1. **DeepStockAnalysis** - Core investment analysis
2. **RiskManagement** - Position sizing, portfolio risk
3. **QuantAnalysis** - Backtesting, technical indicators
4. **FundamentalAnalysis** - DCF, valuation
5. **TaxStrategy** - Tax-loss harvesting automation

### Tier 2: High Value, User-Created, Operations
6. **HardwareDiag** - Infrastructure health
7. **Infisical** - Secrets management (like Linear pattern)
8. **Adr** - Decision tracking

### Tier 3: Medium Value
9. **AnalyzeTranscript** - Meeting analysis
10. **NetworkOps** - Network diagnostics
11. **Sre** - SLO/incident tracking

### Not Prioritized
- Finance skills with less frequent use
- Upstream skills (AlexHormoziPitch, Prompting, StoryExplanation)
- Structural/meta skills

---

## Recommendations

1. **Start with Tier 1 Finance skills** - highest daily value
2. **Follow Linear pattern** - TypeScript CLI tools with keychain auth
3. **Integrate external APIs** - Alpha Vantage, Yahoo Finance, etc.
4. **Consider bundling** - Create a `finance-tools` package shared across Finance skills

---

*Generated as part of Phase 4: Tool Creation Sprint*
