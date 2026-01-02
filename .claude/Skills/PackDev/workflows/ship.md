# Workflow: Shipping

Use this workflow during the SHIP phase.

---

## Purpose

Deploy to production. Make it available to users.

---

## Prerequisites

- VERIFY phase complete
- verify.md shows all criteria met
- All tests pass

---

## Steps

### 1. Create Merge Request

```bash
# Ensure all changes committed
git status

# Push branch
git push -u origin PACK-XXX-description

# Create MR (or use GitLab UI)
```

MR title: `PACK-XXX: [Brief description]`

MR description should include:
- Link to story in Linear
- Summary of changes
- Testing notes

### 2. Wait for Pipeline

- All CI jobs must pass
- Security scans must be clean
- Coverage must meet threshold

### 3. Request Review

Move story to "In Review" in Linear.

Handler will review in next batch session.

### 4. Address Feedback

If changes requested:
1. Make the changes
2. Push new commits
3. Request re-review

### 5. Merge (Handler Does This)

Handler merges when approved.

### 6. Verify Deployment

After merge:
1. Confirm deployment succeeded
2. Run smoke tests
3. Check logs for errors

### 7. Close Story

Mark story "Done" in Linear.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Deploying Friday afternoon | Ship early in the week |
| No rollback plan | Know how to revert first |
| Skipping smoke tests | Always verify production |
| Forgetting Linear | Update status |

---

## Output

When complete:
- Code merged to main
- Deployed to production
- Story marked Done
- Move to next story
