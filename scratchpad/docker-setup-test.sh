#!/bin/bash

# ============================================
# PAI Setup Script Docker Test Suite
# ============================================
#
# Tests three critical scenarios:
# 1. Fresh install
# 2. Name customization
# 3. Update without overwriting customizations
#
# Usage: ./docker-setup-test.sh
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to report test results
report_test() {
    local test_name="$1"
    local result="$2"
    local details="$3"

    TESTS_TOTAL=$((TESTS_TOTAL + 1))

    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        [ -n "$details" ] && echo -e "   ${CYAN}$details${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        [ -n "$details" ] && echo -e "   ${RED}$details${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Function to print section headers
print_section() {
    echo ""
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to create expect script for fresh install
create_fresh_install_expect() {
    cat > /tmp/pai-fresh-install.exp << 'EOF'
#!/usr/bin/expect -f

set timeout 300

spawn bash -c "curl -fsSL https://raw.githubusercontent.com/banjoey/Personal_AI_Infrastructure/forge-all/.claude/setup.sh | bash"

expect "Ready to get started?"
send "y\r"

expect "Enter your choice (1-4)"
send "1\r"

expect "Update to the latest version?"
send "y\r"

expect "What would you like to call your AI assistant?"
send "TestBot\r"

expect "What's your name?"
send "TestUser\r"

expect "Enter your choice (1-5)"
send "1\r"

expect "Would you like to add API keys now?"
send "n\r"

expect "Would you like to set up the voice server?"
send "n\r"

expect "Are you using Claude Code?"
send "y\r"

expect "Would you like to open the getting started guide?"
send "n\r"

expect eof
EOF
    chmod +x /tmp/pai-fresh-install.exp
}

# Function to create expect script for update scenario
create_update_expect() {
    cat > /tmp/pai-update.exp << 'EOF'
#!/usr/bin/expect -f

set timeout 300

spawn bash -c "/root/PAI/.claude/setup.sh"

expect "Ready to get started?"
send "y\r"

expect "PAI will be installed to:"
send "\r"

expect "Update to the latest version?"
send "y\r"

expect "What would you like to call your AI assistant?"
send "TestBot\r"

expect "What's your name?"
send "TestUser\r"

expect "Enter your choice (1-5)"
send "1\r"

expect "Update them?"
send "y\r"

expect "Keep existing .env file?"
send "y\r"

expect "Would you like to add API keys now?"
send "n\r"

expect "Would you like to set up the voice server?"
send "n\r"

expect "Are you using Claude Code?"
send "y\r"

expect "Would you like to open the getting started guide?"
send "n\r"

expect eof
EOF
    chmod +x /tmp/pai-update.exp
}

# ============================================
# Main Test Execution
# ============================================

print_section "🚀 Starting PAI Setup Script Docker Tests"

echo -e "${CYAN}Test Configuration:${NC}"
echo "  Repository: https://github.com/banjoey/Personal_AI_Infrastructure.git"
echo "  Branch: forge-all"
echo "  Docker Image: ubuntu:22.04"
echo "  AI Name: TestBot"
echo ""

# ============================================
# TEST 1: Fresh Install
# ============================================

print_section "TEST 1: Fresh Install Scenario"

echo "Creating Docker container..."
docker rm -f pai-test-fresh 2>/dev/null || true
CONTAINER_ID=$(docker run -d --name pai-test-fresh ubuntu:22.04 sleep 3600)

echo "Container created: $CONTAINER_ID"
echo ""

echo "Installing prerequisites in container..."
docker exec pai-test-fresh bash -c "apt-get update -qq && apt-get install -y -qq curl git sudo expect > /dev/null 2>&1"

echo "Creating expect script for automated responses..."
create_fresh_install_expect
docker cp /tmp/pai-fresh-install.exp pai-test-fresh:/tmp/

echo "Running fresh install..."
echo ""
docker exec pai-test-fresh /tmp/pai-fresh-install.exp | tee /tmp/test1-output.log
echo ""

echo "Verifying fresh install..."

# Verify PAI directory exists
if docker exec pai-test-fresh test -d /root/PAI; then
    report_test "PAI directory created" "PASS" "Directory exists at /root/PAI"
else
    report_test "PAI directory created" "FAIL" "Directory not found"
fi

# Verify correct branch
BRANCH=$(docker exec pai-test-fresh bash -c "cd /root/PAI && git branch --show-current")
if [ "$BRANCH" = "forge-all" ]; then
    report_test "Correct branch checked out" "PASS" "Branch: $BRANCH"
else
    report_test "Correct branch checked out" "FAIL" "Expected: forge-all, Got: $BRANCH"
fi

# Verify skills symlink
if docker exec pai-test-fresh test -L /root/.claude/skills; then
    report_test "Skills symlink created" "PASS" "Symlink exists"
else
    report_test "Skills symlink created" "FAIL" "Symlink not found"
fi

# Verify hooks symlink
if docker exec pai-test-fresh test -L /root/.claude/hooks; then
    report_test "Hooks symlink created" "PASS" "Symlink exists"
else
    report_test "Hooks symlink created" "FAIL" "Symlink not found"
fi

# Verify settings.json created and personalized
if docker exec pai-test-fresh test -f /root/.claude/settings.json; then
    NAME_CHECK=$(docker exec pai-test-fresh grep -c "TestBot" /root/.claude/settings.json || echo "0")
    if [ "$NAME_CHECK" -gt "0" ]; then
        report_test "Settings.json personalized with AI name" "PASS" "TestBot found $NAME_CHECK times"
    else
        report_test "Settings.json personalized with AI name" "FAIL" "TestBot not found in settings.json"
    fi
else
    report_test "Settings.json created" "FAIL" "File not found"
fi

# Verify history directories created (local, not symlinked)
if docker exec pai-test-fresh test -d /root/.claude/history/sessions; then
    IS_SYMLINK=$(docker exec pai-test-fresh test -L /root/.claude/history && echo "yes" || echo "no")
    if [ "$IS_SYMLINK" = "no" ]; then
        report_test "History directory is local (not symlinked)" "PASS" "Directory is real, not a symlink"
    else
        report_test "History directory is local (not symlinked)" "FAIL" "History should NOT be symlinked"
    fi
else
    report_test "History directory created" "FAIL" "Directory not found"
fi

# ============================================
# TEST 2: Name Customization Verification
# ============================================

print_section "TEST 2: Name Customization Verification"

echo "Checking all locations where TestBot should appear..."

# Check ~/.claude/settings.json
SETTINGS_COUNT=$(docker exec pai-test-fresh grep -c "TestBot" /root/.claude/settings.json 2>/dev/null || echo "0")
if [ "$SETTINGS_COUNT" -gt "0" ]; then
    report_test "Name in settings.json" "PASS" "Found $SETTINGS_COUNT occurrences"
else
    report_test "Name in settings.json" "FAIL" "TestBot not found"
fi

# Check shell environment (from .zshrc or .bashrc)
SHELL_CONFIG=$(docker exec pai-test-fresh bash -c "test -f /root/.zshrc && echo '/root/.zshrc' || echo '/root/.bashrc'")
if docker exec pai-test-fresh grep -q 'DA="TestBot"' "$SHELL_CONFIG"; then
    report_test "Name in shell config (DA variable)" "PASS" "DA=\"TestBot\" found in $SHELL_CONFIG"
else
    report_test "Name in shell config (DA variable)" "FAIL" "DA variable not set correctly"
fi

# Verify name does NOT appear in PAI repo (should only be in ~/.claude)
REPO_COUNT=$(docker exec pai-test-fresh grep -r "TestBot" /root/PAI/.claude/ 2>/dev/null | wc -l || echo "0")
if [ "$REPO_COUNT" -eq "0" ]; then
    report_test "Name NOT in PAI repo (only in ~/.claude)" "PASS" "Repo remains clean for git updates"
else
    report_test "Name NOT in PAI repo (only in ~/.claude)" "FAIL" "Found $REPO_COUNT occurrences in repo - should be 0"
fi

# ============================================
# TEST 3: Update Without Overwrite
# ============================================

print_section "TEST 3: Update Without Overwriting Customizations (CRITICAL)"

echo "This test simulates re-running setup.sh after initial install..."
echo ""

# Create update expect script
create_update_expect
docker cp /tmp/pai-update.exp pai-test-fresh:/tmp/

# Verify current name before update
NAME_BEFORE=$(docker exec pai-test-fresh grep '"DA"' /root/.claude/settings.json | head -1)
echo "Name BEFORE update: $NAME_BEFORE"

# Run setup.sh again (simulating update)
echo ""
echo "Running setup script again (update scenario)..."
docker exec pai-test-fresh /tmp/pai-update.exp | tee /tmp/test3-output.log
echo ""

# Verify name after update
NAME_AFTER=$(docker exec pai-test-fresh grep '"DA"' /root/.claude/settings.json | head -1)
echo "Name AFTER update: $NAME_AFTER"

# Test: Name should be preserved
if echo "$NAME_AFTER" | grep -q "TestBot"; then
    report_test "Custom name preserved after update" "PASS" "TestBot still present in settings.json"
else
    report_test "Custom name preserved after update" "FAIL" "Name was overwritten!"
    echo -e "${RED}   CRITICAL BUG: Setup script overwrites user customizations${NC}"
fi

# Verify symlinks still work
if docker exec pai-test-fresh test -L /root/.claude/skills; then
    TARGET=$(docker exec pai-test-fresh readlink /root/.claude/skills)
    report_test "Skills symlink still valid after update" "PASS" "Points to: $TARGET"
else
    report_test "Skills symlink still valid after update" "FAIL" "Symlink broken or removed"
fi

# Verify settings.json still exists and is a regular file
if docker exec pai-test-fresh test -f /root/.claude/settings.json && ! docker exec pai-test-fresh test -L /root/.claude/settings.json; then
    report_test "Settings.json is regular file (not symlink)" "PASS" "Correct setup for preserving customizations"
else
    report_test "Settings.json is regular file (not symlink)" "FAIL" "File should be copied, not symlinked"
fi

# Verify history is still local
if docker exec pai-test-fresh test -d /root/.claude/history && ! docker exec pai-test-fresh test -L /root/.claude/history; then
    report_test "History directory still local after update" "PASS" "User data preserved correctly"
else
    report_test "History directory still local after update" "FAIL" "History should remain local"
fi

# ============================================
# Additional Verification Tests
# ============================================

print_section "Additional Verification Tests"

# Test: Verify .gitignore or git clean won't remove user data
echo "Testing git operations don't affect user data..."
docker exec pai-test-fresh bash -c "cd /root/PAI && git status" > /tmp/git-status.log

# Check that ~/.claude files are not tracked
if ! grep -q ".claude/settings.json" /tmp/git-status.log; then
    report_test "User settings not tracked by git" "PASS" "settings.json not in git status"
else
    report_test "User settings not tracked by git" "FAIL" "settings.json appears in git status"
fi

# Test: Verify symlinks point to correct locations
SKILLS_TARGET=$(docker exec pai-test-fresh readlink /root/.claude/skills)
if [ "$SKILLS_TARGET" = "/root/PAI/.claude/skills" ]; then
    report_test "Skills symlink points to correct location" "PASS" "Points to PAI repo"
else
    report_test "Skills symlink points to correct location" "FAIL" "Expected /root/PAI/.claude/skills, got $SKILLS_TARGET"
fi

# ============================================
# Cleanup and Final Report
# ============================================

print_section "Test Results Summary"

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  FINAL RESULTS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Total Tests:  ${BLUE}$TESTS_TOTAL${NC}"
echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed:       ${RED}$TESTS_FAILED${NC}"
echo ""

if [ "$TESTS_FAILED" -eq "0" ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo ""
    echo "The setup script works correctly for:"
    echo "  ✅ Fresh installations"
    echo "  ✅ Name customizations"
    echo "  ✅ Updates without overwriting user settings"
    echo ""
    EXIT_CODE=0
else
    echo -e "${RED}⚠️  TESTS FAILED ⚠️${NC}"
    echo ""
    echo "Issues detected in the setup script:"
    echo "  - Review the test output above for details"
    echo "  - Check the FAIL messages for specific problems"
    echo ""

    # Provide recommendations
    echo -e "${YELLOW}Recommendations:${NC}"
    if grep -q "Custom name preserved after update.*FAIL" /tmp/test3-output.log 2>/dev/null || [ "$TESTS_FAILED" -gt "0" ]; then
        echo "  1. The setup script may be overwriting settings.json during updates"
        echo "  2. Consider checking if settings.json copy logic preserves existing values"
        echo "  3. Verify the sed commands only run on fresh installs, not updates"
    fi
    echo ""
    EXIT_CODE=1
fi

# Ask if user wants to keep container for debugging
echo ""
read -p "Keep Docker container for debugging? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}Container 'pai-test-fresh' preserved for debugging${NC}"
    echo ""
    echo "To inspect:"
    echo "  docker exec -it pai-test-fresh bash"
    echo ""
    echo "To remove when done:"
    echo "  docker rm -f pai-test-fresh"
    echo ""
else
    echo "Cleaning up Docker container..."
    docker rm -f pai-test-fresh >/dev/null 2>&1
    echo -e "${GREEN}Cleanup complete${NC}"
fi

# Cleanup temp files
rm -f /tmp/pai-fresh-install.exp /tmp/pai-update.exp /tmp/test1-output.log /tmp/test3-output.log /tmp/git-status.log

exit $EXIT_CODE
