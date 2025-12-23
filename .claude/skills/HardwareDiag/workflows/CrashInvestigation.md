# CrashInvestigation Workflow

**Post-crash analysis to determine why a system went offline**

## Trigger
- "{target} went offline"
- "why did {target} crash?"
- "{target} rebooted unexpectedly"
- "diagnose crash on {target}"

## Priority Checks

1. **Was it a clean shutdown or crash?**
2. **Thermal event?**
3. **Kernel panic/oops?**
4. **OOM killer?**
5. **Hardware failure?**
6. **Power event?**

## Steps

### 1. Connect and Get Boot Context

```bash
TARGET="$1"
SSH_USER="joey"  # or root for unraid

# First, verify system is back online
ssh -o ConnectTimeout=5 ${SSH_USER}@${TARGET} "echo 'System is online'"
```

### 2. Determine Shutdown Type

```bash
echo "=== SHUTDOWN ANALYSIS ==="

# Last shutdown/reboot
echo "Current boot: $(who -b 2>/dev/null)"
echo "Uptime: $(uptime)"

# Check last command (was it intentional?)
last -x | head -20

# Shutdown reason from wtmp
last -x shutdown reboot | head -5

# Check if it was a clean shutdown
if journalctl -b -1 --no-pager 2>/dev/null | grep -qi "shutting down\|power off\|systemd.*stopped"; then
    echo "LIKELY: Clean shutdown detected in previous boot"
else
    echo "LIKELY: Unclean shutdown (crash/power loss)"
fi
```

### 3. Previous Boot Journal Analysis

```bash
echo "=== PREVIOUS BOOT JOURNAL (last 200 lines) ==="
journalctl -b -1 --no-pager 2>/dev/null | tail -200

echo ""
echo "=== CRITICAL/ERROR MESSAGES FROM PREVIOUS BOOT ==="
journalctl -b -1 -p err --no-pager 2>/dev/null | tail -50
```

### 4. Thermal Investigation

```bash
echo "=== THERMAL ANALYSIS ==="

# Check for thermal events in previous boot
journalctl -b -1 --no-pager 2>/dev/null | grep -i "thermal\|temperature\|overheat\|critical temp" | tail -20

# Current temperatures
if command -v sensors &>/dev/null; then
    echo "Current temps:"
    sensors 2>/dev/null
elif [ -f /sys/class/thermal/thermal_zone0/temp ]; then
    for zone in /sys/class/thermal/thermal_zone*/temp; do
        name=$(dirname $zone)/type
        echo "$(cat $name 2>/dev/null): $(($(cat $zone) / 1000))°C"
    done
fi

# Check CPU throttling
if [ -f /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq ]; then
    echo "CPU Frequency: $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq) kHz"
    echo "CPU Max: $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_max_freq) kHz"
fi
```

### 5. Kernel Panic/Oops Detection

```bash
echo "=== KERNEL PANIC/OOPS ANALYSIS ==="

# Check dmesg for panic indicators
dmesg | grep -i "panic\|oops\|bug\|rip\|call trace" | tail -30

# Previous boot kernel messages
journalctl -b -1 -k --no-pager 2>/dev/null | grep -i "panic\|oops\|bug\|error\|fail" | tail -30

# Check for crash dump
if [ -d /var/crash ]; then
    echo "Crash dumps:"
    ls -la /var/crash/
fi

# Check mcelog for hardware errors
if command -v mcelog &>/dev/null; then
    echo "Machine Check Errors:"
    sudo mcelog --client 2>/dev/null || echo "No mcelog daemon"
fi
```

### 6. OOM Killer Analysis

```bash
echo "=== OOM KILLER ANALYSIS ==="

# Check for OOM events in previous boot
journalctl -b -1 --no-pager 2>/dev/null | grep -i "out of memory\|oom\|killed process" | tail -20

# Current memory pressure
echo "Current memory:"
free -h
cat /proc/meminfo | grep -E "MemTotal|MemAvailable|SwapTotal|SwapFree"
```

### 7. Hardware Error Analysis

```bash
echo "=== HARDWARE ERRORS ==="

# SMART status
if command -v smartctl &>/dev/null; then
    for disk in $(lsblk -d -o NAME,TYPE | grep disk | awk '{print $1}'); do
        echo "--- /dev/$disk ---"
        sudo smartctl -H /dev/$disk 2>/dev/null
        sudo smartctl -A /dev/$disk 2>/dev/null | grep -E "Reallocated|Pending|Uncorrect|Error"
    done
fi

# Check for disk errors in logs
journalctl -b -1 --no-pager 2>/dev/null | grep -i "i/o error\|ata.*error\|scsi.*error\|ext4.*error\|xfs.*error" | tail -20

# ECC memory errors
if [ -d /sys/devices/system/edac/mc ]; then
    echo "ECC Memory Errors:"
    find /sys/devices/system/edac/mc -name "*_count" -exec sh -c 'echo "$1: $(cat $1)"' _ {} \;
fi
```

### 8. Power Event Analysis

```bash
echo "=== POWER ANALYSIS ==="

# Check for power-related messages
journalctl -b -1 --no-pager 2>/dev/null | grep -i "power\|acpi\|battery\|suspend\|hibernate\|sleep" | tail -20

# Current power state
if command -v upower &>/dev/null; then
    upower -d 2>/dev/null | head -30
fi

# Check if system is configured to sleep
systemctl status sleep.target suspend.target hibernate.target 2>/dev/null | grep -E "Loaded|Active"

# Power management settings
cat /sys/power/state 2>/dev/null
```

### 9. Service Failure Analysis

```bash
echo "=== SERVICE FAILURES ==="

# Services that failed in previous boot
journalctl -b -1 --no-pager 2>/dev/null | grep -i "failed\|start-limit-hit\|entered failed state" | tail -20

# Current failed services
systemctl --failed --no-pager 2>/dev/null
```

### 10. Generate Diagnosis

Based on findings, categorize:

| Evidence | Likely Cause |
|----------|--------------|
| "thermal shutdown" in logs | Overheating |
| Kernel panic/oops traces | Kernel bug or hardware |
| OOM messages | Memory exhaustion |
| SMART errors | Disk failure |
| Power/suspend messages | Power management |
| I/O errors | Storage issues |
| No errors, clean shutdown | Intentional or power loss |
| mcelog errors | CPU/memory hardware |

## Output Format

```markdown
# Crash Investigation: {hostname}
**Date:** {timestamp}
**Investigating boot from:** {previous_boot_time}

## Verdict
**Most Likely Cause:** {cause}
**Confidence:** {high/medium/low}

## Evidence

### Shutdown Type
{clean/unclean} - {evidence}

### Timeline (last minutes before crash)
{extracted timeline}

### Key Findings
1. {finding 1}
2. {finding 2}
...

## Raw Data
<details>
<summary>Previous Boot Journal</summary>
{journal output}
</details>

<details>
<summary>Thermal Data</summary>
{thermal output}
</details>

## Recommendations
1. {action 1}
2. {action 2}
...

## Prevention
{suggestions to prevent recurrence}
```

## Storage

Save to Joplin:
```
Tech Documentation/Hardware Diagnostics/{hostname}/incident-{date}.md
```
