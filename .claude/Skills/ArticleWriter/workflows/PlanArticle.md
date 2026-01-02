# PlanArticle Workflow

Creates a detailed article outline with SEO keywords and product research.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `topic` | Yes | Article topic (e.g., "USB charger spy cameras") |
| `site` | No | Target site for affiliate config (default: pispycameras.com) |
| `product_count` | No | Number of products to include (default: 7) |

## Steps

### 1. Keyword Research

Use WebSearch to find:
- Primary keyword (highest volume)
- Secondary keywords (3-5 related terms)
- Long-tail variations
- Questions people ask (for FAQ section)

### 2. Product Research

Use research agents to find real Amazon products:
```
Task({
  prompt: "Find {product_count} real Amazon products for {topic} with ASINs, prices, features",
  subagent_type: "perplexity-researcher",
  model: "sonnet"
})
```

### 3. Create Outline

Structure:
```markdown
# {Title} - {Year}

## Quick Picks
[List top 3 with badges: Best Overall, Best Budget, Best for X]

## What to Look For
[5-7 buying criteria sections]

## Detailed Reviews
[{product_count} products with template for each]

## Comparison Table
[Columns: Name, Resolution, WiFi, Night Vision, Price]

## Use Cases
[3-4 scenario-based recommendations]

## Legal Section
[Required for surveillance products]

## FAQ
[5-7 questions from keyword research]

## Conclusion
[Summary with affiliate links]
```

### 4. SEO Metadata

Generate:
- Title tag (60 chars max)
- Meta description (160 chars max)
- Target keywords
- Schema markup outline

## Output

Returns structured outline object:
```typescript
{
  title: string,
  slug: string,
  keywords: string[],
  products: Product[],
  outline: Section[],
  seoMeta: { title, description, schema }
}
```
