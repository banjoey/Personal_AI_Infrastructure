---
name: PersonalFinance
description: Personal finance fundamentals including budgeting, cash flow management, debt payoff strategies, emergency funds, and financial goal setting. USE WHEN user mentions budget, spending, savings rate, emergency fund, debt payoff, net worth, financial goals, or basic money management.
---

# PersonalFinance

**Build a solid financial foundation.** Covers the fundamentals that make everything else possible - budgeting, saving, debt management, and financial planning basics.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName PersonalFinance
```

| Workflow | Trigger | File |
|----------|---------|------|
| **BudgetCreation** | "create budget", "budgeting help" | `workflows/BudgetCreation.md` |
| **CashFlowAnalysis** | "cash flow", "income vs expenses" | `workflows/CashFlowAnalysis.md` |
| **DebtPayoff** | "pay off debt", "debt strategy" | `workflows/DebtPayoff.md` |
| **EmergencyFund** | "emergency fund", "rainy day fund" | `workflows/EmergencyFund.md` |
| **NetWorthTracking** | "net worth", "track wealth" | `workflows/NetWorthTracking.md` |
| **InsuranceReview** | "insurance", "coverage review" | `workflows/InsuranceReview.md` |
| **FinancialGoals** | "financial goals", "money goals" | `workflows/FinancialGoals.md` |
| **SavingsRate** | "savings rate", "how much to save" | `workflows/SavingsRate.md` |

## Examples

**Example 1: Budget creation**
```
User: "Help me create a budget"
→ Invokes BudgetCreation workflow
→ Gathers income and expense categories
→ Applies 50/30/20 or custom framework
→ Returns personalized budget with tracking suggestions
```

**Example 2: Debt payoff strategy**
```
User: "What's the best way to pay off my debt?"
→ Invokes DebtPayoff workflow
→ Analyzes debt types, rates, balances
→ Compares avalanche vs snowball methods
→ Returns optimized payoff plan with timeline
```

**Example 3: Emergency fund assessment**
```
User: "How much should I have in my emergency fund?"
→ Invokes EmergencyFund workflow
→ Analyzes income stability, expenses, obligations
→ Calculates target amount
→ Returns savings plan to reach target
```

## Budgeting Frameworks

### 50/30/20 Rule
```
Monthly After-Tax Income Allocation:
├── 50% Needs
│   ├── Housing (rent/mortgage)
│   ├── Utilities
│   ├── Groceries
│   ├── Transportation
│   ├── Insurance
│   └── Minimum debt payments
├── 30% Wants
│   ├── Dining out
│   ├── Entertainment
│   ├── Shopping
│   ├── Hobbies
│   └── Subscriptions
└── 20% Savings & Debt
    ├── Emergency fund
    ├── Retirement contributions
    ├── Extra debt payments
    └── Investment contributions
```

### Zero-Based Budget
```
Income - Expenses - Savings = $0

Every dollar gets a job:
- Bills and necessities
- Debt payments
- Savings goals
- Discretionary spending
- Buffer for unexpected
```

### Pay Yourself First
```
Income arrives → Automatic transfers:
1. Retirement accounts (401k, IRA)
2. Emergency fund (until full)
3. Investment accounts
4. Remaining → Checking for bills/spending
```

## Debt Payoff Strategies

### Avalanche Method (Mathematically Optimal)
```
1. List debts by interest rate (highest first)
2. Pay minimums on all
3. Put extra money toward highest rate
4. When paid, roll payment to next highest
5. Repeat until debt-free

Pros: Minimizes total interest paid
Cons: May take longer to see progress
```

### Snowball Method (Psychologically Motivating)
```
1. List debts by balance (smallest first)
2. Pay minimums on all
3. Put extra money toward smallest balance
4. When paid, roll payment to next smallest
5. Repeat until debt-free

Pros: Quick wins build momentum
Cons: May pay more interest overall
```

### Debt Priority Framework
| Debt Type | Priority | Reason |
|-----------|----------|--------|
| High-interest credit cards | 1 | 15-25% rates destroy wealth |
| Personal loans | 2 | Usually high rates |
| Car loans | 3 | Moderate rates, depreciating asset |
| Student loans | 4 | Lower rates, possible forgiveness |
| Mortgage | 5 | Low rates, tax-deductible, appreciating asset |

## Emergency Fund Guidelines

### Target Amount
| Situation | Target |
|-----------|--------|
| Stable job, dual income | 3 months expenses |
| Stable job, single income | 6 months expenses |
| Variable income / self-employed | 6-12 months expenses |
| High job risk | 9-12 months expenses |

### Building Strategy
```
Emergency Fund Phases:
1. Starter: $1,000 (immediate safety net)
2. Basic: 1 month expenses
3. Solid: 3 months expenses
4. Full: 6+ months expenses

Keep in: High-yield savings account
- Liquid and accessible
- FDIC insured
- Earning some interest
```

## Savings Rate Targets

| Savings Rate | Retirement Timeline |
|--------------|---------------------|
| 10% | Work 40+ years |
| 15% | Work 35-40 years |
| 20% | Work 30-35 years |
| 25% | Work 25-30 years |
| 50% | Work 15-20 years (FIRE) |

**Savings Rate = (Savings + Investments) / Gross Income**

## Net Worth Tracking

```
Net Worth = Assets - Liabilities

Assets:
├── Cash & Savings
├── Investment Accounts
├── Retirement Accounts (401k, IRA)
├── Real Estate (market value)
├── Vehicles (market value)
└── Other valuable assets

Liabilities:
├── Mortgage balance
├── Student loans
├── Car loans
├── Credit card debt
├── Personal loans
└── Other debts
```

### Milestones
- **$0:** Debt-free (excluding mortgage)
- **$100K:** First major milestone
- **1x Income:** On track for retirement
- **2x Income:** Ahead of schedule
- **10x Income:** Retirement ready

## Financial Order of Operations

```
Priority Sequence:
1. Basic budget (know your numbers)
2. Emergency starter fund ($1,000)
3. Employer 401k match (free money)
4. Pay off high-interest debt (>7%)
5. Full emergency fund (3-6 months)
6. Max retirement accounts
7. Pay off moderate debt (4-7%)
8. Invest in taxable accounts
9. Pay off low-interest debt (<4%)
10. Advanced strategies (real estate, etc.)
```

## Integration

- **TaxStrategy:** Tax-advantaged savings
- **RetirementPlanning:** Long-term planning
- **RiskManagement:** Insurance, emergency planning
- **Finance Orchestrator:** Foundation for all financial decisions
