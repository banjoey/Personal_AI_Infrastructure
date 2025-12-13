# NewSiteProject Workflow

Creates a new Cloudflare Pages website with GitLab CI/CD auto-deployment.

## Triggers

- "new website", "create a site", "set up a new project"
- "deploy to cloudflare", "cloudflare pages project"
- "website on gitlab"

## Prerequisites

- Cloudflare MCP configured (use McpManager skill to add if missing)
- GitLab token available (`GITLAB_TOKEN` env var)
- Cloudflare credentials (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `project_name` | Yes | Lowercase, hyphenated name (e.g., `my-site`) |
| `description` | No | Short description for GitLab repo |
| `framework` | No | Default: `astro`. Options: `astro`, `hugo`, `next` |
| `visibility` | No | GitLab repo visibility. Default: `private` |

## Workflow Steps

### 1. Project Scaffold

Create project structure based on framework:

```bash
# For Astro (default)
mkdir -p src/pages src/components src/layouts src/content public docs
```

Create minimal files:
- `package.json` with framework dependencies
- `src/pages/index.astro` (or equivalent) with coming soon page
- `.gitignore` with framework-specific ignores
- `README.md` with project docs
- `.mcp.json` with Cloudflare MCP config

### 2. GitLab CI/CD Configuration

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - deploy

variables:
  BUN_VERSION: "1.1.38"

build:
  stage: build
  image: oven/bun:${BUN_VERSION}
  script:
    - bun install --frozen-lockfile
    - bun run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

deploy_production:
  stage: deploy
  image: node:20-alpine
  dependencies:
    - build
  before_script:
    - npm install -g wrangler
  script:
    - wrangler pages deploy dist --project-name=${PROJECT_NAME} --branch=main
  environment:
    name: production
    url: https://${PROJECT_NAME}.pages.dev
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy_preview:
  stage: deploy
  image: node:20-alpine
  dependencies:
    - build
  before_script:
    - npm install -g wrangler
  script:
    - wrangler pages deploy dist --project-name=${PROJECT_NAME} --branch=$CI_COMMIT_REF_SLUG
  environment:
    name: preview/$CI_COMMIT_REF_SLUG
    url: https://$CI_COMMIT_REF_SLUG.${PROJECT_NAME}.pages.dev
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

### 3. Initialize Git Repository

```bash
git init
git add -A
git commit -m "Initial project setup with ${framework} and GitLab CI/CD"
```

### 4. Create GitLab Repository

Use GitLab API:

```bash
curl -X POST -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "https://gitlab.com/api/v4/projects" \
  -d "name=${project_name}&visibility=${visibility}&description=${description}"
```

### 5. Create Cloudflare Pages Project

Use Cloudflare MCP:

```
mcp__cloudflare__cloudflare-dns-mcp_create_pages_project
  name: ${project_name}
  production_branch: main
  build_config:
    build_command: "bun run build"
    destination_dir: "dist"
```

### 6. Configure GitLab CI Variables

Add Cloudflare credentials to GitLab project:

```bash
# Add CLOUDFLARE_API_TOKEN (masked)
curl -X POST -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "https://gitlab.com/api/v4/projects/${PROJECT_ID}/variables" \
  -d "key=CLOUDFLARE_API_TOKEN&value=${CLOUDFLARE_API_TOKEN}&masked=true"

# Add CLOUDFLARE_ACCOUNT_ID
curl -X POST -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  "https://gitlab.com/api/v4/projects/${PROJECT_ID}/variables" \
  -d "key=CLOUDFLARE_ACCOUNT_ID&value=${CLOUDFLARE_ACCOUNT_ID}"
```

### 7. Push to GitLab

```bash
git remote add origin git@gitlab.com:${GITLAB_USER}/${project_name}.git
git push -u origin main
```

## Outputs

| Output | Description |
|--------|-------------|
| GitLab URL | `https://gitlab.com/${user}/${project_name}` |
| Pages URL | `https://${project_name}.pages.dev` |
| Pipeline URL | Link to first CI pipeline |

## Post-Workflow

After project is created:
1. Wait for pipeline to complete (~2-3 minutes)
2. Verify site is live at `https://${project_name}.pages.dev`
3. Optionally add custom domain via Cloudflare MCP

## Example Usage

```
User: "Create a new website called my-blog"

Charles:
1. Creates Astro project scaffold
2. Creates GitLab repo (private): gitlab.com/user/my-blog
3. Creates Cloudflare Pages project: my-blog.pages.dev
4. Configures CI/CD with Cloudflare credentials
5. Pushes code, pipeline deploys automatically

Output:
- GitLab: https://gitlab.com/mikmattley/my-blog
- Live site: https://my-blog.pages.dev
- Pipeline: https://gitlab.com/mikmattley/my-blog/-/pipelines/123
```

## Notes

- Always use `bun` as package manager (PAI standard)
- Default to private GitLab repos for security
- Pages subdomain used initially; custom domain added later via separate workflow
- MCP config (`.mcp.json`) included but `.claude/` directory gitignored
