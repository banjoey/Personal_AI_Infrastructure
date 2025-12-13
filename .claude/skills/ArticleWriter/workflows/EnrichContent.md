# EnrichContent Workflow

Adds multimedia enrichment to articles: YouTube videos, product images, and schema markup.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `article_path` | Yes | Path to the article file |
| `products` | Yes | Product array with names and ASINs |
| `enrich_types` | No | Array of enrichment types (default: all) |

## Steps

### 1. YouTube Video Search (Haiku)

For each product, find relevant review videos:
```
Task({
  prompt: "Search YouTube for '{product.name} review 2024' or '{product.name} test'.
           Find videos with:
           - Views > 10,000
           - Duration 5-15 minutes
           - Published within last 2 years
           Return: videoId, title, channel, viewCount",
  subagent_type: "general-purpose",
  model: "haiku"
})
```

**Video Selection Criteria:**
- Prioritize channels with 10K+ subscribers
- Prefer unsponsored reviews
- Match product exactly (not generic category)

### 2. Product Image Sources

Find product images in this priority order:
1. **Amazon Product Images** - Via Product Advertising API (if available)
2. **Manufacturer Press Kit** - High-res official images
3. **Placeholder with Alt Text** - If no images found

Image requirements:
- Minimum 800px width
- WebP format preferred
- Descriptive alt text for SEO

### 3. Schema Markup Generation

Generate JSON-LD schema for:

**Product Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{product.name}",
  "description": "{product.description}",
  "image": "{product.image}",
  "offers": {
    "@type": "Offer",
    "price": "{product.price}",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "{affiliate_url}"
  }
}
```

**FAQ Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "{question}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "{answer}"
      }
    }
  ]
}
```

**Article Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{title}",
  "datePublished": "{pubDate}",
  "dateModified": "{updatedDate}",
  "author": {
    "@type": "Organization",
    "name": "PI Spy Cameras"
  }
}
```

### 4. Embed Integration

Insert enrichments into article:
- YouTube embeds after product descriptions
- Schema in article frontmatter or head
- Image placeholders with lazy loading

**YouTube Embed Component:**
```astro
<YouTubeEmbed videoId="{id}" title="{product} Review" />
```

### 5. Validation (Haiku)

Quick validation pass:
```
Task({
  prompt: "Validate these YouTube video IDs are still active: {videoIds}",
  subagent_type: "general-purpose",
  model: "haiku"
})
```

## Output

Returns enrichment report:
```typescript
{
  videos: Array<{
    productName: string,
    videoId: string,
    title: string,
    embedCode: string
  }>,
  images: Array<{
    productName: string,
    imageUrl: string,
    altText: string
  }>,
  schema: {
    products: object[],
    faq: object,
    article: object
  },
  insertions: number
}
```
