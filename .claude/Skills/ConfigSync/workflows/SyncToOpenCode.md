# Sync to OpenCode Workflow

**Sync skills and configs from Claude Code (joey-all) to OpenCode (opencode-all)**

## Trigger
- "sync to opencode"
- "update opencode-all"
- "port skills to opencode"
- "I added skills in claude code"

## Steps

### 1. Pull Latest from Claude Code

```bash
cd ~/src/pai/Personal_AI_Infrastructure
git checkout joey-all
git pull origin joey-all
```

### 2. Check What's New

```bash
# List skills in Claude Code
CLAUDE_SKILLS=$(ls ~/src/pai/Personal_AI_Infrastructure/.claude/skills/ 2>/dev/null || ls ~/src/pai/Personal_AI_Infrastructure/.claude/Skills/)

# List skills in OpenCode
OPENCODE_SKILLS=$(ls ~/src/PAI-opencode/.opencode/skill/)

# Find new skills
echo "New skills to sync:"
comm -23 <(echo "$CLAUDE_SKILLS" | sort) <(echo "$OPENCODE_SKILLS" | sort)
```

### 3. Sync Skills

```bash
# Determine source directory (skills or Skills)
if [ -d ~/src/pai/Personal_AI_Infrastructure/.claude/Skills ]; then
    SRC=~/src/pai/Personal_AI_Infrastructure/.claude/Skills
else
    SRC=~/src/pai/Personal_AI_Infrastructure/.claude/skills
fi

# Sync to OpenCode repo
rsync -av --delete \
    "$SRC/" \
    ~/src/PAI-opencode/.opencode/skill/
```

### 4. Verify Structure

```bash
# Ensure lowercase top-level (OpenCode requirement)
# Subdirs should remain TitleCase

ls ~/src/PAI-opencode/.opencode/skill/ | head -10
```

### 5. Commit to OpenCode Repo

```bash
cd ~/src/PAI-opencode
git add .opencode/skill/
git status

# Show what changed
git diff --cached --stat

# Commit
git commit -m "sync: Update skills from joey-all $(date +%Y-%m-%d)"
```

### 6. Push to Remote

```bash
git push origin opencode-all
```

### 7. Deploy to Live (Optional)

If user wants immediate deployment:

```bash
rsync -av --delete \
    ~/src/PAI-opencode/.opencode/skill/ \
    ~/.config/opencode/skill/

echo "Deployed $(ls ~/.config/opencode/skill/ | wc -l) skills to live config"
echo "Restart OpenCode session to load new skills"
```

## Output

Report:
- Number of skills synced
- New skills added
- Skills removed (if any)
- Whether deployed to live
