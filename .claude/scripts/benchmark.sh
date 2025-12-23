#!/bin/bash

#
# benchmark.sh - Claude Code Performance Benchmark Suite
#
# Measures startup time, tool execution time, and MCP initialization.
# Results are saved to ~/.claude/benchmarks/ for comparison.
#
# Usage:
#   benchmark.sh                  # Run all benchmarks
#   benchmark.sh startup          # Run only startup benchmark
#   benchmark.sh tool             # Run only tool execution benchmark
#   benchmark.sh mcp              # Run only MCP benchmark
#   benchmark.sh compare          # Compare last two runs
#

set -e

# Configuration
BENCHMARK_DIR="$HOME/.claude/benchmarks"
RESULTS_FILE="$BENCHMARK_DIR/results-$(date +%Y%m%d_%H%M%S).json"
ITERATIONS="${BENCHMARK_ITERATIONS:-3}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log_header() { echo -e "\n${BOLD}${CYAN}━━━ $1 ━━━${NC}\n"; }
log_info() { echo -e "${BLUE}→${NC} $1"; }
log_result() { echo -e "${GREEN}✓${NC} $1: ${BOLD}$2${NC}"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }

mkdir -p "$BENCHMARK_DIR"

# Get high-precision time in milliseconds
get_ms() {
    if [[ "$(uname)" == "Darwin" ]]; then
        # macOS: use perl for millisecond precision
        perl -MTime::HiRes=time -e 'printf "%.0f\n", time * 1000'
    else
        # Linux: use date with nanoseconds
        echo $(($(date +%s%N) / 1000000))
    fi
}

# Run a command and return duration in milliseconds
time_command() {
    local start=$(get_ms)
    eval "$@" > /dev/null 2>&1
    local end=$(get_ms)
    echo $((end - start))
}

# Calculate average from array of values
average() {
    local sum=0
    local count=0
    for val in "$@"; do
        sum=$((sum + val))
        ((count++))
    done
    echo $((sum / count))
}

# Benchmark: Bare startup (no tools, no MCPs)
benchmark_startup_bare() {
    log_info "Bare startup (no MCPs, minimal prompt)..." >&2
    local times=()

    for i in $(seq 1 $ITERATIONS); do
        local ms=$(time_command "claude -p 'reply with: ok' --tools '' --strict-mcp-config --mcp-config '{}'")
        times+=($ms)
        echo -e "  Run $i: ${ms}ms" >&2
    done

    local avg=$(average "${times[@]}")
    log_result "Bare startup average" "${avg}ms" >&2
    echo "$avg"  # Only numeric value to stdout
}

# Benchmark: Startup with default config
benchmark_startup_default() {
    log_info "Default startup (your normal config)..." >&2
    local times=()

    for i in $(seq 1 $ITERATIONS); do
        local ms=$(time_command "claude -p 'reply with: ok'")
        times+=($ms)
        echo -e "  Run $i: ${ms}ms" >&2
    done

    local avg=$(average "${times[@]}")
    log_result "Default startup average" "${avg}ms" >&2
    echo "$avg"  # Only numeric value to stdout
}

# Benchmark: Startup in specific project directory
benchmark_startup_project() {
    local project_dir="$1"
    local project_name=$(basename "$project_dir")
    log_info "Project startup ($project_name)..." >&2
    local times=()

    for i in $(seq 1 $ITERATIONS); do
        local ms=$(time_command "cd '$project_dir' && claude -p 'reply with: ok'")
        times+=($ms)
        echo -e "  Run $i: ${ms}ms" >&2
    done

    local avg=$(average "${times[@]}")
    log_result "Project startup average ($project_name)" "${avg}ms" >&2
    echo "$avg"  # Only numeric value to stdout
}

# Benchmark: Tool execution (Read tool)
benchmark_tool_read() {
    log_info "Tool execution (Read a file)..." >&2
    local times=()
    local test_file="$HOME/.zshrc"

    for i in $(seq 1 $ITERATIONS); do
        local ms=$(time_command "claude -p 'Read the file $test_file and reply with: done'")
        times+=($ms)
        echo -e "  Run $i: ${ms}ms" >&2
    done

    local avg=$(average "${times[@]}")
    log_result "Read tool average" "${avg}ms" >&2
    echo "$avg"  # Only numeric value to stdout
}

# Benchmark: Tool execution (Bash tool)
benchmark_tool_bash() {
    log_info "Tool execution (Bash command)..." >&2
    local times=()

    for i in $(seq 1 $ITERATIONS); do
        local ms=$(time_command "claude -p 'Run: echo hello. Then reply: done'")
        times+=($ms)
        echo -e "  Run $i: ${ms}ms" >&2
    done

    local avg=$(average "${times[@]}")
    log_result "Bash tool average" "${avg}ms" >&2
    echo "$avg"  # Only numeric value to stdout
}

# Benchmark: MCP tool call (if gitlab available)
benchmark_mcp_gitlab() {
    log_info "MCP tool call (GitLab list projects)..." >&2
    local times=()

    for i in $(seq 1 $ITERATIONS); do
        local ms=$(time_command "claude -p 'Use gitlab MCP to list 1 project, then reply: done'")
        times+=($ms)
        echo -e "  Run $i: ${ms}ms" >&2
    done

    local avg=$(average "${times[@]}")
    log_result "GitLab MCP average" "${avg}ms" >&2
    echo "$avg"  # Only numeric value to stdout
}

# Compare two result files
compare_results() {
    local files=($(ls -t "$BENCHMARK_DIR"/results-*.json 2>/dev/null | head -2))

    if [[ ${#files[@]} -lt 2 ]]; then
        log_warn "Need at least 2 benchmark runs to compare"
        return 1
    fi

    log_header "Comparing Results"
    echo "Newer: ${files[0]}"
    echo "Older: ${files[1]}"
    echo ""

    # Use jq to compare if available
    if command -v jq &> /dev/null; then
        local new_file="${files[0]}"
        local old_file="${files[1]}"

        echo -e "${BOLD}Benchmark               Old        New        Change${NC}"
        echo "─────────────────────────────────────────────────────"

        for key in $(jq -r '.benchmarks | keys[]' "$new_file"); do
            local old_val=$(jq -r ".benchmarks[\"$key\"] // 0" "$old_file")
            local new_val=$(jq -r ".benchmarks[\"$key\"] // 0" "$new_file")

            if [[ "$old_val" != "0" && "$new_val" != "0" ]]; then
                local diff=$((new_val - old_val))
                local pct=$(echo "scale=1; ($diff * 100) / $old_val" | bc 2>/dev/null || echo "?")

                local color="$NC"
                local sign=""
                if [[ $diff -lt 0 ]]; then
                    color="$GREEN"
                    sign=""
                elif [[ $diff -gt 0 ]]; then
                    color="$RED"
                    sign="+"
                fi

                printf "%-22s %8sms  %8sms  ${color}%s%sms (%s%s%%)${NC}\n" \
                    "$key" "$old_val" "$new_val" "$sign" "$diff" "$sign" "$pct"
            fi
        done
    else
        log_warn "Install jq for detailed comparison: brew install jq"
        echo "Raw files:"
        echo "  $new_file"
        echo "  $old_file"
    fi
}

# Run all benchmarks
run_all() {
    log_header "Claude Code Benchmark Suite"
    echo "Iterations per test: $ITERATIONS"
    echo "Results will be saved to: $RESULTS_FILE"

    local results=()

    # Startup benchmarks
    log_header "Startup Benchmarks"
    local bare_ms=$(benchmark_startup_bare)
    results+=("\"startup_bare\": $bare_ms")

    local default_ms=$(benchmark_startup_default)
    results+=("\"startup_default\": $default_ms")

    # Project-specific (bfinfrastructure if exists)
    if [[ -d "$HOME/src/bfinfrastructure" ]]; then
        local project_ms=$(benchmark_startup_project "$HOME/src/bfinfrastructure")
        results+=("\"startup_bfinfrastructure\": $project_ms")
    fi

    # Tool benchmarks
    log_header "Tool Benchmarks"
    local read_ms=$(benchmark_tool_read)
    results+=("\"tool_read\": $read_ms")

    local bash_ms=$(benchmark_tool_bash)
    results+=("\"tool_bash\": $bash_ms")

    # MCP benchmarks (optional)
    # Uncomment if you want to test MCP calls
    # log_header "MCP Benchmarks"
    # local mcp_ms=$(benchmark_mcp_gitlab)
    # results+=("\"mcp_gitlab\": $mcp_ms")

    # Save results
    log_header "Saving Results"

    local json_results=$(IFS=,; echo "${results[*]}")
    cat > "$RESULTS_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "iterations": $ITERATIONS,
  "system": {
    "os": "$(uname -s)",
    "arch": "$(uname -m)",
    "claude_version": "$(claude --version 2>/dev/null || echo 'unknown')"
  },
  "benchmarks": {
    $json_results
  }
}
EOF

    log_result "Results saved" "$RESULTS_FILE"

    # Show summary
    log_header "Summary"
    echo -e "Bare startup:      ${BOLD}${bare_ms}ms${NC}"
    echo -e "Default startup:   ${BOLD}${default_ms}ms${NC}"
    echo -e "MCP overhead:      ${BOLD}$((default_ms - bare_ms))ms${NC} (default - bare)"
    echo ""
    echo "Run 'benchmark.sh compare' after making changes to see improvement."
}

# Main
case "${1:-all}" in
    startup)
        log_header "Startup Benchmarks Only"
        benchmark_startup_bare
        benchmark_startup_default
        ;;
    tool)
        log_header "Tool Benchmarks Only"
        benchmark_tool_read
        benchmark_tool_bash
        ;;
    mcp)
        log_header "MCP Benchmarks Only"
        benchmark_mcp_gitlab
        ;;
    compare)
        compare_results
        ;;
    all|*)
        run_all
        ;;
esac
