---
name: RealEstateInvesting
description: Real estate investment analysis including property evaluation, REIT screening, rental ROI calculations, and mortgage optimization. USE WHEN user mentions real estate, property investment, REITs, rental property, mortgage, cap rate, cash-on-cash return, or real estate portfolio.
---

# RealEstateInvesting

**Build wealth through real estate.** Analyzes property investments, REITs, and real estate strategies as part of a diversified portfolio.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName RealEstateInvesting
```

| Workflow | Trigger | File |
|----------|---------|------|
| **PropertyAnalysis** | "analyze property", "evaluate rental" | `workflows/PropertyAnalysis.md` |
| **REITScreening** | "REIT", "real estate stocks" | `workflows/REITScreening.md` |
| **RentalROI** | "rental ROI", "cash flow analysis" | `workflows/RentalROI.md` |
| **MarketComparison** | "real estate markets", "where to invest" | `workflows/MarketComparison.md` |
| **MortgageOptimization** | "mortgage", "refinance", "loan comparison" | `workflows/MortgageOptimization.md` |
| **REvsStocks** | "real estate vs stocks", "allocation to RE" | `workflows/REvsStocks.md` |

## Examples

**Example 1: Rental property analysis**
```
User: "Is this rental property a good investment?"
→ Invokes PropertyAnalysis workflow
→ Calculates cap rate, cash-on-cash, ROI
→ Estimates cash flow and appreciation
→ Returns investment scorecard with recommendation
```

**Example 2: REIT screening**
```
User: "What are the best REITs to buy?"
→ Invokes REITScreening workflow
→ Screens by sector, dividend yield, FFO
→ Analyzes valuation metrics
→ Returns ranked REIT recommendations
```

**Example 3: Mortgage comparison**
```
User: "Should I refinance my mortgage?"
→ Invokes MortgageOptimization workflow
→ Compares current vs new terms
→ Calculates break-even timeline
→ Returns refinance recommendation
```

## Property Investment Metrics

### Return Calculations

**Cap Rate (Capitalization Rate)**
```
Cap Rate = Net Operating Income / Property Value

Example:
- Property Value: $500,000
- Annual NOI: $40,000
- Cap Rate: 8%

Interpretation:
- 4-6%: Core/low-risk markets
- 6-8%: Value-add opportunities
- 8%+: Higher risk/reward
```

**Cash-on-Cash Return**
```
Cash-on-Cash = Annual Cash Flow / Total Cash Invested

Example:
- Total Cash Invested: $125,000 (25% down + closing)
- Annual Cash Flow: $12,000
- Cash-on-Cash: 9.6%
```

**Total ROI**
```
Total ROI = (Cash Flow + Appreciation + Loan Paydown + Tax Benefits) / Cash Invested
```

### Cash Flow Analysis
```
Rental Property Cash Flow:
├── Gross Rental Income
├── - Vacancy (5-10%)
├── - Property Management (8-10%)
├── - Maintenance/Repairs (5-10%)
├── - Property Taxes
├── - Insurance
├── - HOA (if applicable)
├── = Net Operating Income (NOI)
├── - Mortgage Payment (P&I)
└── = Cash Flow
```

## REIT Analysis Framework

### REIT Sectors
| Sector | Examples | Characteristics |
|--------|----------|-----------------|
| Residential | EQR, AVB, MAA | Stable, inflation hedge |
| Industrial | PLD, STAG | E-commerce tailwind |
| Data Centers | EQIX, DLR | Tech growth, high capex |
| Healthcare | WELL, VTR | Aging demographics |
| Retail | SPG, O | Challenged, high yields |
| Office | BXP, ARE | Work-from-home headwind |
| Self-Storage | PSA, EXR | Recession resistant |
| Cell Towers | AMT, CCI | Recurring revenue |

### Key REIT Metrics
| Metric | Formula | Good Range |
|--------|---------|------------|
| FFO Yield | FFO / Price | 5-8% |
| AFFO Yield | AFFO / Price | 4-7% |
| Dividend Yield | Dividend / Price | 3-6% |
| Payout Ratio | Dividend / FFO | <80% |
| Debt/EBITDA | Total Debt / EBITDA | <6x |
| NAV Premium/Discount | Price vs NAV | Varies |

## Mortgage Optimization

### Loan Comparison Framework
```
Mortgage Analysis:
├── Monthly Payment
├── Total Interest Paid
├── Break-even Point (if refinancing)
├── Points Analysis
│   └── Cost of points vs interest savings
├── ARM vs Fixed
│   └── Rate environment consideration
└── 15 vs 30 Year
    └── Payment capacity vs wealth building
```

### Refinance Decision
```
Should I Refinance?

1. Rate Reduction
   - Rule of thumb: Refinance if rate drops 0.75-1%+
   - Calculate actual break-even

2. Break-even Calculation
   - Closing Costs / Monthly Savings = Months to break-even
   - Example: $6,000 / $200 = 30 months

3. Consider:
   - How long will you stay?
   - Current rate environment
   - Loan-to-value ratio
   - Credit score changes
```

## Real Estate vs Stocks

### Comparison Framework
| Factor | Real Estate | Stocks |
|--------|-------------|--------|
| Leverage | 4-5x typical | 1-2x (margin) |
| Liquidity | Low | High |
| Diversification | Hard without REITs | Easy |
| Control | High (direct) | None |
| Tax Benefits | Depreciation, 1031 | Long-term cap gains |
| Time Commitment | High (direct) | Low |
| Minimum Investment | High (direct) | Low |

### Portfolio Allocation
- **Conservative:** 10-15% real estate
- **Moderate:** 15-25% real estate
- **Aggressive:** 25-35% real estate

Options for RE exposure:
1. Direct ownership
2. REITs (public)
3. Private RE funds
4. Crowdfunding platforms
5. RE ETFs (VNQ, SCHH)

## Integration

- **TaxStrategy:** Depreciation, 1031 exchanges
- **RiskManagement:** RE correlation with portfolio
- **PersonalFinance:** RE in overall wealth plan
- **MacroStrategy:** RE market cycles
