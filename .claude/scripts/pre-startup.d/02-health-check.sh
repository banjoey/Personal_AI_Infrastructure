#!/bin/bash

#
# 02-health-check.sh
#
# Pre-startup module: PAI Health Check
#
# Validates PAI installation is healthy:
#   - PAI_DIR exists and is valid
#   - Required symlinks exist (skills/, hooks/)
#   - settings.json is readable
#   - Bun is installed (for hooks)
#
# Warns but does NOT block - user can use Claude to fix issues.
#

# Use PAI_DIR from environment or default
PAI_DIR="${PAI_DIR:-$HOME/.claude}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "  ${BLUE}→${NC} $1"; }
log_success() { echo -e "  ${GREEN}✓${NC} $1"; }
log_warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "  ${RED}✗${NC} $1"; }

# Track issues for summary
ISSUES=()

check_pai_dir() {
    if [[ ! -d "$PAI_DIR" ]]; then
        log_error "PAI_DIR not found: $PAI_DIR"
        ISSUES+=("PAI_DIR missing - run setup.sh")
        return 1
    fi
    log_success "PAI_DIR exists: $PAI_DIR"
    return 0
}

check_symlinks() {
    local required_links=("skills" "hooks")
    local all_ok=true

    for link in "${required_links[@]}"; do
        local path="$HOME/.claude/$link"
        if [[ -L "$path" ]]; then
            # It's a symlink - check if target exists
            if [[ -e "$path" ]]; then
                log_success "$link/ symlink valid"
            else
                log_error "$link/ symlink broken (target missing)"
                ISSUES+=("$link symlink broken - re-run setup.sh")
                all_ok=false
            fi
        elif [[ -d "$path" ]]; then
            log_warn "$link/ is a directory, not a symlink (updates won't auto-sync)"
        else
            log_error "$link/ not found"
            ISSUES+=("$link missing - re-run setup.sh")
            all_ok=false
        fi
    done

    $all_ok
}

check_settings() {
    local settings="$HOME/.claude/settings.json"

    if [[ ! -f "$settings" ]]; then
        log_error "settings.json not found"
        ISSUES+=("settings.json missing - re-run setup.sh")
        return 1
    fi

    # Check if it's valid JSON
    if command -v jq &> /dev/null; then
        if ! jq empty "$settings" 2>/dev/null; then
            log_error "settings.json is not valid JSON"
            ISSUES+=("settings.json corrupted - check syntax or re-run setup.sh")
            return 1
        fi

        # Check for required fields
        local pai_dir_set
        pai_dir_set=$(jq -r '.env.PAI_DIR // empty' "$settings")
        if [[ -z "$pai_dir_set" ]]; then
            log_warn "PAI_DIR not set in settings.json"
        fi
    fi

    log_success "settings.json readable"
    return 0
}

check_bun() {
    if command -v bun &> /dev/null; then
        local bun_version
        bun_version=$(bun --version 2>/dev/null)
        log_success "Bun installed: v$bun_version"
        return 0
    else
        log_warn "Bun not installed - some hooks may not work"
        log_info "  Install with: curl -fsSL https://bun.sh/install | bash"
        ISSUES+=("Bun not installed - hooks may fail")
        return 1
    fi
}

check_cli() {
    # Check for the configured CLI (currently only claude supported)
    local cli="claude"

    if command -v "$cli" &> /dev/null; then
        log_success "Claude CLI available"
        return 0
    else
        log_error "Claude CLI not found in PATH"
        ISSUES+=("Claude CLI not installed or not in PATH")
        return 1
    fi
}

print_summary() {
    if [[ ${#ISSUES[@]} -eq 0 ]]; then
        log_success "All health checks passed"
    else
        echo ""
        log_warn "Issues detected (${#ISSUES[@]}):"
        for issue in "${ISSUES[@]}"; do
            echo -e "    ${YELLOW}•${NC} $issue"
        done
        echo ""
        log_info "PAI will still launch - you can use Claude to troubleshoot"
    fi
}

# Main
main() {
    check_pai_dir
    check_symlinks
    check_settings
    check_bun
    check_cli

    print_summary
    return 0  # Always return 0 - we warn but don't block
}

main "$@"
