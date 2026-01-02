# QuickScan Workflow

**Fast hardware health check (30-60 seconds)**

## Trigger
- "check hardware on {target}"
- "is {target} healthy?"
- "quick scan {target}"
- Proactively when hardware concerns mentioned

## Steps

### 1. Resolve Target
```bash
# Parse target - could be hostname, IP, or SSH config name
TARGET="$1"

# Determine connection parameters
if [[ "$TARGET" == "nas1" || "$TARGET" == *"unraid"* ]]; then
    SSH_USER="root"
else
    SSH_USER="joey"
fi

# Test connection
ssh -o ConnectTimeout=5 -o BatchMode=yes ${SSH_USER}@${TARGET} "echo connected" || {
    echo "ERROR: Cannot connect to ${TARGET}"
    exit 1
}
```

### 2. Detect OS
```bash
ssh ${SSH_USER}@${TARGET} "
    if [ -f /etc/unraid-version ]; then
        echo 'unraid'
    elif [ -f /etc/os-release ]; then
        . /etc/os-release
        echo \"\$ID\"
    else
        echo 'unknown'
    fi
"
```

### 3. Run Quick Diagnostics

Execute on target via SSH:

```bash
echo "=== QUICK HARDWARE SCAN: $(hostname) ==="
echo "Timestamp: $(date -Iseconds)"
echo ""

# System Info
echo "=== SYSTEM INFO ==="
echo "Hostname: $(hostname)"
echo "OS: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"')"
echo "Kernel: $(uname -r)"
echo "Uptime: $(uptime -p 2>/dev/null || uptime)"
echo "Last Boot: $(who -b 2>/dev/null | awk '{print $3, $4}')"
echo ""

# CPU
echo "=== CPU ==="
echo "Model: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)"
echo "Cores: $(nproc)"
echo "Load: $(cat /proc/loadavg | awk '{print $1, $2, $3}')"
if command -v sensors &>/dev/null; then
    echo "Temperature: $(sensors 2>/dev/null | grep -i 'core 0\|package' | head -1 | awk '{print $3}')"
elif [ -f /sys/class/thermal/thermal_zone0/temp ]; then
    echo "Temperature: $(($(cat /sys/class/thermal/thermal_zone0/temp) / 1000))°C"
fi
echo ""

# Memory
echo "=== MEMORY ==="
free -h | grep -E "^(Mem|Swap):"
echo ""

# Disk Space
echo "=== DISK SPACE ==="
df -h | grep -E "^/dev" | awk '{print $1, $5, $6}'
echo ""

# SMART Quick Check (if smartctl available)
echo "=== SMART STATUS ==="
if command -v smartctl &>/dev/null; then
    for disk in $(lsblk -d -o NAME,TYPE | grep disk | awk '{print $1}'); do
        status=$(sudo smartctl -H /dev/$disk 2>/dev/null | grep -i "result\|status" | head -1)
        if [ -n "$status" ]; then
            echo "/dev/$disk: $status"
        fi
    done
else
    echo "smartctl not installed"
fi
echo ""

# Recent Errors
echo "=== RECENT ERRORS (last 1 hour) ==="
if command -v journalctl &>/dev/null; then
    journalctl --since "1 hour ago" -p err --no-pager 2>/dev/null | tail -10
else
    dmesg | grep -i "error\|fail\|critical" | tail -10
fi
echo ""

# Network
echo "=== NETWORK ==="
ip -br link show | grep -v "^lo"
echo ""

# Services (systemd)
echo "=== FAILED SERVICES ==="
systemctl --failed --no-pager 2>/dev/null || echo "N/A"
```

### 4. Parse Results

Evaluate against thresholds:

| Check | WARNING | CRITICAL |
|-------|---------|----------|
| CPU Temp | > 70°C | > 85°C |
| Load (per core) | > 2.0 | > 5.0 |
| Memory % | > 85% | > 95% |
| Disk % | > 80% | > 95% |
| SMART | Any issue | FAILED |
| Failed Services | Any | > 3 |

### 5. Report Findings

Format output with severity indicators:
- `[OK]` - Normal
- `[WARNING]` - Needs attention
- `[CRITICAL]` - Immediate action

### 6. Store Results

Save to Joplin via MCP:
```
Tech Documentation/Hardware Diagnostics/{hostname}/scan-{date}.md
```

### 7. Offer Next Steps

If any issues found:
> "I found [N] items that need attention. Would you like me to:
> 1. Run a comprehensive scan for more details?
> 2. Investigate the [specific issue]?
> 3. Compare against baseline (if exists)?"

If all OK:
> "Quick scan complete - all systems nominal. Run comprehensive scan for deeper analysis?"

## Output Format

```markdown
# Hardware Quick Scan: {hostname}
**Date:** {timestamp}
**Duration:** {seconds}s

## Summary
| Category | Status | Notes |
|----------|--------|-------|
| CPU | [OK/WARN/CRIT] | {details} |
| Memory | [OK/WARN/CRIT] | {details} |
| Disk | [OK/WARN/CRIT] | {details} |
| SMART | [OK/WARN/CRIT] | {details} |
| Services | [OK/WARN/CRIT] | {details} |

## Details
{raw output sections}

## Recommendations
{if issues found}
```
