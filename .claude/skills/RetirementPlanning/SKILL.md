---
name: RetirementPlanning
description: Retirement planning strategies including contribution optimization, retirement projections, Social Security planning, withdrawal strategies, and Roth conversions. USE WHEN user mentions retirement, 401k, IRA, pension, Social Security, retirement income, FIRE, or retirement age planning.
---

# RetirementPlanning

**Secure your financial future.** Plans for retirement through optimized saving, smart account usage, and sustainable withdrawal strategies.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName RetirementPlanning
```

| Workflow | Trigger | File |
|----------|---------|------|
| **RetirementProjection** | "retirement projection", "when can I retire" | `workflows/RetirementProjection.md` |
| **ContributionOptimization** | "max contributions", "401k strategy" | `workflows/ContributionOptimization.md` |
| **SocialSecurityStrategy** | "Social Security", "when to claim" | `workflows/SocialSecurityStrategy.md` |
| **DrawdownPlanning** | "withdrawal strategy", "retirement income" | `workflows/DrawdownPlanning.md` |
| **RothConversion** | "Roth conversion", "Roth ladder" | `workflows/RothConversion.md` |
| **FIREPlanning** | "FIRE", "early retirement" | `workflows/FIREPlanning.md` |
| **CatchUpStrategy** | "behind on retirement", "catch up" | `workflows/CatchUpStrategy.md` |

## Examples

**Example 1: Retirement projection**
```
User: "When can I retire?"
→ Invokes RetirementProjection workflow
→ Gathers current savings, income, expenses
→ Models growth and withdrawal scenarios
→ Returns retirement age estimate with scenarios
```

**Example 2: Contribution optimization**
```
User: "How should I allocate my retirement contributions?"
→ Invokes ContributionOptimization workflow
→ Analyzes tax situation, employer match
→ Compares Traditional vs Roth
→ Returns optimized contribution strategy
```

**Example 3: Social Security timing**
```
User: "When should I claim Social Security?"
→ Invokes SocialSecurityStrategy workflow
→ Analyzes break-even points
→ Considers longevity, other income
→ Returns claiming recommendation
```

## Retirement Account Types

### Tax Treatment Comparison
| Account | Contributions | Growth | Withdrawals |
|---------|--------------|--------|-------------|
| Traditional 401(k) | Pre-tax | Tax-deferred | Taxed as income |
| Roth 401(k) | After-tax | Tax-free | Tax-free |
| Traditional IRA | Tax-deductible* | Tax-deferred | Taxed as income |
| Roth IRA | After-tax | Tax-free | Tax-free |
| HSA | Pre-tax | Tax-free | Tax-free (medical) |

### 2024 Contribution Limits
| Account | Under 50 | 50 and Over |
|---------|----------|-------------|
| 401(k) employee | $23,000 | $30,500 |
| 401(k) total (with employer) | $69,000 | $76,500 |
| IRA | $7,000 | $8,000 |
| HSA (individual) | $4,150 | $5,150 |
| HSA (family) | $8,300 | $9,300 |

## Retirement Projections

### The 4% Rule
```
Sustainable Withdrawal Rate:
- Withdraw 4% of portfolio in year 1
- Adjust for inflation each year
- ~95% success rate over 30 years

Example:
- Need $60,000/year in retirement
- Target portfolio: $60,000 / 0.04 = $1,500,000
```

### FI Number Calculation
```
FI Number = Annual Expenses × 25

Example:
- Annual expenses: $80,000
- FI Number: $80,000 × 25 = $2,000,000
```

### Retirement Milestones
| Multiple of Income | Status |
|--------------------|--------|
| 1x by age 30 | On track |
| 3x by age 40 | On track |
| 6x by age 50 | On track |
| 8x by age 60 | On track |
| 10x by age 67 | Retirement ready |

## Social Security Strategy

### Claiming Ages
| Age | Benefit Level |
|-----|---------------|
| 62 | ~70% of full benefit |
| 67 (FRA) | 100% of full benefit |
| 70 | ~124% of full benefit |

### Break-Even Analysis
```
Claiming 62 vs 67:
- Monthly at 62: $1,400
- Monthly at 67: $2,000
- Difference: $600/month

Break-even: ~15 years (age 77)
If live past 77: 67 is better
If die before 77: 62 was better
```

### Considerations
- Health and longevity expectations
- Spousal benefits
- Other retirement income
- Tax implications
- Working in retirement

## Withdrawal Strategies

### Order of Withdrawals
```
Tax-Efficient Withdrawal Sequence:
1. Taxable accounts (capital gains rates)
2. Tax-deferred (401k, Traditional IRA)
3. Tax-free (Roth IRA) - let grow longest

Exception: Roth Conversion Ladder
- Convert Traditional → Roth during low-income years
- Wait 5 years, then withdraw tax-free
```

### Bucket Strategy
```
Retirement Buckets:
├── Bucket 1: Cash (1-2 years expenses)
│   └── High-yield savings, CDs
├── Bucket 2: Income (3-5 years expenses)
│   └── Bonds, dividend stocks
└── Bucket 3: Growth (remainder)
    └── Stocks, growth investments

Replenish buckets 1 & 2 from bucket 3 in good years
```

### Required Minimum Distributions (RMDs)
- Start at age 73 (as of 2023)
- Applies to Traditional 401(k), IRA
- Does NOT apply to Roth IRA (while owner alive)
- Penalty for missing: 25% of required amount

## FIRE Planning

### FIRE Variants
| Type | Description | Savings Target |
|------|-------------|----------------|
| Regular FIRE | Standard early retirement | 25× expenses |
| Lean FIRE | Minimal lifestyle | 25× bare minimum |
| Fat FIRE | Comfortable lifestyle | 25× + buffer |
| Barista FIRE | Part-time work supplements | Lower multiplier |
| Coast FIRE | Stop saving, let compound | Varies by age |

### Early Retirement Considerations
- Healthcare before Medicare (65)
- 59.5 penalty for early withdrawals
- Roth conversion ladder (5-year rule)
- 72(t) SEPP payments
- Taxable account access

## Integration

- **TaxStrategy:** Roth conversions, tax-efficient withdrawals
- **PersonalFinance:** Savings rate, budgeting
- **RiskManagement:** Retirement portfolio allocation
- **EstatePlanning:** Beneficiary designations
