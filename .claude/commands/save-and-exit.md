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
     - "Yes, save context" - Save the summary to the project's context file
     - "No, just exit" - Exit without saving

3. **If user chooses to save:**
   - Determine the context file location (check in order):
     - `./project-context.md` (if exists)
     - `./.claude/context.md` (if .claude/ exists)
     - `./CONTEXT.md` (fallback)
   - Write the session summary with this format:
     ```markdown
     ## Session Summary - [DATE]

     ### Completed
     - [List of completed tasks]

     ### Decisions
     - [Key decisions made]

     ### Next Steps
     - [Recommended follow-ups]
     ```
   - If the file already exists, append to or update the "Session Summary" section

4. **Confirm and exit:**
   - If saved: "Context saved to [path]. Goodbye!"
   - If not saved: "Goodbye! Use /save-and-exit next time to preserve context."

5. **Important:** After completing this flow, remind the user to type `/exit` or close the terminal to end the session.
