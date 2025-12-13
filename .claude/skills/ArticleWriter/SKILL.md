---
name: ArticleWriter
description: SEO-optimized affiliate article creation with multimedia enrichment. USE WHEN user wants to write articles, create content, add YouTube videos, find product images, or generate affiliate content. Delegates writing to Sonnet for cost efficiency.
---

# ArticleWriter Skill

Creates SEO-optimized affiliate articles with multimedia enrichment. Uses Opus for planning/review and Sonnet for bulk writing to optimize costs.

## Workflow Routing

| Workflow | Trigger | Description |
|----------|---------|-------------|
| PlanArticle | "plan article", "outline content" | Opus creates detailed outline with SEO keywords |
| WriteArticle | "write article", "create content" | Sonnet writes from outline, Opus reviews |
| EnrichContent | "add videos", "find images", "enrich article" | Find YouTube reviews, product images |
| PublishArticle | "publish", "deploy article" | Format, commit, deploy via CI/CD |

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
│                  SONNET (Delegated)                          │
│  - Bulk article writing                                      │
│  - Product descriptions                                      │
│  - Section content generation                                │
│  - First draft creation                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  HAIKU (Quick Tasks)                         │
│  - YouTube search queries                                    │
│  - Image URL validation                                      │
│  - Link checking                                             │
│  - Simple formatting                                         │
└─────────────────────────────────────────────────────────────┘
```

## Multimedia Enrichment

### YouTube Video Discovery

For each product, search YouTube for reviews:
```
Search: "{product name} review 2024" OR "{product name} unboxing"
Filter: Views > 10K, Duration 5-15 min
Extract: Video ID, title, channel name, view count
```

**Embedding format:**
```html
<iframe
  width="560" height="315"
  src="https://www.youtube.com/embed/{VIDEO_ID}"
  title="{title}"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen>
</iframe>
```

### Image Sources

1. **Amazon Product Images** (affiliate compliant)
   - Use Product Advertising API (when available)
   - Or link to Amazon product page

2. **Comparison Graphics** (create via tools)
   - Feature comparison charts
   - Pros/cons infographics

3. **Stock Photos** (for lifestyle context)
   - Unsplash (free, attribution optional)
   - Pexels (free, no attribution)

### Schema Markup (SEO)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "image": "image-url",
  "description": "...",
  "review": {
    "@type": "Review",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "4.5",
      "bestRating": "5"
    },
    "author": {
      "@type": "Organization",
      "name": "PI Spy Cameras"
    }
  }
}
```

## Article Template Structure

```markdown
# {Title} - {Year}

## Quick Picks (Above the fold)
- Best Overall: [Product] - $XX
- Best Budget: [Product] - $XX
- Best for [Use Case]: [Product] - $XX

## What to Look For (Buying Guide)
[Educational content - builds trust, targets informational keywords]

## Detailed Reviews
### 1. {Product Name} - {Badge}
[Description, features, pros/cons]
[YouTube embed if available]
[Amazon affiliate link]

## Comparison Table
[Side-by-side specs]

## Use Cases
[Scenario-based recommendations]

## Legal/Safety Section
[Required for surveillance products]

## FAQ (Schema markup for rich snippets)
[Common questions - target featured snippets]

## Conclusion
[Summary recommendations with affiliate links]
```

## Research Services Integration

### Available Now
- **WebSearch**: Basic web search for products, reviews
- **perplexity-researcher**: Deep research with citations
- **gemini-researcher**: Multi-perspective research (if API configured)

### Recommended Additions
- **YouTube Data API**: Direct video search and metadata
- **Amazon Product Advertising API**: Official product data, images, prices
- **SerpAPI or similar**: SERP analysis for SEO optimization

## Usage Example

```
User: "Write an article about USB charger spy cameras"

Opus (planning):
1. Research keywords: "usb charger spy camera", "hidden charger camera", etc.
2. Create outline with 7 products
3. Define SEO targets

Opus → Sonnet (writing):
Task(model: "sonnet", prompt: "Write sections based on this outline...")

Sonnet returns draft

Opus → Haiku (enrichment):
Task(model: "haiku", prompt: "Find YouTube review videos for these products...")

Opus (review):
- Check quality, accuracy
- Add schema markup
- Finalize for publishing
```

## Environment Requirements

```bash
# Required
ANTHROPIC_API_KEY     # For Sonnet/Haiku delegation

# Optional - Enhanced Research
YOUTUBE_API_KEY       # YouTube Data API for video search
AMAZON_PA_API_KEY     # Product Advertising API
SERPAPI_KEY           # SERP analysis
GEMINI_API_KEY        # Gemini research (multi-perspective)
```

## Site-Specific Configuration

For pispycameras.com:
```yaml
affiliate_tag: pispy01-20
site_name: PI Spy Cameras
theme: dark
categories:
  - clock-cameras
  - usb-charger-cameras
  - smoke-detector-cameras
  - mini-cameras
  - detection-tools
legal_disclaimer: required
```
