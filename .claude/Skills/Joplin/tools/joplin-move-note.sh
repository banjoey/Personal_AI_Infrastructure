#!/bin/bash
# Move a Joplin note to a different notebook
# Usage: joplin-move-note.sh <note_id> <target_notebook_id>

set -e

NOTE_ID="$1"
TARGET_NOTEBOOK_ID="$2"

if [[ -z "$NOTE_ID" || -z "$TARGET_NOTEBOOK_ID" ]]; then
    echo "Usage: joplin-move-note.sh <note_id> <target_notebook_id>"
    exit 1
fi

TOKEN=$(security find-generic-password -s "joplin-token" -a "claude-code" -w)
if [[ -z "$TOKEN" ]]; then
    echo "ERROR: Could not retrieve Joplin token from keychain"
    exit 1
fi

RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d "{\"parent_id\": \"$TARGET_NOTEBOOK_ID\"}" \
    "http://localhost:41184/notes/$NOTE_ID?token=$TOKEN")

if echo "$RESPONSE" | grep -q '"id"'; then
    echo "SUCCESS: Note moved to notebook $TARGET_NOTEBOOK_ID"
    echo "$RESPONSE" | jq -r '.title' 2>/dev/null || echo "$RESPONSE"
else
    echo "ERROR: $RESPONSE"
    exit 1
fi
