#!/bin/bash

#
# 01-mcp-sync.sh
#
# Pre-startup module: Sync MCP configurations
#
# Merge Logic:
#   - Global MCPs (~/.claude/.mcp.json) are the source of truth
#   - Global servers overwrite matching project servers (global wins)
#   - Project-only servers are preserved (e.g., project-specific MCPs)
#

# Use PAI_DIR from environment or default
PAI_DIR="${PAI_DIR:-$HOME/.claude}"
GLOBAL_MCP="$PAI_DIR/.mcp.json"

# Fallback to ~/.claude if PAI_DIR doesn't have .mcp.json
if [[ ! -f "$GLOBAL_MCP" ]] && [[ -f "$HOME/.claude/.mcp.json" ]]; then
    GLOBAL_MCP="$HOME/.claude/.mcp.json"
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "  ${BLUE}→${NC} $1"; }
log_success() { echo -e "  ${GREEN}✓${NC} $1"; }
log_warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }

# Find project MCP config in current directory
find_project_mcp() {
    local cwd="$1"

    if [[ -f "$cwd/.mcp.json" ]]; then
        echo "$cwd/.mcp.json"
    elif [[ -f "$cwd/.claude/.mcp.json" ]]; then
        echo "$cwd/.claude/.mcp.json"
    else
        echo ""
    fi
}

# Sync MCP configs using jq
sync_mcp_configs() {
    local project_mcp="$1"

    if [[ ! -f "$GLOBAL_MCP" ]]; then
        log_warn "No global MCP config found at $GLOBAL_MCP"
        return 0
    fi

    if [[ -z "$project_mcp" ]]; then
        log_info "No project MCP config - using global config only"
        return 0
    fi

    if ! command -v jq &> /dev/null; then
        log_warn "jq not installed - skipping MCP sync (brew install jq)"
        return 0
    fi

    log_info "Syncing: $GLOBAL_MCP → $project_mcp"

    # Read both configs
    local global_servers project_servers
    global_servers=$(jq -r '.mcpServers // {}' "$GLOBAL_MCP")
    project_servers=$(jq -r '.mcpServers // {}' "$project_mcp")

    # Merge: project first, then global (global wins for conflicts)
    local merged
    merged=$(jq -n \
        --argjson project "$project_servers" \
        --argjson global "$global_servers" \
        '$project * $global')

    # Check if anything changed
    local current_sorted merged_sorted
    current_sorted=$(echo "$project_servers" | jq -S '.')
    merged_sorted=$(echo "$merged" | jq -S '.')

    if [[ "$current_sorted" == "$merged_sorted" ]]; then
        log_success "MCP configs already in sync"
        return 0
    fi

    # Show what's being added/updated
    local global_keys
    global_keys=$(echo "$global_servers" | jq -r 'keys[]')

    for key in $global_keys; do
        local in_project
        in_project=$(echo "$project_servers" | jq -r "has(\"$key\")")

        if [[ "$in_project" == "false" ]]; then
            log_info "  + Adding: $key"
        else
            local global_config project_config
            global_config=$(echo "$global_servers" | jq -S ".\"$key\"")
            project_config=$(echo "$project_servers" | jq -S ".\"$key\"")

            if [[ "$global_config" != "$project_config" ]]; then
                log_info "  ~ Updating: $key"
            fi
        fi
    done

    # Write merged config
    local new_config
    new_config=$(jq --argjson servers "$merged" '.mcpServers = $servers' "$project_mcp")
    echo "$new_config" > "$project_mcp"

    log_success "MCP config synced"
    return 0
}

# Main
main() {
    local cwd project_mcp
    cwd="$(pwd)"
    project_mcp=$(find_project_mcp "$cwd")

    sync_mcp_configs "$project_mcp"
}

main "$@"
