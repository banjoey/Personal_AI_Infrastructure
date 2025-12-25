# Sync to Claude Code Workflow

**Sync skills and configs from OpenCode (opencode-all) to Claude Code (joey-all)**

## Trigger
- "sync to claude code"
- "update joey-all"
- "port skills to claude"
- "I added skills in opencode"

## Steps

### 1. Pull Latest from OpenCode

```bash
cd ~/src/PAI-opencode
git checkout opencode-all
git pull origin opencode-all
```

### 2. Check What's New

```bash
# List skills in OpenCode
OPENCODE_SKILLS=$(ls ~/src/PAI-opencode/.opencode/skill/)

# List skills in Claude Code
CLAUDE_SKILLS=$(ls ~/src/pai/Personal_AI_Infrastructure/.claude/skills/ 2>/dev/null || ls ~/src/pai/Personal_AI_Infrastructure/.claude/Skills/)

# Find new skills
echo "New skills to sync:"
comm -23 <(echo "$OPENCODE_SKILLS" | sort) <(echo "$CLAUDE_SKILLS" | sort)
```

### 3. Sync Skills

```bash
# Determine target directory (prefer Skills TitleCase)
if [ -d ~/src/pai/Personal_AI_Infrastructure/.claude/Skills ]; then
    DEST=~/src/pai/Personal_AI_Infrastructure/.claude/Skills
else
    DEST=~/src/pai/Personal_AI_Infrastructure/.claude/skills
fi

# Sync from OpenCode to Claude Code
rsync -av --delete \
    ~/src/PAI-opencode/.opencode/skill/ \
    "$DEST/"
```

### 4. Commit to Claude Code Repo

```bash
cd ~/src/pai/Personal_AI_Infrastructure
git add .claude/skills/ .claude/Skills/
git status

# Show what changed
git diff --cached --stat

# Commit
git commit -m "sync: Update skills from opencode-all $(date +%Y-%m-%d)"
```

### 5. Push to Remote

```bash
git push origin joey-all
```

## Output

Report:
- Number of skills synced
- New skills added
- Skills removed (if any)
