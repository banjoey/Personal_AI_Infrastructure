#!/bin/bash
#
# manage-synthesis-schedule.sh
#
# Manages the scheduled weekly synthesis launchd agent.
# Usage: ./manage-synthesis-schedule.sh [install|uninstall|status|run]
#

PLIST_NAME="com.pai.scheduled-synthesis"
PLIST_SOURCE="/Users/jbarkley/PAI/.claude/agents/scheduled-synthesis.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

case "$1" in
    install)
        echo "Installing scheduled synthesis agent..."

        # Create LaunchAgents directory if needed
        mkdir -p "$HOME/Library/LaunchAgents"

        # Copy plist
        cp "$PLIST_SOURCE" "$PLIST_DEST"

        # Load the agent
        launchctl load "$PLIST_DEST"

        echo "Installed and loaded $PLIST_NAME"
        echo "Synthesis will run every Sunday at 6:00 PM"
        echo ""
        echo "To check status: $0 status"
        echo "To run now: $0 run"
        ;;

    uninstall)
        echo "Uninstalling scheduled synthesis agent..."

        # Unload if loaded
        launchctl unload "$PLIST_DEST" 2>/dev/null

        # Remove plist
        rm -f "$PLIST_DEST"

        echo "Uninstalled $PLIST_NAME"
        ;;

    status)
        echo "Checking status of $PLIST_NAME..."
        echo ""

        if [ -f "$PLIST_DEST" ]; then
            echo "Plist installed: YES"
        else
            echo "Plist installed: NO"
            exit 0
        fi

        if launchctl list | grep -q "$PLIST_NAME"; then
            echo "Agent loaded: YES"
            launchctl list "$PLIST_NAME"
        else
            echo "Agent loaded: NO"
        fi

        echo ""
        echo "Recent logs:"
        tail -5 /Users/jbarkley/workshop/captures/logs/synthesis.log 2>/dev/null || echo "No logs yet"
        ;;

    run)
        echo "Running synthesis now..."
        bun run /Users/jbarkley/src/pai/CaptureIntelligence/tools/synthesis.ts -w /Users/jbarkley/workshop
        ;;

    *)
        echo "Usage: $0 [install|uninstall|status|run]"
        echo ""
        echo "Commands:"
        echo "  install   - Install and enable the weekly synthesis schedule"
        echo "  uninstall - Remove the scheduled synthesis"
        echo "  status    - Check if synthesis is scheduled and show recent logs"
        echo "  run       - Run synthesis immediately"
        exit 1
        ;;
esac
