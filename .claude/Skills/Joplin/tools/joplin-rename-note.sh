#!/bin/bash
# Rename a Joplin note
# Usage: joplin-rename-note.sh <note_id> "New Title"

set -e

NOTE_ID="$1"
NEW_TITLE="$2"

if [[ -z "$NOTE_ID" || -z "$NEW_TITLE" ]]; then
    echo "Usage: joplin-rename-note.sh <note_id> \"New Title\""
    exit 1
fi

TOKEN=$(security find-generic-password -s "joplin-token" -a "claude-code" -w)
if [[ -z "$TOKEN" ]]; then
    echo "ERROR: Could not retrieve Joplin token from keychain"
    exit 1
fi

RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"$NEW_TITLE\"}" \
    "http://localhost:41184/notes/$NOTE_ID?token=$TOKEN")

if echo "$RESPONSE" | grep -q '"id"'; then
    echo "SUCCESS: Note renamed to '$NEW_TITLE'"
    echo "$RESPONSE" | jq -r '.title' 2>/dev/null || echo "$RESPONSE"
else
    echo "ERROR: $RESPONSE"
    exit 1
fi
