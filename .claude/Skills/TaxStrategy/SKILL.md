---
name: TaxStrategy
description: Tax optimization strategies for investors including tax-loss harvesting, capital gains planning, retirement account optimization, and year-end planning. USE WHEN user mentions taxes, tax-loss harvesting, capital gains, tax efficiency, 1099, wash sale, tax bracket, Roth conversion, or year-end tax planning.
---

# TaxStrategy

**Keep more of what you earn.** Optimizes investment decisions for tax efficiency, from harvesting losses to strategic account placement.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName TaxStrategy
```

| Workflow | Trigger | File |
|----------|---------|------|
| **TaxLossHarvesting** | "harvest losses", "tax-loss harvesting" | `workflows/TaxLossHarvesting.md` |
| **CapitalGainsStrategy** | "capital gains", "short-term vs long-term" | `workflows/CapitalGainsStrategy.md` |
| **RetirementContributions** | "401k contribution", "IRA", "HSA" | `workflows/RetirementContributions.md` |
| **TaxEfficiencyAudit** | "tax efficiency", "asset location" | `workflows/TaxEfficiencyAudit.md` |
| **YearEndPlanning** | "year-end tax", "December tax moves" | `workflows/YearEndPlanning.md` |
| **WashSaleMonitor** | "wash sale", "wash sale rule" | `workflows/WashSaleMonitor.md` |
| **RothConversion** | "Roth conversion", "convert to Roth" | `workflows/RothConversion.md` |

## Examples

**Example 1: Tax-loss harvesting opportunity**
```
User: "Do I have any tax-loss harvesting opportunities?"
→ Invokes TaxLossHarvesting workflow
→ Identifies positions with unrealized losses
→ Checks wash sale constraints
→ Returns harvesting candidates with replacement suggestions
```

**Example 2: Year-end tax planning**
```
User: "What tax moves should I make before December 31?"
→ Invokes YearEndPlanning workflow
→ Reviews income, gains, losses
→ Checks contribution limits
→ Returns prioritized action checklist
```

**Example 3: Roth conversion analysis**
```
User: "Should I do a Roth conversion this year?"
→ Invokes RothConversion workflow
→ Analyzes current vs future tax brackets
→ Calculates break-even timeline
→ Returns conversion recommendation with amount
```

## Tax-Loss Harvesting Framework

### Identification Criteria
```
Harvesting Candidates:
├── Unrealized Loss > $1,000
├── Holding Period
│   ├── Long-term loss: Offsets long-term gains first
│   └── Short-term loss: More valuable (higher tax rate)
├── Wash Sale Clear
│   ├── No purchase 30 days before
│   └── No purchase 30 days after
└── Replacement Available
    ├── Similar but not "substantially identical"
    └── Maintains market exposure
```

### Replacement Strategies
| Sold Position | Replacement Options |
|---------------|---------------------|
| Individual stock | Sector ETF, competitor stock |
| S&P 500 ETF (SPY) | Total market ETF (VTI), different S&P ETF (IVV) |
| Bond fund | Different duration or issuer fund |
| International ETF | Different index (MSCI vs FTSE) |

### Wash Sale Rules
- **30-day window:** Before AND after sale
- **Substantially identical:** Same security or very similar
- **All accounts:** Applies across taxable, IRA, spouse accounts
- **Consequence:** Loss disallowed, added to cost basis of new shares

## Asset Location Strategy

**Tax-Efficient Placement:**

| Asset Type | Best Account | Reason |
|------------|--------------|--------|
| High-growth stocks | Taxable | Long-term cap gains rate |
| Index funds (low turnover) | Taxable | Tax-efficient |
| REITs | Tax-advantaged | Dividends taxed as ordinary income |
| Bonds | Tax-advantaged | Interest taxed as ordinary income |
| High-dividend stocks | Tax-advantaged | Dividend taxation |
| Tax-managed funds | Taxable | Designed for taxable accounts |

## Capital Gains Management

### Tax Rates (2024)
| Income Level | Long-Term Rate | Short-Term Rate |
|--------------|----------------|-----------------|
| Low | 0% | 10-12% |
| Middle | 15% | 22-24% |
| High | 20% (+3.8% NIIT) | 32-37% |

### Strategies
1. **Hold for long-term:** Wait 1 year + 1 day for lower rate
2. **Harvest gains in low-income years:** Use 0% bracket
3. **Offset gains with losses:** Up to $3,000 net loss deduction
4. **Donate appreciated stock:** Avoid gains, get deduction
5. **Step-up at death:** Heirs get stepped-up basis

## Year-End Checklist

```markdown
## Year-End Tax Optimization Checklist

### Contributions (Before Dec 31)
- [ ] Max 401(k): $23,000 ($30,500 if 50+)
- [ ] Max HSA: $4,150 single / $8,300 family
- [ ] Backdoor Roth IRA if over income limit
- [ ] 529 contributions for state deduction

### Harvesting (Before Dec 31)
- [ ] Review unrealized losses
- [ ] Execute tax-loss harvesting
- [ ] Check wash sale dates
- [ ] Consider gain harvesting if in low bracket

### Distributions
- [ ] Required Minimum Distributions (RMDs) if applicable
- [ ] Qualified Charitable Distributions (QCDs) if 70.5+

### Planning
- [ ] Estimate total tax liability
- [ ] Consider Roth conversion
- [ ] Bunch deductions if near standard deduction
- [ ] Defer income if possible
```

## Integration

- **RiskManagement:** Tax implications of hedging
- **Finance Orchestrator:** Tax considerations in all decisions
- **PersonalFinance:** Overall financial planning context

## Important Disclaimer

```
This skill provides tax education and planning tools only.
It is NOT tax advice. Consult a qualified tax professional
for advice specific to your situation.

Tax laws change frequently. Verify current rules before acting.
```
