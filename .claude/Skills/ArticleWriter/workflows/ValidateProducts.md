# ValidateProducts Workflow

Validates all affiliate product links are still active and in stock.

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `site_path` | Yes | Path to site root (e.g., `/path/to/pispycameras.com`) |
| `products_file` | No | Path to products.ts (default: `src/data/products.ts`) |
| `update_file` | No | Whether to update lastValidated timestamps (default: false) |

## Steps

### 1. Load Products

Read the central products file:
```typescript
import { products, getAllAsins } from '{site_path}/src/data/products';
const asins = getAllAsins();
```

### 2. Validate Each ASIN (Haiku - Parallel)

Launch parallel Haiku agents to check each product:
```
Task({
  prompt: "Check Amazon product page for ASIN {asin}.
           Fetch https://www.amazon.com/dp/{asin}
           Determine:
           1. Does the page return 200? (not 404 or redirect to search)
           2. Is the product in stock? (look for 'In Stock' or 'Add to Cart')
           3. What is the current price?
           Return JSON: {
             asin: string,
             status: 'valid' | 'unavailable' | 'out_of_stock',
             currentPrice: string | null,
             error: string | null
           }",
  subagent_type: "general-purpose",
  model: "haiku"
})
```

**Batch for efficiency:** Group into batches of 5-10 ASINs per agent.

### 3. Compile Results

Aggregate results:
```typescript
interface ValidationReport {
  checkedAt: string;
  totalProducts: number;
  valid: number;
  unavailable: number;
  outOfStock: number;
  errors: number;
  details: Array<{
    asin: string;
    name: string;
    status: string;
    currentPrice?: string;
    usedOn: string[];
    action?: string;
  }>;
}
```

### 4. Generate Report

Output a markdown report:
```markdown
# Product Validation Report - {date}

## Summary
- Total Products: {total}
- Valid: {valid}
- Unavailable: {unavailable}
- Out of Stock: {outOfStock}
- Errors: {errors}

## Issues Found

### Unavailable Products
| Product | ASIN | Used On | Action Needed |
|---------|------|---------|---------------|
| {name} | {asin} | {pages} | Find replacement |

### Out of Stock
| Product | ASIN | Used On | Action Needed |
|---------|------|---------|---------------|
| {name} | {asin} | {pages} | Monitor or replace |

## Price Changes
| Product | ASIN | Old Price | New Price |
|---------|------|-----------|-----------|
| {name} | {asin} | {old} | {new} |
```

### 5. Update Products File (Optional)

If `update_file` is true:
- Update `lastValidated` timestamps for valid products
- Add comments for products needing attention

## Usage Examples

**Quick validation check:**
```
"Validate all products for pispycameras.com"
→ Runs validation, outputs report
```

**With file updates:**
```
"Validate products and update timestamps"
→ Runs validation, updates products.ts with new lastValidated dates
```

**Check specific page:**
```
"Check if products on the best-hidden-cameras article are still valid"
→ Filters to products where usedOn includes that page
```

## Output

Returns validation report:
```typescript
{
  success: boolean,
  report: ValidationReport,
  reportPath?: string, // If saved to file
  updatedProducts: number // If file was updated
}
```

## Automation

Can be scheduled via cron or GitLab CI:
```yaml
validate_products:
  stage: maintenance
  script:
    - claude "Validate all products for this site"
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
  # Run weekly
```
