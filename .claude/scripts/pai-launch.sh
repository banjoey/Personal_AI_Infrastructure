#!/bin/bash

#
# pai-launch.sh
#
# Modular PAI launcher - runs pre-startup modules then launches Claude Code.
#
# Pre-startup modules live in: ~/.claude/scripts/pre-startup.d/
# Modules are executed in alphabetical order (use numeric prefixes).
#
# Usage:
#   pai-launch.sh [claude-code-args...]
#
# To create an alias, add to your .zshrc/.bashrc:
#   alias <your-pai-name>='~/.claude/scripts/pai-launch.sh'
#
# Example:
#   alias charles='~/.claude/scripts/pai-launch.sh'
#   alias kai='~/.claude/scripts/pai-launch.sh'
#

set -e

# Resolve PAI_DIR (from env or default to ~/.claude)
PAI_DIR="${PAI_DIR:-$HOME/.claude}"
SCRIPTS_DIR="$PAI_DIR/scripts"
MODULES_DIR="$SCRIPTS_DIR/pre-startup.d"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get AI name from environment or default
AI_NAME="${DA:-${ASSISTANT_NAME:-PAI}}"

log_header() {
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}  $AI_NAME Pre-Launch Checks${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

log_info() {
    echo -e "${BLUE}[${AI_NAME}]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[${AI_NAME}]${NC} ✓ $1"
}

log_warn() {
    echo -e "${YELLOW}[${AI_NAME}]${NC} ⚠ $1"
}

log_error() {
    echo -e "${RED}[${AI_NAME}]${NC} ✗ $1"
}

log_module() {
    echo -e "${CYAN}[Module]${NC} $1"
}

# Run all pre-startup modules
run_modules() {
    if [[ ! -d "$MODULES_DIR" ]]; then
        log_warn "No modules directory found at $MODULES_DIR"
        return 0
    fi

    # Find all executable .sh files in modules directory
    local modules
    modules=$(find "$MODULES_DIR" -maxdepth 1 -name "*.sh" -type f -executable 2>/dev/null | sort)

    if [[ -z "$modules" ]]; then
        log_info "No pre-startup modules found"
        return 0
    fi

    local module_count
    module_count=$(echo "$modules" | wc -l | tr -d ' ')
    log_info "Running $module_count pre-startup module(s)..."
    echo ""

    # Run each module
    local failed=0
    for module in $modules; do
        local module_name
        module_name=$(basename "$module" .sh)

        log_module "Running: $module_name"

        # Run module, passing through environment
        if ! "$module"; then
            log_error "Module failed: $module_name"
            failed=1
        fi
        echo ""
    done

    return $failed
}

# Main
main() {
    log_header

    local cwd
    cwd="$(pwd)"
    log_info "Directory: $cwd"
    echo ""

    # Run pre-startup modules
    if ! run_modules; then
        log_warn "Some modules had issues, but continuing..."
    fi

    # Launch Claude Code with any passed arguments
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log_info "Launching Claude Code..."
    echo ""
    exec claude "$@"
}

main "$@"
