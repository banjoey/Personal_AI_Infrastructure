# List Workflow

**Purpose:** List and search Architecture Decision Records.

## Execution Steps

1. **Determine scope**
   - Current project only?
   - PAI-wide only?
   - All locations?

2. **Scan ADR directories**
   ```bash
   # Project ADRs
   ls <project>/docs/decisions/ADR-*.md 2>/dev/null

   # PAI-wide ADRs
   ls ${PAI_DIR}/docs/decisions/ADR-*.md 2>/dev/null
   ```

3. **Parse ADR metadata**
   For each ADR file:
   - Extract number from filename
   - Extract title from first heading
   - Extract status from **Status:** line
   - Extract date from **Date:** line

4. **Filter if requested**
   - By status (accepted, deprecated, superseded)
   - By keyword in title or content
   - By date range
   - By domain (infra, security, etc.)

5. **Format output**
   ```
   === ADRs in <location> ===

   ADR-001: Use Infisical for secrets (accepted, 2025-12-21)
   ADR-002: MCP HTTP transport via supergateway (accepted, 2025-12-20)
   ADR-003: ArgoCD for GitOps (proposed, 2025-12-19)
   ```

6. **Offer to read specific ADR**
   If user wants details, read and summarize the full ADR.

## Example

**Listing all accepted ADRs:**

```bash
# Find all ADR files
find ~/PAI/docs/decisions -name "ADR-*.md" 2>/dev/null

# For each, extract status
grep -l "Status.*accepted" ~/PAI/docs/decisions/ADR-*.md
```

## Quick Summary Format

For brief listings:
```
| # | Title | Status | Date |
|---|-------|--------|------|
| 001 | Use Infisical for secrets | accepted | 2025-12-21 |
| 002 | MCP HTTP transport | accepted | 2025-12-20 |
```

## Notes

- Sort by ADR number (ascending)
- Clearly indicate deprecated/superseded ADRs
- For superseded ADRs, show which ADR supersedes them
