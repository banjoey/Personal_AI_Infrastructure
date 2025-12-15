#!/bin/bash

#
# 03-context-detection.sh
#
# Pre-startup module: Project Context Detection
#
# Detects and handles project context files based on pai-config.json settings:
#   onLoad: "auto-load" | "notify" | "none"
#
# Context files searched (in order):
#   - ./project-context.md
#   - ./CONTEXT.md
#   - ./.claude/context.md
#
# The onExit behavior is handled by stop-hook.ts, not this module.
#

# Use PAI_DIR from environment or default
PAI_DIR="${PAI_DIR:-$HOME/.claude}"
GLOBAL_PAI_CONFIG="$HOME/.claude/pai-config.json"
# Project-level config can override global (checked in get_config)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "  ${BLUE}→${NC} $1"; }
log_success() { echo -e "  ${GREEN}✓${NC} $1"; }
log_warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
log_context() { echo -e "  ${CYAN}📄${NC} $1"; }

# Get config value with default
# Checks project-level config first (.claude/pai-config.json), falls back to global
get_config() {
    local key="$1"
    local default="$2"
    local cwd="$(pwd)"

    if ! command -v jq &> /dev/null; then
        echo "$default"
        return
    fi

    local value=""

    # Check project-level config first (in .claude/ subdirectory)
    local project_config="$cwd/.claude/pai-config.json"
    if [[ -f "$project_config" ]]; then
        value=$(jq -r "$key // empty" "$project_config" 2>/dev/null)
        if [[ -n "$value" ]]; then
            echo "$value"
            return
        fi
    fi

    # Fall back to global config
    if [[ -f "$GLOBAL_PAI_CONFIG" ]]; then
        value=$(jq -r "$key // empty" "$GLOBAL_PAI_CONFIG" 2>/dev/null)
        echo "${value:-$default}"
        return
    fi

    echo "$default"
}

# Find context file in current directory
find_context_file() {
    local cwd="$1"

    # Check common locations in priority order
    local candidates=(
        "$cwd/project-context.md"
        "$cwd/CONTEXT.md"
        "$cwd/.claude/context.md"
    )

    for candidate in "${candidates[@]}"; do
        if [[ -f "$candidate" ]]; then
            echo "$candidate"
            return 0
        fi
    done

    echo ""
    return 1
}

# Get file info
get_file_info() {
    local file="$1"

    if [[ ! -f "$file" ]]; then
        return
    fi

    local size modified lines
    size=$(wc -c < "$file" | tr -d ' ')
    lines=$(wc -l < "$file" | tr -d ' ')

    # Get modified time (cross-platform)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        modified=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$file")
    else
        modified=$(stat -c "%y" "$file" | cut -d'.' -f1)
    fi

    echo "$lines lines, $(numfmt --to=iec $size 2>/dev/null || echo "${size}B"), modified $modified"
}

# Handle context based on config
handle_context() {
    local context_file="$1"
    local on_load="$2"

    case "$on_load" in
        "auto-load")
            log_context "Context found: $(basename "$context_file")"
            log_info "$(get_file_info "$context_file")"
            log_success "Context will be available to Claude"
            # Note: The actual loading happens via Claude reading the file
            # We're just detecting and informing here
            ;;

        "notify")
            log_context "Context available: $context_file"
            log_info "$(get_file_info "$context_file")"
            log_info "Use: 'load context' or 'read project-context.md' to load"
            ;;

        "none")
            # Silent - don't mention context
            ;;

        *)
            # Unknown setting, default to notify
            log_context "Context found: $context_file"
            ;;
    esac
}

# Main
main() {
    local cwd on_load context_file
    cwd="$(pwd)"

    # Get config setting
    on_load=$(get_config '.context.onLoad' 'auto-load')

    # Skip if disabled
    if [[ "$on_load" == "none" ]]; then
        return 0
    fi

    # Find context file
    context_file=$(find_context_file "$cwd")

    if [[ -z "$context_file" ]]; then
        # No context file - this is fine, just skip silently
        return 0
    fi

    handle_context "$context_file" "$on_load"
    return 0
}

main "$@"
