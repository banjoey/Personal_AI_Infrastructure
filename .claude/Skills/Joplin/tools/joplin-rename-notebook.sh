#!/bin/bash
# Rename a Joplin notebook
# Usage: joplin-rename-notebook.sh <notebook_id> "New Name"

set -e

NOTEBOOK_ID="$1"
NEW_NAME="$2"

if [[ -z "$NOTEBOOK_ID" || -z "$NEW_NAME" ]]; then
    echo "Usage: joplin-rename-notebook.sh <notebook_id> \"New Name\""
    exit 1
fi

TOKEN=$(security find-generic-password -s "joplin-token" -a "claude-code" -w)
if [[ -z "$TOKEN" ]]; then
    echo "ERROR: Could not retrieve Joplin token from keychain"
    exit 1
fi

RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"$NEW_NAME\"}" \
    "http://localhost:41184/folders/$NOTEBOOK_ID?token=$TOKEN")

if echo "$RESPONSE" | grep -q '"id"'; then
    echo "SUCCESS: Notebook renamed to '$NEW_NAME'"
    echo "$RESPONSE" | jq -r '.title' 2>/dev/null || echo "$RESPONSE"
else
    echo "ERROR: $RESPONSE"
    exit 1
fi
