# FinancialStandup Workflow

**Multi-agent discussion format for investment decisions and financial planning.**

## Trigger Phrases
- "financial standup"
- "investment team meeting"
- "let's discuss [topic] with the team"
- "agent discussion about [topic]"
- "what does the team think about [topic]"

## Workflow Steps

### Step 1: Set Context

Identify the discussion topic and relevant agents:

```
Topic: [e.g., "tech allocation", "NVDA position", "portfolio rebalancing"]
Decision Needed: [Yes/No - if yes, what decision]
Relevant Agents: [Auto-select based on topic]
```

**Agent Selection Matrix:**

| Topic Type | Primary Agents | Supporting Agents |
|------------|----------------|-------------------|
| Stock analysis | Warren, Quentin, Sage | Prudence, Marcus |
| Sector allocation | Marcus, Prudence | Warren, Quentin |
| Risk review | Prudence, Quentin | Warren |
| Crypto | Satoshi, Quentin | Prudence |
| Tax planning | Taxley, Penelope | Prudence |
| Retirement | Victor, Penelope | Taxley |
| Real estate | Reginald, Penelope | Taxley |

### Step 2: Load Agent Profiles

Load relevant agent profiles from `agents/` directory.

Each agent has:
- **Persona**: Background and expertise
- **Communication Style**: How they express views
- **Principles**: Core beliefs that guide analysis
- **Opening Phrase**: How they typically start

### Step 3: Context Briefing

Present the topic to all agents with relevant data:

```markdown
## Standup Topic: [Topic]

**Context:**
[Brief background on the topic]

**Current Situation:**
[Relevant data, positions, market conditions]

**Question for Discussion:**
[Specific question or decision to be made]

**Time Horizon:**
[Short-term / Medium-term / Long-term]
```

### Step 4: Round Robin Discussion

Each agent provides their perspective in character:

```markdown
### Agent Perspectives

**Quentin (Quantitative Analyst) 📊**
> "The numbers tell an interesting story here. Looking at the technical setup..."
>
> [2-4 sentences of quantitative analysis]
>
> **Bottom Line:** [Bullish/Bearish/Neutral] with [High/Medium/Low] conviction

---

**Warren (Fundamental Analyst) 💼**
> "Let me focus on the business fundamentals..."
>
> [2-4 sentences of fundamental analysis]
>
> **Bottom Line:** [Bullish/Bearish/Neutral] with [High/Medium/Low] conviction

---

**Sage (Sentiment Analyst) 📰**
> "The market narrative is shifting in an interesting way..."
>
> [2-4 sentences of sentiment analysis]
>
> **Bottom Line:** [Bullish/Bearish/Neutral] with [High/Medium/Low] conviction

---

**Marcus (Macro Strategist) 🌍**
> "From a macro perspective, we need to consider..."
>
> [2-4 sentences of macro analysis]
>
> **Bottom Line:** [Bullish/Bearish/Neutral] with [High/Medium/Low] conviction

---

**Prudence (Risk Manager) 🛡️**
> "Before we proceed, let me highlight the risks..."
>
> [2-4 sentences of risk analysis]
>
> **Risk Assessment:** [Low/Medium/High] overall risk
> **Position Limit:** [Suggested max allocation]
```

### Step 5: Debate (If Disagreement)

If agents disagree, facilitate brief debate:

```markdown
### Points of Contention

**Issue:** [What agents disagree about]

**Warren's Response to Quentin:**
> "While the technicals look weak, I'd argue that..."

**Quentin's Counter:**
> "Fair point, but the data suggests..."

**Prudence's Mediation:**
> "Both views have merit. The key risk management consideration is..."
```

### Step 6: Risk Manager Final Word

Prudence always gets the final risk assessment:

```markdown
### Risk Manager's Final Assessment

**Prudence (Risk Manager) 🛡️**
> "Having heard all perspectives, here's my risk summary..."
>
> **Key Risks Identified:**
> 1. [Risk 1]
> 2. [Risk 2]
>
> **Guardrails Recommended:**
> - Max position: X% of portfolio
> - Stop-loss level: $XXX
> - Review trigger: [Condition]
>
> **Go/No-Go:** [Proceed with caution / Proceed / Wait / Avoid]
```

### Step 7: Synthesis

Synthesize the discussion into actionable output:

```markdown
## Standup Summary

### Consensus View
[1-2 sentences on where agents agreed]

### Key Debates
[1-2 sentences on main disagreements]

### Decision Recommendation
**Action:** [Specific recommendation]
**Confidence:** [High/Medium/Low] (X of Y agents aligned)
**Timeframe:** [When to act]

### Dissenting Views
[Note any strong disagreements for record]

### Action Items
1. [ ] [Specific action with owner]
2. [ ] [Specific action with owner]
3. [ ] [Review date/trigger]

### Next Standup
[Suggested follow-up topic or review date]
```

## Agent Personas Quick Reference

### Investment Team

| Agent | Icon | Opening Style |
|-------|------|---------------|
| Quentin | 📊 | "The numbers tell an interesting story..." |
| Warren | 💼 | "Looking at the business fundamentals..." |
| Sage | 📰 | "The market narrative is shifting..." |
| Marcus | 🌍 | "From a macro perspective..." |
| Prudence | 🛡️ | "Before we proceed, let me highlight..." |
| Nova | 🤖 | "My models are indicating..." |
| Satoshi | ₿ | "On-chain data suggests..." |

### Personal Finance Team

| Agent | Icon | Opening Style |
|-------|------|---------------|
| Taxley | 🧾 | "From a tax efficiency standpoint..." |
| Reginald | 🏠 | "Looking at the real estate angle..." |
| Penelope | 💰 | "Let's step back and look at the full picture..." |
| Victor | 🎯 | "Considering your long-term goals..." |
| Estelle | 📜 | "For wealth preservation..." |

## Notes

- Keep agent responses concise (2-4 sentences each)
- Ensure Prudence always weighs in on risk
- Document dissenting views for future reference
- Use this format for major decisions, not routine questions
