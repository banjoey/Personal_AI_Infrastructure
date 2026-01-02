#!/bin/bash
# UniFi Keychain Setup Script
# Sets up macOS keychain entries for local UniFi skill tools

set -e

SERVICE="unifi-controller"

echo "UniFi Keychain Setup"
echo "===================="
echo ""
echo "This will store your UniFi controller credentials in the macOS keychain."
echo "These are used by the PAI UniFi skill for direct API access."
echo ""

# Check for existing entries
check_entry() {
    security find-generic-password -s "$SERVICE" -a "$1" -w 2>/dev/null && return 0 || return 1
}

if check_entry "host"; then
    echo "Existing credentials found. Do you want to replace them? (y/n)"
    read -r REPLACE
    if [ "$REPLACE" != "y" ]; then
        echo "Keeping existing credentials."
        exit 0
    fi
    # Delete existing entries
    security delete-generic-password -s "$SERVICE" -a "host" 2>/dev/null || true
    security delete-generic-password -s "$SERVICE" -a "username" 2>/dev/null || true
    security delete-generic-password -s "$SERVICE" -a "password" 2>/dev/null || true
fi

# Get credentials
read -rp "UniFi Controller IP/Host [10.0.0.1]: " HOST
HOST=${HOST:-10.0.0.1}

read -rp "Username: " USERNAME
read -rsp "Password: " PASSWORD
echo ""

# Store in keychain
echo "Storing credentials in keychain..."

security add-generic-password -s "$SERVICE" -a "host" -w "$HOST" -U
security add-generic-password -s "$SERVICE" -a "username" -w "$USERNAME" -U
security add-generic-password -s "$SERVICE" -a "password" -w "$PASSWORD" -U

echo ""
echo "Credentials stored successfully!"
echo ""
echo "Test with:"
echo "  bun run ~/.claude/skills/Unifi/tools/GetSystemInfo.ts"
