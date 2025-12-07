# Financial Skills Suite

**Branch:** `feature/financial-skills`
**Status:** Planning Complete - Ready for Implementation

---

## Quick Summary

Transform 7 BMAD stock trading agents into a comprehensive 12-skill PAI financial system.

### What We're Building

| Category | Skills | Agents |
|----------|--------|--------|
| **Investment Analysis** | QuantAnalysis, FundamentalAnalysis, SentimentAnalysis, MacroStrategy, RiskManagement, AITrading, CryptoAnalysis | Quentin, Warren, Sage, Marcus, Prudence, Nova, Satoshi |
| **Personal Finance** | TaxStrategy, RealEstateInvesting, PersonalFinance, RetirementPlanning, EstatePlanning | Taxley, Reginald, Penelope, Victor, Estelle |
| **Orchestrator** | Finance | Charles (primary) |

### Key Design Decisions

1. **Skills First** - Charles can assume any financial persona via skills
2. **Standup Agents** - 12 agent profiles for multi-agent discussions
3. **Free Data Sources** - yfinance, Alpaca, Finnhub, FRED, SEC EDGAR
4. **Multi-Philosophy** - Capital preservation + growth + quantitative
5. **Cross-Skill Orchestration** - Skills can invoke each other

### Implementation Phases

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1. Foundation | Week 1-2 | 8 transformed investment skills |
| 2. Expansion | Week 3-4 | 5 new personal finance skills |
| 3. Advanced | Week 5-6 | Portfolio tracking, backtesting, alerts |
| 4. Polish | Week 7-8 | Testing, documentation, release |

---

## Files in This Directory

| File | Purpose |
|------|---------|
| `README.md` | This overview |
| `FINANCIAL-SKILLS-PLAN.md` | Comprehensive implementation plan |

---

## Next Steps

1. Review `FINANCIAL-SKILLS-PLAN.md`
2. Approve or modify scope
3. Begin Phase 1 implementation

---

## Commands

```bash
# View the full plan
cat docs/planning/financial-skills/FINANCIAL-SKILLS-PLAN.md

# Switch to this branch
git checkout feature/financial-skills

# Start implementation
# (After approval)
```
