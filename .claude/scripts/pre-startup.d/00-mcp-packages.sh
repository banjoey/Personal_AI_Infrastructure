#!/bin/bash

#
# 00-mcp-packages.sh
#
# Pre-startup module: Ensure MCP packages are installed (not downloaded at runtime)
#
# This runs ONLY in interactive mode (when you run 'charles').
# Subagents/workers skip this via CLAUDE_WORKER_MODE check.
#
# Packages are installed to ~/.claude/mcp-packages/<name>/
# Each package is isolated to avoid binary name conflicts.
#

# Skip if in worker mode (subagents don't need to update packages)
if [[ "${CLAUDE_WORKER_MODE:-0}" == "1" ]]; then
    exit 0
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "  ${BLUE}→${NC} $1"; }
log_success() { echo -e "  ${GREEN}✓${NC} $1"; }
log_warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
log_pkg() { echo -e "  ${CYAN}📦${NC} $1"; }

MCP_PKG_DIR="$HOME/.claude/mcp-packages"

# Packages to pre-install (macOS bash compatible - no associative arrays)
# Format: "name:npm-package"
MCP_PACKAGES="
gitlab:@modelcontextprotocol/server-gitlab
brightdata:@brightdata/mcp
stripe:@stripe/mcp
apify:@apify/actors-mcp-server
playwright:@playwright/mcp
"

# Check if package needs update (installed more than 7 days ago)
needs_update() {
    local pkg_dir="$1"
    local marker="$pkg_dir/.installed"

    if [[ ! -f "$marker" ]]; then
        return 0  # Not installed
    fi

    # Check if older than 7 days
    local now=$(date +%s)
    local installed=$(cat "$marker" 2>/dev/null || echo 0)
    local age=$((now - installed))
    local week=$((7 * 24 * 60 * 60))

    if [[ $age -gt $week ]]; then
        return 0  # Needs update
    fi

    return 1  # Up to date
}

install_package() {
    local name="$1"
    local npm_pkg="$2"
    local pkg_dir="$MCP_PKG_DIR/$name"

    if ! needs_update "$pkg_dir"; then
        log_success "$name: up to date"
        return 0
    fi

    log_pkg "$name: installing/updating $npm_pkg..."

    mkdir -p "$pkg_dir"
    cd "$pkg_dir" || return 1

    # Use bun for speed, fall back to npm
    if command -v bun &> /dev/null; then
        bun install "$npm_pkg" --silent 2>/dev/null
    else
        npm install "$npm_pkg" --silent 2>/dev/null
    fi

    if [[ $? -eq 0 ]]; then
        date +%s > "$pkg_dir/.installed"
        log_success "$name: installed"
    else
        log_warn "$name: install failed (will use bunx fallback)"
    fi
}

main() {
    log_info "Checking MCP packages..."

    mkdir -p "$MCP_PKG_DIR"

    local checked=0
    # Parse the package list (name:npm-package format)
    echo "$MCP_PACKAGES" | while IFS=: read -r name pkg; do
        # Skip empty lines
        [[ -z "$name" ]] && continue
        # Trim whitespace
        name=$(echo "$name" | xargs)
        pkg=$(echo "$pkg" | xargs)
        [[ -z "$name" || -z "$pkg" ]] && continue

        install_package "$name" "$pkg"
        ((checked++))
    done

    log_success "MCP packages checked"
}

main "$@"
