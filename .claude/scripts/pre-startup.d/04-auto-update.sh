#!/bin/bash

#
# 04-auto-update.sh
#
# Pre-startup module: PAI Auto-Update Check
#
# Checks for PAI updates based on pai-config.json settings:
#   autoUpdate: "notify" | "auto" | "off"
#
# Behaviors:
#   - notify: Check for updates, show message if available
#   - auto: Run git pull automatically (if no local changes), notify if setup.sh needed
#   - off: Don't check, don't mention it
#

# Find PAI repo location
# Priority: PAI_REPO_DIR env var > ~/PAI > directory containing .claude that's a git repo
find_pai_repo() {
    if [[ -n "$PAI_REPO_DIR" ]] && [[ -d "$PAI_REPO_DIR/.git" ]]; then
        echo "$PAI_REPO_DIR"
        return 0
    fi

    if [[ -d "$HOME/PAI/.git" ]]; then
        echo "$HOME/PAI"
        return 0
    fi

    # Check if PAI_DIR points to a .claude inside a git repo
    local pai_dir="${PAI_DIR:-$HOME/PAI}"
    local parent_dir=$(dirname "$pai_dir")
    if [[ -d "$parent_dir/.git" ]]; then
        echo "$parent_dir"
        return 0
    fi

    echo ""
    return 1
}

PAI_REPO=$(find_pai_repo)
PAI_CONFIG="$HOME/.claude/pai-config.json"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "  ${BLUE}→${NC} $1"; }
log_success() { echo -e "  ${GREEN}✓${NC} $1"; }
log_warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
log_update() { echo -e "  ${CYAN}🔄${NC} $1"; }

# Get config value with default
get_config() {
    local key="$1"
    local default="$2"

    if [[ ! -f "$PAI_CONFIG" ]]; then
        echo "$default"
        return
    fi

    if ! command -v jq &> /dev/null; then
        echo "$default"
        return
    fi

    local value
    value=$(jq -r "$key // empty" "$PAI_CONFIG" 2>/dev/null)
    echo "${value:-$default}"
}

# Check if there are local changes in the repo
has_local_changes() {
    local repo="$1"
    cd "$repo" || return 1

    # Check for uncommitted changes
    if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
        return 0  # Has changes
    fi

    return 1  # No changes
}

# Check if updates are available
check_for_updates() {
    local repo="$1"
    cd "$repo" || return 1

    # Fetch latest (quiet, quick)
    git fetch --quiet 2>/dev/null || return 1

    # Compare local and remote
    local local_hash remote_hash
    local_hash=$(git rev-parse HEAD 2>/dev/null)
    remote_hash=$(git rev-parse @{u} 2>/dev/null)

    if [[ "$local_hash" != "$remote_hash" ]]; then
        return 0  # Updates available
    fi

    return 1  # Up to date
}

# Get number of commits behind
commits_behind() {
    local repo="$1"
    cd "$repo" || return

    git rev-list --count HEAD..@{u} 2>/dev/null || echo "?"
}

# Check if settings.json has changed in the update
settings_changed_in_update() {
    local repo="$1"
    cd "$repo" || return 1

    # Check if settings.json is in the diff between local and remote
    git diff --name-only HEAD..@{u} 2>/dev/null | grep -q "settings.json"
}

# Perform auto-update
do_auto_update() {
    local repo="$1"
    cd "$repo" || return 1

    log_update "Pulling latest changes..."
    if git pull --quiet 2>/dev/null; then
        log_success "PAI updated successfully"
        return 0
    else
        log_warn "Auto-update failed - try manually: cd $repo && git pull"
        return 1
    fi
}

# Main
main() {
    # Get config setting
    local auto_update
    auto_update=$(get_config '.autoUpdate' 'notify')

    # Skip if disabled
    if [[ "$auto_update" == "off" ]]; then
        return 0
    fi

    # Check if we can find the PAI repo
    if [[ -z "$PAI_REPO" ]]; then
        log_warn "Cannot find PAI repo - skipping update check"
        return 0
    fi

    # Check for updates
    if ! check_for_updates "$PAI_REPO"; then
        log_success "PAI is up to date"
        return 0
    fi

    local behind
    behind=$(commits_behind "$PAI_REPO")
    log_update "PAI update available ($behind commits behind)"

    case "$auto_update" in
        "auto")
            # Check for local changes first
            if has_local_changes "$PAI_REPO"; then
                log_warn "Local changes detected - skipping auto-update"
                log_info "Quick update: cd $PAI_REPO && git stash && git pull && git stash pop"
                log_info "Full update:  cd $PAI_REPO && ./.claude/setup.sh"
            else
                do_auto_update "$PAI_REPO"

                # Check if setup.sh should be re-run
                if settings_changed_in_update "$PAI_REPO"; then
                    log_warn "settings.json changed - consider re-running setup.sh"
                    log_info "Run: cd $PAI_REPO && ./.claude/setup.sh"
                fi
            fi
            ;;

        "notify"|*)
            log_info "Quick update: cd $PAI_REPO && git pull"
            log_info "Full update:  cd $PAI_REPO && ./.claude/setup.sh"
            ;;
    esac

    return 0
}

main "$@"
