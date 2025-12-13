---
name: ArticleWriter
description: SEO-optimized affiliate article creation with multimedia enrichment. USE WHEN user wants to write articles, create blog content, add YouTube videos, find product images, generate affiliate content, OR plan content strategy. Delegates writing to Sonnet for cost efficiency.
---

# ArticleWriter

Creates SEO-optimized affiliate articles with multimedia enrichment. Uses Opus for planning/review and Sonnet for bulk writing to optimize costs.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName ArticleWriter
```

| Workflow | Trigger | File |
|----------|---------|------|
| **PlanArticle** | "plan article", "outline content", "content strategy" | `workflows/PlanArticle.md` |
| **WriteArticle** | "write article", "create content", "draft article" | `workflows/WriteArticle.md` |
| **EnrichContent** | "add videos", "find images", "enrich article" | `workflows/EnrichContent.md` |
| **PublishArticle** | "publish", "deploy article", "push content" | `workflows/PublishArticle.md` |
| **ValidateProducts** | "validate products", "check affiliate links", "product link check" | `workflows/ValidateProducts.md` |

## Examples

**Example 1: Plan and write an affiliate article**
```
User: "Write an article about USB charger spy cameras for pispycameras.com"
→ Invokes PlanArticle workflow
→ Opus researches keywords, creates outline with 7 products
→ Invokes WriteArticle workflow
→ Sonnet writes article sections from outline
→ Opus reviews, adds schema markup
→ Returns complete article ready for publishing
```

**Example 2: Enrich existing article with videos**
```
User: "Add YouTube review videos to the hidden cameras article"
→ Invokes EnrichContent workflow
→ Haiku searches YouTube for "{product name} review 2024"
→ Filters for views > 10K, duration 5-15 min
→ Returns list of video IDs with embed code
```

**Example 3: Publish article to site**
```
User: "Publish the USB charger article"
→ Invokes PublishArticle workflow
→ Formats article as Astro page
→ Commits to GitLab repo
→ CI/CD deploys to Cloudflare Pages
→ Returns live URL
```

**Example 4: Validate affiliate links**
```
User: "Check all my product links are still valid"
→ Invokes ValidateProducts workflow
→ Haiku agents check each ASIN in parallel
→ Reports unavailable/out-of-stock products
→ Optionally updates lastValidated timestamps
```

## Cost Optimization Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    OPUS (Main Agent)                         │
│  - Article planning & strategy                               │
│  - SEO keyword research                                      │
│  - Final review & quality check                              │
│  - Coordination & decision-making                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  SONNET (Delegated via Task)                 │
│  - Bulk article writing (~5x cheaper than Opus)              │
│  - Product descriptions                                      │
│  - Section content generation                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  HAIKU (Quick Tasks)                         │
│  - YouTube search queries (~12x cheaper than Sonnet)         │
│  - Link validation                                           │
│  - Simple formatting                                         │
└─────────────────────────────────────────────────────────────┘
```

**Model selection in Task tool:**
```typescript
Task({ prompt: "...", subagent_type: "engineer", model: "sonnet" })  // Writing
Task({ prompt: "...", subagent_type: "general-purpose", model: "haiku" })  // Quick tasks
```

## Article Template Structure

```markdown
# {Title} - {Year}

## Quick Picks (Above the fold)
- Best Overall: [Product] - $XX
- Best Budget: [Product] - $XX

## What to Look For (Buying Guide)
[Educational content - targets informational keywords]

## Detailed Reviews
### 1. {Product Name} - {Badge}
[Features, pros/cons, YouTube embed, affiliate link]

## Comparison Table
[Side-by-side specs]

## Legal/Safety Section
[Required for surveillance products]

## FAQ (Schema markup for rich snippets)
[Common questions]
```

## Environment Requirements

```bash
# Required
ANTHROPIC_API_KEY     # For Sonnet/Haiku delegation

# Optional - Enhanced Research
YOUTUBE_API_KEY       # YouTube Data API for video search
AMAZON_PA_API_KEY     # Product Advertising API
```
