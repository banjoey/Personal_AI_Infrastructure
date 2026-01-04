---
name: ContentPublishing
description: Content lifecycle with calendar and SEO tools. USE WHEN user wants to plan content calendar, create articles, check SEO, schedule publishing, OR mentions blog posts, content strategy. Provides CLI tools for calendar management and SEO analysis.
---

# ContentPublishing

Content lifecycle management with CLI tools for calendar management and SEO optimization. Composes Cloudflare and GitLab skills for publishing automation.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName ContentPublishing
```

| Workflow | Trigger | File |
|----------|---------|------|
| **NewSiteProject** | "new website", "create site", "cloudflare pages" | `workflows/NewSiteProject.md` |
| **QuarterlyPlan** | "content calendar", "quarterly plan", "content roadmap" | `workflows/QuarterlyPlan.md` |
| **CreateArticle** | "write article", "create blog post", "new content" | `workflows/CreateArticle.md` |
| **ScheduledPublishing** | "schedule post", "publish later", "automate" | `workflows/ScheduledPublishing.md` |
| **ReviewPerformance** | "content analytics", "review performance" | `workflows/ReviewPerformance.md` |

## Tools

All tools are TypeScript CLIs for deterministic content management.

| Tool | Purpose | File |
|------|---------|------|
| **ContentCalendar** | Manage content planning and scheduling | `tools/ContentCalendar.ts` |
| **SeoChecker** | Analyze markdown for SEO best practices | `tools/SeoChecker.ts` |

## Examples

**Example 1: View content calendar**
```
User: "What content do we have planned for January?"
→ Runs tools/ContentCalendar.ts list --month=2025-01
→ Returns: 5 drafts, 3 scheduled, 2 published for January
```

**Example 2: Add content to calendar**
```
User: "Add 'Best Cameras 2025' article for January 15th"
→ Runs tools/ContentCalendar.ts add "Best Cameras 2025" --date=2025-01-15
→ Returns: Added content-abc123, status: draft
```

**Example 3: Check SEO before publishing**
```
User: "Check SEO for my new article"
→ Runs tools/SeoChecker.ts content/blog/cameras-2025.md
→ Returns: Score 85/100, 1 warning (description too short)
```

**Example 4: Bulk SEO audit**
```
User: "Audit all blog posts for SEO issues"
→ Runs tools/SeoChecker.ts --all --dir=content/blog
→ Returns: 12 files checked, avg score 78/100, 3 files with errors
```

## Integration

- **Cloudflare Skill:** Pages deployment, KV for metadata
- **GitLab Skill:** CI/CD for scheduled publishing
- **ArticleWriter Skill:** AI-assisted article creation

## Content Types

| Type | Format | Target |
|------|--------|--------|
| Blog posts | Markdown → Static | Cloudflare Pages |
| Tutorials | Markdown + code | Cloudflare Pages |
| Newsletter | Markdown → Email | API integration |
| Announcements | Markdown → Social | Multi-platform |

## SEO Checklist

| Check | Target | Severity |
|-------|--------|----------|
| Title length | 30-60 chars | Warning |
| Meta description | 120-160 chars | Error |
| H1 heading | Exactly 1 | Error |
| Content structure | 2+ H2 headings | Warning |
| Word count | 300+ words | Warning |
| Image alt text | All images | Warning |
| Featured image | Present | Warning |

## Common Operations

### Initialize content calendar
```bash
bun run tools/ContentCalendar.ts init
```

### List planned content
```bash
bun run tools/ContentCalendar.ts list
bun run tools/ContentCalendar.ts list --month=2025-01
```

### Add content to calendar
```bash
bun run tools/ContentCalendar.ts add "Article Title" --date=2025-01-15 --status=scheduled
```

### Check SEO for article
```bash
bun run tools/SeoChecker.ts content/blog/article.md
bun run tools/SeoChecker.ts --all --dir=content/blog
```

## Environment

```bash
CF_API_TOKEN        # Cloudflare API access
CF_ACCOUNT_ID       # Cloudflare account
GITLAB_TOKEN        # GitLab API for CI/CD
```
