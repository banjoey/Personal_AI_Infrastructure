#!/bin/bash
# Move a Joplin notebook under a different parent
# Usage: joplin-move-notebook.sh <notebook_id> <parent_notebook_id>
# Use empty string "" for parent_id to move to root level

set -e

NOTEBOOK_ID="$1"
PARENT_ID="$2"

if [[ -z "$NOTEBOOK_ID" ]]; then
    echo "Usage: joplin-move-notebook.sh <notebook_id> <parent_notebook_id>"
    echo "Use empty string \"\" for parent_id to move to root level"
    exit 1
fi

TOKEN=$(security find-generic-password -s "joplin-token" -a "claude-code" -w)
if [[ -z "$TOKEN" ]]; then
    echo "ERROR: Could not retrieve Joplin token from keychain"
    exit 1
fi

RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d "{\"parent_id\": \"$PARENT_ID\"}" \
    "http://localhost:41184/folders/$NOTEBOOK_ID?token=$TOKEN")

if echo "$RESPONSE" | grep -q '"id"'; then
    echo "SUCCESS: Notebook moved"
    echo "$RESPONSE" | jq -r '.title' 2>/dev/null || echo "$RESPONSE"
else
    echo "ERROR: $RESPONSE"
    exit 1
fi
