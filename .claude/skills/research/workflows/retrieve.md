# Retrieve Workflow

Intelligent multi-layer content retrieval system for DIFFICULT content retrieval. Uses built-in tools (WebFetch, WebSearch) for 90% of cases, then spawns a dedicated **scraper agent** with heavy-duty MCPs (BrightData, Apify, Playwright) only when needed. USE ONLY WHEN user indicates difficulty: 'can't get this', 'having trouble', 'site is blocking', 'protected site', 'keeps giving CAPTCHA', 'won't let me scrape'. DO NOT use for simple 'read this page' or 'get content from' without indication of difficulty.

## Agent-Pool Architecture

This workflow uses a **lean orchestrator + heavy agent** pattern:

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR SESSION (Orchestrator)                                │
│  - No heavy scraping MCPs loaded                            │
│  - Fast startup, lean context                               │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: WebFetch + WebSearch (built-in, FREE)             │
│  ↓ If blocked/failed                                        │
│  Layer 2: Spawn @scraper agent                              │
│           - Loads BrightData, Apify, Playwright MCPs        │
│           - Does the heavy lifting                          │
│           - Returns results and terminates                  │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- Main session stays fast (no heavy MCP startup)
- Only pay for scraping tools when actually needed
- Scraper agent has full context for the task
- Clean separation of concerns

## 🎯 Load Full PAI Context

**Before starting any task with this skill, load complete PAI context:**

`Skill("CORE")` or `read ${PAI_DIR}/skills/CORE/SKILL.md`

This provides access to:
- Stack preferences and tool configurations
- Security rules and repository safety protocols
- Response format requirements
- Personal preferences and operating instructions

## When to Use This Skill

**⚠️ IMPORTANT:** This skill is for CHALLENGING content retrieval only, not routine fetching.

**✅ DO USE this skill when user indicates difficulty:**
- "I can't get this content"
- "Having trouble retrieving this"
- "Site is blocking me"
- "Protected site" / "CloudFlare protected"
- "Keeps giving me CAPTCHA"
- "Won't let me scrape this"
- "Bot detection blocking me"
- "Rate limited when trying to get this"
- "Tried to fetch but failed"
- "Need advanced scraping for this"

**❌ DO NOT use this skill for simple requests:**
- "Read this page" → Use WebFetch directly
- "Get content from [URL]" → Use WebFetch directly
- "What does this site say" → Use WebFetch directly
- "Fetch this article" → Use WebFetch directly
- "Check this URL" → Use WebFetch directly

**Simple rule:** Only activate when user signals DIFFICULTY, not for routine content requests.

**NOT for research questions** - use the research skill instead for "research X" or "find information about X"

## 🎯 Intelligent Retrieval Strategy

The Retrieve skill uses a **2-layer fallback strategy** with agent-pool pattern:

```
Layer 1: Built-in Tools (Fast, Simple, FREE)
  ↓ (If blocked, rate-limited, or fails)
Layer 2: Spawn @scraper Agent (Heavy-duty tools)
         - Agent loads BrightData, Apify, Playwright MCPs
         - Agent handles CAPTCHA, bot detection, specialized extraction
         - Agent returns results and terminates
```

### Decision Tree: Which Layer to Use?

**Use Layer 1 (Built-in) - TRY THIS FIRST:**
- Simple public webpage
- No known bot detection
- Standard HTML content
- Quick one-off fetch
- **90% of requests succeed here**

**Spawn @scraper Agent (Layer 2) if:**
- Layer 1 blocked or failed
- Known bot detection (CloudFlare, etc.)
- CAPTCHA protection
- Rate limiting encountered
- Need specialized extraction (social media, e-commerce)
- JavaScript-heavy SPA that WebFetch can't parse
- Need batch scraping from same domain

## Layer 1: Built-in Tools

### WebFetch Tool

**Best for:** Simple HTML pages, public content, one-off fetches

**Usage:**
```typescript
// Fetch and extract specific information
WebFetch({
  url: "https://example.com/page",
  prompt: "Extract the main article content and author name"
})
```

**When it fails:**
- Returns error about blocked request
- Gets rate-limited (429 status)
- Receives CAPTCHA challenge
- Returns empty/broken content
→ **Escalate to Layer 2 (BrightData)**

### WebSearch Tool

**Best for:** Finding content when you have keywords but not URLs

**Usage:**
```typescript
// Search for content, get URLs, then fetch them
WebSearch({
  query: "latest React 19 features documentation",
  allowed_domains: ["react.dev"]
})
```

**When it fails:**
- Need more comprehensive search results
- Need specific search engine (Google, Bing, Yandex)
→ **Escalate to Layer 2 (BrightData search_engine)**

## Layer 2: Spawn @scraper Agent

When Layer 1 fails, spawn the dedicated scraper agent instead of using heavy MCPs directly in your session.

### How to Spawn the Scraper Agent

```typescript
// Spawn scraper agent with full context
Task({
  subagent_type: "scraper",
  prompt: `
    Retrieve content from: ${url}

    Context: Layer 1 (WebFetch) failed with: ${error_message}

    Try these approaches in order:
    1. BrightData scrape_as_markdown (for CAPTCHA/bot detection)
    2. Apify RAG browser (for complex sites)
    3. Playwright (for JavaScript SPAs needing interaction)

    Return:
    - Extracted content in markdown format
    - Which method succeeded
    - Any errors encountered
  `,
  model: "sonnet"
})
```

### When to Spawn the Agent

**Spawn @scraper when:**
- WebFetch returns 403, 429, or empty content
- CAPTCHA or bot detection message received
- Site is known to be protected (CloudFlare, etc.)
- Need specialized extraction (Instagram, LinkedIn, Amazon)
- JavaScript-heavy SPA that doesn't render with WebFetch

### What the Agent Has Access To

The scraper agent loads these MCPs (which are NOT in your main session):

| MCP | Best For | Key Tools |
|-----|----------|-----------|
| **BrightData** | CAPTCHA bypass, protected sites | `scrape_as_markdown`, `scrape_batch`, `search_engine` |
| **Apify** | Social media, e-commerce, RAG content | `call-actor`, `search-actors`, `rag-web-browser` |
| **Playwright** | JS SPAs, form filling, screenshots | `browser_navigate`, `browser_click`, `browser_snapshot` |

### Example: Protected Site Scraping

```typescript
// Layer 1 failed - spawn agent
Task({
  subagent_type: "scraper",
  prompt: `
    URL: https://cloudflare-protected-site.com/article

    WebFetch failed with: "Access denied - CloudFlare protection"

    Use BrightData to bypass protection and extract the article content.
    Return markdown format.
  `,
  model: "sonnet"
})
```

### Example: Social Media Extraction

```typescript
// Need Instagram data - spawn agent with Apify
Task({
  subagent_type: "scraper",
  prompt: `
    Extract the last 10 posts from Instagram user: @exampleuser

    Use Apify's instagram-scraper Actor.
    Return: post text, image URLs, engagement metrics, timestamps
  `,
  model: "sonnet"
})
```

### Example: JavaScript SPA

```typescript
// SPA that needs browser interaction
Task({
  subagent_type: "scraper",
  prompt: `
    URL: https://spa-site.com/dashboard

    This is a React SPA. WebFetch returns empty content.

    Use Playwright to:
    1. Navigate to the URL
    2. Wait for content to load
    3. Take a snapshot
    4. Extract the data table content

    Return the extracted data in markdown table format.
  `,
  model: "sonnet"
})
```

## 🔄 Complete Retrieval Workflow

### Example: Retrieve Article Content

**User request:** "Get me the content from https://example.com/article"

**Execution:**

```typescript
// 1. Try Layer 1 (Built-in) first - this works 90% of the time
WebFetch({
  url: "https://example.com/article",
  prompt: "Extract the main article content, title, author, and published date"
})

// 2. If Layer 1 fails (blocked/CAPTCHA) - spawn scraper agent
Task({
  subagent_type: "scraper",
  prompt: `
    Retrieve article from: https://example.com/article
    WebFetch failed with: [error message]
    Extract: title, author, published date, main content
    Return in markdown format.
  `,
  model: "sonnet"
})
```

### Example: Search + Scrape Multiple Pages

**User request:** "Get content about React 19 from the top 5 search results"

**Execution:**

```typescript
// 1. Use Layer 1 for search:
WebSearch({
  query: "React 19 features documentation",
  allowed_domains: ["react.dev"]
})
// Extract URLs from results

// 2. Fetch each URL with Layer 1 (parallel):
WebFetch({ url: url1, prompt: "Extract main content" })
WebFetch({ url: url2, prompt: "Extract main content" })
// ... (run in parallel)

// 3. If any fetches fail, spawn agent for failed URLs only:
Task({
  subagent_type: "scraper",
  prompt: `
    Batch scrape these URLs that WebFetch couldn't handle:
    - ${failedUrl1}
    - ${failedUrl2}

    Use BrightData batch scraping.
    Return content in markdown format for each URL.
  `,
  model: "sonnet"
})
```

### Example: Protected Site Scraping

**User request:** "Scrape this CloudFlare-protected site"

**Execution:**

```typescript
// Known protected site - spawn agent directly (skip Layer 1)
Task({
  subagent_type: "scraper",
  prompt: `
    Scrape protected site: https://cloudflare-protected-site.com

    Site has CloudFlare protection. Use BrightData to bypass.
    If BrightData fails, try Apify RAG browser.
    Return content in markdown format.
  `,
  model: "sonnet"
})
```

## 📊 Layer Comparison Matrix

| Feature | Layer 1 (Built-in) | Layer 2 (@scraper Agent) |
|---------|-------------------|--------------------------|
| **Speed** | Fast (< 5s) | Slower (10-60s agent startup + work) |
| **Bot Detection Bypass** | ❌ No | ✅ Yes (via BrightData) |
| **CAPTCHA Handling** | ❌ No | ✅ Yes (via BrightData) |
| **JavaScript Rendering** | ⚠️ Limited | ✅ Full (via Playwright) |
| **Batch Operations** | Manual parallel | ✅ BrightData batch (10), Apify unlimited |
| **Social Media** | ❌ No | ✅ Yes (via Apify Actors) |
| **Session Impact** | None (built-in) | None (isolated agent) |
| **Cost** | Free | Paid (only when spawned) |
| **Best For** | 90% of requests | Protected sites, SPAs, specialized extraction |

## 🚨 Error Handling & Escalation

**Layer 1 Errors → Spawn @scraper Agent:**
- HTTP 403 (Forbidden)
- HTTP 429 (Rate Limited)
- HTTP 503 (Service Unavailable)
- Empty content returned
- CAPTCHA challenge detected
- Bot detection messages
- JavaScript-heavy SPA (empty/broken content)

**Agent Errors → Report to User:**
- All methods exhausted (BrightData, Apify, Playwright all failed)
- Site requires login/authentication
- Site technically impossible to scrape
- Legal/ethical concerns with scraping

**Agent Response Format:**
The scraper agent should return:
```markdown
## Retrieval Result

**URL:** https://example.com/page
**Method Used:** BrightData scrape_as_markdown
**Status:** Success

## Content
[extracted markdown content]

## Errors Encountered
- Layer 1 (WebFetch): 403 Forbidden - CloudFlare protection
- BrightData: Success on first attempt
```

## 📁 Scratchpad → History Pattern

**Working Directory (Scratchpad):** `${PAI_DIR}/scratchpad/YYYY-MM-DD-HHMMSS_retrieve-[site-or-topic]/`

**Process:**

1. **Scratchpad (Working Files - Temporary):**
   - Create timestamped directory for each retrieval task
   - Store raw scraped content (HTML, markdown, JSON)
   - Keep intermediate processing notes
   - Save error logs and retry attempts
   - Draft extracted data and transformations

2. **History (Permanent Archive):**
   - Move to `${PAI_DIR}/history/research/YYYY-MM-DD_[description]/` when complete
   - Include: `README.md`, final extracted content, metadata
   - Archive for future reference and reuse

3. **Verification (MANDATORY):**
   - Check if hooks captured output to history automatically
   - If hooks failed, manually save to history
   - Confirm all files present in history directory

**File Structure Example:**

**Scratchpad (temporary workspace):**
```
${PAI_DIR}/scratchpad/2025-10-26-143022_retrieve-react19-docs/
├── raw-content/
│   ├── page1.md (Layer 2 output)
│   ├── page2.md (Layer 2 output)
│   └── page3.md (Layer 2 output)
├── processed/
│   ├── combined-content.md
│   └── extracted-features.json
├── metadata.json (URLs, layers used, timestamps)
└── errors.log (failed attempts, escalations)
```

**History (permanent archive):**
```
${PAI_DIR}/history/research/2025-10-26_react19-documentation/
├── README.md (retrieval documentation)
├── content.md (final extracted content)
├── metadata.json (sources, layers used, timestamps)
└── summary.md (key extracted information)
```

**README.md Template:**
```markdown
# Retrieval: [Site/Topic]

**Date:** YYYY-MM-DD
**Target:** [URLs or site description]
**Layers Used:** Layer 1 / Layer 2 / Layer 3

## Retrieval Request
[Original request]

## URLs Retrieved
- URL 1
- URL 2
- URL 3

## Layers & Tools Used
- Layer 1: WebFetch (success/failed)
- Layer 2: BrightData scrape_as_markdown (success/failed)
- Layer 3: Apify RAG browser (success/failed)

## Challenges Encountered
- Bot detection: Yes/No
- CAPTCHA: Yes/No
- JavaScript rendering: Yes/No
- Rate limiting: Yes/No

## Output Files
- content.md: Final extracted content
- metadata.json: Source tracking
- summary.md: Key information extracted

## Notes
[Any limitations, challenges, or follow-up needed]
```

## 🎯 Quick Reference Card

**Always Try Layer 1 First (Built-in):**
- Simple public webpages
- Quick one-off fetches
- Basic search queries
- **90% of requests succeed here**

**Spawn @scraper Agent When:**
- Layer 1 blocked (403, 429, CAPTCHA)
- Known protected site (CloudFlare, etc.)
- JavaScript SPA with empty content
- Social media extraction needed
- Batch scraping required

**How to Spawn:**
```typescript
Task({
  subagent_type: "scraper",
  prompt: "URL: ..., Error: ..., Extract: ...",
  model: "sonnet"
})
```

**Remember:**
- Always try Layer 1 first (free, fast)
- Agent spawns with its own MCPs (no impact on your session)
- Agent terminates after returning results
- Document which method succeeded for future reference
