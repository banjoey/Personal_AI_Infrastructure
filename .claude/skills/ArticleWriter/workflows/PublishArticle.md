# PublishArticle Workflow

Publishes completed articles to the target site via GitLab CI/CD and Cloudflare Pages.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `article` | Yes | Complete article object from WriteArticle |
| `site` | Yes | Target site (e.g., pispycameras.com) |
| `repo` | No | GitLab repo path (auto-detected from site config) |

## Steps

### 1. Format for Astro

Convert article to Astro page format:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import ProductCard from '../../components/ProductCard.astro';
import ComparisonTable from '../../components/ComparisonTable.astro';
import YouTubeEmbed from '../../components/YouTubeEmbed.astro';

const title = "{article.frontmatter.title}";
const description = "{article.frontmatter.description}";
const products = {article.products};
---

<BaseLayout title={title} description={description} article={true}>
  {/* Article content */}
</BaseLayout>
```

### 2. File Placement

Determine correct path:
- Articles: `src/pages/articles/{slug}.astro`
- Category pages: `src/pages/{category}/index.astro`
- Landing pages: `src/pages/{slug}.astro`

### 3. Git Operations

Stage and commit changes:
```bash
git add src/pages/articles/{slug}.astro
git commit -m "Add article: {title}

- {wordCount} words, {readingTime} min read
- {productCount} products reviewed
- SEO: {primaryKeyword}

🤖 Generated with Claude Code"
```

### 4. Push to GitLab

Push to main branch to trigger CI/CD:
```bash
git push origin main
```

### 5. Monitor Deployment

Track GitLab pipeline:
```bash
# Get pipeline status
curl --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/{project_id}/pipelines?per_page=1"
```

Wait for stages:
1. `build` - Astro build
2. `deploy` - Cloudflare Pages deployment
3. `post_deploy` - Cache purge (if custom domain)

### 6. Verify Live

After deployment completes:
```
Task({
  prompt: "Verify {live_url} is accessible and renders correctly.
           Check: title tag, meta description, product links, images.",
  subagent_type: "general-purpose",
  model: "haiku"
})
```

### 7. Index Request (Optional)

For new articles, request Google indexing:
```bash
# Using Google Indexing API (if configured)
curl -X POST "https://indexing.googleapis.com/v3/urlNotifications:publish" \
  -H "Authorization: Bearer $GOOGLE_TOKEN" \
  -d '{
    "url": "{live_url}",
    "type": "URL_UPDATED"
  }'
```

## Output

Returns publish result:
```typescript
{
  success: boolean,
  liveUrl: string,
  pipelineId: string,
  pipelineUrl: string,
  deploymentTime: number, // seconds
  cacheStatus: "purged" | "not_needed",
  indexingRequested: boolean
}
```

## Site Configuration

Site configs stored in skill config:
```yaml
sites:
  pispycameras.com:
    repo: mikmattley/pispycameras
    branch: main
    pagesProject: pispycameras
    affiliateTag: pispy01-20
    layout: BaseLayout
    components:
      - ProductCard
      - ComparisonTable
      - YouTubeEmbed
```
