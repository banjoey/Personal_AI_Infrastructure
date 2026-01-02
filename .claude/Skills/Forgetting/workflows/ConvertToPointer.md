# ConvertToPointer Workflow

Converts an archived item to a minimal pointer reference, removing the full archive file.

## Trigger

- "convert to pointer"
- "compress this archive"
- "this archive is old, just keep a reference"

## When to Use

- Archived items that are 90+ days old
- Archives you're unlikely to need full detail from
- When you want to reduce storage while keeping a breadcrumb

## Prerequisites

- Archive file exists in `captures/archive/`

## Steps

### 1. Identify the Archive

List candidates from GenerateCandidates output, or specify directly:

```bash
ls ~/workshop/captures/archive/
```

### 2. Convert to Pointer

```bash
bun run ${CAPTURE_TOOLS}/archive-item.ts -w ${WORKSPACE_ROOT} \
  --to-pointer \
  --archive-path captures/archive/ARCH-<id>-<slug>.md
```

This:
- Reads the archive file
- Extracts title and date
- Adds a one-line entry to `captures/POINTERS.md`
- Deletes the archive file

### 3. Confirm Completion

Report:
- Pointer added to POINTERS.md
- Archive file removed
- Storage recovered

## Output

- Entry added to `captures/POINTERS.md`:
  ```markdown
  - DNS Migration (2025-12-15) - see archive/ARCH-ACT-001-dns-migration.md
  ```

Note: The pointer still references the old filename for searchability, but the file no longer exists.

## Pointer Format

The POINTERS.md file is a simple list:

```markdown
# Archived Pointers

Reference list of archived items. See archive/ for full details if needed.

---

- DNS Migration (2025-12-15) - completed IaC migration
- Security Audit (2025-11-20) - passed all checks
- K8s Upgrade (2025-10-01) - v1.28 → v1.29
```

## Reversibility

**Pointers are NOT reversible.** The original archive content is deleted.

If you need to preserve content:
1. Don't convert to pointer
2. Or copy the archive elsewhere first

## Example

```
User: "Convert ARCH-ACT-001-dns-migration.md to a pointer"

→ Read archive file
→ Extract: "DNS Migration", archived 2025-12-15
→ Add to POINTERS.md: "- DNS Migration (2025-12-15) - see archive/..."
→ Delete archive file
→ Report: "Converted to pointer. Archive file removed."
```

## Batch Conversion

For multiple old archives:

```bash
# First, see candidates
bun run ${CAPTURE_TOOLS}/generate-forgetting.ts -w ~/workshop --json | jq '.candidates.archivedToPointer'

# Then convert each (or script it)
for f in captures/archive/ARCH-OLD-*.md; do
  bun run archive-item.ts -w ~/workshop --to-pointer --archive-path "$f"
done
```
