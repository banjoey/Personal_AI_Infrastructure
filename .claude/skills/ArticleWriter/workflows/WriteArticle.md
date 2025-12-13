# WriteArticle Workflow

Writes the full article content from an outline using Sonnet for cost efficiency.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `outline` | Yes | Article outline from PlanArticle workflow |
| `products` | Yes | Product array with ASINs, prices, features |
| `affiliate_tag` | No | Amazon affiliate tag (default: pispy01-20) |

## Steps

### 1. Section Generation (Sonnet)

For each section in the outline, delegate to Sonnet:
```
Task({
  prompt: "Write the '{section.title}' section for article about {topic}.
           Use these products: {products}.
           Include affiliate links with tag {affiliate_tag}.
           Match this tone: informative, trustworthy, conversion-focused.
           Output as markdown.",
  subagent_type: "engineer",
  model: "sonnet"
})
```

### 2. Section Order

Write sections in this order:
1. **Introduction** - Hook + promise of value
2. **Quick Picks** - Top 3 with badges (Best Overall, Best Budget, Best for X)
3. **What to Look For** - Buying criteria (builds authority)
4. **Detailed Reviews** - Each product with template:
   ```markdown
   ### {rank}. {Product Name} - {Badge}

   **Best for:** {use case}

   [Image placeholder]

   {2-3 paragraph review}

   **Pros:**
   - Pro 1
   - Pro 2
   - Pro 3

   **Cons:**
   - Con 1
   - Con 2

   **Specs:** Resolution | WiFi | Night Vision | Storage

   [Check Price on Amazon](https://amazon.com/dp/{ASIN}?tag={affiliate_tag})
   ```
5. **Comparison Table** - Side-by-side specs
6. **Use Cases** - Scenario recommendations
7. **Legal Section** - Required for surveillance products
8. **FAQ** - Schema-ready Q&A format
9. **Conclusion** - Summary with final CTA

### 3. Internal Linking

Add internal links to related articles:
- Link to category pages
- Link to related buying guides
- Link to legal/disclosure pages

### 4. Quality Review (Opus)

Main agent reviews for:
- Accuracy of product information
- Proper affiliate link format
- SEO keyword density (1-2%)
- Readability score
- Legal compliance

## Output

Returns complete article:
```typescript
{
  frontmatter: {
    title: string,
    description: string,
    pubDate: Date,
    updatedDate: Date,
    heroImage: string,
    category: string,
    tags: string[]
  },
  content: string, // Full markdown
  wordCount: number,
  readingTime: number
}
```
