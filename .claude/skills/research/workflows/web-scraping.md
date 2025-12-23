# Web Scraping Workflow

Web scraping and crawling using WebFetch for simple pages (90% of cases). For protected sites, CAPTCHA, or social media, spawn the **@scraper agent** which loads heavy-duty MCPs on-demand.

## Agent-Pool Architecture

This workflow uses a **lean orchestrator + heavy agent** pattern:

```
Your Session (no heavy MCPs loaded)
  ↓
Layer 1: WebFetch (built-in, FREE) - handles 90% of cases
  ↓ (if blocked/failed)
Spawn @scraper agent (loads BrightData, Apify, Playwright)
  ↓
Agent returns results and terminates
```

## 🎯 Load Full PAI Context

**Before starting any task with this skill, load complete PAI context:**

`Skill("CORE")` or `read ${PAI_DIR}/skills/CORE/SKILL.md`

## When to Activate This Skill
- Scrape web pages
- Extract data from websites
- Crawl multiple pages
- Collect web data
- Extract links or content
- Data extraction tasks

## Decision Tree

1. **Simple pages?** → Use WebFetch first (Layer 1)
2. **WebFetch blocked/failed?** → Spawn @scraper agent
3. **Known protected site?** → Spawn @scraper agent directly
4. **Social media?** → Spawn @scraper agent (uses Apify Actors)

## Common Tasks

### Extract All Links from Page
```typescript
// Layer 1 - try first
WebFetch({
  url: "https://example.com",
  prompt: "Extract all links from this page with their anchor text"
})
```

### Scrape Product Listings
```typescript
// Layer 1 - try first
WebFetch({
  url: "https://shop.example.com/products",
  prompt: "Extract product listings: name, price, image URL, product URL"
})

// If blocked, spawn agent
Task({
  subagent_type: "scraper",
  prompt: `
    Scrape product listings from: https://shop.example.com/products
    Extract: product name, price, image URL, product URL
    Return as JSON array.
  `,
  model: "sonnet"
})
```

### Crawl Multiple Pages
```typescript
// 1. Get listing page with Layer 1
WebFetch({ url: indexUrl, prompt: "Extract all product detail page URLs" })

// 2. Fetch each detail page (parallel)
WebFetch({ url: url1, prompt: "Extract product details" })
WebFetch({ url: url2, prompt: "Extract product details" })
// ...

// 3. If any fail, spawn agent for failed URLs
Task({
  subagent_type: "scraper",
  prompt: `
    Batch scrape these failed URLs:
    - ${failedUrl1}
    - ${failedUrl2}
    Extract product details from each.
  `,
  model: "sonnet"
})
```

### Social Media Extraction
```typescript
// Always spawn agent for social media
Task({
  subagent_type: "scraper",
  prompt: `
    Extract last 20 posts from Instagram user: @username
    Use Apify instagram-scraper Actor.
    Return: post text, image URLs, likes, comments, timestamp
  `,
  model: "sonnet"
})
```

## Best Practices

### Do's
✅ Try WebFetch first (free, fast)
✅ Only spawn agent when WebFetch fails
✅ Check robots.txt first
✅ Add delays between requests
✅ Handle errors gracefully

### Don'ts
❌ Don't spawn agent for simple pages
❌ Don't scrape too fast
❌ Don't ignore rate limits
❌ Don't scrape personal data without permission

## Spawning the @scraper Agent

```typescript
Task({
  subagent_type: "scraper",
  prompt: `
    [Describe what to scrape]
    URL(s): [target URLs]
    Extract: [what data to extract]
    Format: [markdown/JSON/etc]

    WebFetch error (if applicable): [error message]
  `,
  model: "sonnet"
})
```

The agent has access to:
- **BrightData** - CAPTCHA bypass, bot detection bypass
- **Apify** - Social media scrapers, e-commerce scrapers
- **Playwright** - JavaScript SPAs, form filling, screenshots

## Supplementary Resources
For detailed retrieval strategies: `read ${PAI_DIR}/skills/research/workflows/retrieve.md`
