# AutomationSetup Workflow

Sets up automated scheduled synthesis to run weekly without manual intervention.

## Trigger

- "enable automatic synthesis"
- "schedule weekly synthesis"
- "set up forgetting automation"
- "automate memory cleanup"

## Prerequisites

- CaptureIntelligence tools installed at `~/src/pai/CaptureIntelligence/tools/`
- Workspace at `~/workshop`
- Bun runtime installed

## Overview

The automation uses macOS launchd to run synthesis every Sunday at 6 PM.

## Steps

### 1. Install the Scheduled Agent

```bash
bash ${PAI_DIR}/.claude/agents/manage-synthesis-schedule.sh install
```

This:
- Copies the plist to `~/Library/LaunchAgents/`
- Loads the agent into launchd
- Schedules weekly runs

### 2. Verify Installation

```bash
bash ${PAI_DIR}/.claude/agents/manage-synthesis-schedule.sh status
```

### 3. Confirm to User

Report:
- Agent installed and loaded
- Schedule: Every Sunday at 6:00 PM
- Logs location: `~/workshop/captures/logs/synthesis.log`

## Management Commands

| Command | Description |
|---------|-------------|
| `./manage-synthesis-schedule.sh install` | Enable weekly synthesis |
| `./manage-synthesis-schedule.sh uninstall` | Disable weekly synthesis |
| `./manage-synthesis-schedule.sh status` | Check if running, show logs |
| `./manage-synthesis-schedule.sh run` | Run synthesis immediately |

## What Gets Automated

Each Sunday at 6 PM:
1. Scans last 7 days of changes
2. Assesses effectiveness of each change
3. Generates `WEEKLY-SYNTHESIS.md` report
4. Logs output to `captures/logs/`

## Reviewing Automated Output

After automation runs:
1. Read `~/workshop/captures/WEEKLY-SYNTHESIS.md`
2. Review effectiveness assessments
3. Act on suggestions (archive, remove, expand)

## Adjusting Schedule

To change the schedule, edit the plist:

```bash
# Edit the plist
vim ${PAI_DIR}/.claude/agents/scheduled-synthesis.plist

# Reload
bash ${PAI_DIR}/.claude/agents/manage-synthesis-schedule.sh uninstall
bash ${PAI_DIR}/.claude/agents/manage-synthesis-schedule.sh install
```

### Schedule Examples

**Every Sunday at 6 PM (default):**
```xml
<key>Weekday</key>
<integer>0</integer>
<key>Hour</key>
<integer>18</integer>
```

**Every Friday at 5 PM:**
```xml
<key>Weekday</key>
<integer>5</integer>
<key>Hour</key>
<integer>17</integer>
```

**Daily at 8 AM:**
```xml
<key>Hour</key>
<integer>8</integer>
<key>Minute</key>
<integer>0</integer>
```

## Troubleshooting

**Agent not running:**
```bash
# Check if loaded
launchctl list | grep pai

# Check error log
cat ~/workshop/captures/logs/synthesis-error.log
```

**Bun not found:**
Ensure PATH in plist includes bun location:
```xml
<key>PATH</key>
<string>/Users/jbarkley/.bun/bin:/usr/local/bin:/usr/bin:/bin</string>
```

## Example

```
User: "Set up automatic weekly synthesis"

→ Check prerequisites (bun, workspace, tools)
→ Run: bash manage-synthesis-schedule.sh install
→ Verify: bash manage-synthesis-schedule.sh status
→ Report: "Weekly synthesis scheduled for Sundays at 6 PM.
   View reports at ~/workshop/captures/WEEKLY-SYNTHESIS.md"
```
