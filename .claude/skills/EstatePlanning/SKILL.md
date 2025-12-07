---
name: EstatePlanning
description: Estate planning guidance including wills, trusts, beneficiary designations, gifting strategies, and wealth transfer planning. USE WHEN user mentions estate planning, will, trust, inheritance, beneficiary, power of attorney, estate tax, or wealth transfer.
---

# EstatePlanning

**Protect and transfer your wealth.** Provides guidance on estate planning essentials to ensure your wishes are honored and your assets transfer efficiently.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName EstatePlanning
```

| Workflow | Trigger | File |
|----------|---------|------|
| **WillChecklist** | "will", "need a will" | `workflows/WillChecklist.md` |
| **TrustAnalysis** | "trust", "living trust", "revocable trust" | `workflows/TrustAnalysis.md` |
| **BeneficiaryReview** | "beneficiary", "update beneficiaries" | `workflows/BeneficiaryReview.md` |
| **GiftingStrategy** | "gifting", "gift tax", "annual exclusion" | `workflows/GiftingStrategy.md` |
| **SuccessionPlanning** | "succession", "business succession" | `workflows/SuccessionPlanning.md` |
| **EstateTaxPlanning** | "estate tax", "inheritance tax" | `workflows/EstateTaxPlanning.md` |
| **DocumentChecklist** | "estate documents", "what documents" | `workflows/DocumentChecklist.md` |

## Examples

**Example 1: Estate document review**
```
User: "What estate planning documents do I need?"
→ Invokes DocumentChecklist workflow
→ Assesses family situation, assets
→ Identifies required vs optional documents
→ Returns prioritized action checklist
```

**Example 2: Trust evaluation**
```
User: "Should I set up a trust?"
→ Invokes TrustAnalysis workflow
→ Analyzes assets, goals, family situation
→ Compares trust types
→ Returns recommendation with pros/cons
```

**Example 3: Beneficiary audit**
```
User: "Are my beneficiaries up to date?"
→ Invokes BeneficiaryReview workflow
→ Lists accounts needing beneficiaries
→ Checks for common mistakes
→ Returns review checklist
```

## Essential Estate Documents

### The Core Four
```
Essential Estate Documents:
├── 1. Will (Last Will and Testament)
│   ├── Names guardian for minor children
│   ├── Distributes probate assets
│   ├── Names executor
│   └── Must go through probate
├── 2. Durable Power of Attorney (Financial)
│   ├── Names agent for financial decisions
│   ├── Effective if incapacitated
│   └── Can be immediate or "springing"
├── 3. Healthcare Power of Attorney
│   ├── Names agent for medical decisions
│   ├── Effective if incapacitated
│   └── Also called healthcare proxy
└── 4. Living Will (Advance Directive)
    ├── States end-of-life wishes
    ├── Guides decisions if terminal
    └── Removes burden from family
```

### Additional Documents
| Document | Purpose | Who Needs It |
|----------|---------|--------------|
| Revocable Living Trust | Avoid probate, privacy | Higher net worth, privacy concerns |
| HIPAA Authorization | Medical info access | Everyone |
| Letter of Instruction | Guidance for executor | Helpful for everyone |
| Digital Asset Plan | Online accounts access | Anyone with digital presence |

## Trust Types

### Revocable Living Trust
```
Revocable Living Trust:
├── Benefits
│   ├── Avoids probate (saves time & money)
│   ├── Privacy (trusts not public record)
│   ├── Incapacity planning
│   └── Flexibility (can modify)
├── Drawbacks
│   ├── Setup cost ($1,500-$5,000+)
│   ├── Must retitle assets
│   └── No tax benefits
└── Best for
    ├── Homeowners wanting to avoid probate
    ├── Privacy concerns
    └── Complex family situations
```

### Irrevocable Trust
```
Irrevocable Trust:
├── Benefits
│   ├── Estate tax reduction
│   ├── Asset protection
│   └── Medicaid planning
├── Drawbacks
│   ├── Cannot modify easily
│   ├── Give up control
│   └── Complex administration
└── Best for
    ├── High net worth (>$13M estate)
    ├── Asset protection needs
    └── Special needs planning
```

## Beneficiary Designations

### Accounts with Beneficiaries
```
Beneficiary Designation Accounts:
├── Retirement Accounts
│   ├── 401(k)
│   ├── IRA
│   └── Pension
├── Insurance
│   ├── Life insurance
│   └── Annuities
├── Bank Accounts
│   ├── POD (Payable on Death)
│   └── TOD (Transfer on Death)
└── Brokerage Accounts
    └── TOD registration
```

### Common Mistakes
1. **Outdated beneficiaries** - Ex-spouse still listed
2. **No contingent beneficiary** - Primary predeceases
3. **Estate as beneficiary** - Loses tax benefits, adds probate
4. **Minor as beneficiary** - Requires court-appointed guardian
5. **Forgetting to update** - After life changes

### Review Triggers
- Marriage or divorce
- Birth or adoption
- Death of beneficiary
- Major life changes
- Every 3-5 years regardless

## Gifting Strategies

### Annual Exclusion
```
2024 Annual Gift Exclusion: $18,000 per recipient

Examples:
- Married couple can give $36,000/person/year
- To 3 children + 3 spouses: $216,000/year
- No gift tax, no reporting required
```

### Lifetime Exemption
```
2024 Lifetime Gift/Estate Exemption: $13.61 million per person

- Married couples: $27.22 million combined
- Gifts over annual exclusion count against this
- Same exemption for gifts and estate
```

### Gifting Strategies
| Strategy | Description | Benefit |
|----------|-------------|---------|
| Annual exclusion gifts | $18K/person/year | Reduces estate, no tax |
| 529 superfunding | 5 years at once | $90K in one year |
| Pay tuition directly | Unlimited if to institution | Doesn't count as gift |
| Pay medical directly | Unlimited if to provider | Doesn't count as gift |
| Charitable giving | To qualified charities | Deduction + estate reduction |
| Appreciated stock gifts | Give appreciated assets | Avoid capital gains |

## Estate Tax Planning

### Estate Tax Basics
```
Federal Estate Tax (2024):
├── Exemption: $13.61 million per person
├── Rate: 40% on amount over exemption
├── Portability: Unused exemption transfers to spouse
└── Note: Exemption scheduled to drop ~50% in 2026
```

### State Estate Taxes
Some states have lower thresholds:
- Massachusetts: $2 million
- Oregon: $1 million
- Washington: $2.193 million
- Many states: No estate tax

## Integration

- **RetirementPlanning:** Beneficiary coordination
- **TaxStrategy:** Gift and estate tax planning
- **PersonalFinance:** Overall wealth picture
- **Finance Orchestrator:** Major life planning

## Important Disclaimer

```
This skill provides estate planning education only.
It is NOT legal advice. Consult a qualified estate
planning attorney for advice specific to your situation.

Estate planning laws vary by state and change frequently.
Work with professionals to create legally valid documents.
```
