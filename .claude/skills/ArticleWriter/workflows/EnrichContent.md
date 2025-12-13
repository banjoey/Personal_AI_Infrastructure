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

### 2. Amazon Product Images

As an Amazon Associate, you can use Amazon product images with these rules:
- **Must link to Amazon** - Image must be wrapped in affiliate link
- **No modifications** - No cropping, watermarks, or alterations
- **Hotlink from Amazon CDN** - Don't download/rehost images

**Method A: Direct ASIN Image URL (Simple)**

Amazon provides predictable image URLs based on ASIN:
```
https://m.media-amazon.com/images/I/{IMAGE_ID}._AC_SL1500_.jpg
```

To get the IMAGE_ID, scrape the product page or use PA-API.

**Method B: Product Advertising API (Official)**

If `AMAZON_PA_API_KEY` is configured:
```bash
# PA-API returns image URLs in response
curl -X POST "https://webservices.amazon.com/paapi5/getitems" \
  -H "Content-Type: application/json" \
  -d '{
    "ItemIds": ["{ASIN}"],
    "Resources": ["Images.Primary.Large", "Images.Variants.Large"]
  }'
```

**Method C: Fallback - Product Page Scrape (Haiku)**

```
Task({
  prompt: "Fetch Amazon product page for ASIN {asin}.
           Extract the main product image URL from og:image meta tag.
           Return the full image URL.",
  subagent_type: "general-purpose",
  model: "haiku"
})
```

**Image Component Usage:**
```astro
<a href="https://amazon.com/dp/{ASIN}?tag=pispy01-20">
  <img
    src="{amazon_image_url}"
    alt="{product_name}"
    loading="lazy"
    class="product-image"
  />
</a>
```

**Compliance Notes:**
- Images MUST link to Amazon (Associates requirement)
- Don't cache images locally - always hotlink
- Include affiliate tag in all image links
- Alt text should describe the product for SEO

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
