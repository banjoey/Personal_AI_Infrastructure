# Scraper Agent

**Created:** 2025-12-21
**Type:** Agent-Pool Agent
**Model:** Sonnet (default)
**MCP Config:** `.claude/mcp-configs/scraper.json`

## Purpose

The Scraper Agent handles heavy-duty web scraping tasks that the built-in WebFetch tool cannot handle. It loads expensive MCP servers on-demand and terminates after completing the task.

## When to Spawn This Agent

| Scenario | Spawn? | Why |
|----------|--------|-----|
| Simple public webpage | No | WebFetch handles it |
| Site returns 403/429 | Yes | Bot detection blocking |
| CAPTCHA challenge | Yes | BrightData can solve |
| CloudFlare protected | Yes | BrightData bypasses |
| Instagram/Twitter/LinkedIn | Yes | Apify has specialized scrapers |
| JavaScript SPA (empty content) | Yes | Playwright can render |
| Batch scraping (5+ URLs) | Yes | BrightData batch is efficient |

## MCP Servers Loaded

### BrightData
**Best for:** Bot detection bypass, CAPTCHA solving, protected sites

| Tool | Purpose |
|------|---------|
| `scrape_as_markdown` | Single URL with full protection bypass |
| `scrape_batch` | Up to 10 URLs in parallel |
| `search_engine` | Google/Bing/Yandex results with bypass |

### Apify
**Best for:** Social media, e-commerce, specialized extraction

| Tool | Purpose |
|------|---------|
| `call-actor` | Run any of 2000+ pre-built scrapers |
| `search-actors` | Find scrapers for specific sites |
| `rag-web-browser` | LLM-optimized content extraction |
| `get-actor-output` | Retrieve full dataset results |

### Playwright
**Best for:** JavaScript SPAs, form filling, visual debugging

| Tool | Purpose |
|------|---------|
| `browser_navigate` | Open URL in headless browser |
| `browser_snapshot` | Get accessibility tree (better than screenshot) |
| `browser_click` | Click elements |
| `browser_type` | Fill form fields |
| `browser_take_screenshot` | Visual debugging |

## How to Spawn

```typescript
Task({
  subagent_type: "scraper",
  prompt: `
    [Clear task description]
    URL(s): [target URLs]
    Extract: [what data to extract]
    Format: [markdown/JSON/etc]

    Context: [why WebFetch failed, if applicable]
  `,
  model: "sonnet"  // or "haiku" for simple tasks
})
```

## Examples

### Protected Site
```typescript
Task({
  subagent_type: "scraper",
  prompt: `
    Scrape article from: https://protected-news-site.com/article/12345

    WebFetch failed with: 403 Forbidden - CloudFlare protection

    Use BrightData to bypass protection.
    Extract: title, author, date, full article text
    Return in markdown format.
  `,
  model: "sonnet"
})
```

### Instagram Posts
```typescript
Task({
  subagent_type: "scraper",
  prompt: `
    Extract last 20 posts from Instagram user: @exampleuser

    Use Apify's instagram-scraper Actor.
    Return: post text, image URLs, likes, comments, timestamp
    Format as JSON array.
  `,
  model: "sonnet"
})
```

### JavaScript SPA
```typescript
Task({
  subagent_type: "scraper",
  prompt: `
    Extract data from: https://react-dashboard.example.com

    This is a React SPA. WebFetch returns empty content.

    Use Playwright to:
    1. Navigate to URL
    2. Wait for content to load
    3. Take snapshot
    4. Extract the data table

    Return as markdown table.
  `,
  model: "sonnet"
})
```

### Batch Scraping
```typescript
Task({
  subagent_type: "scraper",
  prompt: `
    Batch scrape these 8 product pages:
    - https://shop.com/product/1
    - https://shop.com/product/2
    - https://shop.com/product/3
    - https://shop.com/product/4
    - https://shop.com/product/5
    - https://shop.com/product/6
    - https://shop.com/product/7
    - https://shop.com/product/8

    Use BrightData batch scraping.
    Extract: product name, price, description, image URL
    Return as JSON array.
  `,
  model: "sonnet"
})
```

## Expected Response Format

The agent should return:

```markdown
## Scraping Result

**URL(s):** [URLs processed]
**Method Used:** [BrightData/Apify/Playwright]
**Status:** Success/Partial/Failed

## Extracted Content

[The actual content in requested format]

## Methods Attempted

1. BrightData scrape_as_markdown: [Success/Failed - reason]
2. Apify RAG browser: [Success/Failed - reason]
3. Playwright: [Success/Failed - reason]

## Notes

[Any limitations, warnings, or follow-up needed]
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Agent can't find MCP tools | Check `.claude/mcp-configs/scraper.json` exists |
| BrightData fails | Check `BRIGHTDATA_API_KEY` in `~/.config/.env` |
| Apify fails | Check `APIFY_TOKEN` in `~/.config/.env` |
| Playwright fails | May need `mcp__playwright__browser_install` first |
| All methods fail | Site may require login or be technically unscrrapable |

## Cost Considerations

- **BrightData:** ~$0.001-0.01 per page (varies by protection level)
- **Apify:** Varies by Actor, check pricing before heavy use
- **Playwright:** Free (runs locally)

Only spawn this agent when WebFetch fails to avoid unnecessary costs.

## Related Documentation

- [Agent-Pool Pattern](../agent-pool-pattern.md)
- [Research Skill - Retrieve Workflow](../../../.claude/skills/research/workflows/retrieve.md)
- [Web Scraping Workflow](../../../.claude/skills/research/workflows/web-scraping.md)
