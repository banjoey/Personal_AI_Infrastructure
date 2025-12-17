# Save and Exit Command

You are about to end this session. Before exiting, let's save context for next time.

## Instructions

1. **Generate a session summary** by reviewing what was accomplished in this conversation:
   - Key tasks completed
   - Important decisions made
   - Files modified
   - Any unfinished work or next steps

2. **Ask the user** using AskUserQuestion:
   - Question: "Save session context before exiting?"
   - Options:
     - "Yes, save to CLAUDE.local.md" - Save personal context (not committed to git)
     - "Yes, save to CLAUDE.md" - Save to team-shared context
     - "No, just exit" - Exit without saving

3. **If user chooses to save:**
   - For CLAUDE.local.md: Write to `./CLAUDE.local.md` (personal, gitignored)
   - For CLAUDE.md: Write to `./CLAUDE.md` (team shared)
   - If the file already exists, append a new session section
   - Use this format:
     ```markdown
     ## Session Summary - [DATE]

     ### Completed
     - [List of completed tasks]

     ### Decisions
     - [Key decisions made]

     ### Next Steps
     - [Recommended follow-ups]

     ---
     ```

4. **Context file priority** (for reference):
   - `CLAUDE.md` - Project memory (team shared, Claude Code native)
   - `.claude/CLAUDE.md` - Alternative location
   - `CLAUDE.local.md` - Personal project-specific (recommended for session saves)
   - Legacy: `project-context.md`, `CONTEXT.md`, `.claude/context.md`

5. **Confirm and exit:**
   - If saved: "Context saved to [path]. Claude Code will auto-load it next session. Goodbye!"
   - If not saved: "Goodbye! Use /save-and-exit next time to preserve context."

6. **Important:** After completing this flow, remind the user to type `/exit` or Ctrl+C to end the session.
